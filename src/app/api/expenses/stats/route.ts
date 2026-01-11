import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { protectApiRoute } from '@/lib/api-protection';
import mongoose from 'mongoose';

// GET expenses statistics (for dashboard and analytics)
export async function GET(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const userId = new mongoose.Types.ObjectId(protection.userId);

    let matchStage: any = { userId };

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
      const endDate = new Date(Number(year), Number(monthNum), 0, 23, 59, 59);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    // Get category-wise breakdown
    const categoryWiseExpenses = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get personal vs shared breakdown
    const typeWiseExpenses = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Get recent expenses
    const recentExpenses = await Expense.find({ userId: protection.userId })
      .sort({ date: -1 })
      .limit(10);

    // Get total spent this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyTotal = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json(
      {
        categoryWise: categoryWiseExpenses,
        typeWise: typeWiseExpenses,
        recent: recentExpenses,
        monthlyTotal: monthlyTotal[0]?.total || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
