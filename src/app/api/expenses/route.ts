import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { protectApiRoute } from '@/lib/api-protection';
import { formatMonth } from '@/utils/formatting';

// In-memory cache for expense queries (TTL: 30 seconds)
const expenseCache = new Map<string, { data: any; timestamp: number }>();
const statsCache = new Map<string, { data: any; timestamp: number }>(); // Reference to stats cache
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(userId: string, month?: string, date?: string, page?: string) {
  return `${userId}:${month || 'all'}:${date || 'none'}:${page || '1'}`;
}

function isCacheValid(timestamp: number) {
  return Date.now() - timestamp < CACHE_TTL;
}

// GET all expenses for a user (with optional month filter and pagination)
export async function GET(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const date = searchParams.get('date');
    const page = searchParams.get('page') || '1';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check cache first
    const cacheKey = getCacheKey(protection.userId, month || undefined, date || undefined, page);
    const cached = expenseCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return NextResponse.json(cached.data, { 
        status: 200,
        headers: { 'X-Cache': 'HIT' }
      });
    }

    await connectDB();

    let query: any = { userId: protection.userId };

    if (month) {
      // Filter by month
      const [year, monthNum] = month.split('-');
      const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
      const endDate = new Date(Number(year), Number(monthNum), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (date) {
      // Filter by specific date
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: dateObj, $lt: nextDay };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * limit;

    // Parallel queries: get expenses and total count
    const [expenses, totalCount] = await Promise.all([
      Expense.find(query)
        .select('_id date category type paymentMethod description amount')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean for faster queries
      Expense.countDocuments(query), // Get total count for pagination
    ]);

    const response = {
      expenses,
      pagination: {
        page: parseInt(page),
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };

    // Cache the response
    expenseCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response, { 
      status: 200,
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Create a new expense (with cache invalidation)
export async function POST(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { date, category, type, paymentMethod, description, amount } =
      await request.json();

    // Validation
    if (!date || !category || !type || !paymentMethod || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const expense = new Expense({
      userId: protection.userId,
      date: new Date(date),
      category,
      type,
      paymentMethod,
      description,
      amount,
    });

    await expense.save();

    // Invalidate caches for this user to ensure fresh data on next fetch
    const cacheKeysToDelete: string[] = [];
    for (const [key] of expenseCache.entries()) {
      if (key.startsWith(protection.userId)) {
        cacheKeysToDelete.push(key);
      }
    }
    cacheKeysToDelete.forEach(key => expenseCache.delete(key));

    // Also invalidate stats cache
    const statsKeysToDelete: string[] = [];
    for (const [key] of statsCache.entries()) {
      if (key.startsWith(protection.userId)) {
        statsKeysToDelete.push(key);
      }
    }
    statsKeysToDelete.forEach(key => statsCache.delete(key));

    return NextResponse.json(
      { message: 'Expense created successfully', expense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
