"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLOneUserResponse = exports.GraphQLGenderEnum = exports.GraphQLUniformResponse = void 0;
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const error_response_1 = require("./utils/response/error.response");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const s3_config_1 = require("./utils/multer/s3.config");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const chat_1 = require("./modules/chat");
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
const DB_1 = require("./DB");
const GraphQLUniformResponse = ({ name, data, }) => {
    return new graphql_1.GraphQLObjectType({
        name: name,
        fields: {
            message: { type: graphql_1.GraphQLString },
            statusCode: { type: graphql_1.GraphQLInt },
            data: { type: data },
        },
    });
};
exports.GraphQLUniformResponse = GraphQLUniformResponse;
exports.GraphQLGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLGenderEnum",
    values: {
        male: { value: DB_1.GenderEnum.male },
        female: { value: DB_1.GenderEnum.female },
    },
});
exports.GraphQLOneUserResponse = new graphql_1.GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        id: { type: graphql_1.GraphQLID },
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: graphql_1.GraphQLString },
        gender: { type: exports.GraphQLGenderEnum },
        followers: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    },
});
let users = [
    {
        id: 1,
        name: "khaled",
        email: "khaled@gmail.com",
        gender: DB_1.GenderEnum.male,
        password: "0000",
        followers: [],
    },
    {
        id: 2,
        name: "mohamed",
        email: "mohamed@gmail.com",
        gender: DB_1.GenderEnum.male,
        password: "0000",
        followers: [],
    },
    {
        id: 3,
        name: "menna",
        email: "menna@gmail.com",
        gender: DB_1.GenderEnum.female,
        password: "0000",
        followers: [],
    },
    {
        id: 4,
        name: "mazen",
        email: "mazen@gmail.com",
        gender: DB_1.GenderEnum.male,
        password: "0000",
        followers: [],
    },
];
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 60 * 6000,
        limit: 2000,
        message: { error: "too many request please try again later" },
        statusCode: 429,
    });
    app.use(limiter);
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "RootSchemaQuery",
            fields: {
                sayHi: {
                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    resolve: (parent, args) => {
                        return "Hi Khaled";
                    },
                },
                allUsers: {
                    type: new graphql_1.GraphQLList(exports.GraphQLOneUserResponse),
                    args: {
                        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                        gender: { type: exports.GraphQLGenderEnum },
                    },
                    resolve: (parent, args) => {
                        return users.filter((ele) => ele.name === args.name && ele.gender === args.gender);
                    },
                },
                searchUser: {
                    type: (0, exports.GraphQLUniformResponse)({
                        name: "SearchUser",
                        data: new graphql_1.GraphQLNonNull(exports.GraphQLOneUserResponse),
                    }),
                    args: {
                        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                    },
                    resolve: (parent, args) => {
                        const user = users.find((ele) => ele.email === args.email);
                        return { message: "Done", statusCode: 200, data: user };
                    },
                },
            },
        }),
        mutation: new graphql_1.GraphQLObjectType({
            name: "RootSchemaMutation",
            fields: {
                addFollower: {
                    type: new graphql_1.GraphQLList(exports.GraphQLOneUserResponse),
                    args: {
                        friendId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                        myId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                    },
                    resolve: (parent, args) => {
                        users = users.map((ele) => {
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
    app.all("/graphql", (0, express_2.createHandler)({ schema }));
    await (0, connection_db_1.default)();
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.use("/chat", chat_1.chatRouter);
    app.get("/upload/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        console.log({ s3Response });
        if (!s3Response?.Body) {
            throw new error_response_1.BadRequestException("fail to fetch this asset");
        }
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-type", `${s3Response.ContentType || "application/octet-stream"}`);
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split("/").pop()}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download = "false", expiresIn = 120, } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPresignedLink)({
            Key,
            downloadName: downloadName,
            download,
            expiresIn,
        });
        return res.json({ message: "Done", data: { url } });
    });
    app.get("/", (req, res) => {
        res.json({ message: "Welcome to social app backend landing page ❤️🍀" });
    });
    app.use("{/*dummy}", (req, res) => {
        res.status(404).json({ message: "invalid application routing ❌" });
    });
    app.use(error_response_1.globalErrorHandling);
    const httpServer = app.listen(port, () => {
        console.log(`server is running on port ${port} 🚀`);
    });
    (0, modules_1.initIo)(httpServer);
};
exports.default = bootstrap;
