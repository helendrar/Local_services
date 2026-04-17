const { query } = require('../config/db');

// ── GET ALL NOTIFICATIONS (paginated) ─────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [notifications, unread] = await Promise.all([
      query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query(
        `SELECT COUNT(*) FROM notifications
         WHERE user_id = $1 AND is_read = false`,
        [req.user.id]
      ),
    ]);

    res.json({
      notifications: notifications.rows,
      unread: Number(unread.rows[0].count),
      page: Number(page),
    });
  } catch (err) {
    next(err);
  }
};

// ── MARK ALL AS READ ───────────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
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

// ── MARK ONE AS READ ───────────────────────────────────────────
exports.markOneRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE ONE ─────────────────────────────────────────────────
exports.deleteOne = async (req, res, next) => {
  try {
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE ALL ─────────────────────────────────────────────────
exports.deleteAll = async (req, res, next) => {
  try {
    await query(`DELETE FROM notifications WHERE user_id = $1`, [req.user.id]);
    res.json({ message: 'All notifications cleared.' });
  } catch (err) {
    next(err);
  }
};

// ── GET UNREAD COUNT ONLY (for polling) ───────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ unread: Number(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
};
