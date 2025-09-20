import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  AllowCommentsEnum,
  CommentModel,
  CommentRepository,
  HPostDocument,
  PostModel,
  PostRepository,
  RoleEnum,
  UserModel,
  UserRepository,
} from "../../DB";
import { Types } from "mongoose";
import { postAvailability } from "../post";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";

class CommentService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);
  private commentModel = new CommentRepository(CommentModel);
  constructor() {}

  createComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        allowComments: AllowCommentsEnum.allow,
        $or: postAvailability(req),
      },
    });
    if (!post) {
      throw new NotFoundException("fail to find matching result");
    }
    if (
      req.body.tags?.length &&
      (
        await this.userModel.find({
          filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
        })
      ).length !== req.body.tags.length
    ) {
      throw new NotFoundException("some of the mentioned users are not exist");
    }
    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      });
    }
    const [comment] =
      (await this.commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("fail to create this comment");
    }
    return successResponse({ res, statusCode: 201 });
  };
  replyOnComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };
    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        postId,
      },
      options: {
        populate: [
          {
            path: "postId",
            match: {
              allowComments: AllowCommentsEnum.allow,
              $or: postAvailability(req),
            },
          },
        ],
      },
    });
    if (!comment?.postId) {
      throw new NotFoundException("fail to find matching result");
    }
    if (
      req.body.tags?.length &&
      (
        await this.userModel.find({
          filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
        })
      ).length !== req.body.tags.length
    ) {
      throw new NotFoundException("some of the mentioned users are not exist");
    }
    let attachments: string[] = [];
    if (req.files?.length) {
      const post = comment.postId as Partial<HPostDocument>;
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      });
    }
    const [reply] =
      (await this.commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            commentId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!reply) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("fail to create this reply comment");
    }
    return successResponse({ res, statusCode: 201 });
  };
  getCommentById = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
    };

    const comment = await this.commentModel.findOne({
      filter: { _id: commentId },
    });

    if (!comment) {
      throw new NotFoundException("comment not found");
    }

    return successResponse({
      res,
      message: "comment fetched successfully",
      data: { comment },
    });
  };
  getCommentWithReply = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
    };

    const comment = await this.commentModel.findOne({
      filter: { _id: commentId },
      options: { populate: { path: "reply" } },
    });

    if (!comment) {
      throw new NotFoundException("comment not found");
    }

    return successResponse({
      res,
      message: "comment with reply fetched successfully",
      data: { comment },
    });
  };
  freezeComment = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
    };

    const comment = await this.commentModel.findOneAndUpdate({
      filter: {
        _id: commentId,
        freezedAt: { $exists: false },
        $or: [
          { createdBy: req.user?._id },
          { ...(req.user?.role === RoleEnum.admin ? {} : { _id: null }) },
        ],
      },
      update: {
        $set: {
          freezedAt: new Date(),
          freezedBy: req.user?._id,
        },
        $unset: {
          restoredAt: 1,
          restoredBy: 1,
        },
      },
      options: { new: true },
    });

    if (!comment) {
      throw new NotFoundException("comment not found or already freezed");
    }

    return successResponse({
      res,
      message: "comment freezed successfully",
    });
  };
  hardDeleteComment = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
    };

    const comment = await this.commentModel.deleteOne({
      filter: {
        _id: commentId,
        freezedAt: { $exists: true },
        $or: [
          { createdBy: req.user?._id },
          { ...(req.user?.role === RoleEnum.admin ? {} : { _id: null }) },
        ],
      },
    });

    if (!comment.deletedCount) {
      throw new NotFoundException("comment not found or fail to delete");
    }

    return successResponse({
      res,
      message: "comment deleted successfully",
    });
  };
  updateComment = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
    };
    const updateData = req.body;

    const comment = await this.commentModel.findOneAndUpdate({
      filter: {
        _id: commentId,
        freezedAt: { $exists: false },
        $or: [
          { createdBy: req.user?._id },
          { ...(req.user?.role === RoleEnum.admin ? {} : { _id: null }) },
        ],
      },
      update: {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      options: { new: true },
    });

    if (!comment) {
      throw new NotFoundException("comment not found or not allowed to update");
    }

    return successResponse({
      res,
      message: "comment updated successfully",
      data: { comment },
    });
  };
}

export default new CommentService();
