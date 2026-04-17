const { query } = require('../config/db');

// ── DASHBOARD STATS ────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [users, jobs, providers, ratings, recentJobs, recentUsers, logs] = await Promise.all([
      query(`SELECT
               COUNT(*) AS total,
               SUM(CASE WHEN role='customer' THEN 1 ELSE 0 END) AS customers,
               SUM(CASE WHEN role='provider' THEN 1 ELSE 0 END) AS providers_count,
               SUM(CASE WHEN is_active=false THEN 1 ELSE 0 END) AS suspended
             FROM users WHERE role != 'admin'`),
      query(`SELECT
               COUNT(*) AS total,
               SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) AS open,
               SUM(CASE WHEN status='assigned' THEN 1 ELSE 0 END) AS assigned,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed
             FROM jobs`),
      query(`SELECT
               COUNT(*) AS total,
               SUM(CASE WHEN verification_status='verified' THEN 1 ELSE 0 END) AS verified,
               SUM(CASE WHEN verification_status='pending' THEN 1 ELSE 0 END) AS pending,
               SUM(CASE WHEN verification_status='rejected' THEN 1 ELSE 0 END) AS rejected
             FROM providers`),
      query(`SELECT ROUND(AVG(score)::numeric, 2) AS avg, COUNT(*) AS total FROM ratings`),
      query(`SELECT j.id, j.title, j.status, j.created_at, u.full_name AS customer_name
             FROM jobs j JOIN users u ON u.id = j.customer_id
             ORDER BY j.created_at DESC LIMIT 5`),
      query(`SELECT id, full_name, email, role, created_at
             FROM users ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT action, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10`),
    ]);

    res.json({
      users: users.rows[0],
      jobs: jobs.rows[0],
      providers: providers.rows[0],
      ratings: ratings.rows[0],
      recent_jobs: recentJobs.rows,
      recent_users: recentUsers.rows,
      activity_logs: logs.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET ALL USERS ──────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filterParams = [];
    const conditions = ["role != 'admin'"];

    if (role) { filterParams.push(role); conditions.push(`role = $${filterParams.length}`); }
    if (search) {
      filterParams.push(`%${search}%`);
      conditions.push(`(full_name ILIKE $${filterParams.length} OR email ILIKE $${filterParams.length})`);
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset   = (pageNum - 1) * limitNum;
    const where    = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      query(
        `SELECT id, full_name, email, role, digital_id, phone, is_active, last_login, created_at
         FROM users
         WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`,
        [...filterParams, limitNum, offset]
      ),
      query(
        `SELECT COUNT(*) FROM users WHERE ${where}`,
        filterParams
      ),
    ]);

    res.json({ users: result.rows, total: Number(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

// ── GET PENDING PROVIDERS ──────────────────────────────────────
exports.getPendingProviders = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.id, p.bio, p.skills, p.years_experience, p.document_url,
              p.document_name, p.verification_status, p.created_at,
              u.full_name, u.email, u.phone, u.digital_id,
              c.name AS category_name, l.name AS location_name
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.verification_status = 'pending'
       ORDER BY p.created_at ASC`
    );
    res.json({ providers: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET ALL PROVIDERS (admin view) ─────────────────────────────
exports.getAllProviders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [];
    let filter = '';
    if (status) { params.push(status); filter = `WHERE p.verification_status = $1`; }

    const result = await query(
      `SELECT
         p.id, p.verification_status, p.avg_rating, p.total_ratings,
         p.total_jobs_completed, p.created_at, p.verified_at,
         p.bio, p.skills, p.years_experience, p.hourly_rate,
         p.document_url, p.document_name, p.rejection_reason,
         u.full_name, u.email, u.phone, u.digital_id, u.is_active,
         c.name AS category_name, c.id AS category_id,
         l.name AS location_name, l.id AS location_id
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       ${filter}
       ORDER BY p.created_at DESC`,
      params
    );
    res.json({ providers: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── VERIFY / REJECT PROVIDER ───────────────────────────────────
exports.verifyProvider = async (req, res, next) => {
  try {
    const { provider_id, action, reason } = req.body;
    if (!['verified', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be verified or rejected.' });
    }

    const result = await query(
      `UPDATE providers
       SET verification_status = $1,
           verified_at = NOW(),
           verified_by = $2,
           rejection_reason = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING user_id`,
      [action, req.user.id, action === 'rejected' ? reason : null, provider_id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Provider not found.' });

    // Notify provider
    const msg = action === 'verified'
      ? 'Congratulations! Your provider profile has been verified. You can now receive job assignments.'
      : `Your provider application was rejected. Reason: ${reason || 'Does not meet requirements.'}`;

    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].user_id,
       `Application ${action === 'verified' ? 'Approved' : 'Rejected'}`, msg,
       action === 'verified' ? 'success' : 'danger']
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'provider', $3)`,
      [req.user.id, `PROVIDER_${action.toUpperCase()}`, provider_id]
    );

    res.json({ message: `Provider ${action} successfully.` });
  } catch (err) {
    next(err);
  }
};

// ── TOGGLE USER ACTIVE STATUS ──────────────────────────────────
exports.toggleUser = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const result = await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 AND role != $2 RETURNING is_active, full_name',
      [user_id, 'admin']
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });

    const action = result.rows[0].is_active ? 'activated' : 'suspended';
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'user', $3)`,
      [req.user.id, `USER_${action.toUpperCase()}`, user_id]
    );

    res.json({ message: `User ${result.rows[0].full_name} has been ${action}.`, is_active: result.rows[0].is_active });
  } catch (err) {
    next(err);
  }
};

// ── GET ALL JOBS (admin) ───────────────────────────────────────
exports.getAllJobs = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT j.*, c.name AS category_name, l.name AS location_name,
              u.full_name AS customer_name
       FROM jobs j
       JOIN users u ON u.id = j.customer_id
       LEFT JOIN categories c ON c.id = j.category_id
       LEFT JOIN locations l ON l.id = j.location_id
       ORDER BY j.created_at DESC
       LIMIT 100`
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET CATEGORIES ─────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (err) { next(err); }
};

// ── GET LOCATIONS ──────────────────────────────────────────────
exports.getLocations = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM locations ORDER BY name');
    res.json({ locations: result.rows });
  } catch (err) { next(err); }
};

// ── GET NOTIFICATIONS ──────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ notifications: result.rows });
  } catch (err) { next(err); }
};
