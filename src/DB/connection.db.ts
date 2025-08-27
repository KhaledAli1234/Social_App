import { connect } from "mongoose";
import { UserModel } from "./models/User.model";

const connectDB = async (): Promise<void> => {
  try {
    const result = await connect(process.env.DB_URI as string);
    await UserModel.syncIndexes()
    console.log(result.models);
    console.log("DB connected ✅");
  } catch (err) {
    console.error("Fail to connect on DB ❌", err);
  }
};

export default connectDB;
