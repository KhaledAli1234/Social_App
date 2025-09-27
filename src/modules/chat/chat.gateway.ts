import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { ChatEvents } from "./chat.events";

export class ChatGateway {
  private chatEvents: ChatEvents;
  constructor() {
    this.chatEvents = new ChatEvents();
  }
  register = (socket: IAuthSocket, io: Server) => {
    try {
      this.chatEvents.sayHi(socket, io);
      this.chatEvents.sendMessage(socket, io);
      this.chatEvents.joinRoom(socket, io);
      this.chatEvents.sendGroupMessage(socket, io);
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };
}
