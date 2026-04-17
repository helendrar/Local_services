import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Navbar from './Navbar';

const NAV = {
  admin: [
    { section: 'Overview', links: [
      { to: '/admin',               icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'Management', links: [
      { to: '/admin/users',         icon: '👥', label: 'Users' },
      { to: '/admin/providers',     icon: '🔒', label: 'Providers' },
      { to: '/admin/jobs',          icon: '📋', label: 'All Jobs' },
    ]},
    { section: 'Configuration', links: [
      { to: '/admin/categories',    icon: '📂', label: 'Categories' },
      { to: '/admin/locations',     icon: '📍', label: 'Locations' },
    ]},
  ],
  customer: [
    { section: 'Menu', links: [
      { to: '/dashboard',           icon: '🏠', label: 'Dashboard' },
      { to: '/providers',           icon: '🔍', label: 'Find Providers' },
      { to: '/jobs/post',           icon: '➕', label: 'Post a Job' },
      { to: '/jobs/mine',           icon: '💼', label: 'My Jobs' },
    ]},
  ],
  provider: [
    { section: 'Menu', links: [
      { to: '/dashboard',           icon: '🏠', label: 'Dashboard' },
      { to: '/jobs/assigned',       icon: '📋', label: 'My Assignments' },
    ]},
  ],
};

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const nav = NAV[user?.role] || [];
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-text">🌿 LocalServices</div>
          <div className="logo-sub">Verified professionals</div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ section, links }) => (
            <div key={section}>
              <div className="nav-section-title">{section}</div>
              {links.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin' || to === '/dashboard'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSideOpen(false)}
                >
                  <span className="icon">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="nav-section-title">Account</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSideOpen(false)}
          >
            <span className="icon">👤</span>
            My Profile
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name truncate">{user?.full_name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm btn-icon"
              title="Logout"
              style={{ color: '#9ca3af', padding: 6 }}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        <Navbar title={title} />
        <div className="content fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
