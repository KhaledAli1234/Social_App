import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { ChatService } from "./chat.service";

export class ChatEvents {
  private chatService: ChatService = new ChatService();
  constructor() {}

  sayHi = (socket: IAuthSocket, io: Server) => {
    return socket.on("sayHi", (message: string, callback: any) => {
      try {
        this.chatService.sayHi({ message, socket, callback, io });
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendMessage",
      (data: { content: string; sendTo: string }) => {
        try {
          this.chatService.sendMessage({ ...data, socket, io });
        } catch (error) {
          socket.emit("custom_error", error);
        }
      }
    );
  };
  joinRoom = (socket: IAuthSocket, io: Server) => {
    return socket.on("join_room", (data: { roomId: string }) => {
      try {
        this.chatService.joinRoom({ ...data, socket, io });
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
  sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendGroupMessage",
      (data: { content: string; groupId: string }) => {
        try {
          this.chatService.sendGroupMessage({ ...data, socket, io });
        } catch (error) {
          socket.emit("custom_error", error);
        }
      }
    );
  };
}
