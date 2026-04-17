const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { normalizeDigitalId, isValidDigitalId } = require('../utils/digitalId');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── REGISTER ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role, digital_id, phone } = req.body;

    // Validation
    if (!full_name || !email || !password || !digital_id) {
      return res.status(400).json({ message: 'Full name, email, password, and digital ID are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!isValidDigitalId(digital_id)) {
      return res.status(400).json({
        message: 'Digital ID must be KE-12345678 or ET-12345678 (8 digits after the hyphen).',
      });
    }
    const digitalIdNorm = normalizeDigitalId(digital_id);
    const validRoles = ['customer', 'provider'];
    const userRole = role && validRoles.includes(role) ? role : 'customer';

    // Check duplicates
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR digital_id = $2',
      [email.toLowerCase(), digitalIdNorm]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email or Digital ID already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, digital_id, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, digital_id, phone, created_at`,
      [full_name.trim(), email.toLowerCase(), password_hash, userRole, digitalIdNorm, phone]
    );

    const user = result.rows[0];

    // If provider, create providers record
    if (userRole === 'provider') {
      await query('INSERT INTO providers (user_id) VALUES ($1)', [user.id]);
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'USER_REGISTERED', 'user', $1)`,
      [user.id]
    );

    // Send welcome notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'success')`,
      [user.id, 'Welcome to LocalServices!',
       `Hello ${user.full_name}, your account has been created successfully.`]
    );

    const token = signToken(user);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const emailNorm = typeof email === 'string' ? email.toLowerCase().trim() : '';
    if (!emailNorm || password == null || String(password) === '') {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await query(
      'SELECT * FROM users WHERE LOWER(TRIM(email)) = $1',
      [emailNorm]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'USER_LOGIN', 'user', $1)`,
      [user.id]
    );

    const token = signToken(user);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET ME ────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.digital_id,
              u.phone, u.profile_image, u.is_active, u.created_at,
              p.id AS provider_id, p.verification_status, p.avg_rating,
              p.total_ratings, p.bio, p.skills, p.years_experience,
              p.hourly_rate, p.category_id, p.location_id, p.document_url
       FROM users u
       LEFT JOIN providers p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};
