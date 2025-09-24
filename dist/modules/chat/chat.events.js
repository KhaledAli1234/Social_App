"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvents {
    chatService;
    constructor() {
        this.chatService = new chat_service_1.ChatService();
    }
    sayHi = (socket, io) => {
        return socket.on("sayHi", (message) => {
            try {
                this.chatService.sayHi({ message, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
}
exports.ChatEvents = ChatEvents;
