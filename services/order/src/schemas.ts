import { z } from 'zod';

export const orderSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  cartSessionId: z.string(),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  inventoryId: z.string(),
  quantity: z.number(),
});
