import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GraphQLGenderEnum } from "./user.types.gql";

export const allUsers = {
  gender: { type: GraphQLGenderEnum },
};

export const searchUser = {
  email: { type: new GraphQLNonNull(GraphQLString) },
};

export const addFollower = {
  friendId: { type: new GraphQLNonNull(GraphQLInt) },
  myId: { type: new GraphQLNonNull(GraphQLInt) },
};
