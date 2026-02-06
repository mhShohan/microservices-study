import config from '@/config';
import { prisma } from '@/prisma';
import { EmailVerificationDTOSchema } from '@/schemas';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data: payload, error } = EmailVerificationDTOSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data.',
        errors: error.issues,
      });
    }

    // Check if user with the email exists
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return res.status(404).json({
        status: 'failure',
        statusCode: 404,
        success: false,
        message: 'User with this email does not exist.',
      });
    }

    // find the verification code for the user
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: payload.code,
      },
    });

    if (!verificationRecord) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid verification code.',
      });
    }

    if (verificationRecord.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Verification code has expired.',
      });
    }

    // If verification is successful, update the user's verified status
    await prisma.user.update({
      where: { email: payload.email },
      data: { verified: true, status: 'ACTIVE' },
    });

    // update verification record as used
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { status: 'USED', verifiedAt: new Date() },
    });

    // send email to user confirming successful verification
    await axios.post(`${config.emailServiceUrl}/emails/send`, {
      recipient: user.email,
      subject: 'Email Verified Successfully',
      body: `Your email has been successfully verified. You can now log in to your account.`,
      source: 'email-verification',
    });

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export default verifyEmail;
