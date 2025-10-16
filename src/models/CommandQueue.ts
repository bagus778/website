import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommandQueue extends Document {
  order: Types.ObjectId;
  orderNumber: string;
  product: string;
  optionLabel?: string;
  player: string;
  command: string;
  delay: number;
  status: 'pending' | 'processing' | 'executed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  executedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CommandQueueSchema = new Schema<ICommandQueue>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    product: {
      type: String,
      required: true,
      trim: true,
    },
    optionLabel: {
      type: String,
      trim: true,
    },
    player: {
      type: String,
      required: [true, 'Player username is required'],
      trim: true,
    },
    command: {
      type: String,
      required: [true, 'Command is required'],
      trim: true,
    },
    delay: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'executed', 'failed'],
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    executedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

CommandQueueSchema.index({ status: 1, scheduledFor: 1 });
CommandQueueSchema.index({ order: 1 });

export default mongoose.models.CommandQueue || mongoose.model<ICommandQueue>('CommandQueue', CommandQueueSchema);