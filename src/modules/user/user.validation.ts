import { z } from "zod";
import { LogoutEnum } from "../../utils/secuirty/token.secuirty";

export const logout = {
  body: z
    .strictObject({
      flag: z.enum(LogoutEnum).default(LogoutEnum.only),
    })
};


