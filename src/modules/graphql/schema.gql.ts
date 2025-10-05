import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { UserGQLSchema } from "../user";
import { postGQLSchema } from "../post";

const query = new GraphQLObjectType({
  name: "RootSchemaQuery",
  fields: {
    ...UserGQLSchema.registerQuery(),
    ...postGQLSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootSchemaMutation",
  fields: {
    ...UserGQLSchema.registerMutation(),
    ...postGQLSchema.registerMutation(),
  },
});

export const schema = new GraphQLSchema({ query, mutation });
