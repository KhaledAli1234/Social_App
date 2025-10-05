"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const user_1 = require("../user");
const post_1 = require("../post");
const query = new graphql_1.GraphQLObjectType({
    name: "RootSchemaQuery",
    fields: {
        ...user_1.UserGQLSchema.registerQuery(),
        ...post_1.postGQLSchema.registerQuery(),
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "RootSchemaMutation",
    fields: {
        ...user_1.UserGQLSchema.registerMutation(),
        ...post_1.postGQLSchema.registerMutation(),
    },
});
exports.schema = new graphql_1.GraphQLSchema({ query, mutation });
