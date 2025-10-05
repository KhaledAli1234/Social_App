"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const DB_1 = require("../../DB");
const post_1 = require("../post");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
class CommentService {
    postModel = new DB_1.PostRepository(DB_1.PostModel);
    userModel = new DB_1.UserRepository(DB_1.UserModel);
    commentModel = new DB_1.CommentRepository(DB_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: DB_1.AllowCommentsEnum.allow,
                $or: (0, post_1.postAvailability)(req.user),
            },
        });
        if (!post) {
            throw new error_response_1.NotFoundException("fail to find matching result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of the mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [comment] = (await this.commentModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("fail to create this comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    replyOnComment = async (req, res) => {
        const { postId, commentId } = req.params;
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
                            allowComments: DB_1.AllowCommentsEnum.allow,
                            $or: (0, post_1.postAvailability)(req.user),
                        },
                    },
                ],
            },
        });
        if (!comment?.postId) {
            throw new error_response_1.NotFoundException("fail to find matching result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of the mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [reply] = (await this.commentModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("fail to create this reply comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    getCommentById = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: { _id: commentId },
        });
        if (!comment) {
            throw new error_response_1.NotFoundException("comment not found");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "comment fetched successfully",
            data: { comment },
        });
    };
    getCommentWithReply = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: { _id: commentId },
            options: { populate: { path: "reply" } },
        });
        if (!comment) {
            throw new error_response_1.NotFoundException("comment not found");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "comment with reply fetched successfully",
            data: { comment },
        });
    };
    freezeComment = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOneAndUpdate({
            filter: {
                _id: commentId,
                freezedAt: { $exists: false },
                $or: [
                    { createdBy: req.user?._id },
                    { ...(req.user?.role === DB_1.RoleEnum.admin ? {} : { _id: null }) },
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
            throw new error_response_1.NotFoundException("comment not found or already freezed");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "comment freezed successfully",
        });
    };
    hardDeleteComment = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.deleteOne({
            filter: {
                _id: commentId,
                freezedAt: { $exists: true },
                $or: [
                    { createdBy: req.user?._id },
                    { ...(req.user?.role === DB_1.RoleEnum.admin ? {} : { _id: null }) },
                ],
            },
        });
        if (!comment.deletedCount) {
            throw new error_response_1.NotFoundException("comment not found or fail to delete");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "comment deleted successfully",
        });
    };
    updateComment = async (req, res) => {
        const { commentId } = req.params;
        const updateData = req.body;
        const comment = await this.commentModel.findOneAndUpdate({
            filter: {
                _id: commentId,
                freezedAt: { $exists: false },
                $or: [
                    { createdBy: req.user?._id },
                    { ...(req.user?.role === DB_1.RoleEnum.admin ? {} : { _id: null }) },
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
            throw new error_response_1.NotFoundException("comment not found or not allowed to update");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "comment updated successfully",
            data: { comment },
        });
    };
}
exports.default = new CommentService();
