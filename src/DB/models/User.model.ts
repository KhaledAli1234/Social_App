import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum GenderEnum {
  male = "male",
  female = "female",
}
export enum RoleEnum {
  user = "user",
  admin = "admin",
}
export enum ProviderEnum {
  google = "google",
  system = "system",
}

export interface IUser {
  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  confirmEmailOtp?: string;
  confirmAt?: Date;

  password: string;
  resetPasswordOtp?: string;
  changeCredentialsTime?: Date;

  phone?: string;
  address?: string;

  profileImage?: string;
  temProfileImage?: string;
  coverImages?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt?: Date;

  isVerified: boolean;
  verificationCode: string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 20 },
    lastName: { type: String, required: true, minlength: 2, maxlength: 20 },

    email: { type: String, required: true, unique: true },
    confirmEmailOtp: { type: String },
    confirmAt: { type: Date },

    password: {
      type: String,
      required: function () {
        return this.provider === ProviderEnum.google ? false : true;
      },
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },

    phone: { type: String },
    address: { type: String },

    profileImage: { type: String },
    temProfileImage: { type: String },
    coverImages: [String],

    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.system,
    },

    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const UserModel = models.user || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
