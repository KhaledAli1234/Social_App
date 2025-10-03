import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
} from "mongoose";
import { DatabaseRepository, Lean } from "./database.repository";
import { IPost } from "../models/Post.model";
import { CommentRepository } from "./comment.repository";
import { CommentModel } from "../models";

export class PostRepository extends DatabaseRepository<IPost> {
  private commentModel = new CommentRepository(CommentModel);

  constructor(protected override readonly model: Model<IPost>) {
    super(model);
  }
  async findCursor({
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<IPost>;
    select?: ProjectionType<IPost> | undefined;
    options?: QueryOptions<IPost> | undefined;
  }): Promise<HydratedDocument<IPost>[] | [] | Lean<IPost>[] | any> {
    let result = [];

    const cursor = this.model
      .find(filter || {})
      .select(select || "")
      .populate(options?.populate as PopulateOptions[])
      .cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const comments = await this.commentModel.find({
        filter: { postId: doc._id, commentId: { $exists: false } },
      });
      result.push({ post: doc, comments });
    }
    return result;
  }
}
