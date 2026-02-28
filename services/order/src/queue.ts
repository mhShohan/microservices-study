import amqp from 'amqplib';

type TQueueName = 'send_email' | 'clear_cart';

const sendToQueue = async (queueName: TQueueName, message: string) => {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const exchangeName = 'order';
    await channel.assertExchange(exchangeName, 'direct', { durable: true });

    // await channel.assertQueue(queueName, { durable: true });
    // await channel.bindQueue(queueName, exchangeName, queueName);

    channel.publish(exchangeName, queueName, Buffer.from(message));
    console.log(`Message sent to ${queueName}: ${message}`);

    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.log(error);
  }
};

export default sendToQueue;
