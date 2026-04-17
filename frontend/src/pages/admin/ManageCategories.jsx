import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import api from '../../api/axios';

function CategoryModal({ category, onClose, onDone }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || 'briefcase',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!category;

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Category name is required.');
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/categories/${category.id}`, form);
        toast.success('Category updated.');
      } else {
        await api.post('/categories', form);
        toast.success('Category created.');
      }
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Category' : 'Add Category'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Name <span>*</span></label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Plumbing" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this category" />
          </div>
          <div className="form-group">
            <label className="form-label">Icon (name)</label>
            <input className="form-input" value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="e.g. hammer, zap, leaf" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Saving…</> : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | category object

  const load = () => {
    setLoading(true);
    api.get('/categories')
      .then(r => setCategories(r.data.categories))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success('Category deleted.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <Layout title="Manage Categories">
      {modal && (
        <CategoryModal
          category={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}

      <div className="mb-16 flex-between">
        <div>
          <h2>Service Categories</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
            {categories.length} categories
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          ➕ Add Category
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Providers</th>
                <th>Jobs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}><span className="spinner spinner-dark" /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state" style={{ padding: 32 }}><span className="emoji">📂</span><h3>No categories</h3></div></td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>icon: {cat.icon}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)', maxWidth: 280 }}>{cat.description || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{cat.provider_count || 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{cat.job_count || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(cat)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
