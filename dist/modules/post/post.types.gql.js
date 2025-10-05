"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQLOnePostResponse = exports.GraphQLAvailabilityEnum = exports.GraphQLAllowCommentsEnum = void 0;
const graphql_1 = require("graphql");
const DB_1 = require("../../DB");
const user_1 = require("../user");
exports.GraphQLAllowCommentsEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLAllowCommentsEnum",
    values: {
        allow: { value: DB_1.AllowCommentsEnum.allow },
        deny: { value: DB_1.AllowCommentsEnum.deny },
    },
});
exports.GraphQLAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLAvailabilityEnum",
    values: {
        public: { value: DB_1.AvailabilityEnum.public },
        friends: { value: DB_1.AvailabilityEnum.friends },
        onlyMe: { value: DB_1.AvailabilityEnum.onlyMe },
    },
});
exports.GraphQLOnePostResponse = new graphql_1.GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        assetsFolderId: { type: graphql_1.GraphQLString },
        allowComments: { type: exports.GraphQLAllowCommentsEnum },
        availability: { type: exports.GraphQLAvailabilityEnum },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdBy: { type: user_1.GraphQLOneUserResponse },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.allPosts = new graphql_1.GraphQLObjectType({
    name: "allPosts",
    fields: {
        docCount: { type: graphql_1.GraphQLID },
        limit: { type: graphql_1.GraphQLID },
        pages: { type: graphql_1.GraphQLID },
        currentPage: { type: graphql_1.GraphQLID },
        result: { type: new graphql_1.GraphQLList(exports.GraphQLOnePostResponse) },
    },
});
