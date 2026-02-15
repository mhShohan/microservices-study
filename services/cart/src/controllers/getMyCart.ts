import redisClient from '@/redis';
import { NextFunction, Request, Response } from 'express';

const getMyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartSessionId = req.headers['x-cart-session-id'] as string;
    if (!cartSessionId) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Cart session ID is required',
      });
    }

    // Check if the cart session exists in Redis store
    const exists = await redisClient.exists(`session:${cartSessionId}`);

    if (!exists) {
      await redisClient.del(`cart:${cartSessionId}`);
      return res.status(404).json({
        status: 'failure',
        statusCode: 404,
        success: false,
        message: 'Cart session not found',
        data: [],
      });
    }

    const cart = await redisClient.hgetall(`cart:${cartSessionId}`);

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Cart retrieved successfully',
      data: Object.values(cart).map((item) => JSON.parse(item)),
    });
  } catch (error) {
    next(error);
  }
};

export default getMyCart;
