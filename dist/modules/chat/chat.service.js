"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
class ChatService {
    constructor() { }
    sayHi = ({ message, socket, }) => {
        console.log({ message });
    };
}
exports.ChatService = ChatService;
