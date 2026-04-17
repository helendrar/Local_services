const { query } = require('../config/db');

// ── GET ALL CATEGORIES ─────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.icon,
         c.created_at,
         COUNT(p.id) FILTER (WHERE p.verification_status = 'verified') AS provider_count,
         COUNT(j.id) AS job_count
       FROM categories c
       LEFT JOIN providers p ON p.category_id = c.id
       LEFT JOIN jobs      j ON j.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE CATEGORY ────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, COUNT(p.id) FILTER (WHERE p.verification_status = 'verified') AS provider_count
       FROM categories c
       LEFT JOIN providers p ON p.category_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: CREATE CATEGORY ─────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const result = await query(
      `INSERT INTO categories (name, description, icon)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), description, icon || 'briefcase']
    );
    res.status(201).json({ message: 'Category created.', category: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: UPDATE CATEGORY ─────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    const result = await query(
      `UPDATE categories SET name=$1, description=$2, icon=$3 WHERE id=$4 RETURNING *`,
      [name, description, icon, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found.' });
    res.json({ message: 'Category updated.', category: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: DELETE CATEGORY ─────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
};
