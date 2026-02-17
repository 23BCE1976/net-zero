import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `Anubhav Jha ${process.env.MAIL_USER}`,
    to: to,
    subject: subject,
    html: html,
  });
};

export default sendEmail;
