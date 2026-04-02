import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';  // Путь к вашему файлу
import Expense from '@/app/models/Expense';

export async function GET() {
    try {
        await connectToDatabase();
        const expenses = await Expense.find({});
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const newExpense = new Expense(body);
        await newExpense.save();
        return NextResponse.json(newExpense, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
    }
}
