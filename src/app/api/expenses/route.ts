import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { protectApiRoute } from '@/lib/api-protection';
import { formatMonth } from '@/utils/formatting';

// GET all expenses for a user (with optional month filter)
export async function GET(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const date = searchParams.get('date');

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

    const expenses = await Expense.find(query).sort({ date: -1 });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Create a new expense
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
