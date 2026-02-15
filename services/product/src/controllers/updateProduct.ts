import { prisma } from '@/prisma';
import { ProductUpdateDTOSchema } from '@/schemas';
import { Request, Response, NextFunction } from 'express';

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data, error } = ProductUpdateDTOSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Validation Error',
        errors: error.issues,
      });
    }

    // check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existingProduct) {
      return res.status(404).json({
        status: 'failure',
        statusCode: 404,
        success: false,
        message: 'Product not found',
      });
    }

    // update product
    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id as string },
      data,
    });

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export default updateProduct;
