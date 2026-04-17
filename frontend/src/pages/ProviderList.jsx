import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProviderCard from '../components/ProviderCard';
import api from '../api/axios';

export default function ProviderList() {
  const navigate = useNavigate();
  const [providers, setProviders]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);

  const [filters, setFilters] = useState({
    search: '', category: '', location: '', sort: 'rating',
  });

  const fetchProviders = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12, ...filters };
      const res = await api.get('/providers', { params });
      setProviders(res.data.providers);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/locations')])
      .then(([c, l]) => {
        setCategories(c.data.categories);
        setLocations(l.data.locations);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProviders(1), 350);
    return () => clearTimeout(t);
  }, [fetchProviders]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const hasFilters = filters.search || filters.category || filters.location;

  return (
    <Layout title="Find Providers">
      <div className="mb-16 flex-between">
        <div>
          <h2>Service Providers</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
            {total} verified professional{total !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="search-bar mb-20">
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search by name, skill, or bio…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: 180 }}
          value={filters.category}
          onChange={e => setFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className="form-select" style={{ width: 160 }}
          value={filters.location}
          onChange={e => setFilter('location', e.target.value)}>
          <option value="">All locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <select className="form-select" style={{ width: 150 }}
          value={filters.sort}
          onChange={e => setFilter('sort', e.target.value)}>
          <option value="rating">⭐ Top Rated</option>
          <option value="newest">🆕 Newest</option>
          <option value="jobs">✅ Most Jobs</option>
        </select>

        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ search: '', category: '', location: '', sort: 'rating' })}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)', height: 200,
              animation: 'pulse 1.5s ease infinite',
            }} />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🔍</span>
          <h3>No providers found</h3>
          <p>Try adjusting your filters or search term</p>
          {hasFilters && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setFilters({ search: '', category: '', location: '', sort: 'rating' })}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {providers.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                onClick={() => navigate(`/providers/${p.id}`)}
                showRate={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => fetchProviders(page - 1)}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--gray-500)', padding: '0 8px' }}>
                Page {page} of {pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === pages}
                onClick={() => fetchProviders(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
