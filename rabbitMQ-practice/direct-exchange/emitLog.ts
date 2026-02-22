import amqp from 'amqplib';

const emitLog = async () => {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const exchange = 'direct_logs';
    const msg = process.argv.slice(2).join(' ') || 'Hello World!';
    const severity = process.argv[2] || 'info';

    await channel.assertExchange(exchange, 'direct', { durable: false });
    channel.publish(exchange, severity, Buffer.from(msg)); // For direct exchange, the routing key is used to route the message
    console.log(`[x] Sent ${msg} with severity ${severity}`);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.log(error);
  }
};

emitLog();
