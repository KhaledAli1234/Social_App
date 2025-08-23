"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail({ from = process.env.EMAIL, to, cc, bcc, subject = "Social_App", text, html, attachments, }) {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    await transporter.sendMail({
        from: `"Route ❤️✅" <${from}>`,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments,
    });
}
