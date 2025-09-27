import { z } from "zod";
import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { createChattingGroup, getChat, getChattingGroup } from "./chat.validation";

export type IGetChattingGroupParamsDTO = z.infer<typeof getChattingGroup.params>;
export type IGetChatParamsDTO = z.infer<typeof getChat.params>;
export type IGetChatQueryParamsDTO = z.infer<typeof getChat.query>;
export type ICreateChattingGroupParamsDTO = z.infer<
  typeof createChattingGroup.body
>;

export interface IMainDTO {
  socket: IAuthSocket;
  callback?: any;
  io?: Server;
}

export interface ISayHiDTO extends IMainDTO {
  message: string;
}

export interface ISendMessageDTO extends IMainDTO {
  content: string;
  sendTo: string;
}

export interface ISendGroupMessageDTO extends IMainDTO {
  content: string;
  groupId: string;
}

export interface IJoinRoomDTO extends IMainDTO {
  roomId: string;
}

