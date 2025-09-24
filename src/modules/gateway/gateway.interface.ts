import { Socket } from "socket.io";
import { HUserDocument } from "../../DB";
import { JwtPayload } from "jsonwebtoken";
export interface ICredentials {
  user: Partial<HUserDocument>;
  decoded: JwtPayload;
}
export interface IAuthSocket extends Socket {
  credentials?: ICredentials;
}
