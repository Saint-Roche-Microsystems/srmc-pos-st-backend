import { Document } from "mongoose";

export interface OrderItem {
  productId: string;
  quantity: number;
  price?: number;
}

export interface Order extends Document {
  userId: string;
  orderItems: OrderItem[];
  total: number;
}