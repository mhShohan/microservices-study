import redisClient from '@/redis';
import { Request, Response, NextFunction } from 'express';

const clearMyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartSessionId = req.headers['x-cart-session-id'] as string;
    const exists = await redisClient.exists(`session:${cartSessionId}`);

    if (!cartSessionId || !exists) {
      delete req.headers['x-cart-session-id'];

      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Cart is already empty',
      });
    }

    await redisClient.del(`cart:${cartSessionId}`);
    await redisClient.del(`session:${cartSessionId}`);

    delete req.headers['x-cart-session-id'];

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default clearMyCart;
