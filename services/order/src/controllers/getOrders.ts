import { prisma } from '@/prisma';
import { Request, Response, NextFunction } from 'express';

const getOrders = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({});

    return res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export default getOrders;
