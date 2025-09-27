"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initIo = exports.connectedSockets = exports.io = void 0;
const socket_io_1 = require("socket.io");
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const error_response_1 = require("../../utils/response/error.response");
const chat_1 = require("../chat");
exports.io = undefined;
exports.connectedSockets = new Map();
const initIo = async (httpServer) => {
    const chatGateway = new chat_1.ChatGateway();
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    exports.io.use(async (socket, next) => {
        try {
            const { decoded, user } = await (0, token_secuirty_1.decodedToken)({
                authorization: socket.handshake?.auth?.authorization,
                tokenType: token_secuirty_1.TokenEnum.access,
            });
            const userTapes = exports.connectedSockets.get(user._id.toString()) || [];
            userTapes.push(socket.id);
            socket.credentials = { decoded, user };
            exports.connectedSockets.set(user._id.toString(), userTapes);
            next();
        }
        catch (error) {
            next(error);
        }
    });
    function disconnection(socket, io) {
        return socket.on("disconnect", () => {
            const userId = socket.credentials?.user?._id?.toString();
            let remainingTabs = exports.connectedSockets.get(userId)?.filter((tab) => {
                return tab !== socket.id;
            }) || [];
            if (remainingTabs.length) {
                exports.connectedSockets.set(userId, remainingTabs);
            }
            else {
                exports.connectedSockets.delete(userId);
                (0, exports.getIo)().emit("offline_User", { userId });
            }
            console.log(`logout: ${socket.id}`);
        });
    }
    exports.io.on("connection", (socket) => {
        try {
            console.log(socket.id);
            chatGateway.register(socket, (0, exports.getIo)());
            disconnection(socket, (0, exports.getIo)());
        }
        catch (error) {
            console.log("fail");
        }
    });
};
exports.initIo = initIo;
const getIo = () => {
    if (!exports.io) {
        throw new error_response_1.BadRequestException("socket Io server is not initialized yet !!");
    }
    return exports.io;
};
exports.getIo = getIo;
