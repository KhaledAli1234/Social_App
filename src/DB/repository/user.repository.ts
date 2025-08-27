import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IUser } from "../models/User.model";
import { BadRequestException } from "../../utils/response/error.response";

export class UserRepository extends DatabaseRepository<IUser> {
  constructor(protected override readonly model: Model<IUser>) {
    super(model);
  }

  async createUser({
    data,
    options,
  }: {
    data: Partial<IUser>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<IUser>> {
    const [user] = (await this.create({ data, options })) || [];
    if (!user) {
      throw new BadRequestException("fail to create user");
    }
    return user;
  }
}
