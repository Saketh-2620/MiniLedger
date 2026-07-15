const pool         = require('../db/pool');
const { sendMail } = require('./mailer');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Log a notification attempt in the DB and return the log row id.
 */
async function createLog(userId, type, metadata = {}) {
  const { rows } = await pool.query(
    `INSERT INTO notification_logs (user_id, type, status, metadata)
     VALUES ($1, $2, 'pending', $3)
     RETURNING id`,
    [userId, type, JSON.stringify(metadata)]
  );
  return rows[0].id;
}

async function markSent(logId) {
  await pool.query(
    `UPDATE notification_logs SET status = 'sent', sent_at = NOW() WHERE id = $1`,
    [logId]
  );
}

async function markFailed(logId, errorMessage) {
  await pool.query(
    `UPDATE notification_logs
     SET status = 'failed', metadata = metadata || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify({ error: errorMessage }), logId]
  );
}

// ── Currency formatter ────────────────────────────────────────────────────────

function fmt(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

// ── 1. Large Transaction Alert ────────────────────────────────────────────────

/**
 * Called immediately after a large transaction is created.
 * @param {Object} user        - { id, email, name }
 * @param {Object} transaction - { id, type, amount, description, date }
 */
async function notifyLargeTransaction(user, transaction) {
  const logId = await createLog(user.id, 'large_transaction', {
    transactionId: transaction.id,
    amount: transaction.amount,
  });

  try {
    const typeLabel = transaction.type === 'income' ? 'Income' : 'Expense';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Large Transaction Alert 🔔</h2>
        <p>Hi ${user.name},</p>
        <p>A large transaction was just recorded on your Mini-Ledger account:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:8px; border:1px solid #ddd;"><strong>Type</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;"><strong>Amount</strong></td>
            <td style="padding:8px; border:1px solid #ddd; color:${transaction.type === 'income' ? '#2e7d32' : '#c62828'};">
              ${fmt(transaction.amount)}
            </td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:8px; border:1px solid #ddd;"><strong>Description</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${transaction.description || '—'}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;"><strong>Date</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${transaction.date}</td>
          </tr>
        </table>
        <p style="color:#666; font-size:12px;">This is an automated alert from Mini-Ledger.</p>
      </div>
    `;

    await sendMail({
      to:      user.email,
      subject: `Large Transaction Alert: ${fmt(transaction.amount)} ${typeLabel}`,
      html,
    });

    await markSent(logId);
  } catch (err) {
    await markFailed(logId, err.message);
    throw err; // re-throw so caller can log it
  }
}

// ── 2. Weekly Summary ─────────────────────────────────────────────────────────

/**
 * Send weekly summary to a single user.
 * Covers the past 7 days.
 */
async function sendWeeklySummary(user) {
  const logId = await createLog(user.id, 'weekly_summary');

  try {
    const dateTo   = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - 7);

    const fromStr = dateFrom.toISOString().slice(0, 10);
    const toStr   = dateTo.toISOString().slice(0, 10);

    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expenses,
         COUNT(*) AS count
       FROM transactions
       WHERE user_id=$1 AND date BETWEEN $2 AND $3`,
      [user.id, fromStr, toStr]
    );

    const { total_income, total_expenses, count } = rows[0];
    const netBalance = parseFloat(total_income) - parseFloat(total_expenses);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Your Weekly Summary 📊</h2>
        <p>Hi ${user.name},</p>
        <p>Here's your financial summary for <strong>${fromStr}</strong> to <strong>${toStr}</strong>:</p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <tr style="background:#e8f5e9;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Total Income</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:#2e7d32;">${fmt(total_income)}</td>
          </tr>
          <tr style="background:#ffebee;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Total Expenses</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:#c62828;">${fmt(total_expenses)}</td>
          </tr>
          <tr style="background:#e3f2fd;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Net Balance</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:${netBalance >= 0 ? '#1565c0' : '#b71c1c'};">
              ${fmt(netBalance)}
            </td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;"><strong>Transactions</strong></td>
            <td style="padding:10px; border:1px solid #ddd;">${count}</td>
          </tr>
        </table>
        <p style="color:#666; font-size:12px;">This weekly digest is sent every Monday. Log in to Mini-Ledger for a full breakdown.</p>
      </div>
    `;

    await sendMail({
      to:      user.email,
      subject: `Mini-Ledger Weekly Summary (${fromStr} – ${toStr})`,
      html,
    });

    await markSent(logId);
  } catch (err) {
    await markFailed(logId, err.message);
    console.error(`Weekly summary failed for ${user.email}:`, err.message);
  }
}

