const express      = require('express');
const pool         = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns notification log for the current user
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await pool.query(
      `SELECT id, type, status, metadata, sent_at, created_at
       FROM notification_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
