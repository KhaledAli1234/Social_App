import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  ICreateChattingGroupParamsDTO,
  IGetChatParamsDTO,
  IGetChatQueryParamsDTO,
  IGetChattingGroupParamsDTO,
  IJoinRoomDTO,
  ISayHiDTO,
  ISendGroupMessageDTO,
  ISendMessageDTO,
} from "./chat.dto";
import { ChatModel, ChatRepository, UserModel, UserRepository } from "../../DB";
import { Types } from "mongoose";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { IGetChatResponse } from "./chat.entities";
import { connectedSockets } from "../gateway";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";
import { v4 as uuid } from "uuid";

export class ChatService {
  private chatModel = new ChatRepository(ChatModel);
  private userModel = new UserRepository(UserModel);
  constructor() {}

  //REST
  getChat = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IGetChatParamsDTO;
    const { page, size }: IGetChatQueryParamsDTO = req.query;
    const chat = await this.chatModel.findOneChat({
      filter: {
        participants: {
          $all: [
            req.user?._id as Types.ObjectId,
            Types.ObjectId.createFromHexString(userId),
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
      throw new BadRequestException("fail to find matching chatting instance");
    }
    return successResponse<IGetChatResponse>({ res, data: { chat } });
  };

  getChattingGroup = async (req: Request, res: Response): Promise<Response> => {
    const { groupId } = req.params as IGetChattingGroupParamsDTO;
    const { page, size }: IGetChatQueryParamsDTO = req.query;
    const chat = await this.chatModel.findOneChat({
      filter: {
        _id: Types.ObjectId.createFromHexString(groupId),
        participants: { $in: req.user?._id as Types.ObjectId },
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
      throw new BadRequestException("fail to find matching chatting instance");
    }
    return successResponse<IGetChatResponse>({ res, data: { chat } });
  };

  createChattingGroup = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { group, participants }: ICreateChattingGroupParamsDTO = req.body;
    const dbParticipants = participants.map((participants: string) => {
      return Types.ObjectId.createFromHexString(participants);
    });

    const users = await this.userModel.find({
      filter: {
        _id: { $in: dbParticipants },
        friends: { $in: req.user?._id as Types.ObjectId },
      },
    });

    if (participants.length != users.length) {
      throw new NotFoundException("some recipient all invalid");
    }
    let group_image: string | undefined = undefined;
    const roomId = group.replaceAll(/\s+/g, "_") + "_" + uuid();
    if (req.file) {
      group_image = await uploadFile({
        file: req.file as Express.Multer.File,
        path: `chat/${roomId}`,
      });
    }
    dbParticipants.push(req.user?._id as Types.ObjectId);
    const [chat] =
      (await this.chatModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            messages: [],
            participants: dbParticipants,
            group,
            group_image: group_image as string,
            roomId,
          },
        ],
      })) || [];
    if (!chat) {
      if (group_image) {
        await deleteFile({ Key: group_image });
      }
      throw new BadRequestException("fail to generate this group");
    }
    return successResponse<IGetChatResponse>({
      res,
      statusCode: 201,
      data: { chat },
    });
  };

  //IO
  sayHi = ({ message, socket, callback, io }: ISayHiDTO) => {
    try {
      console.log({ message });
      if (callback) {
        callback("BE TO FE");
      }
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  sendMessage = async ({ content, sendTo, socket, io }: ISendMessageDTO) => {
    try {
      const createdBy = socket.credentials?.user._id as Types.ObjectId;
      const user = await this.userModel.findOne({
        filter: {
          _id: Types.ObjectId.createFromHexString(sendTo),
          friends: { $in: createdBy },
        },
      });

      if (!user) {
        throw new NotFoundException("invalid recipient friend");
      }

      const chat = await this.chatModel.findOneAndUpdate({
        filter: {
          participants: {
            $all: [
              createdBy as Types.ObjectId,
              Types.ObjectId.createFromHexString(sendTo),
            ],
          },
          group: { $exists: false },
        },
        update: {
          $addToSet: { messages: { content, createdBy } },
        },
      });

      if (!chat) {
        const [newChat] =
          (await this.chatModel.create({
            data: [
              {
                createdBy,
                messages: [{ content, createdBy }],
                participants: [
                  createdBy as Types.ObjectId,
                  Types.ObjectId.createFromHexString(sendTo),
                ],
              },
            ],
          })) || [];
        if (!newChat) {
          throw new BadRequestException("fail to creat this chat");
        }
      }

      io?.to(
        connectedSockets.get(createdBy.toString() as string) as string[]
      ).emit("successMessage", { content });

      io?.to(connectedSockets.get(sendTo) as string[]).emit("newMessage", {
        content,
        from: socket.credentials?.user,
      });
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  joinRoom = async ({ roomId, socket, io }: IJoinRoomDTO) => {
    try {
      const chat = await this.chatModel.findOne({
        filter: {
          roomId,
          group: { $exists: true },
          participants: { $in: socket.credentials?.user._id },
        },
      });
      if (!chat) {
        throw new NotFoundException("fail to find matching room");
      }
      socket.join(chat.roomId as string);
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  sendGroupMessage = async ({
    content,
    groupId,
    socket,
    io,
  }: ISendGroupMessageDTO) => {
    try {
      const createdBy = socket.credentials?.user._id as Types.ObjectId;
      const chat = await this.chatModel.findOneAndUpdate({
        filter: {
          _id: Types.ObjectId.createFromHexString(groupId),
          participants: { $in: createdBy as Types.ObjectId },
          group: { $exists: true },
        },
        update: {
          $addToSet: { messages: { content, createdBy } },
        },
      });

      if (!chat) {
        throw new BadRequestException("fail to find matching room");
      }

      io?.to(
        connectedSockets.get(createdBy.toString() as string) as string[]
      ).emit("successMessage", { content });

      socket?.to(chat.roomId as string).emit("newMessage", {
        content,
        groupId,
        from: socket.credentials?.user,
      });
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };
}
