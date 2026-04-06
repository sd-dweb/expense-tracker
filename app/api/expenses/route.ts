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

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const expenses = await Expense.find({});
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
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

    console.log('Saving expense with amountUSD:', amountUSD, 'body:', JSON.stringify(body));
    const expenseData = {
      id: body.id,
      date: body.date,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      amountUSD: amountUSD,
    };
    const newExpense = new Expense(expenseData);
    await newExpense.save();
    console.log('Saved expense:', JSON.stringify(newExpense.toObject()));
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}
