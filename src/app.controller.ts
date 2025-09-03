import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });
import type { Request, Response, Express } from "express";
import express from "express";
import authController from "./modules/auth/auth.controller";
import userController from "./modules/user/user.controller";

import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  BadRequestException,
  globalErrorHandling,
} from "./utils/response/error.response";
import connectDB from "./DB/connection.db";
import { createGetPresignedLink, getFile } from "./utils/multer/s3.config";
import { promisify } from "node:util";
import { pipeline } from "node:stream";

const createS3WriteStreamPipe = promisify(pipeline);

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

  await connectDB();

  app.use("/auth", authController);
  app.use("/user", userController);

  app.get(
    "/upload/*path",
    async (req: Request, res: Response): Promise<void> => {
      const { downloadName, download = "false" } = req.query as {
        downloadName?: string;
        download?: string;
      };
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const s3Response = await getFile({ Key });
      console.log({ s3Response });
      if (!s3Response?.Body) {
        throw new BadRequestException("fail to fetch this asset");
      }
      res.setHeader(
        "Content-type",
        `${s3Response.ContentType || "application/octet-stream"}`
      );
      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${downloadName || Key.split("/").pop()}"`
        );
      }

      return await createS3WriteStreamPipe(
        s3Response.Body as NodeJS.ReadableStream,
        res
      );
    }
  );

  app.get(
    "/upload/pre-signed/*path",
    async (req: Request, res: Response): Promise<Response> => {
      const {
        downloadName,
        download = "false",
        expiresIn = 120,
      } = req.query as {
        downloadName?: string;
        download?: string;
        expiresIn?: number;
      };
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const url = await createGetPresignedLink({
        Key,
        downloadName: downloadName as string,
        download,
        expiresIn
      });
      return res.json({ message: "Done", data: { url } });
    }
  );

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
