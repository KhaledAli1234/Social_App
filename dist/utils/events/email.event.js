"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const send_email_1 = require("../email/send.email");
const verify_email_templates_1 = require("../email/templates/verify.email.templates");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on("confirmEmail", async (data) => {
    try {
        await (0, send_email_1.sendEmail)({
            to: data.to,
            subject: data.subject || "confirm-Email",
            html: (0, verify_email_templates_1.verifyEmailTemplate)({ otp: data.otp }),
        });
        console.log(`Email sent to ${data.to} ✅`);
    }
    catch (error) {
        console.error(`fail to send email to ${data.to}`);
    }
});
