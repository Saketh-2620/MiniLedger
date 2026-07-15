const express      = require('express');
const pool         = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All category routes require authentication
router.use(authenticate);

// ── GET /api/categories ───────────────────────────────────────────────────────
// List all categories for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, default_type, created_at
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
// Create a new category
// default_type is optional: 'income' | 'expense' | 'other' | null
router.post('/', async (req, res, next) => {
  try {
    const { name, default_type = null } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const validTypes = ['income', 'expense', 'other', null];
    if (!validTypes.includes(default_type)) {
      return res.status(400).json({ error: 'default_type must be income, expense, other, or omitted' });
    }

    const { rows } = await pool.query(
      `INSERT INTO categories (user_id, name, default_type)
       VALUES ($1, $2, $3)
       RETURNING id, name, default_type, created_at`,
      [req.user.id, name.trim(), default_type]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/categories/:id ───────────────────────────────────────────────────
// Update a category name and/or default_type
router.put('/:id', async (req, res, next) => {
  try {
    const { id }   = req.params;
    const { name, default_type } = req.body;

    // Ensure user owns this category
    const check = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ error: 'Category name cannot be empty' });
    }

    const validTypes = ['income', 'expense', 'other', null, undefined];
    if (!validTypes.includes(default_type)) {
      return res.status(400).json({ error: 'default_type must be income, expense, other, or omitted' });
    }

    const { rows } = await pool.query(
      `UPDATE categories
       SET
         name         = COALESCE($1, name),
         default_type = CASE WHEN $2::text IS NOT NULL THEN $2::VARCHAR(10) ELSE default_type END
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, default_type, created_at`,
      [
        name ? name.trim() : null,
        default_type !== undefined ? default_type : null,
        id,
        req.user.id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/categories/:id ────────────────────────────────────────────────
// Delete a category — transactions keep their category_id as NULL (ON DELETE SET NULL)
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
