"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const success_response_1 = require("../../utils/response/success.response");
const DB_1 = require("../../DB");
const mongoose_1 = require("mongoose");
const error_response_1 = require("../../utils/response/error.response");
const gateway_1 = require("../gateway");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
class ChatService {
    chatModel = new DB_1.ChatRepository(DB_1.ChatModel);
    userModel = new DB_1.UserRepository(DB_1.UserModel);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        mongoose_1.Types.ObjectId.createFromHexString(userId),
                    ],
                },
                group: { $exists: false },
            },
            options: {
                populate: [
                    {
                        path: "participants",
                        select: "firstName lastName email gender profilePicture",
                    },
                ],
            },
            page,
            size,
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("fail to find matching chatting instance");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat } });
    };
    getChattingGroup = async (req, res) => {
        const { groupId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: { $in: req.user?._id },
                group: { $exists: true },
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy",
                        select: "firstName lastName email gender profilePicture",
                    },
                ],
            },
            page,
            size,
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("fail to find matching chatting instance");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat } });
    };
    createChattingGroup = async (req, res) => {
        const { group, participants } = req.body;
        const dbParticipants = participants.map((participants) => {
            return mongoose_1.Types.ObjectId.createFromHexString(participants);
        });
        const users = await this.userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: req.user?._id },
            },
        });
        if (participants.length != users.length) {
            throw new error_response_1.NotFoundException("some recipient all invalid");
        }
        let group_image = undefined;
        const roomId = group.replaceAll(/\s+/g, "_") + "_" + (0, uuid_1.v4)();
        if (req.file) {
            group_image = await (0, s3_config_1.uploadFile)({
                file: req.file,
                path: `chat/${roomId}`,
            });
        }
        dbParticipants.push(req.user?._id);
        const [chat] = (await this.chatModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    messages: [],
                    participants: dbParticipants,
                    group,
                    group_image: group_image,
                    roomId,
                },
            ],
        })) || [];
        if (!chat) {
            if (group_image) {
                await (0, s3_config_1.deleteFile)({ Key: group_image });
            }
            throw new error_response_1.BadRequestException("fail to generate this group");
        }
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 201,
            data: { chat },
        });
    };
    sayHi = ({ message, socket, callback, io }) => {
        try {
            console.log({ message });
            if (callback) {
                callback("BE TO FE");
            }
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, sendTo, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const user = await this.userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: createdBy },
                },
            });
            if (!user) {
                throw new error_response_1.NotFoundException("invalid recipient friend");
            }
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy,
                            mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                        ],
                    },
                    group: { $exists: false },
                },
                update: {
                    $addToSet: { messages: { content, createdBy } },
                },
            });
            if (!chat) {
                const [newChat] = (await this.chatModel.create({
                    data: [
                        {
                            createdBy,
                            messages: [{ content, createdBy }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                            ],
                        },
                    ],
                })) || [];
                if (!newChat) {
                    throw new error_response_1.BadRequestException("fail to creat this chat");
                }
            }
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            io?.to(gateway_1.connectedSockets.get(sendTo)).emit("newMessage", {
                content,
                from: socket.credentials?.user,
            });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    roomId,
                    group: { $exists: true },
                    participants: { $in: socket.credentials?.user._id },
                },
            });
            if (!chat) {
                throw new error_response_1.NotFoundException("fail to find matching room");
            }
            socket.join(chat.roomId);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendGroupMessage = async ({ content, groupId, socket, io, }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: { $in: createdBy },
                    group: { $exists: true },
                },
                update: {
                    $addToSet: { messages: { content, createdBy } },
                },
            });
            if (!chat) {
                throw new error_response_1.BadRequestException("fail to find matching room");
            }
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            socket?.to(chat.roomId).emit("newMessage", {
                content,
                groupId,
                from: socket.credentials?.user,
            });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;
