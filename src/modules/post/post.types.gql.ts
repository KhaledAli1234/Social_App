import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { AllowCommentsEnum, AvailabilityEnum } from "../../DB";
import { GraphQLOneUserResponse } from "../user";

export const GraphQLAllowCommentsEnum = new GraphQLEnumType({
  name: "GraphQLAllowCommentsEnum",
  values: {
    allow: { value: AllowCommentsEnum.allow },
    deny: { value: AllowCommentsEnum.deny },
  },
});

export const GraphQLAvailabilityEnum = new GraphQLEnumType({
  name: "GraphQLAvailabilityEnum",
  values: {
    public: { value: AvailabilityEnum.public },
    friends: { value: AvailabilityEnum.friends },
    onlyMe: { value: AvailabilityEnum.onlyMe },
  },
});

export const GraphQLOnePostResponse = new GraphQLObjectType({
  name: "OnePostResponse",
  fields: {
    _id: { type: GraphQLID },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    assetsFolderId: { type: GraphQLString },

    allowComments: { type: GraphQLAllowCommentsEnum },
    availability: { type: GraphQLAvailabilityEnum },

    tags: { type: new GraphQLList(GraphQLID) },
    likes: { type: new GraphQLList(GraphQLID) },

    createdBy: { type: GraphQLOneUserResponse },

    freezedAt: { type: GraphQLString },
    freezedBy: { type: GraphQLID },

    restoredAt: { type: GraphQLString },
    restoredBy: { type: GraphQLID },

    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});

export const allPosts = new GraphQLObjectType({
  name: "allPosts",
  fields: {
    docCount: { type: GraphQLID },
    limit: { type: GraphQLID },
    pages: { type: GraphQLID },
    currentPage: { type: GraphQLID },
    result: { type: new GraphQLList(GraphQLOnePostResponse) },
  },
});
