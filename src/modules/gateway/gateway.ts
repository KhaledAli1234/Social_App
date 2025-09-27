import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { decodedToken, TokenEnum } from "../../utils/secuirty/token.secuirty";
import { IAuthSocket } from "./gateway.interface";
import { BadRequestException } from "../../utils/response/error.response";
import { ChatGateway } from "../chat";

export let io: Server | undefined = undefined;
export const connectedSockets = new Map<string, string[]>();

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
      const userTapes = connectedSockets.get(user._id.toString()) || [];
      userTapes.push(socket.id);

      socket.credentials = { decoded, user };
      connectedSockets.set(user._id.toString(), userTapes);
      next();
    } catch (error: any) {
      next(error);
    }
  });

  function disconnection(socket: IAuthSocket , io: Server) {
    return socket.on("disconnect", () => {
      const userId = socket.credentials?.user?._id?.toString() as string;
      let remainingTabs =
        connectedSockets.get(userId)?.filter((tab: string) => {
          return tab !== socket.id;
        }) || [];
      if (remainingTabs.length) {
        connectedSockets.set(userId, remainingTabs);
      } else {
        connectedSockets.delete(userId);
        getIo().emit("offline_User", { userId });
      }
      console.log(`logout: ${socket.id}`);
    });
  }

  io.on("connection", (socket: IAuthSocket) => {
    try {
      console.log(socket.id);
      chatGateway.register(socket, getIo());
      disconnection(socket , getIo());
    } catch (error) {
      console.log("fail");
    }
  });
};

export const getIo = (): Server => {
  if (!io) {
    throw new BadRequestException("socket Io server is not initialized yet !!");
  }
  return io;
};
