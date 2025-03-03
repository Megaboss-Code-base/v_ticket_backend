import { createClient } from "smtpexpress";
import { SMTPEXPRESS_PROJECT_ID, SMTPEXPRESS_PROJECT_SECRET } from "../config";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  isHtml?: boolean;
  attachments?: {
    filename?: string;
    content?: string;
    contentType?: string;
    encoding?: string;
  }[];
}

const smtpexpressClient = createClient({
  projectId: SMTPEXPRESS_PROJECT_ID,
  projectSecret: SMTPEXPRESS_PROJECT_SECRET,
});

const sendEmail = async (options: EmailOptions): Promise<void> => {
  console.log("Using SMTPExpress Credentials:", {
    projectId: SMTPEXPRESS_PROJECT_ID,
    projectSecret: SMTPEXPRESS_PROJECT_SECRET,
  });

  const emailData: any = {
    subject: options.subject,
    message: options.isHtml ? undefined : options.message,
    htmlMessage: options.isHtml ? options.message : undefined,
    sender: {
      name: process.env.FROM_NAME,
      email: process.env.FROM_EMAIL,
    },
    recipients: options.email,
  };

  if (options.attachments) {
    emailData.attachments = options.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      encoding: a.encoding,
    }));
  }

  console.log("Sending email with data:", JSON.stringify(emailData, null, 2));

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