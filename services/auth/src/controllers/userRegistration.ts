import config from '@/config';
import { prisma } from '@/prisma';
import { UserCreateDTOSchema } from '@/schemas';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';

const generateVerificationCode = () => {
  const timestamp = new Date().getTime().toString();
  const randomNum = Math.floor(10 + Math.random() * 90);
  const code = (timestamp + randomNum).slice(-5); // Get the last 5 digits
  return code;
};

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

    // generate Verification code and store it in the database
    const code = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Code expires in 24 hours
      },
    });

    // send verification email (omitted for brevity)
    await axios.post(`${config.emailServiceUrl}/emails/send`, {
      recipient: user.email,
      subject: 'Email Verification',
      body: `Your verification code is: ${code}`,
      source: 'user-registration',
    });

    return res.status(201).json({
      message: 'User registered successfully. Please check your email for the verification code.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
