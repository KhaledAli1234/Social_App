"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLUniformResponse = void 0;
const graphql_1 = require("graphql");
const GraphQLUniformResponse = ({ name, data, }) => {
    return new graphql_1.GraphQLObjectType({
        name: name,
        fields: {
            message: { type: graphql_1.GraphQLString },
            statusCode: { type: graphql_1.GraphQLInt },
            data: { type: data },
        },
    });
};
exports.GraphQLUniformResponse = GraphQLUniformResponse;
