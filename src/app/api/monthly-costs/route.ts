import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import MonthlyCost from '@/lib/models/MonthlyCost';
import { protectApiRoute } from '@/lib/api-protection';

// GET monthly costs
export async function GET(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let query: any = { userId: protection.userId };

    if (month) {
      query.month = month;
    }

    const costs = await MonthlyCost.find(query);

    return NextResponse.json({ costs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching monthly costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly costs' },
      { status: 500 }
    );
  }
}

// POST - Create or update monthly costs
export async function POST(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  try {
    await connectDB();

    const { month, rent, electricity, gas, maintenance, other } =
      await request.json();

    if (!month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }

    // Check if record exists
    let cost = await MonthlyCost.findOne({
      userId: protection.userId,
      month,
    });

    if (cost) {
      // Update existing
      cost.rent = rent ?? cost.rent;
      cost.electricity = electricity ?? cost.electricity;
      cost.gas = gas ?? cost.gas;
      cost.maintenance = maintenance ?? cost.maintenance;
      cost.other = other ?? cost.other;
      await cost.save();
    } else {
      // Create new
      cost = new MonthlyCost({
        userId: protection.userId,
        month,
        rent: rent || 0,
        electricity: electricity || 0,
        gas: gas || 0,
        maintenance: maintenance || 0,
        other: other || 0,
      });
      await cost.save();
    }

    return NextResponse.json(
      { message: 'Monthly costs saved', cost },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving monthly costs:', error);
    return NextResponse.json(
      { error: 'Failed to save monthly costs' },
      { status: 500 }
    );
  }
}
