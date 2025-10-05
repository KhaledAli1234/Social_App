import { HPostDocument, LikeActionEnum } from "../../DB";
import { IAuthGraph } from "../graphql/schema.interface.gql";
import { PostService } from "./post.service";

export class PostResolver {
  private postService = new PostService();
  constructor() {}

  //QUERY

  allPosts = async (
    parent: unknown,
    args: { page: number; size: number },
    context: IAuthGraph
  ): Promise<{
    docCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | undefined;
    result: HPostDocument[];
  }> => {
    return await this.postService.allPosts(args, context.user);
  };

  //MUTITION

  likePost = async (
    parent: unknown,
    args: { postId: string; action: LikeActionEnum },
    context: IAuthGraph
  ): Promise<HPostDocument> => {
    return await this.postService.likeGraphPost(args, context.user);
  };
}
