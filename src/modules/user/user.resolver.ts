import { GenderEnum, HUserDocument } from "../../DB";
import { graphAuthorization } from "../../middleware/authentication.middleware";
import { graphValidation } from "../../middleware/validation.middleware";
import { IAuthGraph } from "../graphql/schema.interface.gql";
import { endpoint } from "./user.authorization";
import { IUsers, UserService } from "./user.service";
import * as validators from "./user.validation";

export class UserResolver {
  private userService = new UserService();
  constructor() {}

  //QUERY

  welcome = async (
    parent: unknown,
    args: { name: string },
    context: IAuthGraph
  ): Promise<string> => {
    await graphValidation<{ name: string }>(validators.welcome, args);
    await graphAuthorization(endpoint.welcome, context.user.role);

    return this.userService.welcome(context.user);
  };

  allUsers = async (
    parent: unknown,
    args: { gender: GenderEnum },
    context: IAuthGraph
  ): Promise<HUserDocument[]> => {
    return await this.userService.allUsers(args , context.user);
  };

  search = (
    parent: unknown,
    args: { email: string }
  ): { message: string; statusCode: number; data: IUsers } => {
    return this.userService.search(args);
  };

  //MUTITION

  addFollower = (
    parent: unknown,
    args: { friendId: number; myId: number }
  ): IUsers[] => {
    return this.userService.addFollower(args);
  };
}
