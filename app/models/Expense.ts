import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    id: string;
    date: string;
    amount: number;
    currency: string;
    description: string;
}

const ExpenseSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    description: { type: String, required: true },
});

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);