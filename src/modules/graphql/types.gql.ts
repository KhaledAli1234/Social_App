import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLString,
} from "graphql";

export const GraphQLUniformResponse = ({
  name,
  data,
}: {
  name: string;
  data: GraphQLOutputType;
}): GraphQLOutputType => {
  return new GraphQLObjectType({
    name: name,
    fields: {
      message: { type: GraphQLString },
      statusCode: { type: GraphQLInt },
      data: { type: data },
    },
  });
};
