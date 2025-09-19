"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestRepository = void 0;
const database_repository_1 = require("./database.repository");
class FriendRequestRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.FriendRequestRepository = FriendRequestRepository;
