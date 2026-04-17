const { query } = require('../config/db');

// ── POST A JOB ────────────────────────────────────────────────
exports.postJob = async (req, res, next) => {
  try {
    const { title, description, category_id, location_id, budget, urgency } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const result = await query(
      `INSERT INTO jobs (customer_id, title, description, category_id, location_id, budget, urgency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title.trim(), description.trim(), category_id, location_id, budget, urgency || 'normal']
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'JOB_POSTED', 'job', $2)`,
      [req.user.id, result.rows[0].id]
    );

    res.status(201).json({ message: 'Job posted successfully!', job: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET CUSTOMER'S JOBS ────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [req.user.id];
    let statusFilter = '';
    if (status) {
      params.push(status);
      statusFilter = `AND j.status = $${params.length}`;
    }

    const result = await query(
      `SELECT j.*,
              c.name AS category_name,
              l.name AS location_name,
              ja.id AS assignment_id,
              ja.status AS assignment_status,
              ja.provider_id,
              u.full_name AS provider_name,
              p.avg_rating AS provider_rating
       FROM jobs j
       LEFT JOIN categories c ON c.id = j.category_id
       LEFT JOIN locations l ON l.id = j.location_id
       LEFT JOIN job_assignments ja ON ja.job_id = j.id AND ja.status != 'rejected'
       LEFT JOIN providers p ON p.id = ja.provider_id
       LEFT JOIN users u ON u.id = p.user_id
       WHERE j.customer_id = $1 ${statusFilter}
       ORDER BY j.created_at DESC`,
      params
    );

    res.json({ jobs: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET ALL OPEN JOBS (for providers to browse) ────────────────
exports.getOpenJobs = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT j.*, c.name AS category_name, l.name AS location_name, u.full_name AS customer_name
       FROM jobs j
       JOIN users u ON u.id = j.customer_id
       LEFT JOIN categories c ON c.id = j.category_id
       LEFT JOIN locations l ON l.id = j.location_id
       WHERE j.status = 'open'
       ORDER BY
         CASE j.urgency WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
         j.created_at DESC`
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── ASSIGN JOB TO PROVIDER ─────────────────────────────────────
exports.assignJob = async (req, res, next) => {
  try {
    const { job_id, provider_id } = req.body;
    if (!job_id || !provider_id) {
      return res.status(400).json({ message: 'job_id and provider_id are required.' });
    }

    // Verify job belongs to this customer and is open
    const job = await query(
      "SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status = 'open'",
      [job_id, req.user.id]
    );
    if (!job.rows.length) {
      return res.status(404).json({ message: 'Job not found, not yours, or no longer open.' });
    }

    // Verify provider is verified
    const provider = await query(
      "SELECT * FROM providers WHERE id = $1 AND verification_status = 'verified'",
      [provider_id]
    );
    if (!provider.rows.length) {
      return res.status(400).json({ message: 'Provider not found or not verified.' });
    }

    // Create assignment
    const assignment = await query(
      `INSERT INTO job_assignments (job_id, provider_id) VALUES ($1, $2) RETURNING *`,
      [job_id, provider_id]
    );

    // Update job status
    await query("UPDATE jobs SET status = 'assigned', updated_at = NOW() WHERE id = $1", [job_id]);

    // Notify provider
    const providerUser = await query('SELECT user_id FROM providers WHERE id = $1', [provider_id]);
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'New Job Assignment', $2, 'info')`,
      [providerUser.rows[0].user_id,
       `You have been assigned a new job: "${job.rows[0].title}". Please accept or reject.`]
    );

    res.json({ message: 'Job assigned successfully!', assignment: assignment.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PROVIDER RESPOND TO JOB ────────────────────────────────────
exports.respondToJob = async (req, res, next) => {
  try {
    const { assignment_id, action, provider_note } = req.body;
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accepted or rejected.' });
    }

    const provider = await query('SELECT id FROM providers WHERE user_id = $1', [req.user.id]);
    if (!provider.rows.length) return res.status(403).json({ message: 'Provider profile not found.' });

    const assignment = await query(
      'SELECT * FROM job_assignments WHERE id = $1 AND provider_id = $2',
      [assignment_id, provider.rows[0].id]
    );
    if (!assignment.rows.length) return res.status(404).json({ message: 'Assignment not found.' });

    await query(
      `UPDATE job_assignments
       SET status = $1, responded_at = NOW(), provider_note = $2
       WHERE id = $3`,
      [action, provider_note, assignment_id]
    );

    // If rejected, reopen the job
    if (action === 'rejected') {
      await query("UPDATE jobs SET status = 'open', updated_at = NOW() WHERE id = $1", [assignment.rows[0].job_id]);
    }

    // Notify customer
    const jobData = await query(
      'SELECT j.title, j.customer_id FROM jobs j WHERE j.id = $1',
      [assignment.rows[0].job_id]
    );
    const providerName = await query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);

    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        jobData.rows[0].customer_id,
        `Job ${action === 'accepted' ? 'Accepted' : 'Rejected'}`,
        `${providerName.rows[0].full_name} has ${action} your job "${jobData.rows[0].title}".`,
        action === 'accepted' ? 'success' : 'warning',
      ]
    );

    res.json({ message: `Job ${action} successfully.` });
  } catch (err) {
    next(err);
  }
};

// ── GET PROVIDER'S ASSIGNED JOBS ───────────────────────────────
exports.getAssignedJobs = async (req, res, next) => {
  try {
    const provider = await query('SELECT id FROM providers WHERE user_id = $1', [req.user.id]);
    if (!provider.rows.length) return res.status(403).json({ message: 'Provider profile not found.' });

    const result = await query(
      `SELECT ja.id AS assignment_id, ja.status AS assignment_status,
              ja.assigned_at, ja.responded_at,
              j.id AS job_id, j.title, j.description, j.budget, j.urgency,
              c.name AS category_name, l.name AS location_name,
              u.full_name AS customer_name, u.phone AS customer_phone
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = j.customer_id
       LEFT JOIN categories c ON c.id = j.category_id
       LEFT JOIN locations l ON l.id = j.location_id
       WHERE ja.provider_id = $1
       ORDER BY ja.assigned_at DESC`,
      [provider.rows[0].id]
    );

    res.json({ assignments: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── MARK JOB COMPLETE ──────────────────────────────────────────
exports.completeJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;

    const job = await query(
      "SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status = 'assigned'",
      [job_id, req.user.id]
    );
    if (!job.rows.length) {
      return res.status(404).json({ message: 'Job not found or not in assigned status.' });
    }

    await query("UPDATE jobs SET status = 'completed', updated_at = NOW() WHERE id = $1", [job_id]);
    await query("UPDATE job_assignments SET status = 'completed' WHERE job_id = $1 AND status = 'accepted'", [job_id]);

    // Update provider job count
    const assignment = await query(
      "SELECT provider_id FROM job_assignments WHERE job_id = $1 AND status = 'completed'",
      [job_id]
    );
    if (assignment.rows.length) {
      await query(
        'UPDATE providers SET total_jobs_completed = total_jobs_completed + 1 WHERE id = $1',
        [assignment.rows[0].provider_id]
      );
    }

    res.json({ message: 'Job marked as completed! You can now rate the provider.' });
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE JOB ─────────────────────────────────────────────
exports.getJobById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT j.*, c.name AS category_name, l.name AS location_name,
              u.full_name AS customer_name
       FROM jobs j
       JOIN users u ON u.id = j.customer_id
       LEFT JOIN categories c ON c.id = j.category_id
       LEFT JOIN locations l ON l.id = j.location_id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Job not found.' });
    res.json({ job: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
