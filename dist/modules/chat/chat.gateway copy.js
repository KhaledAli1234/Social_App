"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
class ChatGateway {
    constructor() { }
    register = (socket, io) => {
        socket.on("sayHi", (data) => {
            console.log({ data });
        });
    };
}
exports.ChatGateway = ChatGateway;
