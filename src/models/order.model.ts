import { Schema, model, Types } from "mongoose";
import { Order as IOrder } from "../interfaces/index";

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a positive integer',
      },
    },
    price: {
      type: Number,
      required: false,
      min: 0,
    }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },
    orderItems: {
      type: [OrderItemSchema],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    }
  }
);

export const Order = model<IOrder>("Order", OrderSchema);
