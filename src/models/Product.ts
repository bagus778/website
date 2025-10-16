import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProductCommand {
  command: string;
  delay?: number; // in seconds
  order: number;
}

export interface IProductOption {
  label: string;
  price: number;
  commands: IProductCommand[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: Types.ObjectId;
  commands: IProductCommand[];
  options?: IProductOption[];
  isActive: boolean;
  stock?: number;
  isUnlimited: boolean;
  order: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCommandSchema = new Schema<IProductCommand>({
  command: {
    type: String,
    required: [true, 'Command is required'],
    trim: true,
  },
  delay: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    required: true,
  },
});

const ProductOptionSchema = new Schema<IProductOption>({
  label: {
    type: String,
    required: [true, 'Option label is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Option price is required'],
    min: 0,
  },
  commands: {
    type: [ProductCommandSchema],
    default: [],
  },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: function (this: IProduct) {
        return !this.options || this.options.length === 0;
      },
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    commands: {
      type: [ProductCommandSchema],
      default: [],
    },
    options: {
      type: [ProductOptionSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      min: 0,
    },
    isUnlimited: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);