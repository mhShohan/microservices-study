import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma';

const getAllEmail = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: {
        sentAt: 'desc',
      },
    });

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Emails retrieved successfully.',
      data: emails,
    });
  } catch (error) {
    next(error);
  }
};

export default getAllEmail;
