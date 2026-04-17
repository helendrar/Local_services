const { query } = require('../config/db');

// ── GET ALL PROVIDERS (search + filter + paginate) ────────────
exports.getProviders = async (req, res, next) => {
  try {
    const {
      category,
      location,
      sort = 'rating',
      page = 1,
      limit = 12,
      search,
    } = req.query;

    const filterParams = [];
    const conditions = ["p.verification_status = 'verified'", "u.is_active = true"];

    if (category) {
      filterParams.push(Number(category));
      conditions.push(`p.category_id = $${filterParams.length}`);
    }
    if (location) {
      filterParams.push(Number(location));
      conditions.push(`p.location_id = $${filterParams.length}`);
    }
    if (search) {
      filterParams.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${filterParams.length} OR p.bio ILIKE $${filterParams.length} OR EXISTS(SELECT 1 FROM unnest(p.skills) AS skill WHERE skill ILIKE $${filterParams.length}))`);
    }

    const where = conditions.join(' AND ');
    const orderBy = sort === 'rating'  ? 'p.avg_rating DESC, p.total_ratings DESC'
                  : sort === 'newest'  ? 'p.created_at DESC'
                  : sort === 'jobs'    ? 'p.total_jobs_completed DESC'
                  : 'p.avg_rating DESC';

    const pageNum   = Math.max(1, Number(page));
    const limitNum  = Math.min(50, Math.max(1, Number(limit)));
    const offset    = (pageNum - 1) * limitNum;

    // Count query uses only the filter params (no limit/offset)
    const countResult = await query(
      `SELECT COUNT(*) FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE ${where}`,
      filterParams
    );
    const total = Number(countResult.rows[0].count);

    // Data query adds limit and offset
    const dataParams = [...filterParams, limitNum, offset];
    const dataResult = await query(
      `SELECT
         p.id, p.bio, p.skills, p.years_experience, p.hourly_rate,
         p.avg_rating, p.total_ratings, p.total_jobs_completed,
         p.verification_status, p.created_at,
         u.id AS user_id, u.full_name, u.email, u.phone, u.profile_image,
         c.name AS category_name, c.id AS category_id,
         l.name AS location_name, l.id AS location_id
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`,
      dataParams
    );

    res.json({
      providers: dataResult.rows,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE PROVIDER ────────────────────────────────────────
exports.getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT
        p.id, p.bio, p.skills, p.years_experience, p.hourly_rate,
        p.avg_rating, p.total_ratings, p.total_jobs_completed,
        p.verification_status, p.created_at,
        u.id AS user_id, u.full_name, u.email, u.phone, u.profile_image,
        c.name AS category_name, c.id AS category_id,
        l.name AS location_name, l.id AS location_id
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.id = $1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Provider not found.' });

    // Get recent ratings
    const ratingsResult = await query(
      `SELECT r.score, r.comment, r.created_at, u.full_name AS customer_name
       FROM ratings r
       JOIN users u ON u.id = r.customer_id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({ provider: result.rows[0], ratings: ratingsResult.rows });
  } catch (err) {
    next(err);
  }
};

// ── UPDATE PROVIDER PROFILE ────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, years_experience, hourly_rate, category_id, location_id, full_name, phone } = req.body;

    await query(
      `UPDATE providers
       SET bio = $1, skills = $2, years_experience = $3,
           hourly_rate = $4, category_id = $5, location_id = $6,
           updated_at = NOW()
       WHERE user_id = $7`,
      [bio, skills, years_experience, hourly_rate, category_id, location_id, req.user.id]
    );

    if (full_name || phone) {
      await query(
        'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3',
        [full_name, phone, req.user.id]
      );
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── UPLOAD DOCUMENT ────────────────────────────────────────────
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const url = `/uploads/${req.file.filename}`;
    await query(
      'UPDATE providers SET document_url = $1, document_name = $2, updated_at = NOW() WHERE user_id = $3',
      [url, req.file.originalname, req.user.id]
    );

    res.json({ message: 'Document uploaded successfully.', url, name: req.file.originalname });
  } catch (err) {
    next(err);
  }
};

// ── GET MY PROVIDER PROFILE ────────────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, u.full_name, u.email, u.phone,
              c.name AS category_name, l.name AS location_name
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Provider profile not found.' });
    res.json({ profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
