import amqp from 'amqplib';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: receiveLog.js [info] [warning] [error]');
  process.exit(1);
}

const receiveLog = async () => {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const exchange = 'direct_logs';

    await channel.assertExchange(exchange, 'direct', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true }); // Create a temporary queue with a random name
    console.log(`[x] Waiting for messages in ${q.queue}. To exit press CTRL+C`);

    args.forEach((severity) => {
      channel.bindQueue(q.queue, exchange, severity); // Bind the queue to the exchange with the specified severity
    });

    channel.consume(
      q.queue,
      (msg) => {
        console.log(
          `[*] [Routing key] ${msg?.fields.routingKey} - [Message] ${msg?.content.toString()}`,
        );
      },
      { noAck: true },
    );
  } catch (error) {
    console.log(error);
  }
};

receiveLog();
