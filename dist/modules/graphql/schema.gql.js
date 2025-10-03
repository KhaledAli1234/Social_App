"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const user_1 = require("../user");
const query = new graphql_1.GraphQLObjectType({
    name: "RootSchemaQuery",
    fields: {
        ...user_1.UserGQLSchema.registerQuery(),
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "RootSchemaMutation",
    fields: {
        ...user_1.UserGQLSchema.registerMutation(),
    },
});
exports.schema = new graphql_1.GraphQLSchema({ query, mutation });
