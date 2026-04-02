import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Expense from '@/app/models/Expense';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const updatedExpense = await Expense.findOneAndUpdate({ id: params.id }, body, { new: true });
        if (!updatedExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }
        return NextResponse.json(updatedExpense);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const deletedExpense = await Expense.findOneAndDelete({ id: params.id });
        if (!deletedExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Expense deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}