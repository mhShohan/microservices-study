import amqp from 'amqplib';
import redisClient from './redis';

type TQueueName = 'send_email' | 'clear_cart';

const receiveFromQueue = async (queueName: TQueueName, callback: (message: any) => void) => {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchangeName = 'order';
  await channel.assertExchange(exchangeName, 'direct', { durable: true });

  const q = await channel.assertQueue(queueName, { exclusive: true });
  await channel.bindQueue(q.queue, exchangeName, queueName);

  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    q.queue,
    (msg) => {
      if (msg) {
        const messageContent = msg.content.toString();
        console.log(`Received message from ${queueName}: ${messageContent}`);
        callback(messageContent);
        channel.ack(msg);
      }
    },
    { noAck: false },
  );
};

export default receiveFromQueue;

receiveFromQueue('clear_cart', async (message) => {
  const parsedMessage = JSON.parse(message);

  const cartSessionId = parsedMessage.cartSessionId;

  console.log(`===>> Clearing cart for session: ${cartSessionId}`);

  redisClient.del(`session:${cartSessionId}`);
  redisClient.del(`cart:${cartSessionId}`);

  console.log(`===>> Cart cleared for session: ${cartSessionId}`);
});
