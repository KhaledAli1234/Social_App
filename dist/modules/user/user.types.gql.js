"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = exports.addFollower = exports.allUsers = exports.welcome = exports.GraphQLOneUserResponse = exports.GraphQLProviderEnum = exports.GraphQLRoleEnum = exports.GraphQLGenderEnum = void 0;
const graphql_1 = require("graphql");
const DB_1 = require("../../DB");
const types_gql_1 = require("../graphql/types.gql");
exports.GraphQLGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLGenderEnum",
    values: {
        male: { value: DB_1.GenderEnum.male },
        female: { value: DB_1.GenderEnum.female },
    },
});
exports.GraphQLRoleEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLRoleEnum",
    values: {
        user: { value: DB_1.RoleEnum.user },
        admin: { value: DB_1.RoleEnum.admin },
        superAdmin: { value: DB_1.RoleEnum.superAdmin },
    },
});
exports.GraphQLProviderEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLProviderEnum",
    values: {
        system: { value: DB_1.ProviderEnum.system },
        google: { value: DB_1.ProviderEnum.google },
    },
});
exports.GraphQLOneUserResponse = new graphql_1.GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: graphql_1.GraphQLString },
        username: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        confirmEmailOtp: { type: graphql_1.GraphQLString },
        confirmAt: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        resetPasswordOtp: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        pendingEmail: { type: graphql_1.GraphQLString },
        emailOtp: { type: graphql_1.GraphQLString },
        profileImage: { type: graphql_1.GraphQLString },
        temProfileImage: { type: graphql_1.GraphQLString },
        coverImages: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        gender: { type: exports.GraphQLGenderEnum },
        role: { type: exports.GraphQLRoleEnum },
        provider: { type: exports.GraphQLProviderEnum },
        isTwoStepEnabled: { type: graphql_1.GraphQLBoolean },
        twoStepOtp: { type: graphql_1.GraphQLString },
        twoStepOtpExpire: { type: graphql_1.GraphQLString },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        blockedUsers: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.welcome = new graphql_1.GraphQLNonNull(graphql_1.GraphQLString);
exports.allUsers = new graphql_1.GraphQLList(exports.GraphQLOneUserResponse);
exports.addFollower = new graphql_1.GraphQLList(exports.GraphQLOneUserResponse);
exports.search = (0, types_gql_1.GraphQLUniformResponse)({
    name: "SearchUser",
    data: new graphql_1.GraphQLNonNull(exports.GraphQLOneUserResponse),
});
