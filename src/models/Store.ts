import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  description?: string;
  logo?: string;
  currency: string;
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  features: {
    maintenanceMode: boolean;
  };
  minecraft?: {
    serverIp: string;
    serverPort: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    currencySymbol: {
      type: String,
      default: '$',
    },
    features: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
    minecraft: {
      serverIp: String,
      serverPort: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);