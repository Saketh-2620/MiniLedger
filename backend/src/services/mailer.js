const nodemailer = require('nodemailer');

/**
 * Reusable Nodemailer transporter.
 * Supports Gmail SMTP or SendGrid depending on env vars.
 *
 * For Gmail:  set MAIL_SERVICE=gmail, MAIL_USER, MAIL_PASS (App Password)
 * For SendGrid: set MAIL_SERVICE=sendgrid, SENDGRID_API_KEY
 */

let transporter;

if (process.env.MAIL_SERVICE === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
} else {
  // Default: Gmail SMTP
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS, // Use a Gmail App Password, not your account password
    },
  });
}

/**
 * Send an email.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @returns {Promise<Object>} Nodemailer send info
 */
async function sendMail({ to, subject, html }) {
  const mailOptions = {
    from: `"Mini-Ledger" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
