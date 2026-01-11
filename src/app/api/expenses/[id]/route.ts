import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { protectApiRoute } from '@/lib/api-protection';

// GET a specific expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { id } = await params;

    const expense = await Expense.findOne({
      _id: id,
      userId: protection.userId,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PUT - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { id } = await params;
    const { date, category, type, paymentMethod, description, amount } =
      await request.json();

    if (amount && amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: protection.userId },
      {
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(type && { type }),
        ...(paymentMethod && { paymentMethod }),
        ...(description && { description }),
        ...(amount !== undefined && { amount }),
      },
      { new: true }
    );

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Expense updated successfully', expense },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { id } = await params;

    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: protection.userId,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
