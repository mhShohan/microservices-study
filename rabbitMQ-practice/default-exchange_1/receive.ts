import amqp from 'amqplib';

async function receive() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'hello';

    await channel.assertQueue(queue, { durable: false });
    console.log(`[x] Waiting for messages in ${queue}. To exit press CTRL+C`);

    channel.consume(
      queue,
      (msg) => {
        console.log(`[x] Received ${msg?.content.toString()}`);
      },
      { noAck: true },
    );
  } catch (err) {
    console.error(err);
  }
}

receive();
