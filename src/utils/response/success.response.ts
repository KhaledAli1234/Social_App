import { Response } from "express";

export const successResponse = <T = any>({
  res,
  message = "Done",
  statusCode = 200,
  data,
}: {
  res: Response;
  message?: string;
  statusCode?: number;
  data?: T;
}): Response => {
  return res.status(statusCode).json({ message, statusCode, data });
};
