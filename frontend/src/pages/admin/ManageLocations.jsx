import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import api from '../../api/axios';

function LocationModal({ location, onClose, onDone }) {
  const [form, setForm] = useState({
    name: location?.name || '',
    region: location?.region || '',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!location;

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Location name is required.');
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/locations/${location.id}`, form);
        toast.success('Location updated.');
      } else {
        await api.post('/locations', form);
        toast.success('Location created.');
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
          <h3>{isEdit ? 'Edit Location' : 'Add Location'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Location Name <span>*</span></label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Westlands" />
          </div>
          <div className="form-group">
            <label className="form-label">Region / County</label>
            <input className="form-input" value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              placeholder="e.g. Nairobi County" />
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

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/locations')
      .then(r => setLocations(r.data.locations))
      .catch(() => toast.error('Failed to load locations'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (loc) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    try {
      await api.delete(`/locations/${loc.id}`);
      toast.success('Location deleted.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <Layout title="Manage Locations">
      {modal && (
        <LocationModal
          location={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}

      <div className="mb-16 flex-between">
        <div>
          <h2>Service Locations</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
            {locations.length} locations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          ➕ Add Location
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Region / County</th>
                <th>Providers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32 }}><span className="spinner spinner-dark" /></td></tr>
              ) : locations.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state" style={{ padding: 32 }}><span className="emoji">📍</span><h3>No locations</h3></div></td></tr>
              ) : locations.map(loc => (
                <tr key={loc.id}>
                  <td style={{ fontWeight: 500 }}>{loc.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{loc.region || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{loc.provider_count || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(loc)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(loc)}>🗑️ Delete</button>
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
