const { query } = require('../config/db');

// ── GET ALL LOCATIONS ──────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         l.id,
         l.name,
         l.region,
         l.created_at,
         COUNT(p.id) FILTER (WHERE p.verification_status = 'verified') AS provider_count
       FROM locations l
       LEFT JOIN providers p ON p.location_id = l.id
       GROUP BY l.id
       ORDER BY l.name`
    );
    res.json({ locations: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE LOCATION ────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT l.*, COUNT(p.id) FILTER (WHERE p.verification_status='verified') AS provider_count
       FROM locations l
       LEFT JOIN providers p ON p.location_id = l.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Location not found.' });
    res.json({ location: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: CREATE ──────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { name, region } = req.body;
    if (!name) return res.status(400).json({ message: 'Location name is required.' });
    const result = await query(
      `INSERT INTO locations (name, region) VALUES ($1, $2) RETURNING *`,
      [name.trim(), region]
    );
    res.status(201).json({ message: 'Location created.', location: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: UPDATE ──────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { name, region } = req.body;
    const result = await query(
      `UPDATE locations SET name=$1, region=$2 WHERE id=$3 RETURNING *`,
      [name, region, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Location not found.' });
    res.json({ message: 'Location updated.', location: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: DELETE ──────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    await query('DELETE FROM locations WHERE id=$1', [req.params.id]);
    res.json({ message: 'Location deleted.' });
  } catch (err) {
    next(err);
  }
};
