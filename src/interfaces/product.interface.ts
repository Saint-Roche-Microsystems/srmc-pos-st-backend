import { Document } from "mongoose";

export interface Product extends Document {
  name: string;
  price: number;
  stock: number;
  image?: string;
}