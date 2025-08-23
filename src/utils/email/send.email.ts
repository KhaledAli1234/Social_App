import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

interface EmailOptions {
  from?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: SendMailOptions["attachments"];
}

export async function sendEmail({
  from = process.env.EMAIL as string,
  to,
  cc,
  bcc,
  subject = "Social_App",
  text,
  html,
  attachments,
}: EmailOptions): Promise<void> {
  const transporter: Transporter = nodemailer.createTransport({
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
