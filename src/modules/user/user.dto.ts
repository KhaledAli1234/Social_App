import * as validators from "./user.validation";
import { z } from "zod";


export type ILogoutDTO = z.Infer<typeof validators.logout.body>;
