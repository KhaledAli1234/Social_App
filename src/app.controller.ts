import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });
import type { Request, Response, Express } from "express";
import express from "express";
import { authRouter, initIo, postRouter, userRouter } from "./modules";
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
import { chatRouter } from "./modules/chat";

import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import { GenderEnum } from "./DB";

export const GraphQLUniformResponse = ({
  name,
  data,
}: {
  name: string;
  data: GraphQLOutputType;
}): GraphQLOutputType => {
  return new GraphQLObjectType({
    name: name,
    fields: {
      message: { type: GraphQLString },
      statusCode: { type: GraphQLInt },
      data: { type: data },
    },
  });
};

export const GraphQLGenderEnum = new GraphQLEnumType({
  name: "GraphQLGenderEnum",
  values: {
    male: { value: GenderEnum.male },
    female: { value: GenderEnum.female },
  },
});

export const GraphQLOneUserResponse = new GraphQLObjectType({
  name: "OneUserResponse",
  fields: {
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: GraphQLString },
    gender: { type: GraphQLGenderEnum },
    followers: { type: new GraphQLList(GraphQLID) },
  },
});
interface IUser {
  id: number;
  name: string;
  email: string;
  gender: GenderEnum;
  password: string;
  followers: number[];
}
let users: IUser[] = [
  {
    id: 1,
    name: "khaled",
    email: "khaled@gmail.com",
    gender: GenderEnum.male,
    password: "0000",
    followers: [],
  },
  {
    id: 2,
    name: "mohamed",
    email: "mohamed@gmail.com",
    gender: GenderEnum.male,
    password: "0000",
    followers: [],
  },
  {
    id: 3,
    name: "menna",
    email: "menna@gmail.com",
    gender: GenderEnum.female,
    password: "0000",
    followers: [],
  },
  {
    id: 4,
    name: "mazen",
    email: "mazen@gmail.com",
    gender: GenderEnum.male,
    password: "0000",
    followers: [],
  },
];

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

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "RootSchemaQuery",
      fields: {
        sayHi: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: (parent: unknown, args: any): string => {
            return "Hi Khaled";
          },
        },

        allUsers: {
          type: new GraphQLList(GraphQLOneUserResponse),
          args: {
            name: { type: new GraphQLNonNull(GraphQLString) },
            gender: { type: GraphQLGenderEnum },
          },
          resolve: (
            parent: unknown,
            args: { name: string; gender: GenderEnum }
          ) => {
            return users.filter(
              (ele) => ele.name === args.name && ele.gender === args.gender
            );
          },
        },

        searchUser: {
          type: GraphQLUniformResponse({
            name: "SearchUser",
            data: new GraphQLNonNull(GraphQLOneUserResponse),
          }),
          args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
          },
          resolve: (parent: unknown, args: { email: string }) => {
            const user = users.find((ele) => ele.email === args.email);
            return { message: "Done", statusCode: 200, data: user };
          },
        },
      },
    }),

    mutation: new GraphQLObjectType({
      name: "RootSchemaMutation",
      fields: {
        addFollower: {
          type: new GraphQLList(GraphQLOneUserResponse),
          args: {
            friendId: { type: new GraphQLNonNull(GraphQLInt) },
            myId: { type: new GraphQLNonNull(GraphQLInt) },
          },
          resolve: (
            parent: unknown,
            args: { friendId: number; myId: number }
          ) => {
            users = users.map((ele: IUser): IUser => {
              if (ele.id === args.friendId) {
                ele.followers.push(args.myId);
              }
              return ele;
            });
            return users;
          },
        },
      },
    }),
  });

  app.all("/graphql", createHandler({ schema }));

  await connectDB();

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/chat", chatRouter);

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
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
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
        expiresIn,
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

  const httpServer = app.listen(port, () => {
    console.log(`server is running on port ${port} 🚀`);
  });

  initIo(httpServer);
};

export default bootstrap;
