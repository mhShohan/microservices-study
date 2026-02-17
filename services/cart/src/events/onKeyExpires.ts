import { REDIS_HOST, REDIS_PORT } from '@/config';
import { clearCart } from '@/services';
import { Redis } from 'ioredis';

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

const CHANNEL_KEY = `__keyevent@0__:expired`;
redisClient.config('SET', 'notify-keyspace-events', 'Ex');
redisClient.subscribe(CHANNEL_KEY);

redisClient.on('message', (channel, message) => {
  if (channel === CHANNEL_KEY) {
    const cartSessionId = message.split(':')[1];
    console.log(`Cart session expired: ${cartSessionId}`);
    if (!cartSessionId) return;

    clearCart(cartSessionId);
  }
});
