import { NextFunction, Request, Response } from "express";
import { decodedToken, TokenEnum } from "../utils/secuirty/token.secuirty";
import {
  BadRequestException,
  ForbiddenException,
} from "../utils/response/error.response";
import { RoleEnum } from "../DB/models/User.model";
import { GraphQLError } from "graphql";

export const authentication = (tokenType: TokenEnum = TokenEnum.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new BadRequestException("Validation error", {
        key: "headers",
        issuse: [{ path: "authorization", message: "Missing authorization" }],
      });
    }
    const { user, decoded } = await decodedToken({
      authorization: req.headers.authorization,
      tokenType,
    });

    req.user = user;
    req.decoded = decoded;

    return next();
  };
};

export const authorization = (
  accessRole: RoleEnum[] = [],
  tokenType: TokenEnum = TokenEnum.access
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new BadRequestException("Validation error", {
        key: "headers",
        issuse: [{ path: "authorization", message: "Missing authorization" }],
      });
    }
    const { user, decoded } = await decodedToken({
      authorization: req.headers.authorization,
      tokenType,
    });

    if (!accessRole.includes(user.role)) {
      throw new ForbiddenException("Not authorized account");
    }

    req.user = user;
    req.decoded = decoded;

    return next();
  };
};

export const graphAuthorization =async (
  accessRole: RoleEnum[] = [],
  role: RoleEnum
) => {
  if (!accessRole.includes(role)) {
    throw new GraphQLError("Not authorized account", {
      extensions: { statusCode: 403 },
    });
  }
};
