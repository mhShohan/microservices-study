import { CART_TTL, INVENTORY_SERVICE_URL } from '@/config';
import redisClient from '@/redis';
import { CartItemSchema } from '@/schemas';
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data, error } = CartItemSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request data',
        errors: error.issues,
      });
    }

    let cartSessionId = (req.headers['x-cart-session-id'] as string) || null;
    if (cartSessionId) {
      const exists = await redisClient.exists(`session:${cartSessionId}`);
      console.log('Existing Session ID', cartSessionId, 'Exists in Redis:', exists);

      if (!exists) {
        cartSessionId = null;
      }
    }

    if (!cartSessionId) {
      cartSessionId = uuid();
      console.log('New Session ID', cartSessionId);

      // Set the cart session in Redis with an empty array and TTL
      await redisClient.setex(`session:${cartSessionId}`, CART_TTL, JSON.stringify([]));

      res.setHeader('X-Cart-Session-Id', cartSessionId);
    }

    // Check inventory for availability before adding to cart
    const { data: inventoryData } = await axios.get(
      `${INVENTORY_SERVICE_URL}/inventories/${data.inventoryId}`,
    );

    if (!inventoryData || inventoryData.quantity < data.quantity) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Insufficient inventories items available!',
      });
    }

    // Update Inventory
    await axios.put(`${INVENTORY_SERVICE_URL}/inventories/${data.inventoryId}`, {
      quantity: data.quantity,
      actionType: 'OUT',
    });

    // add Item to Cart
    await redisClient.hset(`cart:${cartSessionId}`, data.productId, JSON.stringify(data));

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cartSessionId,
        item: data,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default addToCart;
