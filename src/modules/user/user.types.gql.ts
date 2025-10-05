import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { GenderEnum, HUserDocument, ProviderEnum, RoleEnum } from "../../DB";
import { GraphQLUniformResponse } from "../graphql/types.gql";

export const GraphQLGenderEnum = new GraphQLEnumType({
  name: "GraphQLGenderEnum",
  values: {
    male: { value: GenderEnum.male },
    female: { value: GenderEnum.female },
  },
});
export const GraphQLRoleEnum = new GraphQLEnumType({
  name: "GraphQLRoleEnum",
  values: {
    user: { value: RoleEnum.user },
    admin: { value: RoleEnum.admin },
    superAdmin: { value: RoleEnum.superAdmin },
  },
});
export const GraphQLProviderEnum = new GraphQLEnumType({
  name: "GraphQLProviderEnum",
  values: {
    system: { value: ProviderEnum.system },
    google: { value: ProviderEnum.google },
  },
});
export const GraphQLOneUserResponse = new GraphQLObjectType({
  name: "OneUserResponse",
  fields: {
    _id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: GraphQLString },
    username: {
      type: GraphQLString,
      resolve: (parent: HUserDocument) => {
        return parent.gender === GenderEnum.male
          ? `Mr:${parent.username}`
          : `Mis:${parent.username}`;
      },
    },

    email: { type: GraphQLString },
    confirmEmailOtp: { type: GraphQLString },
    confirmAt: { type: GraphQLString },

    password: { type: GraphQLString },
    resetPasswordOtp: { type: GraphQLString },
    changeCredentialsTime: { type: GraphQLString },

    phone: { type: GraphQLString },
    address: { type: GraphQLString },

    pendingEmail: { type: GraphQLString },
    emailOtp: { type: GraphQLString },

    profileImage: { type: GraphQLString },
    temProfileImage: { type: GraphQLString },
    coverImages: { type: new GraphQLList(GraphQLString) },

    gender: { type: GraphQLGenderEnum },
    role: { type: GraphQLRoleEnum },
    provider: { type: GraphQLProviderEnum },

    isTwoStepEnabled: { type: GraphQLBoolean },
    twoStepOtp: { type: GraphQLString },
    twoStepOtpExpire: { type: GraphQLString },

    freezedAt: { type: GraphQLString },
    freezedBy: { type: GraphQLID },
    restoredAt: { type: GraphQLString },
    restoredBy: { type: GraphQLID },

    friends: { type: new GraphQLList(GraphQLID) },
    blockedUsers: { type: new GraphQLList(GraphQLID) },

    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});
export const welcome = new GraphQLNonNull(GraphQLString);
export const allUsers = new GraphQLList(GraphQLOneUserResponse);
export const addFollower = new GraphQLList(GraphQLOneUserResponse);
export const search = GraphQLUniformResponse({
  name: "SearchUser",
  data: new GraphQLNonNull(GraphQLOneUserResponse),
});
