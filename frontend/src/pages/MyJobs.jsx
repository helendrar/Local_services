import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import { StarInput } from '../components/StarRating';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ── Rate modal ─────────────────────────────────────────────────
function RateModal({ job, onClose, onDone }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/ratings', {
        job_id:      job.id,
        provider_id: job.provider_id,
        score,
        comment,
      });
      toast.success('Rating submitted! Thank you.');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate Provider</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{job.title}</div>
            {job.provider_name && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                Provider: {job.provider_name}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Your rating <span>*</span></label>
            <StarInput value={score} onChange={setScore} />
            <span style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][score]}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Share your experience with this provider…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Submitting…</> : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [tab, setTab] = useState('all');
  const [ratingJob, setRatingJob] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/jobs/mine')
      .then(r => setJobs(r.data.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleComplete = async (job) => {
    if (!confirm('Mark this job as completed?')) return;
    setActionLoading(job.id);
    try {
      await api.patch(`/jobs/${job.id}/complete`);
      toast.success('Job marked complete! You can now rate the provider.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = tab === 'all' ? jobs : jobs.filter(j => j.status === tab);
  const counts = {
    all:       jobs.length,
    open:      jobs.filter(j => j.status === 'open').length,
    assigned:  jobs.filter(j => j.status === 'assigned').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  return (
    <Layout title="My Jobs">
      {ratingJob && (
        <RateModal
          job={ratingJob}
          onClose={() => setRatingJob(null)}
          onDone={() => { setRatingJob(null); load(); }}
        />
      )}

      <div className="mb-16 flex-between">
        <div>
          <h2>My Posted Jobs</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>{jobs.length} jobs total</p>
        </div>
        <Link to="/jobs/post" className="btn btn-primary">➕ Post New Job</Link>
      </div>

      <div className="tabs mb-16">
        {[
          { key: 'all',       label: `All (${counts.all})` },
          { key: 'open',      label: `Open (${counts.open})` },
          { key: 'assigned',  label: `In Progress (${counts.assigned})` },
          { key: 'completed', label: `Completed (${counts.completed})` },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner spinner-dark" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📭</span>
          <h3>{tab === 'all' ? 'No jobs yet' : `No ${tab} jobs`}</h3>
          <p>{tab === 'all' ? 'Post your first job to get started.' : `No ${tab} jobs at the moment.`}</p>
          {tab === 'all' && (
            <Link to="/jobs/post" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Post a Job
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              role="customer"
              loading={actionLoading}
              showProvider={true}
              onComplete={handleComplete}
              onRate={setRatingJob}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
