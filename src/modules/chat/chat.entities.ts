import { HChatDocument } from "../../DB";

export interface IGetChatResponse {
  chat: Partial<HChatDocument>;
}
