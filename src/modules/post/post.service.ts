import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { v4 as uuid } from "uuid";
import {
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from "../../utils/multer/s3.config";
import { ILikePostQueryInputsDTO } from "./post.dto";
import { Types, UpdateQuery } from "mongoose";
import { emailEvent } from "../../utils/email/email.event";
import { generateNumberOtp } from "../../utils/otp";
import {
  AvailabilityEnum,
  CommentModel,
  CommentRepository,
  HPostDocument,
  HUserDocument,
  LikeActionEnum,
  PostModel,
  PostRepository,
  UserModel,
  UserRepository,
} from "../../DB";
import { connectedSockets, getIo } from "../gateway";
import { GraphQLError } from "graphql";

export const postAvailability = (user: HUserDocument) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: user._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...(user.friends || []), user._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tags: { $in: user._id },
    },
  ];
};

export class PostService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);
  private commentModel = new CommentRepository(CommentModel);
  constructor() {}

  createPost = async (req: Request, res: Response): Promise<Response> => {
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
    let assetsFolderId: string = uuid();
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/post/${assetsFolderId}`,
      });
    }
    const [post] =
      (await this.postModel.create({
        data: [
          {
            ...req.body,
            attachments,
            assetsFolderId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];
    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("fail to create this post");
    }
    return successResponse({ res, statusCode: 201 });
  };
  updatePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
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
    const updatedPost = await this.postModel.updateOne({
      filter: {
        _id: post._id,
      },
      update: [
        {
          $set: {
            content: req.body.content,
            allowComments: req.body.allowComments || post.allowComments,
            availability: req.body.availability || post.availability,

            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    "attachments",
                    req.body.removedAttachments || [],
                  ],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "tags",
                    (req.body.removedTags || []).map((tag: string) => {
                      return Types.ObjectId.createFromHexString(tag);
                    }),
                  ],
                },
                (req.body.tags || []).map((tag: string) => {
                  return Types.ObjectId.createFromHexString(tag);
                }),
              ],
            },
          },
        },
      ],
    });
    if (!updatedPost.matchedCount) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("fail to create this post");
    } else {
      if (req.body.removedAttachments?.length) {
        await deleteFiles({ urls: req.body.removedAttachments });
      }
    }
    return successResponse({ res });
  };
  likePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as { postId: string };
    const { action } = req.query as ILikePostQueryInputsDTO;

    let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: req.user?._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = { $pull: { likes: req.user?._id } };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(req.user as HUserDocument),
      },
      update,
    });

    if (!post) {
      throw new NotFoundException("invalid postId or post not exist");
    }
    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit("likePost", { postId, userId: req.user?._id });
    }

    return successResponse({ res });
  };
  postList = async (req: Request, res: Response): Promise<Response> => {
    let { page, size } = req.query as unknown as { page: number; size: number };
    const posts = await this.postModel.paginate({
      filter: {
        $or: postAvailability(req.user as HUserDocument),
      },
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
              freezedAt: { $exists: false },
            },
            populate: [
              {
                path: "reply",
                match: {
                  commentId: { $exists: false },
                  freezedAt: { $exists: false },
                },
                populate: [
                  {
                    path: "reply",
                    match: {
                      commentId: { $exists: false },
                      freezedAt: { $exists: false },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      page,
      size,
    });
    return successResponse({ res, data: { posts } });
  };
  sendTagEmail = async (req: Request, res: Response): Promise<Response> => {
    const { postId, tags } = req.body;

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const users = await this.userModel.find({ filter: { $in: tags } });

    users.forEach((user) => {
      emailEvent.emit("tags", {
        to: user.email,
        otp: generateNumberOtp(),
      });
    });

    return successResponse({
      res,
      message: "Tag emails sent successfully",
    });
  };
  getPostById = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    const post = await this.postModel.findOne({
      filter: { _id: postId },
      options: { populate: [{ path: "comments" }] },
    });

    if (!post) {
      throw new NotFoundException("post not found");
    }

    return successResponse({
      res,
      message: "post fetched successfully",
      data: { post },
    });
  };
  freezePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    const post = await this.postModel.updateOne({
      filter: {
        _id: postId,
        freezedAt: { $exists: false },
      },
      update: {
        freezedAt: new Date(),
        freezedBy: req.user?._id,
        $unset: {
          restoredAt: 1,
          restoredBy: 1,
        },
      },
    });

    if (!post.matchedCount) {
      throw new NotFoundException("post not found or already freezed");
    }

    return successResponse({
      res,
      message: "post freezed successfully",
    });
  };
  hardDeletePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    const post = await this.postModel.deleteOne({
      filter: {
        _id: postId,
        freezedAt: { $exists: true },
      },
    });

    if (!post.deletedCount) {
      throw new NotFoundException("post not found or fail to hard delete");
    }
    await this.commentModel.deleteMany({ filter: { postId } });
    await deleteFolderByPrefix({ path: `posts/${postId}` });

    return successResponse({
      res,
      message: "post deleted successfully",
    });
  };
  // GEAPHQL
  allPosts = async (
    {
      page,
      size,
    }: {
      page: number;
      size: number;
    },
    authUser: HUserDocument
  ): Promise<{
    docCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | undefined;
    result: HPostDocument[];
  }> => {
    const posts = await this.postModel.paginate({
      filter: {
        $or: postAvailability(authUser),
      },
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
              freezedAt: { $exists: false },
            },
            populate: [
              {
                path: "reply",
                match: {
                  commentId: { $exists: false },
                  freezedAt: { $exists: false },
                },
                populate: [
                  {
                    path: "reply",
                    match: {
                      commentId: { $exists: false },
                      freezedAt: { $exists: false },
                    },
                  },
                ],
              },
            ],
          },
          {
            path: "createdBy",
          },
        ],
      },
      page,
      size,
    });
    return posts;
  };
  likeGraphPost = async (
    { postId, action }: { postId: string; action: LikeActionEnum },
    authUser: HUserDocument
  ): Promise<HPostDocument> => {
    let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: authUser._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = { $pull: { likes: authUser._id } };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(authUser),
      },
      update,
    });

    if (!post) {
      throw new GraphQLError("invalid postId or post not exist", {
        extensions: { statusCode: 404 },
      });
    }
    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit("likePost", { postId, userId: authUser._id });
    }

    return post;
  };
}

export const postService = new PostService();
