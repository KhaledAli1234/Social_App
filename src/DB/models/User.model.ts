import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { generatHash } from "../../utils/secuirty/hash.secuirty";
import { emailEvent } from "../../utils/email/email.event";

export enum GenderEnum {
  male = "male",
  female = "female",
}
export enum RoleEnum {
  user = "user",
  admin = "admin",
  superAdmin = "super-admin",
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

  pendingEmail?: string;
  emailOtp?: string;

  profileImage?: string;
  temProfileImage?: string;
  coverImages?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  isTwoStepEnabled?: boolean;
  twoStepOtp?: string;
  twoStepOtpExpire?: Date;

  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;

  friends?: Types.ObjectId[];

  createdAt: Date;
  updatedAt?: Date;
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

    pendingEmail: { type: String },
    emailOtp: { type: String },

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

    isTwoStepEnabled: { type: Boolean, default: false },
    twoStepOtp: { type: String },
    twoStepOtpExpire: { type: Date },

    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
export type HUserDocument = HydratedDocument<IUser>;

userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

userSchema.pre(
  "save",
  async function (
    this: HUserDocument & { wasNew: boolean; confirmEmailPlainOtp?: string },
    next
  ) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
      this.password = await generatHash(this.password);
    }
    if (this.isModified("confirmEmailOtp")) {
      this.confirmEmailPlainOtp = this.confirmEmailOtp as string;
      this.confirmEmailOtp = await generatHash(this.confirmEmailOtp as string);
    }
    next();
  }
);

userSchema.post("save", async function (doc, next) {
  const that = this as HUserDocument & {
    wasNew: boolean;
    confirmEmailPlainOtp?: string;
  };
  if (that.wasNew && that.confirmEmailPlainOtp) {
    emailEvent.emit("confirmEmail", {
      to: this.email,
      otp: that.confirmEmailPlainOtp,
    });
  }
  next();
});

userSchema.pre(["find", "findOne"], function (next) {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }
  next();
});

export const UserModel = models.user || model<IUser>("User", userSchema);
