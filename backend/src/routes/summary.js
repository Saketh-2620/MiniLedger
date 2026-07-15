const express      = require('express');
const pool         = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// ── GET /api/summary ──────────────────────────────────────────────────────────
// Returns totals, net balance, and per-category breakdown.
// Query params: date_from, date_to  (default: current month)
router.get('/', async (req, res, next) => {
  try {
    // Default to current month if no range provided
    const now       = new Date();
    const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const date_from = req.query.date_from || firstDay;
    const date_to   = req.query.date_to   || lastDay;

    // Overall totals
    const totalsResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                           WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS net_balance,
         COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [req.user.id, date_from, date_to]
    );

    // Per-category breakdown
    const breakdownResult = await pool.query(
      `SELECT
         COALESCE(c.name, 'Uncategorized')           AS category_name,
         c.id                                         AS category_id,
         c.default_type                               AS category_default_type,
         t.type,
         COALESCE(SUM(t.amount), 0)                  AS total,
         COUNT(t.id)                                  AS count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
       GROUP BY c.id, c.name, c.default_type, t.type
       ORDER BY total DESC`,
      [req.user.id, date_from, date_to]
    );

    // Recent 5 transactions for dashboard preview
    const recentResult = await pool.query(
      `SELECT
         t.id, t.type, t.amount, t.description, t.date,
         c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    const totals = totalsResult.rows[0];

    res.json({
      period: { date_from, date_to },
      total_income:       parseFloat(totals.total_income),
      total_expenses:     parseFloat(totals.total_expenses),
      net_balance:        parseFloat(totals.net_balance),
      transaction_count:  parseInt(totals.transaction_count),
      breakdown:          breakdownResult.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count),
      })),
      recent_transactions: recentResult.rows.map(r => ({
        ...r,
        amount: parseFloat(r.amount),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
