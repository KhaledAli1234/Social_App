import { v4 as uuid } from "uuid";
import multer, { FileFilterCallback } from "multer";
import os from "node:os";
import { BadRequestException } from "../response/error.response";
import { Request } from "express";

export enum StorageEnum {
  memory = "memory",
  disk = "disk",
}
export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/gif"],
};

export const cloudFileUploud = ({
  validation = [],
  storageApproach = StorageEnum.memory,
  maxSizeMB = 2,
}: {
  validation?: string[];
  storageApproach?: StorageEnum;
  maxSizeMB?: number;
}): multer.Multer => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            callback
          ) {
            callback(null, `${uuid()}_${file.originalname}`);
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) {
    if (!validation.includes(file.mimetype)) {
      return callback(
        new BadRequestException("validation error", {
          validationError: [
            {
              key: "file",
              issues: [{ path: "file", message: "invalid file format" }],
            },
          ],
        })
      );
    }
    return callback(null, true);
  }
  return multer({
    fileFilter,
    limits: { fieldSize: maxSizeMB * 1024 * 1024 },
    storage,
  });
};
