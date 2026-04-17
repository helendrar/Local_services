import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from '../components/StarRating';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

// ── Stat card ─────────────────────────────────────────────────
const Stat = ({ icon, label, value, sub, bg }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}>{icon}</div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

// ── Customer dashboard ────────────────────────────────────────
function CustomerDash() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs/mine').then(r => setJobs(r.data.jobs)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const open      = jobs.filter(j => j.status === 'open').length;
  const assigned  = jobs.filter(j => j.status === 'assigned').length;
  const completed = jobs.filter(j => j.status === 'completed').length;

  return (
    <>
      <div className="grid-4 mb-24">
        <Stat icon="📋" label="Total Jobs Posted" value={jobs.length} bg="#eff6ff" />
        <Stat icon="🔵" label="Open Jobs"          value={open}      sub="Awaiting provider" bg="#f0fdf4" />
        <Stat icon="🟡" label="In Progress"         value={assigned}  bg="#fffbeb" />
        <Stat icon="✅" label="Completed"           value={completed} bg="#f0fdf4" />
      </div>

      <div className="grid-2">
        {/* Recent jobs */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Recent Jobs</h3>
            <Link to="/jobs/mine" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <span className="emoji">📝</span>
                <h3>No jobs yet</h3>
                <p>Post your first job to get started</p>
                <Link to="/jobs/post" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Post a Job</Link>
              </div>
            ) : (
              <div style={{ padding: '0 0 8px' }}>
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
                      <div className="text-muted">{job.category_name || 'General'}</div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: 15 }}>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/jobs/post', icon: '➕', label: 'Post a new job', desc: 'Describe what you need done', primary: true },
              { to: '/providers', icon: '🔍', label: 'Browse providers', desc: 'Search verified professionals' },
              { to: '/jobs/mine', icon: '💼', label: 'Manage my jobs', desc: 'Track status & assign providers' },
            ].map(({ to, icon, label, desc, primary }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 'var(--radius)',
                  border: `1.5px solid ${primary ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: primary ? 'var(--primary-bg)' : '#fff',
                  textDecoration: 'none', transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-800)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Provider dashboard ────────────────────────────────────────
function ProviderDash() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/providers/my-profile'),
      api.get('/jobs/assigned'),
    ]).then(([p, a]) => {
      setProfile(p.data.profile);
      setAssignments(a.data.assignments);
    }).catch(() => {});
  }, []);

  const pending   = assignments.filter(a => a.assignment_status === 'pending').length;
  const accepted  = assignments.filter(a => a.assignment_status === 'accepted').length;
  const completed = assignments.filter(a => a.assignment_status === 'completed').length;

  const isVerified = profile?.verification_status === 'verified';
  const isPending  = profile?.verification_status === 'pending';

  return (
    <>
      {/* Verification banner */}
      {!isVerified && (
        <div style={{
          background: isPending ? 'var(--warning-bg)' : 'var(--danger-bg)',
          border: `1px solid ${isPending ? '#fde68a' : '#fecaca'}`,
          borderRadius: 'var(--radius)', padding: '14px 20px',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>{isPending ? '⏳' : '❌'}</span>
          <div>
            <strong>{isPending ? 'Verification Pending' : 'Not Verified'}</strong>
            <div style={{ fontSize: 13, marginTop: 2, color: 'var(--gray-600)' }}>
              {isPending
                ? 'Your profile is under review. You\'ll be notified once approved.'
                : 'Complete your profile and upload documents to get verified.'}
            </div>
          </div>
          <Link to="/profile" className="btn btn-sm" style={{ marginLeft: 'auto', background: 'var(--warning)', color: '#fff' }}>
            Complete Profile
          </Link>
        </div>
      )}

      <div className="grid-4 mb-24">
        <Stat icon="⭐" label="Average Rating"   value={profile?.avg_rating || '0.00'} sub={`${profile?.total_ratings || 0} reviews`} bg="#fffbeb" />
        <Stat icon="✅" label="Jobs Completed"   value={profile?.total_jobs_completed || 0} bg="#f0fdf4" />
        <Stat icon="🔔" label="New Assignments"  value={pending}   sub="Awaiting response" bg="#eff6ff" />
        <Stat icon="🔧" label="Active Jobs"      value={accepted}  bg="#fef9ee" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Recent Assignments</h3>
            <Link to="/jobs/assigned" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {assignments.length === 0 ? (
              <div className="empty-state">
                <span className="emoji">📭</span>
                <h3>No assignments yet</h3>
                <p>Once you're verified, customers can assign jobs to you</p>
              </div>
            ) : (
              <div style={{ paddingBottom: 8 }}>
                {assignments.slice(0, 5).map(a => (
                  <div key={a.assignment_id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.title}</div>
                      <div className="text-muted">{a.customer_name}</div>
                    </div>
                    <StatusBadge status={a.assignment_status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: 15 }}>Profile Strength</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Basic info',       done: !!(profile?.full_name && profile?.email) },
              { label: 'Category set',     done: !!profile?.category_id },
              { label: 'Bio written',      done: !!profile?.bio },
              { label: 'Skills listed',    done: profile?.skills?.length > 0 },
              { label: 'Document uploaded',done: !!profile?.document_url },
              { label: 'Verified',         done: isVerified },
            ].map(({ label, done }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: done ? 'var(--gray-700)' : 'var(--gray-400)' }}>{label}</span>
                <span>{done ? '✅' : '⬜'}</span>
              </div>
            ))}
            <Link to="/profile" className="btn btn-outline btn-sm" style={{ marginTop: 4, justifyContent: 'center' }}>
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout title="Dashboard">
      <div className="mb-24">
        <h2>Hello, {user?.full_name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
          {user?.role === 'customer'  ? 'Find and manage your service providers' :
           user?.role === 'provider'  ? 'Manage your profile and job assignments' :
           'System overview and administration'}
        </p>
      </div>

      {user?.role === 'customer' && <CustomerDash />}
      {user?.role === 'provider' && <ProviderDash />}
      {user?.role === 'admin'    && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <span style={{ fontSize: 48 }}>🏛️</span>
          <h3 style={{ marginTop: 12 }}>Admin Dashboard</h3>
          <p style={{ color: 'var(--gray-500)', marginTop: 6 }}>
            Use the sidebar to access admin tools
          </p>
        </div>
      )}
    </Layout>
  );
}
