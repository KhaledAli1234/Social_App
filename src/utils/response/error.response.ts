import { NextFunction, Request, Response } from "express";

export interface IError extends Error {
  statusCode: number;
}

export class ApplicationException extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    cause?: unknown
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 400, cause);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 404, cause);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 401, cause);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 403, cause);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 409, cause);
  }
}

export const globalErrorHandling = (
  error: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res.status(error.statusCode || 500).json({
    error_message: error.message || "something went wrong!",
    stack: process.env.MOOD === "development" ? error.stack : undefined,
    cause: error.cause,
    error,
  });
};
