import nodemailer, { Transporter } from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  isHtml? : boolean
  attachments?: {
    filename: string;
    content: string;
    encoding: string;
  }[];
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    // secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  
  const message: any = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    isHtml: options.isHtml,
    attachments: options.attachments,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

export default sendEmail;
