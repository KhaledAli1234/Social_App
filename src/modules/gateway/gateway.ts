import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { decodedToken, TokenEnum } from "../../utils/secuirty/token.secuirty";
import { IAuthSocket } from "./gateway.interface";
import { BadRequestException } from "../../utils/response/error.response";
import { ChatGateway } from "../chat";

export let io: Server | undefined = undefined;
export const connectedSockets = new Map<string, string>();

export const initIo = async (httpServer: HttpServer) => {
  const chatGateway: ChatGateway = new ChatGateway();

  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket: IAuthSocket, next) => {
    try {
      const { decoded, user } = await decodedToken({
        authorization: socket.handshake?.auth?.authorization as string,
        tokenType: TokenEnum.access,
      });
      socket.credentials = { decoded, user };
      connectedSockets.set(user._id.toString(), socket.id);
      next();
    } catch (error: any) {
      next(error);
    }
  });

  function disconnection(socket: IAuthSocket) {
    return socket.on("disconnect", () => {
      const removedUserId = socket.credentials?.user?._id?.toString() as string;
      connectedSockets.delete(removedUserId);
      io?.emit("offlineUser", { removedUserId });
    });
  }

  io.on("connection", (socket: IAuthSocket) => {
    try {
      console.log(socket.id);
      chatGateway.register(socket, getIo());
      disconnection(socket);
    } catch (error) {
      console.log("fail");
    }
  });
};

export const getIo = () => {
  if (!io) {
    throw new BadRequestException("socket Io server is not initialized yet !!");
  }
  return io;
};
