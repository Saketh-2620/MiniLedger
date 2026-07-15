/**
 * Mailer service — uses SendGrid HTTP API (not SMTP).
 *
 * Why HTTP and not SMTP:
 *   Render's free tier blocks all outbound SMTP ports (465, 587).
 *   The SendGrid HTTP API sends over port 443 (HTTPS) which is never blocked.
 *
 * Setup:
 *   1. Create a free account at https://sendgrid.com (100 emails/day free)
 *   2. Settings → API Keys → Create API Key (Full Access) → copy the key
 *   3. Settings → Sender Authentication → verify a single sender (your Gmail)
 *   4. Set env vars:
 *        SENDGRID_API_KEY=SG.xxxxxxxxxxxx
 *        MAIL_FROM=your_verified_sender@gmail.com
 */

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email via SendGrid HTTP API.
 * @param {Object} options
 * @param {string} options.to      - recipient email
 * @param {string} options.subject - email subject
 * @param {string} options.html    - HTML body
 */
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
