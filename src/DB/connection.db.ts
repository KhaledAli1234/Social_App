import mongoose from "mongoose";

 const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log("DB connected ✅");
  } catch (err) {
    console.error("Fail to connect on DB ❌", err);
    process.exit(1);
  }
};

export default connectDB;
