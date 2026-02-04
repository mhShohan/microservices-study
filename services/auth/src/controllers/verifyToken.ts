import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenSchema } from '@/schemas';
import { prisma } from '@/prisma';

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data, error } = AccessTokenSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data.',
        errors: error.issues,
      });
    }
    const accessToken = data.accessToken;

    // verify token
    const secretKey = process.env.JWT_SECRET || 'default_secret_key';
    const decoded = jwt.verify(accessToken, secretKey);
    const user = await prisma.user.findUnique({
      where: { id: (decoded as jwt.JwtPayload).userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        status: 'failure',
        statusCode: 401,
        success: false,
        message: 'Unauthorized!',
      });
    }

    return res.status(200).json({
      message: 'Authorized',
      status: 'success',
      statusCode: 200,
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export default verifyToken;
