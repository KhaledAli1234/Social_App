import * as validators from "./user.validation";
import { z } from "zod";


export type ILogoutDTO = z.Infer<typeof validators.logout.body>;
export type IFreezeAccountDTO = z.Infer<typeof validators.freezeAccount.params>;
export type IRestoreAccountDTO = z.Infer<typeof validators.restoreAccount.params>;
export type IHardDeleteAccountDTO = z.Infer<typeof validators.hardDelete.params>;
