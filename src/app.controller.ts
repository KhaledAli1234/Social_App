import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });
import type { Request, Response, Express } from "express";
import express from "express";
import authController from "./modules/auth/auth.controller";

import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { globalErrorHandling } from "./utils/response/error.response";
import connectDB from "./DB/connection.db";



const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  const port: number | string = process.env.PORT || 5000;

  const limiter = rateLimit({
    windowMs: 60 * 6000,
    limit: 2000,
    message: { error: "too many request please try again later" },
    statusCode: 429,
  });

  app.use(limiter);
  app.use(express.json());
  app.use(cors());
  app.use(helmet());

  await connectDB()

  app.use("/auth", authController);

  app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Welcome to social app backend landing page ❤️🍀" });
  });

  app.use("{/*dummy}", (req: Request, res: Response) => {
    res.status(404).json({ message: "invalid application routing ❌" });
  });

  app.use(globalErrorHandling);

  app.listen(port, () => {
    console.log(`server is running on port ${port} 🚀`);
  });
};

export default bootstrap;
