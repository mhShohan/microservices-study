import { prisma } from '@/prisma';
import { NextFunction, Request, Response } from 'express';

const getAllProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        inventoryId: true,
      },
    });

    // TODO: add pagination
    // TODO: add filtering

    return res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export default getAllProducts;
