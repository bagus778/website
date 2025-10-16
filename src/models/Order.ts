import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  price: number;
  quantity: number;
  optionIndex?: number;
  optionLabel?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    username: string;
    email: string;
    userId?: Types.ObjectId;
  };
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProvider: string;
  paymentId?: string;
  paymentIntentId?: string;
  stripeSessionId?: string;
  coinbaseChargeId?: string;
  coinbaseChargeCode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  optionIndex: {
    type: Number,
  },
  optionLabel: {
    type: String,
    trim: true,
  },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: {
      username: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentProvider: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    stripeSessionId: {
      type: String,
      sparse: true,
    },
    coinbaseChargeId: {
      type: String,
    },
    coinbaseChargeCode: {
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

OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);