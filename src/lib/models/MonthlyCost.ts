import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyCost extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // Format: YYYY-MM
  rent: number;
  electricity: number;
  gas: number;
  maintenance: number;
  other: number;
  createdAt: Date;
}

const MonthlyCostSchema = new Schema<IMonthlyCost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
      index: true,
    },
    rent: {
      type: Number,
      default: 0,
      min: [0, 'Value must be positive'],
    },
    electricity: {
      type: Number,
      default: 0,
      min: [0, 'Value must be positive'],
    },
    gas: {
      type: Number,
      default: 0,
      min: [0, 'Value must be positive'],
    },
    maintenance: {
      type: Number,
      default: 0,
      min: [0, 'Value must be positive'],
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Value must be positive'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure only one cost record per user per month
MonthlyCostSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.models.MonthlyCost ||
  mongoose.model<IMonthlyCost>('MonthlyCost', MonthlyCostSchema);
