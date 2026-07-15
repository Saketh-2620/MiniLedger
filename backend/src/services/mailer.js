

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail({ to, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY env var is not set');
  }
  if (!process.env.MAIL_FROM) {
    throw new Error('MAIL_FROM env var is not set — must be a SendGrid verified sender email');
  }

  const msg = {
    to,
    from: {
      email: process.env.MAIL_FROM,
      name:  'Mini-Ledger',
    },
    subject,
    html,
  };

  await sgMail.send(msg);
}

module.exports = { sendMail };
