import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ── Notifications dropdown ─────────────────────────────────────
function NotificationsDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications?limit=8')
      .then(r => setNotifications(r.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const typeIcon = (type) => ({
    success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️',
  }[type] || 'ℹ️');

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
      width: 360, background: '#fff',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 200,
      animation: 'slideUp .15s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>
          Notifications
        </span>
        <button
          onClick={markAllRead}
          style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <span className="spinner spinner-dark" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 13 }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              style={{
                padding: '12px 18px',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--gray-100)' : 'none',
                background: !n.is_read ? '#f0fdf4' : '#fff',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                transition: 'background .15s',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{typeIcon(n.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.is_read && (
                <span style={{ width: 7, height: 7, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
        <Link to="/profile" onClick={onClose} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
          View all notifications →
        </Link>
      </div>
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────
export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread]         = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser]     = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  // Poll unread count every 30s
  useEffect(() => {
    const fetch = () =>
      api.get('/notifications/unread-count')
        .then(r => setUnread(r.data.unread || 0))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <header style={{
      height: 'var(--header-h)',
      background: '#fff',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
    }}>
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '1.1rem',
          color: 'var(--gray-900)',
        }}>
          {title}
        </span>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Quick nav links (customer only) */}
        {user?.role === 'customer' && (
          <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
            {[
              { to: '/providers', label: '🔍 Find Providers' },
              { to: '/jobs/post', label: '➕ Post Job' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: location.pathname === to ? 'var(--primary)' : 'var(--gray-600)',
                  background: location.pathname === to ? 'var(--primary-bg)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all .15s',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Notifications bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowUser(false); }}
            style={{
              width: 38, height: 38, borderRadius: 'var(--radius)',
              border: 'none', background: showNotifs ? 'var(--gray-100)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, position: 'relative', transition: 'background .15s',
            }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                background: 'var(--danger)', color: '#fff',
                borderRadius: '99px', fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                border: '2px solid #fff',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationsDropdown onClose={() => setShowNotifs(false)} />
          )}
        </div>

        {/* User avatar dropdown */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => { setShowUser(v => !v); setShowNotifs(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 6px',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              background: showUser ? 'var(--gray-50)' : '#fff',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>
              {user?.full_name?.split(' ')[0]}
            </span>
            <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>▾</span>
          </button>

          {showUser && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 200, background: '#fff',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden', zIndex: 200,
              animation: 'slideUp .15s ease',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2, textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
              {[
                { to: '/profile',   icon: '👤', label: 'My Profile' },
                { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
              ].map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setShowUser(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', fontSize: 13,
                    color: 'var(--gray-700)', textDecoration: 'none',
                    transition: 'background .12s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{icon}</span> {label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--gray-100)' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', fontSize: 13,
                    color: 'var(--danger)', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'background .12s', textAlign: 'left',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
