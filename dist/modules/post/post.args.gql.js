"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.allPosts = void 0;
const graphql_1 = require("graphql");
const DB_1 = require("../../DB");
exports.allPosts = {
    size: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    page: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
};
exports.likePost = {
    postId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
    action: {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
            name: "LikeActionEnum",
            values: {
                like: { value: DB_1.LikeActionEnum.like },
                unlike: { value: DB_1.LikeActionEnum.unlike },
            },
        })),
    },
};
