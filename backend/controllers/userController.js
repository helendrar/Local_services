const { query } = require('../config/db');
const { normalizeDigitalId, isValidDigitalId } = require('../utils/digitalId');

// ── GET MY FULL PROFILE ────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id, u.full_name, u.email, u.role, u.digital_id,
         u.phone, u.profile_image, u.is_active, u.last_login, u.created_at,
         p.id              AS provider_id,
         p.verification_status,
         p.avg_rating,
         p.total_ratings,
         p.total_jobs_completed,
         p.bio,
         p.skills,
         p.years_experience,
         p.hourly_rate,
         p.category_id,
         p.location_id,
         p.document_url,
         p.document_name,
         p.rejection_reason,
         p.verified_at,
         c.name            AS category_name,
         l.name            AS location_name
       FROM users u
       LEFT JOIN providers p ON p.user_id = u.id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations  l ON l.id = p.location_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── UPDATE BASIC PROFILE (all roles) ──────────────────────────
exports.updateMe = async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;

    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    await query(
      `UPDATE users
         SET full_name  = $1,
             phone      = $2,
             updated_at = NOW()
       WHERE id = $3`,
      [full_name.trim(), phone || null, req.user.id]
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'PROFILE_UPDATED', 'user', $1)`,
      [req.user.id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── GET USER BY ID (admin or self) ────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only admin or the user themselves can view full details
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const result = await query(
      `SELECT
         u.id, u.full_name, u.email, u.role, u.digital_id,
         u.phone, u.is_active, u.last_login, u.created_at,
         p.id AS provider_id, p.verification_status,
         p.avg_rating, p.total_ratings, p.bio, p.skills,
         c.name AS category_name, l.name AS location_name
       FROM users u
       LEFT JOIN providers p ON p.user_id = u.id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations  l ON l.id = p.location_id
       WHERE u.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── LOOKUP BY DIGITAL ID (simulate ID verification) ───────────
exports.lookupDigitalId = async (req, res, next) => {
  try {
    const { digital_id } = req.params;
    if (!isValidDigitalId(digital_id)) {
      return res.status(400).json({
        message: 'Digital ID must be KE-12345678 or ET-12345678 (8 digits after the hyphen).',
      });
    }
    const idNorm = normalizeDigitalId(digital_id);

    const result = await query(
      `SELECT id, full_name, role, digital_id, created_at
       FROM users WHERE digital_id = $1`,
      [idNorm]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Digital ID not found in the system.' });
    }

    // Return limited info — never expose password or sensitive data
    res.json({
      found: true,
      user: {
        id:         result.rows[0].id,
        full_name:  result.rows[0].full_name,
        role:       result.rows[0].role,
        digital_id: result.rows[0].digital_id,
        registered: result.rows[0].created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET MY ACTIVITY LOG ────────────────────────────────────────
exports.getMyActivity = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT action, entity_type, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json({ activity: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET MY NOTIFICATIONS ───────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );

    const unread = await query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({
      notifications: notifications.rows,
      unread: Number(unread.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
};

// ── MARK NOTIFICATIONS AS READ ─────────────────────────────────
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE A SINGLE NOTIFICATION ──────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};
