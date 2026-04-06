import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Delete cached model to ensure schema changes are picked up (matches Expense.ts pattern)
if (mongoose.models?.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);

