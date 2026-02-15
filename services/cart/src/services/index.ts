import { INVENTORY_SERVICE_URL } from '@/config';
import redisClient from '@/redis';
import axios from 'axios';

export const clearCart = async (cartSessionId: string) => {
  try {
    const data = await redisClient.hgetall(`cart:${cartSessionId}`);

    if (Object.keys(data).length === 0) {
      return;
    }
    const cartItems = Object.values(data).map((item) => JSON.parse(item));

    console.log({ cartItems });

    const requestsPromises = cartItems.map((item) => {
      return axios.put(`${INVENTORY_SERVICE_URL}/inventories/${item.inventoryId}`, {
        quantity: item.quantity,
        actionType: 'IN',
      });
    });

    const res = await Promise.all(requestsPromises);

    console.log(`${res.length} inventory updated!`);

    await redisClient.del(`cart:${cartSessionId}`);
  } catch (error) {
    console.log(error);
  }
};
