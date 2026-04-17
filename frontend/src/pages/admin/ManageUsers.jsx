import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const RoleBadge = ({ role }) => {
  const map = {
    customer: { cls: 'badge-blue',    label: 'Customer' },
    provider: { cls: 'badge-primary', label: 'Provider' },
    admin:    { cls: 'badge-gray',    label: 'Admin' },
  };
  const { cls, label } = map[role] || { cls: 'badge-gray', label: role };
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function ManageUsers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [page, setPage]       = useState(1);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search) params.search = search;
      if (role)   params.role   = role;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggle = async (userId, currentlyActive, name) => {
    if (!confirm(`${currentlyActive ? 'Suspend' : 'Reactivate'} ${name}?`)) return;
    setToggling(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle`);
      toast.success(res.data.message);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setToggling(null);
    }
  };

  const pages = Math.ceil(total / 20);

  return (
    <Layout title="Manage Users">
      <div className="mb-16 flex-between">
        <div>
          <h2>All Users</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar mb-16">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <span className="icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
        </select>
        {(search || role) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setRole(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Digital ID</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                    <span className="spinner spinner-dark" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: 32 }}>
                      <span className="emoji">👥</span>
                      <h3>No users found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const initials = u.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--primary-bg)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600, flexShrink: 0,
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>{u.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={u.role} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.digital_id}</td>
                      <td style={{ fontSize: 13 }}>{u.phone || '—'}</td>
                      <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('en-KE') : 'Never'}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          style={{ fontSize: 12 }}
                          onClick={() => handleToggle(u.id, u.is_active, u.full_name)}
                          disabled={toggling === u.id}
                        >
                          {toggling === u.id
                            ? <span className="spinner" />
                            : u.is_active ? '🚫 Suspend' : '✅ Activate'
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => fetchUsers(page - 1)}>← Prev</button>
            <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--gray-600)' }}>Page {page} of {pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => fetchUsers(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
