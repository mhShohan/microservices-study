import config from '@/config';
import { prisma } from '@/prisma';
import { UserCreateDTOSchema } from '@/schemas';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';

const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data: payload, error } = UserCreateDTOSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data.',
        errors: error.issues,
      });
    }

    // Check if user with the same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'failure',
        statusCode: 409,
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // hash the password before storing (omitted for brevity)
    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    const user = await prisma.user.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
      },
    });

    console.log('User created in auth service:', user);

    //create user profile calling the user services
    await axios.post(`${config.userServiceUrl}/users`, {
      authUserId: user.id,
      name: user.name,
      email: user.email,
    });

    // !TODO - generate Verification code and send verification email

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
