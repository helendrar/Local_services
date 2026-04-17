import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';

export default function AdminJobs() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/jobs')
      .then(r => setJobs(r.data.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const matchTab    = tab === 'all' || j.status === tab;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all:       jobs.length,
    open:      jobs.filter(j => j.status === 'open').length,
    assigned:  jobs.filter(j => j.status === 'assigned').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  return (
    <Layout title="All Jobs">
      <div className="mb-16 flex-between">
        <div>
          <h2>All Platform Jobs</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>{jobs.length} total jobs</p>
        </div>
      </div>

      <div className="tabs mb-16">
        {[
          { key: 'all',       label: `All (${counts.all})` },
          { key: 'open',      label: `Open (${counts.open})` },
          { key: 'assigned',  label: `Assigned (${counts.assigned})` },
          { key: 'completed', label: `Completed (${counts.completed})` },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="search-bar mb-16" style={{ padding: '12px 16px' }}>
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search by title or customer name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Location</th>
                <th>Budget</th>
                <th>Urgency</th>
                <th>Posted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: 32 }}>
                      <span className="emoji">📋</span>
                      <h3>No jobs found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(job => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 14, maxWidth: 240 }}
                           className="truncate">{job.title}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{job.customer_name}</td>
                    <td style={{ fontSize: 13 }}>{job.category_name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{job.location_name || '—'}</td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>
                      {job.budget ? `KSh ${Number(job.budget).toLocaleString()}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        job.urgency === 'urgent' ? 'badge-red' :
                        job.urgency === 'low' ? 'badge-gray' : 'badge-blue'
                      }`}>
                        {job.urgency}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{new Date(job.created_at).toLocaleDateString('en-KE')}</td>
                    <td><StatusBadge status={job.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
