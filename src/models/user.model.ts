import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { User as IUser } from "../interfaces/index";

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>("User", UserSchema);