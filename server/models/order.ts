import { Schema, model, Document, models } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: false,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'canceled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model exists before compiling it
export const Order = models.Order || model<IOrder>('Order', orderSchema); 