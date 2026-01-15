import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { protectApiRoute } from '@/lib/api-protection';
import mongoose from 'mongoose';

// Simple in-memory cache for stats (TTL: 60 seconds)
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

function getCacheKey(userId: string, month?: string) {
  return `${userId}:${month || 'all'}`;
}

function isCacheValid(timestamp: number) {
  return Date.now() - timestamp < CACHE_TTL;
}

// GET expenses statistics (for dashboard and analytics) - OPTIMIZED
export async function GET(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Check cache first
    const cacheKey = getCacheKey(protection.userId, month || undefined);
    const cached = statsCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return NextResponse.json(cached.data, { 
        status: 200,
        headers: { 'X-Cache': 'HIT' }
      });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(protection.userId);

    let matchStage: any = { userId };

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
      const endDate = new Date(Number(year), Number(monthNum), 0, 23, 59, 59);
      matchStage.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default to current month if not specified
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Run all aggregations in parallel for better performance
    const [categoryWiseExpenses, typeWiseExpenses, recentExpenses, monthlyTotalResult] = await Promise.all([
      // Category-wise breakdown
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 }, // Limit results for faster processing
      ]),

      // Personal vs shared breakdown
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Get recent expenses (limited to 5 for dashboard)
      Expense.find({ userId: protection.userId, ...matchStage })
        .select('_id category amount description date')
        .sort({ date: -1 })
        .limit(5)
        .lean(), // Use lean() for faster read-only queries

      // Get total spent in the month
      Expense.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const monthlyTotal = monthlyTotalResult[0]?.total || 0;

    const response = {
      categoryWise: categoryWiseExpenses,
      typeWise: typeWiseExpenses,
      recent: recentExpenses,
      monthlyTotal,
    };

    // Cache the response
    statsCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response, { 
      status: 200,
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
