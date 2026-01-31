import { prisma } from '@/prisma';
import { NextFunction, Request, Response } from 'express';

const getSingleInventoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { id: id },
    });

    if (!inventory) {
      return res.status(404).json({
        status: 'failure',
        statusCode: 404,
        success: false,
        message: 'Inventory not found!',
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
};

export default getSingleInventoryById;
