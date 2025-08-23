import { EventEmitter } from "node:events";
import { sendEmail } from "../email/send.email";
import { verifyEmailTemplate } from "../email/templates/verify.email.templates"; 

interface ConfirmEmailEvent {
  to: string;
  subject?: string;
  otp: string;
}

export const emailEvent = new EventEmitter();

emailEvent.on("confirmEmail", async (data: ConfirmEmailEvent) => {
  try {
    await sendEmail({
      to: data.to,
      subject: data.subject || "confirm-Email",
      html: verifyEmailTemplate({ otp: data.otp }),
    });
    console.log(`Email sent to ${data.to} ✅`);
  } catch (error) {
    console.error(`fail to send email to ${data.to}`);
  }
});
