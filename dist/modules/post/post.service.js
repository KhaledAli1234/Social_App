"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const Post_model_1 = require("../../DB/models/Post.model");
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
const email_event_1 = require("../../utils/email/email.event");
const otp_1 = require("../../utils/otp");
class PostService {
    postModel = new repository_1.PostRepository(Post_model_1.PostModel);
    userModel = new repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
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
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === Post_model_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: { _id: postId },
            update,
        });
        if (!post) {
            throw new error_response_1.NotFoundException("invalid postId or post not exist");
        }
        return (0, success_response_1.successResponse)({ res });
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
}
exports.default = new PostService();
