import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  amountUSD: number;
  userName?: string;
}

const ExpenseSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  description: { type: String, required: true },
  amountUSD: { type: Number, default: 0 },
  userName: { type: String },
});

// Delete cached model to ensure schema changes are picked up
if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
