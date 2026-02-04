import { prisma } from '@/prisma';
import { UserCreateDTOSchema } from '@/schemas';
import { NextFunction, Request, Response } from 'express';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseBody = UserCreateDTOSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid request body',
        errors: parseBody.error.issues,
      });
    }

    const isExist = await prisma.user.findUnique({
      where: { authUserId: parseBody.data.authUserId },
    });

    if (isExist) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: 'User already exists',
      });
    }

    const newUser = await prisma.user.create({
      data: parseBody.data,
    });

    return res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export default createUser;
