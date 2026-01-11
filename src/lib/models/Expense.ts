import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  category: string;
  type: 'personal' | 'shared';
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank';
  description: string;
  amount: number;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: new Date(),
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Grocery',
        'Breakfast',
        'Lunch',
        'Dinner',
        'Travel',
        'Snacks',
        'Personal',
        'Shared',
        'Extras',
      ],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Expense type is required'],
      enum: ['personal', 'shared'],
      default: 'personal',
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['UPI', 'Cash', 'Card', 'Bank'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
