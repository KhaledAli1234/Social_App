"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestModel = void 0;
const mongoose_1 = require("mongoose");
const friendRequestSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    sentTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
});
friendRequestSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
friendRequestSchema.pre(["find", "findOne", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.FriendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)("FriendRequest", friendRequestSchema);
