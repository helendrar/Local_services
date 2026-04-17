import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { StarDisplay, StarInput } from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ── Assign Job Modal ──────────────────────────────────────────
function AssignModal({ provider, onClose, onDone }) {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/jobs/mine', { params: { status: 'open' } })
      .then(r => setJobs(r.data.jobs.filter(j => j.status === 'open')))
      .catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!selected) return toast.error('Please select a job');
    setLoading(true);
    try {
      await api.post('/jobs/assign', { job_id: selected, provider_id: provider.id });
      toast.success(`Job assigned to ${provider.full_name}!`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign a Job</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 16 }}>
            Assigning to <strong>{provider.full_name}</strong>. Select one of your open jobs below.
          </p>
          {jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <span className="emoji" style={{ fontSize: '2rem' }}>📝</span>
              <p style={{ marginTop: 8 }}>No open jobs. <a href="/jobs/post">Post one first.</a></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map(job => (
                <label
                  key={job.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${selected === job.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: selected === job.id ? 'var(--primary-bg)' : '#fff',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <input
                    type="radio"
                    name="job"
                    value={job.id}
                    checked={selected === job.id}
                    onChange={() => setSelected(job.id)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                      {job.category_name} · {job.location_name || 'Any location'}
                      {job.budget && ` · KSh ${Number(job.budget).toLocaleString()}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAssign} disabled={!selected || loading}>
            {loading ? <><span className="spinner" /> Assigning…</> : 'Assign Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rate Modal ────────────────────────────────────────────────
function RateModal({ provider, onClose, onDone }) {
  const [completedJobs, setCompletedJobs] = useState([]);
  const [selected, setSelected] = useState('');
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/jobs/mine', { params: { status: 'completed' } })
      .then(r => setCompletedJobs(r.data.jobs.filter(j => j.status === 'completed')))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selected) return toast.error('Please select a job to rate');
    setLoading(true);
    try {
      await api.post('/ratings', { job_id: selected, provider_id: provider.id, score, comment });
      toast.success('Rating submitted! Thank you.');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate {provider.full_name}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Select completed job <span>*</span></label>
            <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose a job…</option>
              {completedJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Your rating <span>*</span></label>
            <StarInput value={score} onChange={setScore} />
            <span style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][score]}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Share your experience with this provider…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
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

// ── Main Provider Profile ─────────────────────────────────────
export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'assign' | 'rate'

  const load = async () => {
    try {
      const res = await api.get(`/providers/${id}`);
      setData(res.data);
    } catch {
      navigate('/providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <Layout title="Provider Profile">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
      </div>
    </Layout>
  );

  if (!data) return null;
  const { provider: p, ratings } = data;
  const initials = p.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout title="Provider Profile">
      {modal === 'assign' && (
        <AssignModal provider={p} onClose={() => setModal(null)} onDone={() => { setModal(null); }} />
      )}
      {modal === 'rate' && (
        <RateModal provider={p} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}

      <button onClick={() => navigate('/providers')} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        ← Back to providers
      </button>

      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-hero-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ color: '#fff', margin: 0 }}>{p.full_name}</h2>
            <span className="badge badge-green" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>
              ✅ Verified
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginTop: 4 }}>
            {p.category_name || 'Service Provider'} · {p.location_name || 'Kenya'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <StarDisplay rating={p.avg_rating} size={16} />
            <span style={{ color: 'rgba(255,255,255,.9)', fontSize: 14 }}>
              {Number(p.avg_rating).toFixed(1)} · {p.total_ratings} review{p.total_ratings !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'rgba(255,255,255,.5)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>
              {p.total_jobs_completed} jobs completed
            </span>
          </div>
        </div>
        {user?.role === 'customer' && (
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              className="btn btn-sm"
              onClick={() => setModal('assign')}
              style={{ background: '#fff', color: 'var(--primary)', fontWeight: 500 }}
            >
              📋 Assign Job
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setModal('rate')}
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}
            >
              ⭐ Rate
            </button>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* About */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: 15 }}>About</h3></div>
            <div className="card-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: p.bio ? 16 : 0 }}>
                {p.bio || 'No bio provided yet.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                {[
                  { label: 'Experience', value: `${p.years_experience || 0} year${p.years_experience !== 1 ? 's' : ''}` },
                  { label: 'Rate', value: p.hourly_rate ? `KSh ${Number(p.hourly_rate).toLocaleString()}/hr` : 'Negotiable' },
                  { label: 'Category', value: p.category_name || '—' },
                  { label: 'Location', value: p.location_name || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-800)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          {p.skills?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15 }}>Skills</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {p.skills.map(s => (
                    <span key={s} className="badge badge-primary" style={{ fontSize: 13, padding: '5px 12px' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Reviews */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Reviews</h3>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{ratings.length} total</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {ratings.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <span className="emoji" style={{ fontSize: '2rem' }}>💬</span>
                <p style={{ marginTop: 8 }}>No reviews yet</p>
              </div>
            ) : (
              <div>
                {ratings.map((r, i) => (
                  <div key={i} style={{ padding: '16px 20px', borderBottom: i < ratings.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{r.customer_name}</div>
                        <StarDisplay rating={r.score} size={13} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0, lineHeight: 1.5 }}>"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
