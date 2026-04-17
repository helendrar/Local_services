import { useNavigate } from 'react-router-dom';

/**
 * JobCard — reusable card for job listings.
 *
 * Props:
 *   job            {object}    — job data from API
 *   role           {string}    — 'customer' | 'provider' | 'admin'
 *   onAssign       {function}  — called when customer clicks Assign (job) => void
 *   onComplete     {function}  — called when customer marks complete (job) => void
 *   onRespond      {function}  — called when provider clicks Respond (assignment) => void
 *   onRate         {function}  — called when customer clicks Rate (job) => void
 *   loading        {string}    — id of the job/assignment currently loading
 *   showCustomer   {boolean}   — show customer name (admin/provider view)
 *   showProvider   {boolean}   — show assigned provider info (customer view)
 *   compact        {boolean}   — minimal layout (no description, fewer actions)
 */
export default function JobCard({
  job,
  role = 'customer',
  onAssign,
  onComplete,
  onRespond,
  onRate,
  loading,
  showCustomer = false,
  showProvider = false,
  compact = false,
}) {
  const navigate = useNavigate();
  if (!job) return null;

  const {
    id, job_id, assignment_id,
    title, description, status,
    assignment_status,
    category_name, location_name, budget, urgency,
    created_at, assigned_at,
    customer_name, customer_phone,
    provider_name, provider_id, provider_rating,
  } = job;

  const jobId     = id || job_id;
  const isLoading = loading === jobId || loading === assignment_id;

  // ── Status badge ─────────────────────────────────────────────
  const STATUS_MAP = {
    open:      { bg: 'var(--info-bg)',    color: 'var(--info)',    label: 'Open' },
    assigned:  { bg: 'var(--warning-bg)',  color: 'var(--warning)', label: 'Assigned' },
    completed: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Completed' },
    cancelled: { bg: 'var(--gray-100)',   color: 'var(--gray-500)', label: 'Cancelled' },
    pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Pending' },
    accepted:  { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Accepted' },
    rejected:  { bg: 'var(--danger-bg)',  color: 'var(--danger)',  label: 'Rejected' },
  };

  const displayStatus = assignment_status || status;
  const { bg, color, label } = STATUS_MAP[displayStatus] || { bg: 'var(--gray-100)', color: 'var(--gray-500)', label: displayStatus };

  // ── Urgency stripe color ──────────────────────────────────────
  const urgencyColor = urgency === 'urgent' ? 'var(--danger)'
    : urgency === 'low' ? 'var(--gray-300)'
    : 'var(--primary)';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--gray-200)',
      borderLeft: `3.5px solid ${urgencyColor}`,
      borderRadius: 'var(--radius-lg)',
      padding: compact ? '14px 16px' : '18px 20px',
      transition: 'border-color .15s, box-shadow .15s',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor      = 'var(--gray-300)';
        e.currentTarget.style.borderLeftColor  = urgencyColor;
        e.currentTarget.style.boxShadow        = 'var(--shadow-sm)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor      = 'var(--gray-200)';
        e.currentTarget.style.borderLeftColor  = urgencyColor;
        e.currentTarget.style.boxShadow        = 'none';
      }}
    >
      {/* Top row: title + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: compact ? 14 : 15, flex: 1 }}>{title}</h4>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {urgency === 'urgent' && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--danger)',
              background: 'var(--danger-bg)', borderRadius: 99, padding: '2px 7px',
            }}>
              🔴 URGENT
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600, borderRadius: 99,
            padding: '3px 10px', background: bg, color,
          }}>
            {label}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--gray-500)' }}>
        {category_name && <span>📂 {category_name}</span>}
        {location_name && <span>📍 {location_name}</span>}
        {budget        && <span style={{ fontWeight: 500, color: 'var(--primary)' }}>💰 KSh {Number(budget).toLocaleString()}</span>}
        {created_at    && <span>📅 {new Date(created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        {assigned_at   && <span>🔗 Assigned {new Date(assigned_at).toLocaleDateString('en-KE')}</span>}
      </div>

      {/* Description */}
      {!compact && description && (
        <p style={{
          margin: 0, fontSize: 13,
          color: 'var(--gray-500)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {description}
        </p>
      )}

      {/* Customer name (admin/provider view) */}
      {showCustomer && customer_name && (
        <div style={{
          fontSize: 13, color: 'var(--gray-600)',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>👤 Customer:</span>
          <strong>{customer_name}</strong>
          {assignment_status === 'accepted' && customer_phone && (
            <span style={{ color: 'var(--primary)', marginLeft: 4 }}>📞 {customer_phone}</span>
          )}
        </div>
      )}

      {/* Assigned provider (customer view) */}
      {showProvider && provider_name && (
        <div style={{
          fontSize: 13,
          background: 'var(--primary-bg)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>🔧 Provider:</span>
          <strong>{provider_name}</strong>
          {provider_rating && (
            <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>
              ⭐ {Number(provider_rating).toFixed(1)}
            </span>
          )}
          {provider_id && (
            <button
              onClick={() => navigate(`/providers/${provider_id}`)}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', fontSize: 12 }}
            >
              View profile →
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>

        {/* CUSTOMER actions */}
        {role === 'customer' && (
          <>
            {status === 'open' && onAssign && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAssign(job)}
                disabled={isLoading}
              >
                {isLoading ? <><span className="spinner" /> Working…</> : '🔗 Assign Provider'}
              </button>
            )}
            {status === 'open' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/providers')}
              >
                🔍 Find Provider
              </button>
            )}
            {status === 'assigned' && onComplete && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => onComplete(job)}
                disabled={isLoading}
              >
                {isLoading ? <><span className="spinner" /> Completing…</> : '✅ Mark Complete'}
              </button>
            )}
            {status === 'completed' && onRate && provider_id && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onRate(job)}
              >
                ⭐ Rate Provider
              </button>
            )}
          </>
        )}

        {/* PROVIDER actions */}
        {role === 'provider' && (
          <>
            {assignment_status === 'pending' && onRespond && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onRespond(job)}
                disabled={isLoading}
              >
                {isLoading ? <><span className="spinner" /> Responding…</> : '📩 Respond to Job'}
              </button>
            )}
            {assignment_status === 'accepted' && (
              <span style={{
                fontSize: 12, color: 'var(--success)',
                background: 'var(--success-bg)',
                padding: '4px 10px', borderRadius: 99, fontWeight: 500,
              }}>
                ✅ You accepted this job
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
