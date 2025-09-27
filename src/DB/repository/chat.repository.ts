import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
} from "mongoose";
import { DatabaseRepository, Lean } from "./database.repository";
import { IChat } from "../models/Chat.model";

export class ChatRepository extends DatabaseRepository<IChat> {
  constructor(protected override readonly model: Model<IChat>) {
    super(model);
  }

  async findOneChat({
    filter,
    select = {},
    options,
    page = 1,
    size = 5,
  }: {
    filter?: RootFilterQuery<IChat>;
    select?: ProjectionType<IChat> | null;
    options?: QueryOptions<IChat> | null;
    page?: number | undefined;
    size?: number | undefined;
  }): Promise<Lean<IChat> | HydratedDocument<IChat> | null> {
    page = Math.floor(!page || page < 1 ? 1 : page);
    size = Math.floor(size < 1 || !size ? 5 : size);

    const doc = this.model.findOne(filter, {
      messages: { $slice: [-(page * size), size] },
    });
    if (options?.lean) {
      doc.lean(options.lean);
    }
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }
}
