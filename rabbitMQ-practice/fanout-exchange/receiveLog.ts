import amqp from 'amqplib';

const receiveLog = async () => {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const exchange = 'logs';

    await channel.assertExchange(exchange, 'fanout', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true }); // Create a temporary queue with a random name
    console.log(`[x] Waiting for messages in ${q.queue}. To exit press CTRL+C`);

    channel.bindQueue(q.queue, exchange, ''); // Bind the queue to the exchange

    channel.consume(
      q.queue,
      (msg) => {
        if (msg?.content) {
          console.log(`[x] Received ${msg?.content.toString()}`);
        }
      },
      { noAck: true },
    );
  } catch (error) {
    console.log(error);
  }
};

receiveLog();
