import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { UserGQLSchema } from "../user";

const query = new GraphQLObjectType({
  name: "RootSchemaQuery",
  fields: {
    ...UserGQLSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootSchemaMutation",
  fields: {
    ...UserGQLSchema.registerMutation(),
  },
});

export const schema = new GraphQLSchema({ query, mutation });
