import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
});

export const defaultEmailSender = process.env.DEFAULT_EMAIL_SENDER || 'admin@gmail.com';
