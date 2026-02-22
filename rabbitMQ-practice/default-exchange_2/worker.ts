import amqp from 'amqplib';

async function worker() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'task_queue';

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1); // Fair dispatch - don't give more than one message to a worker at a time
    console.log(`[x] Waiting for messages in ${queue}. To exit press CTRL+C`);

    channel.consume(
      queue,
      async (msg) => {
        const exit = process.argv.slice(2).join(' ');
        if (exit === 'exit') {
          console.log('Exiting...');
          process.exit(0);
        }
        const content = msg?.content.toString();
        console.log(`[x] Received ${content}`);

        // Simulate work by sleeping for a random time between 1 and 10 seconds
        const sleepTime = Math.floor(Math.random() * 10000) + 1000;
        await new Promise((resolve) => setTimeout(resolve, sleepTime));

        console.log(`[x] Done processing ${content} after ${sleepTime} ms`);
        channel.ack(msg as amqp.ConsumeMessage); // Acknowledge the message after processing
      },
      { noAck: false },
    );
  } catch (error) {
    console.log(error);
  }
}

worker();
