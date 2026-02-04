import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma';
import { UserLoginDTOSchema } from '@/schemas';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginAttempt } from '../../generated/prisma';

type LoginHistory = {
  userId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: info.userId,
        userAgent: info.userAgent,
        ipAddress: info.ipAddress,
        attempt: info.attempt,
      },
    });
  } catch (error) {
    console.error('Error creating login history:', error);
  }
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const { success, data: payload, error } = UserLoginDTOSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data.',
        errors: error.issues,
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      await createLoginHistory({
        userId: 'Guest',
        userAgent,
        ipAddress: ipAddress,
        attempt: 'FAILED',
      });

      return res.status(401).json({
        status: 'failure',
        statusCode: 401,
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // compare passwords
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      await createLoginHistory({
        userId: user.id,
        userAgent,
        ipAddress: ipAddress,
        attempt: 'FAILED',
      });

      return res.status(401).json({
        status: 'failure',
        statusCode: 401,
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // check if user is verified
    if (!user.verified) {
      await createLoginHistory({
        userId: user.id,
        userAgent,
        ipAddress: ipAddress,
        attempt: 'FAILED',
      });

      return res.status(403).json({
        status: 'failure',
        statusCode: 403,
        success: false,
        message: 'User is not verified. Please verify your email before logging in.',
      });
    }

    // generate Access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '2h' },
    );

    await createLoginHistory({
      userId: user.id,
      userAgent,
      ipAddress: ipAddress,
      attempt: 'SUCCESS',
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        verified: user.verified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
