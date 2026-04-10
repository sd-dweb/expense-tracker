import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Expense from '@/app/models/Expense';
import { auth } from '@/app/lib/auth';

async function fetchExchangeRates() {
  try {
    const plnResponse = await fetch('https://api.exchangerate-api.com/v4/latest/PLN');
    const plnData = await plnResponse.json();
    const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const usdData = await usdResponse.json();
    return {
      USD_PLN: 1 / plnData.rates.USD,
      USD_EUR: usdData.rates.EUR,
      USD_BYN: plnData.rates.BYN / plnData.rates.USD,
    };
  } catch {
    throw new Error('Failed to fetch exchange rates');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    // Authorization check
    const existingExpense = await Expense.findOne({ id: params.id });
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    const currentUser = session.user?.name || session.user?.email || 'Unknown';
    if (existingExpense.userName && existingExpense.userName !== currentUser) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own expenses' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, currency, amountUSD: providedAmountUSD } = body;

    let amountUSD: number;
    if (providedAmountUSD !== undefined) {
      amountUSD = providedAmountUSD;
    } else {
      const rates = await fetchExchangeRates();
      if (currency === 'USD') {
        amountUSD = amount;
      } else if (currency === 'PLN') {
        amountUSD = amount / rates.USD_PLN;
      } else if (currency === 'EUR') {
        amountUSD = amount / rates.USD_EUR;
      } else if (currency === 'BYN') {
        amountUSD = amount / rates.USD_BYN;
      } else {
        amountUSD = amount; // fallback
      }
    }

    console.log('Updating expense with amountUSD:', amountUSD);
    const updateData = {
      id: body.id,
      date: body.date,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      amountUSD: amountUSD,
    };
    const updatedExpense = await Expense.findOneAndUpdate({ id: params.id }, updateData, { new: true });
    if (!updatedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(updatedExpense);
  } catch {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const deletedExpense = await Expense.findOneAndDelete({ id: params.id });
    if (!deletedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Expense deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}