import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  profile: [RoleEnum.user],
  restoreAccount: [RoleEnum.admin],
  hardDelete: [RoleEnum.admin],
};
