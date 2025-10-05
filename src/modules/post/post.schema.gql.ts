import * as gqlTypes from "./post.types.gql";
import * as gqlArgs from "./post.args.gql";
import { PostResolver } from "./post.resolver";

class PostGQLSchema {
  private postResolver = new PostResolver();
  constructor() {}

  registerQuery = () => {
    return {

      allPosts: {
        type: gqlTypes.allPosts,
        args: gqlArgs.allPosts,
        resolve: this.postResolver.allPosts,
      },
    };
  };

  registerMutation = () => {
    return {
     likePost: {
        type: gqlTypes.GraphQLOnePostResponse,
        args: gqlArgs.likePost,
        resolve: this.postResolver.likePost,
      },
    };
  };
}

export default new PostGQLSchema();
