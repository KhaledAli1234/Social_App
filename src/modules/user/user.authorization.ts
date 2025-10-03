import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  welcome: [RoleEnum.user, RoleEnum.admin],
  profile: [RoleEnum.user],
  restoreAccount: [RoleEnum.admin],
  hardDelete: [RoleEnum.admin],
  dashboard: [RoleEnum.admin, RoleEnum.superAdmin],
};
