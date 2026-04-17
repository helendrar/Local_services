import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StarDisplay } from '../../components/StarRating';
import toast from 'react-hot-toast';
import api from '../../api/axios';

// ── Provider detail modal ─────────────────────────────────────
function ProviderModal({ provider, onClose, onDone }) {
  const [action, setAction] = useState('verified');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (action === 'rejected' && !reason.trim()) {
      return toast.error('Please provide a reason for rejection.');
    }
    setLoading(true);
    try {
      await api.post('/admin/verify-provider', {
        provider_id: provider.id,
        action,
        reason: reason || null,
      });
      toast.success(`Provider ${action} successfully!`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const initials = provider.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Provider Application Review</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Provider summary */}
          <div style={{
            display: 'flex', gap: 16, alignItems: 'flex-start',
            background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.1rem', fontWeight: 700,
            }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{provider.full_name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{provider.email}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-gray" style={{ fontSize: 11 }}>🪪 {provider.digital_id}</span>
                {provider.category_name && <span className="badge badge-primary" style={{ fontSize: 11 }}>📂 {provider.category_name}</span>}
                {provider.location_name && <span className="badge badge-gray" style={{ fontSize: 11 }}>📍 {provider.location_name}</span>}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid-2">
            {[
              { label: 'Applied',       value: new Date(provider.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Experience',    value: `${provider.years_experience || 0} years` },
              { label: 'Phone',         value: provider.phone || '—' },
              { label: 'Category',      value: provider.category_name || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {provider.bio && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Bio</div>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>{provider.bio}</p>
            </div>
          )}

          {/* Skills */}
          {provider.skills?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {provider.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
              </div>
            </div>
          )}

          {/* Document */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Verification Document</div>
            {provider.document_url ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--success-bg)', border: '1px solid #86efac',
                borderRadius: 'var(--radius)', padding: '10px 14px',
              }}>
                <span>📄</span>
                <span style={{ fontSize: 13, flex: 1 }}>{provider.document_name || 'Document uploaded'}</span>
                <a
                  href={provider.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: 12 }}
                >
                  View →
                </a>
              </div>
            ) : (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid #fecaca',
                borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)',
              }}>
                ⚠️ No document uploaded yet
              </div>
            )}
          </div>

          {/* Decision */}
          {provider.verification_status === 'pending' && (
            <>
              <div className="divider" />
              <div className="form-group">
                <label className="form-label">Decision</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { value: 'verified', label: '✅ Approve',  color: 'var(--success)' },
                    { value: 'rejected', label: '❌ Reject',   color: 'var(--danger)' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1, textAlign: 'center', padding: '12px',
                        border: `2px solid ${action === opt.value ? opt.color : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: action === opt.value ? `${opt.color}10` : '#fff',
                        fontSize: 14, fontWeight: action === opt.value ? 500 : 400,
                        transition: 'all .15s',
                      }}
                    >
                      <input type="radio" name="decision" value={opt.value} checked={action === opt.value}
                        onChange={() => setAction(opt.value)} style={{ display: 'none' }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {action === 'rejected' && (
                <div className="form-group">
                  <label className="form-label">Reason for rejection <span>*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Explain why this application is rejected. The provider will be notified."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {provider.verification_status !== 'pending' && (
            <div style={{
              background: provider.verification_status === 'verified' ? 'var(--success-bg)' : 'var(--danger-bg)',
              borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 14,
              color: provider.verification_status === 'verified' ? 'var(--success)' : 'var(--danger)',
            }}>
              {provider.verification_status === 'verified'
                ? `✅ Verified on ${provider.verified_at ? new Date(provider.verified_at).toLocaleDateString('en-KE') : 'N/A'}`
                : `❌ Rejected — ${provider.rejection_reason || 'No reason given'}`
              }
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {provider.verification_status !== 'pending' ? 'Close' : 'Cancel'}
          </button>
          {provider.verification_status === 'pending' && (
            <button
              className={`btn ${action === 'verified' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleVerify}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" /> Processing…</>
                : action === 'verified' ? 'Approve Provider' : 'Reject Application'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ManageProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [tab, setTab]             = useState('pending');
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/providers', {
        params: tab !== 'all' ? { status: tab } : {},
      });
      setProviders(res.data.providers);
    } catch {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? providers.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  const counts = {
    pending:  providers.filter(p => p.verification_status === 'pending').length,
    verified: providers.filter(p => p.verification_status === 'verified').length,
    rejected: providers.filter(p => p.verification_status === 'rejected').length,
  };

  const tabCounts = {
    pending:  counts.pending,
    verified: counts.verified,
    rejected: counts.rejected,
    all:      providers.length,
  };

  return (
    <Layout title="Manage Providers">
      {selected && (
        <ProviderModal
          provider={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load(); }}
        />
      )}

      <div className="mb-16 flex-between">
        <div>
          <h2>Provider Management</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
            {counts.pending > 0 && (
              <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                ⚠️ {counts.pending} pending review · {' '}
              </span>
            )}
            {providers.length} total providers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16">
        {[
          { key: 'pending',  label: `Pending (${tab === 'pending' ? filtered.length : counts.pending})` },
          { key: 'verified', label: `Verified (${tab === 'verified' ? filtered.length : counts.verified})` },
          { key: 'rejected', label: `Rejected (${tab === 'rejected' ? filtered.length : counts.rejected})` },
          { key: 'all',      label: `All (${providers.length})` },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar mb-16" style={{ padding: '12px 16px' }}>
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search providers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Category</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Rating</th>
                <th>Jobs Done</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ padding: 32 }}>
                      <span className="emoji">🔍</span>
                      <h3>No providers found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const initials = p.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>{p.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{p.category_name || '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.location_name || '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.years_experience || 0} yr{p.years_experience !== 1 ? 's' : ''}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarDisplay rating={p.avg_rating} size={12} />
                          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                            {Number(p.avg_rating).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, textAlign: 'center' }}>{p.total_jobs_completed || 0}</td>
                      <td style={{ fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                      <td>
                        <span className={`badge ${
                          p.verification_status === 'verified' ? 'badge-green' :
                          p.verification_status === 'rejected' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {p.verification_status === 'verified' ? '✅' : p.verification_status === 'rejected' ? '❌' : '⏳'}{' '}
                          {p.verification_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: 12 }}
                          onClick={() => setSelected(p)}
                        >
                          {p.verification_status === 'pending' ? '🔍 Review' : '👁 View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
