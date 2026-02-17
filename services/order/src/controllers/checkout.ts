import { CART_SERVICE_URL, EMAIL_SERVICE_URL, PRODUCT_SERVICE_URL } from '@/config';
import { prisma } from '@/prisma';
import { cartItemSchema, orderSchema } from '@/schemas';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request body
    const { success, data, error } = orderSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid request body',
        error: error.issues,
      });
    }

    // get cart details from cart service using cartSessionId
    const { data: cartData } = await axios.get(`${CART_SERVICE_URL}/cart`, {
      headers: {
        'x-cart-session-id': data.cartSessionId,
      },
    });
    const cartItems = z.array(cartItemSchema).safeParse(cartData.data);

    if (!cartItems.success) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Invalid cart data',
        error: cartItems.error.issues,
      });
    }

    if (cartItems.data.length === 0) {
      return res.status(400).json({
        status: 'failure',
        statusCode: 400,
        success: false,
        message: 'Cart is empty',
      });
    }

    // get product details from cart items
    const productDetails = await Promise.all(
      cartItems.data.map(async (item) => {
        const { data: product } = await axios.get(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}`,
        );

        return {
          productId: product.id as string,
          productName: product.name as string,
          sku: product.sku as string,
          price: product.price as number,
          quantity: item.quantity as number,
          total: (product.price as number) * (item.quantity as number),
        };
      }),
    );

    const subTotal = productDetails.reduce((acc, item) => acc + item.total, 0);
    const tax = subTotal * 0.1; // assuming 10% tax
    const grandTotal = subTotal + tax;

    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        subTotal,
        tax,
        grandTotal,
        orderItems: {
          create: productDetails,
        },
      },
    });

    // clear cart in cart service
    await axios.delete(`${CART_SERVICE_URL}/cart/clear-cart`, {
      headers: {
        'x-cart-session-id': data.cartSessionId,
      },
    });

    // send email
    await axios.post(`${EMAIL_SERVICE_URL}/emails/send`, {
      recipient: data.userEmail,
      subject: 'Order Confirmation',
      body: `Your order has been successfully placed. You can now view your order details in your account. Order ID: ${order.id} Total: $${grandTotal.toFixed(2)}`,
      source: 'order-confirmation',
    });

    return res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export default checkout;
