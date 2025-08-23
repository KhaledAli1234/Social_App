import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode: string;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
