import { createClient } from "smtpexpress";
import {
  generateRandomAlphaNumeric,
  SMTPEXPRESS_PROJECT_ID,
  SMTPEXPRESS_PROJECT_SECRET,
} from "../config";

interface EmailOptions {
  email: string;
  name?: string;
  subject: string;
  message: string;
  isHtml?: boolean;
  // attachments?: {
  //   filename?: string;
  //   content?: string | Buffer;
  //   contentType?: string;
  //   encoding?: string;
  // }[];
}

const smtpexpressClient = createClient({
  projectId: SMTPEXPRESS_PROJECT_ID,
  projectSecret: SMTPEXPRESS_PROJECT_SECRET,
});

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const buffer = Buffer.from(generateRandomAlphaNumeric(15));
  // const attachment = new Blob([buffer], { type: "image/png" });
  const attachment = new Blob([buffer], { type: "application/pdf" });

  const emailData: any = {
    recipients: { email: options.email, name: options.name || "User" },
    sender: {
      name: process.env.FROM_NAME,
      email: process.env.FROM_EMAIL,
    },
    subject: options.subject,
    message: options.isHtml ? undefined : options.message,
    htmlMessage: options.isHtml ? options.message : undefined,
    // attachments: options.attachments || [], 
  };

  try {
    await smtpexpressClient.sendApi.sendMail(emailData);
  } catch (err: any) {
    console.error(
      "SMTPExpress sendMail failed:",
      err.response?.data || err.message || err
    );
    throw new Error("Email sending failed");
  }
};

export default sendEmail;