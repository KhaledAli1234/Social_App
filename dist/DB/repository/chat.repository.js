"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const database_repository_1 = require("./database.repository");
class ChatRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findOneChat({ filter, select = {}, options, page = 1, size = 5, }) {
        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(size < 1 || !size ? 5 : size);
        const doc = this.model.findOne(filter, {
            messages: { $slice: [-(page * size), size] },
        });
        if (options?.lean) {
            doc.lean(options.lean);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
}
exports.ChatRepository = ChatRepository;
