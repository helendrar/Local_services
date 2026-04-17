import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

const Stat = ({ icon, label, value, sub, bg, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || 'var(--gray-900)' }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

// Mini bar chart for rating distribution
const MiniBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <span style={{ width: 16, color: 'var(--gray-500)', textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--accent)', fontSize: 11 }}>★</span>
      <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <span style={{ width: 28, color: 'var(--gray-500)', fontSize: 12, textAlign: 'right', flexShrink: 0 }}>{count || 0}</span>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Admin Dashboard">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    </Layout>
  );

  const u = stats?.users || {};
  const j = stats?.jobs  || {};
  const p = stats?.providers || {};
  const r = stats?.ratings || {};

  // Jobs donut data
  const jobTotal = Number(j.total) || 0;
  const jobPcts = {
    open:      jobTotal ? Math.round((Number(j.open)      / jobTotal) * 100) : 0,
    assigned:  jobTotal ? Math.round((Number(j.assigned)  / jobTotal) * 100) : 0,
    completed: jobTotal ? Math.round((Number(j.completed) / jobTotal) * 100) : 0,
  };

  return (
    <Layout title="Admin Dashboard">
      {/* Page heading */}
      <div className="mb-24">
        <h2>System Overview</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
          Real-time platform statistics and activity
        </p>
      </div>

      {/* Top stats */}
      <div className="grid-4 mb-24">
        <Stat icon="👥" label="Total Users"       value={Number(u.total) || 0}     sub={`${u.customers || 0} customers · ${u.providers_count || 0} providers`} bg="#eff6ff" />
        <Stat icon="✅" label="Verified Providers" value={Number(p.verified) || 0}  sub={`${p.pending || 0} pending review`} bg="#f0fdf4" color="var(--success)" />
        <Stat icon="📋" label="Total Jobs"         value={Number(j.total) || 0}     sub={`${j.open || 0} open · ${j.completed || 0} completed`} bg="#fffbeb" />
        <Stat icon="⭐" label="Avg Platform Rating" value={r.avg ? Number(r.avg).toFixed(1) : '—'} sub={`${r.total || 0} total ratings`} bg="#fef9ee" color="var(--accent)" />
      </div>

      {/* Second stats row */}
      <div className="grid-4 mb-24">
        <Stat icon="🟡" label="Pending Verification" value={Number(p.pending) || 0}   bg="var(--warning-bg)" color="var(--warning)" />
        <Stat icon="🔵" label="Open Jobs"            value={Number(j.open) || 0}      bg="var(--info-bg)" color="var(--info)" />
        <Stat icon="🔧" label="Jobs In Progress"      value={Number(j.assigned) || 0}  bg="var(--primary-bg)" color="var(--primary)" />
        <Stat icon="🚫" label="Suspended Users"       value={Number(u.suspended) || 0} bg="var(--danger-bg)" color="var(--danger)" />
      </div>

      {/* Charts row */}
      <div className="grid-3 mb-24">
        {/* Jobs breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Jobs Breakdown</h3>
            <Link to="/admin/jobs" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Open',      value: Number(j.open),      color: '#3b82f6', pct: jobPcts.open },
              { label: 'Assigned',  value: Number(j.assigned),  color: '#f59e0b', pct: jobPcts.assigned },
              { label: 'Completed', value: Number(j.completed), color: '#22c55e', pct: jobPcts.completed },
            ].map(({ label, value, color, pct }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value || 0}</span>
                </div>
                <div style={{ background: 'var(--gray-100)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .6s ease' }} />
                </div>
              </div>
            ))}
            {jobTotal === 0 && (
              <p style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>No jobs posted yet</p>
            )}
          </div>
        </div>

        {/* Providers breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Provider Status</h3>
            <Link to="/admin/providers" className="btn btn-ghost btn-sm">Manage →</Link>
          </div>
          <div className="card-body">
            {[
              { label: 'Verified', value: Number(p.verified), color: '#22c55e', total: Number(p.total) },
              { label: 'Pending',  value: Number(p.pending),  color: '#f59e0b', total: Number(p.total) },
              { label: 'Rejected', value: Number(p.rejected), color: '#ef4444', total: Number(p.total) },
            ].map(({ label, value, color, total }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value || 0}</span>
                </div>
                <div style={{ background: 'var(--gray-100)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%',
                    background: color, borderRadius: 99, transition: 'width .6s ease',
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 'var(--radius)', fontSize: 13 }}>
              {Number(p.pending) > 0
                ? <><span style={{ color: 'var(--warning)' }}>⚠️ {p.pending} provider{p.pending > 1 ? 's' : ''} awaiting review</span></>
                : <span style={{ color: 'var(--success)' }}>✅ No pending verifications</span>
              }
            </div>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Rating Distribution</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 2.5 + 'rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>
                {r.avg ? Number(r.avg).toFixed(1) : '—'}
              </div>
              <div style={{ color: 'var(--accent)', fontSize: 20, letterSpacing: 2 }}>★★★★★</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.total || 0} total reviews</div>
            </div>
            {[5, 4, 3, 2, 1].map(n => (
              <MiniBar
                key={n}
                label={n}
                count={Number(r[`${['','one','two','three','four','five'][n]}_star`] || 0)}
                total={Number(r.total) || 0}
                color={n >= 4 ? '#22c55e' : n === 3 ? '#f59e0b' : '#ef4444'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid-2">
        {/* Recent jobs */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Recent Jobs</h3>
            <Link to="/admin/jobs" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div style={{ padding: 0 }}>
            {(stats?.recent_jobs || []).length === 0 ? (
              <div className="empty-state" style={{ padding: 28 }}>
                <span className="emoji" style={{ fontSize: '2rem' }}>📋</span>
                <p style={{ marginTop: 8 }}>No jobs yet</p>
              </div>
            ) : (
              stats.recent_jobs.map((job, i) => (
                <div key={job.id} style={{
                  padding: '12px 20px',
                  borderBottom: i < stats.recent_jobs.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>by {job.customer_name}</div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent users + activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Recent Registrations</h3>
            <Link to="/admin/users" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div style={{ padding: 0 }}>
            {(stats?.recent_users || []).length === 0 ? (
              <div className="empty-state" style={{ padding: 28 }}>
                <span className="emoji" style={{ fontSize: '2rem' }}>👥</span>
                <p style={{ marginTop: 8 }}>No users yet</p>
              </div>
            ) : (
              stats.recent_users.map((u, i) => {
                const initials = u.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={u.id} style={{
                    padding: '12px 20px',
                    borderBottom: i < stats.recent_users.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--primary-bg)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</div>
                    </div>
                    <StatusBadge status={u.role} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{
        marginTop: 24, background: 'var(--gray-900)', borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', display: 'flex', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--gray-400)', fontSize: 13, alignSelf: 'center', marginRight: 4 }}>Quick actions:</span>
        {[
          { to: '/admin/providers', label: `Review ${p.pending || 0} pending providers`, color: 'var(--warning)' },
          { to: '/admin/users',     label: 'Manage all users', color: 'var(--gray-300)' },
          { to: '/admin/jobs',      label: 'View all jobs',    color: 'var(--gray-300)' },
        ].map(({ to, label, color }) => (
          <Link key={to} to={to} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,.06)', color,
            fontSize: 13, fontWeight: 500, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,.08)',
            transition: 'background .15s',
          }}>
            {label} →
          </Link>
        ))}
      </div>
    </Layout>
  );
}
