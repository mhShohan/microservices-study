import amqp from 'amqplib';
import { defaultEmailSender, transporter } from './config';
import { prisma } from './prisma';
import { SentMessageInfo } from 'nodemailer';

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
        callback(messageContent);
        channel.ack(msg);
      }
    },
    { noAck: false },
  );
};

export default receiveFromQueue;

receiveFromQueue('send_email', async (message) => {
  const parsedMessage = JSON.parse(message);
  const { userEmail, grandTotal, id } = parsedMessage;

  const from = defaultEmailSender;
  const subject = 'Order Confirmation';
  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#4CAF50; color:#ffffff; padding:20px; font-size:24px; font-weight:bold;">
              Thank you for your order!
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:16px; line-height:1.6;">

              <p>Hi there 👋</p>

              <p>Your order has been successfully placed. Here are your order details:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Order ID:</td>
                  <td style="padding:8px 0;">${id}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Total:</td>
                  <td style="padding:8px 0;">$${grandTotal.toFixed(2)}</td>
                </tr>
              </table>

              <p>You can view your order anytime from your account.</p>

              <div style="text-align:center; margin:30px 0;">
                <a href="${process.env.FRONTEND_URL}/orders/${id}"
                   style="background:#4CAF50; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold;">
                  View Order
                </a>
              </div>

              <p style="margin-top:40px;">If you have any questions, just reply to this email — we're happy to help.</p>

              <p style="margin-top:20px;">❤️ Your Store Team</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f0f0f0; padding:15px; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} Your Store. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  const emailOptions: SentMessageInfo = {
    from,
    to: userEmail,
    subject,
    html: body,
  };

  const { rejected } = await transporter.sendMail(emailOptions);
  if (rejected.length > 0) {
    console.error(`Failed to send email to ${userEmail}`);
  }

  await prisma.email.create({
    data: {
      sender: from,
      recipient: userEmail,
      subject,
      body,
      source: 'order-confirmation',
    },
  });

  console.log(`===>> Email sent to ${userEmail} for order ID: ${id}`);
});
