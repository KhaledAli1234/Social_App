"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = exports.postAvailability = void 0;
const success_response_1 = require("../../utils/response/success.response");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
const mongoose_1 = require("mongoose");
const email_event_1 = require("../../utils/email/email.event");
const otp_1 = require("../../utils/otp");
const DB_1 = require("../../DB");
const gateway_1 = require("../gateway");
const graphql_1 = require("graphql");
const postAvailability = (user) => {
    return [
        { availability: DB_1.AvailabilityEnum.public },
        { availability: DB_1.AvailabilityEnum.onlyMe, createdBy: user._id },
        {
            availability: DB_1.AvailabilityEnum.friends,
            createdBy: { $in: [...(user.friends || []), user._id] },
        },
        {
            availability: { $ne: DB_1.AvailabilityEnum.onlyMe },
            tags: { $in: user._id },
        },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    postModel = new DB_1.PostRepository(DB_1.PostModel);
    userModel = new DB_1.UserRepository(DB_1.UserModel);
    commentModel = new DB_1.CommentRepository(DB_1.CommentModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of the mentioned users are not exist");
        }
        let attachments = [];
        let assetsFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetsFolderId}`,
            });
        }
        const [post] = (await this.postModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("fail to create this post");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
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
                                        (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        }),
                                    ],
                                },
                                (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                }),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatedPost.matchedCount) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("fail to create this post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, success_response_1.successResponse)({ res });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === DB_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req.user),
            },
            update,
        });
        if (!post) {
            throw new error_response_1.NotFoundException("invalid postId or post not exist");
        }
        if (action !== DB_1.LikeActionEnum.unlike) {
            (0, gateway_1.getIo)()
                .to(gateway_1.connectedSockets.get(post.createdBy.toString()))
                .emit("likePost", { postId, userId: req.user?._id });
        }
        return (0, success_response_1.successResponse)({ res });
    };
    postList = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this.postModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(req.user),
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
        return (0, success_response_1.successResponse)({ res, data: { posts } });
    };
    sendTagEmail = async (req, res) => {
        const { postId, tags } = req.body;
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new error_response_1.NotFoundException("Post not found");
        }
        const users = await this.userModel.find({ filter: { $in: tags } });
        users.forEach((user) => {
            email_event_1.emailEvent.emit("tags", {
                to: user.email,
                otp: (0, otp_1.generateNumberOtp)(),
            });
        });
        return (0, success_response_1.successResponse)({
            res,
            message: "Tag emails sent successfully",
        });
    };
    getPostById = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: { _id: postId },
            options: { populate: [{ path: "comments" }] },
        });
        if (!post) {
            throw new error_response_1.NotFoundException("post not found");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "post fetched successfully",
            data: { post },
        });
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
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
            throw new error_response_1.NotFoundException("post not found or already freezed");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "post freezed successfully",
        });
    };
    hardDeletePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.deleteOne({
            filter: {
                _id: postId,
                freezedAt: { $exists: true },
            },
        });
        if (!post.deletedCount) {
            throw new error_response_1.NotFoundException("post not found or fail to hard delete");
        }
        await this.commentModel.deleteMany({ filter: { postId } });
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `posts/${postId}` });
        return (0, success_response_1.successResponse)({
            res,
            message: "post deleted successfully",
        });
    };
    allPosts = async ({ page, size, }, authUser) => {
        const posts = await this.postModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(authUser),
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
    likeGraphPost = async ({ postId, action }, authUser) => {
        let update = {
            $addToSet: { likes: authUser._id },
        };
        if (action === DB_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: authUser._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(authUser),
            },
            update,
        });
        if (!post) {
            throw new graphql_1.GraphQLError("invalid postId or post not exist", {
                extensions: { statusCode: 404 },
            });
        }
        if (action !== DB_1.LikeActionEnum.unlike) {
            (0, gateway_1.getIo)()
                .to(gateway_1.connectedSockets.get(post.createdBy.toString()))
                .emit("likePost", { postId, userId: authUser._id });
        }
        return post;
    };
}
exports.PostService = PostService;
exports.postService = new PostService();
