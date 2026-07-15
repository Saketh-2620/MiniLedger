const express      = require('express');
const pool         = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// ── GET /api/categories ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY name ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/categories ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO categories (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [req.user.id, name.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/categories/:id ───────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id }   = req.params;
    const { name } = req.body;

    const check = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name cannot be empty' });
    }

    const { rows } = await pool.query(
      `UPDATE categories
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, created_at`,
      [name.trim(), id, req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/categories/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