// ── 3. Monthly Report ─────────────────────────────────────────────────────────

/**
 * Send monthly report to a single user.
 * Covers the previous calendar month.
 */
async function sendMonthlyReport(user) {
  const logId = await createLog(user.id, 'monthly_report');

  try {
    const now       = new Date();
    const firstDay  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay   = new Date(now.getFullYear(), now.getMonth(), 0);
    const fromStr   = firstDay.toISOString().slice(0, 10);
    const toStr     = lastDay.toISOString().slice(0, 10);
    const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Totals
    const totalsResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expenses,
         COUNT(*) AS count
       FROM transactions
       WHERE user_id=$1 AND date BETWEEN $2 AND $3`,
      [user.id, fromStr, toStr]
    );

    // Category breakdown
    const breakdownResult = await pool.query(
      `SELECT
         COALESCE(c.name, 'Uncategorized') AS category_name,
         t.type,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id=$1 AND t.date BETWEEN $2 AND $3
       GROUP BY c.name, t.type
       ORDER BY total DESC
       LIMIT 10`,
      [user.id, fromStr, toStr]
    );

    const { total_income, total_expenses, count } = totalsResult.rows[0];
    const netBalance = parseFloat(total_income) - parseFloat(total_expenses);

    const breakdownRows = breakdownResult.rows
      .map(r => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${r.category_name}</td>
          <td style="padding:8px; border:1px solid #ddd;">${r.type}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${fmt(r.total)}</td>
        </tr>
      `)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Monthly Report: ${monthName} 📅</h2>
        <p>Hi ${user.name}, here's your full financial report for ${monthName}:</p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <tr style="background:#e8f5e9;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Total Income</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:#2e7d32;">${fmt(total_income)}</td>
          </tr>
          <tr style="background:#ffebee;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Total Expenses</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:#c62828;">${fmt(total_expenses)}</td>
          </tr>
          <tr style="background:#e3f2fd;">
            <td style="padding:10px; border:1px solid #ddd;"><strong>Net Balance</strong></td>
            <td style="padding:10px; border:1px solid #ddd; color:${netBalance >= 0 ? '#1565c0' : '#b71c1c'};">${fmt(netBalance)}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;"><strong>Total Transactions</strong></td>
            <td style="padding:10px; border:1px solid #ddd;">${count}</td>
          </tr>
        </table>
        <h3>Top Categories</h3>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px; border:1px solid #ddd; text-align:left;">Category</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:left;">Type</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>${breakdownRows}</tbody>
        </table>
        <p style="color:#666; font-size:12px; margin-top:24px;">Monthly reports are sent on the 1st of each month.</p>
      </div>
    `;

    await sendMail({
      to:      user.email,
      subject: `Mini-Ledger Monthly Report: ${monthName}`,
      html,
    });

    await markSent(logId);
  } catch (err) {
    await markFailed(logId, err.message);
    console.error(`Monthly report failed for ${user.email}:`, err.message);
  }
}

// ── Batch runners (called by scheduler) ──────────────────────────────────────

/**
 * Send weekly summary to ALL users.
 */
async function runWeeklySummaryForAll() {
  console.log('[Scheduler] Running weekly summary for all users...');
  const { rows: users } = await pool.query('SELECT id, email, name FROM users');
  for (const user of users) {
    await sendWeeklySummary(user);
  }
  console.log(`[Scheduler] Weekly summary sent to ${users.length} users.`);
}

/**
 * Send monthly report to ALL users.
 */
async function runMonthlyReportForAll() {
  console.log('[Scheduler] Running monthly report for all users...');
  const { rows: users } = await pool.query('SELECT id, email, name FROM users');
  for (const user of users) {
    await sendMonthlyReport(user);
  }
  console.log(`[Scheduler] Monthly report sent to ${users.length} users.`);
}

module.exports = {
  notifyLargeTransaction,
  sendWeeklySummary,
  sendMonthlyReport,
  runWeeklySummaryForAll,
  runMonthlyReportForAll,
};
