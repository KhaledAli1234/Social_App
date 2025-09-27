import { HChatDocument, HUserDocument } from "../../DB";

export interface IProfileImageResponse {
  url: string;
}

export interface IUserResponse {
  user: Partial<HUserDocument>;
  groups?: Partial<HChatDocument>[];
}
