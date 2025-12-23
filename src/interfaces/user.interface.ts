import { Document } from "mongoose";

export interface User extends Document {
  username: string;
  passwordHash: string;
  comparePassword(passwordHash: string): Promise<boolean>;
}