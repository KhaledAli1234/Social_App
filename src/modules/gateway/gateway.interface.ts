import { Server, Socket } from "socket.io";
import { HUserDocument } from "../../DB";
import { JwtPayload } from "jsonwebtoken";

export interface IAuthSocket extends Socket {
  credentials?: {
    user: Partial<HUserDocument>;
    decoded: JwtPayload;
  };
}
export interface IMainDTO {
  socket: IAuthSocket;
  callback?: any;
  io?: Server;
}
