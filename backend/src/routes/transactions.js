const express             = require('express');
const pool                = require('../db/pool');
const authenticate        = require('../middleware/authenticate');
const { notifyLargeTransaction } = require('../services/notificationService');

const router = express.Router();


router.use(authenticate);

const LARGE_TRANSACTION_THRESHOLD = parseFloat(process.env.LARGE_TXN_THRESHOLD || '1000');


router.get('/', async (req, res, next) => {
  try {
    const {
      type,
      category_id,
      date_from,
      date_to,
      page  = 1,
      limit = 20,
    } = req.query;

    const params  = [req.user.id];
    const filters = ['t.user_id = $1'];

    if (type) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'type must be income or expense' });
      }
      params.push(type);
      filters.push(`t.type = $${params.length}`);
    }

    if (category_id) {
      params.push(category_id);
      filters.push(`t.category_id = $${params.length}`);
    }

    if (date_from) {
      params.push(date_from);
      filters.push(`t.date >= $${params.length}`);
    }

    if (date_to) {
      params.push(date_to);
      filters.push(`t.date <= $${params.length}`);
    }

    const whereClause = filters.join(' AND ');

    // Total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    params.push(offset);

    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.type,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.id   AS category_id,
         c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: rows,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});


router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         t.id, t.type, t.amount, t.description, t.date, t.created_at, t.updated_at,
         c.id AS category_id, c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});


router.post('/', async (req, res, next) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    // If category_id provided, verify it belongs to this user
    if (category_id) {
      const catCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
        [category_id, req.user.id]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, category_id || null, type, parseFloat(amount), description || null, date]
    );

    const transaction = rows[0];

    // Fire large-transaction notification asynchronously (don't block response)
    if (parseFloat(amount) >= LARGE_TRANSACTION_THRESHOLD) {
      notifyLargeTransaction(req.user, transaction).catch(err =>
        console.error('Large transaction notification failed:', err)
      );
    }

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});


router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, description, date, category_id } = req.body;

    // Ownership check
    const check = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) <= 0)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (category_id) {
      const catCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
        [category_id, req.user.id]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE transactions
       SET
         type        = COALESCE($1, type),
         amount      = COALESCE($2, amount),
         description = COALESCE($3, description),
         date        = COALESCE($4, date),
         category_id = CASE WHEN $5::uuid IS NOT NULL THEN $5::uuid ELSE category_id END,
         updated_at  = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        type || null,
        amount ? parseFloat(amount) : null,
        description !== undefined ? description : null,
        date || null,
        category_id || null,
        id,
        req.user.id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});


router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
