import { EventEmitter } from "node:events";
import { sendEmail } from "../email/send.email";
import Mail from "nodemailer/lib/mailer";
import { verifyEmail } from "../email/templates/verify.email.templates";

export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options {
  otp: number;
}

emailEvent.on("confirmEmail", async (data: IEmail) => {
  try {
    data.subject = "Confirm-Email";
    data.html = verifyEmail({
      otp: data.otp,
      title: "Email-Confirmation",
    });

    await sendEmail(data);
  } catch (error) {
    console.error(`fail to send email`);
  }
});


emailEvent.on("resetPassword", async (data: IEmail) => {
  try {
    data.subject = "Reset-Account-Password";
    data.html = verifyEmail({
      otp: data.otp,
      title: "reset code",
    });

    await sendEmail(data);
  } catch (error) {
    console.error(`fail to send email`);
  }
});

emailEvent.on("twoFactorOtp", async (data: IEmail) => {
  try {
    data.subject = "Enable Request";
    data.html = verifyEmail({
      otp: data.otp,
      title: "Two-Factor Authentication",
    });

    await sendEmail(data);
  } catch (error) {
    console.error(`fail to send email`);
  }
});

emailEvent.on("tags", async (data: IEmail) => {
  try {
    data.subject = data.subject || "Tagged in a post";
    await sendEmail(data);
  } catch (error) {
    console.error(`fail to send tag email`);
  }
});
