"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvents {
    chatService = new chat_service_1.ChatService();
    constructor() { }
    sayHi = (socket, io) => {
        return socket.on("sayHi", (message, callback) => {
            try {
                this.chatService.sayHi({ message, socket, callback, io });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", (data) => {
            try {
                this.chatService.sendMessage({ ...data, socket, io });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    joinRoom = (socket, io) => {
        return socket.on("join_room", (data) => {
            try {
                this.chatService.joinRoom({ ...data, socket, io });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on("sendGroupMessage", (data) => {
            try {
                this.chatService.sendGroupMessage({ ...data, socket, io });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
}
exports.ChatEvents = ChatEvents;
