import { useNavigate } from 'react-router-dom';
import { StarDisplay } from './StarRating';

/**
 * ProviderCard — reusable card displayed in search results and grids.
 *
 * Props:
 *   provider  {object}   — provider data from API
 *   onClick   {function} — optional override; defaults to navigate to /providers/:id
 *   compact   {boolean}  — smaller variant for tight spaces (default false)
 *   showRate  {boolean}  — show hourly rate badge (default true)
 *   actionLabel {string} — optional CTA button label
 *   onAction  {function} — optional CTA button handler
 */
export default function ProviderCard({
  provider,
  onClick,
  compact = false,
  showRate = true,
  actionLabel,
  onAction,
}) {
  const navigate = useNavigate();

  if (!provider) return null;

  const {
    id, full_name, bio, skills = [], avg_rating = 0,
    total_ratings = 0, total_jobs_completed = 0,
    category_name, location_name, hourly_rate,
    verification_status, years_experience,
  } = provider;

  const initials = (full_name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleClick = () => {
    if (onClick) return onClick(provider);
    navigate(`/providers/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: '#fff',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '14px' : '20px',
        cursor: 'pointer',
        transition: 'all .2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 8 : 12,
        height: '100%',
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'var(--primary-light)';
        e.currentTarget.style.boxShadow   = 'var(--shadow)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = 'var(--gray-200)';
        e.currentTarget.style.boxShadow   = 'none';
        e.currentTarget.style.transform   = 'translateY(0)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: compact ? 44 : 54,
          height: compact ? 44 : 54,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: compact ? '0.95rem' : '1.15rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {initials}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: compact ? 14 : 15,
            color: 'var(--gray-900)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {full_name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            {category_name && (
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{category_name}</span>
            )}
            {category_name && location_name && (
              <span style={{ color: 'var(--gray-300)', fontSize: 11 }}>·</span>
            )}
            {location_name && (
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>📍 {location_name}</span>
            )}
          </div>

          {/* Stars + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <StarDisplay rating={avg_rating} size={12} />
            <span style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 500 }}>
              {Number(avg_rating).toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              ({total_ratings} review{total_ratings !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Verified badge */}
        {verification_status === 'verified' && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: 'var(--success)',
            background: 'var(--success-bg)',
            border: '1px solid #86efac',
            borderRadius: 99, padding: '2px 8px',
            flexShrink: 0,
          }}>
            ✓ Verified
          </span>
        )}
      </div>

      {/* Bio */}
      {!compact && bio && (
        <p style={{
          fontSize: 13,
          color: 'var(--gray-500)',
          lineHeight: 1.55,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {skills.slice(0, compact ? 2 : 4).map(s => (
            <span
              key={s}
              style={{
                fontSize: 11, padding: '2px 8px',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                borderRadius: 99, fontWeight: 500,
              }}
            >
              {s}
            </span>
          ))}
          {skills.length > (compact ? 2 : 4) && (
            <span style={{ fontSize: 11, color: 'var(--gray-400)', alignSelf: 'center' }}>
              +{skills.length - (compact ? 2 : 4)} more
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: compact ? 0 : 4,
      }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-400)' }}>
          <span>✅ {total_jobs_completed} job{total_jobs_completed !== 1 ? 's' : ''}</span>
          {years_experience > 0 && (
            <span>🏅 {years_experience}yr exp</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showRate && hourly_rate && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--primary)',
            }}>
              KSh {Number(hourly_rate).toLocaleString()}/hr
            </span>
          )}

          {actionLabel && onAction && (
            <button
              className="btn btn-primary btn-sm"
              style={{ fontSize: 12 }}
              onClick={e => { e.stopPropagation(); onAction(provider); }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
