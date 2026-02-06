import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma';
import { CreateEmailDTOSchema } from '@/schemas';
import { defaultEmailSender, transporter } from '@/config';

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data, error } = CreateEmailDTOSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data.',
        details: error.issues,
      });
    }

    // create email options
    const { sender, recipient, subject, body, source } = data;
    const from = sender || defaultEmailSender;
    const emailOptions = {
      sender: from,
      to: recipient,
      subject,
      text: body,
    };

    // send the email using nodemailer
    const { rejected } = await transporter.sendMail(emailOptions);
    if (rejected.length > 0) {
      console.log('Email rejected:', rejected);
      return res.status(500).json({
        status: 'failure',
        statusCode: 500,
        success: false,
        message: 'Failed to send email.',
      });
    }

    await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
      },
    });

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
