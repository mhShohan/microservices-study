import { prisma } from '@/prisma';
import { Request, Response, NextFunction } from 'express';

const getAllInventories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query;

    const inventories = await prisma.inventory.findMany({
      where: query,
    });

    res.status(200).json(inventories);
  } catch (error) {
    next(error);
  }
};

export default getAllInventories;
