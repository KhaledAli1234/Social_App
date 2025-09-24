import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { ChatService } from "./chat.service";

export class ChatEvents {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }
  sayHi = (socket: IAuthSocket, io: Server) => {
    return socket.on("sayHi", (message) => {
      try {
        this.chatService.sayHi({ message, socket });
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
}
