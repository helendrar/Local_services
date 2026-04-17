const { query } = require('../config/db');

// ── SUBMIT RATING ──────────────────────────────────────────────
exports.submitRating = async (req, res, next) => {
  try {
    const { job_id, provider_id, score, comment } = req.body;

    if (!job_id || !provider_id || !score) {
      return res.status(400).json({ message: 'job_id, provider_id, and score are required.' });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5.' });
    }

    // Verify job is completed and belongs to this customer
    const job = await query(
      "SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status = 'completed'",
      [job_id, req.user.id]
    );
    if (!job.rows.length) {
      return res.status(400).json({ message: 'Job not found, not yours, or not completed yet.' });
    }

    // Insert rating
    await query(
      `INSERT INTO ratings (job_id, customer_id, provider_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [job_id, req.user.id, provider_id, score, comment?.trim()]
    );

    // Recalculate avg rating for provider
    const avg = await query(
      'SELECT ROUND(AVG(score)::numeric, 2) AS avg, COUNT(*) AS total FROM ratings WHERE provider_id = $1',
      [provider_id]
    );

    await query(
      'UPDATE providers SET avg_rating = $1, total_ratings = $2, updated_at = NOW() WHERE id = $3',
      [avg.rows[0].avg, avg.rows[0].total, provider_id]
    );

    // Notify provider
    const providerUser = await query('SELECT user_id FROM providers WHERE id = $1', [provider_id]);
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'New Rating Received', $2, 'info')`,
      [providerUser.rows[0].user_id,
       `You received a ${score}-star rating. ${comment ? `"${comment}"` : ''}`]
    );

    res.status(201).json({ message: 'Rating submitted successfully. Thank you!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'You have already rated this job.' });
    }
    next(err);
  }
};

// ── GET RATINGS FOR A PROVIDER ─────────────────────────────────
exports.getProviderRatings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.score, r.comment, r.created_at,
              u.full_name AS customer_name
       FROM ratings r
       JOIN users u ON u.id = r.customer_id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const stats = await query(
      `SELECT
         ROUND(AVG(score)::numeric, 2) AS avg,
         COUNT(*) AS total,
         SUM(CASE WHEN score = 5 THEN 1 ELSE 0 END) AS five_star,
         SUM(CASE WHEN score = 4 THEN 1 ELSE 0 END) AS four_star,
         SUM(CASE WHEN score = 3 THEN 1 ELSE 0 END) AS three_star,
         SUM(CASE WHEN score = 2 THEN 1 ELSE 0 END) AS two_star,
         SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) AS one_star
       FROM ratings WHERE provider_id = $1`,
      [id]
    );

    res.json({ ratings: result.rows, stats: stats.rows[0] });
  } catch (err) {
    next(err);
  }
};
