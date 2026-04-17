import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations]   = useState([]);
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { urgency: 'normal' }
  });

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/locations')])
      .then(([c, l]) => { setCategories(c.data.categories); setLocations(l.data.locations); })
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/jobs', data);
      toast.success('Job posted! You can now assign it to a provider.');
      navigate('/jobs/mine');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  const urgency = watch('urgency');

  return (
    <Layout title="Post a Job">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="mb-24">
          <h2>Post a New Job</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
            Describe what you need and our verified providers will be ready to help.
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Job Title <span>*</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. Fix kitchen sink leaking pipe"
                  {...register('title', { required: 'Job title is required', minLength: { value: 5, message: 'Title too short' } })}
                />
                {errors.title && <span className="form-error">⚠ {errors.title.message}</span>}
              </div>

              {/* Category & Location */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" {...register('category_id')}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-select" {...register('location_id')}>
                    <option value="">Select location…</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description <span>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Describe the job in detail. What needs to be done? Any specific requirements? When do you need it completed?"
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please provide more detail (min 20 characters)' } })}
                />
                {errors.description && <span className="form-error">⚠ {errors.description.message}</span>}
              </div>

              {/* Budget & Urgency */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Budget (KSh)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 2500"
                    min={0}
                    {...register('budget', { min: { value: 0, message: 'Budget cannot be negative' } })}
                  />
                  <span className="form-hint">Leave blank if negotiable</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Urgency</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[
                      { value: 'low',    label: 'Low',    color: 'var(--gray-500)' },
                      { value: 'normal', label: 'Normal', color: 'var(--primary)' },
                      { value: 'urgent', label: 'Urgent', color: 'var(--danger)' },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        style={{
                          flex: 1, textAlign: 'center', padding: '8px',
                          borderRadius: 'var(--radius)', cursor: 'pointer',
                          border: `1.5px solid ${urgency === opt.value ? opt.color : 'var(--gray-200)'}`,
                          background: urgency === opt.value ? `${opt.color}18` : '#fff',
                          fontSize: 13, fontWeight: urgency === opt.value ? 500 : 400,
                          color: urgency === opt.value ? opt.color : 'var(--gray-500)',
                          transition: 'all .15s',
                        }}
                      >
                        <input type="radio" value={opt.value} {...register('urgency')} style={{ display: 'none' }} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div style={{
                background: 'var(--info-bg)', border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13,
              }}>
                <strong style={{ color: 'var(--info)' }}>💡 Tips for a great post:</strong>
                <ul style={{ margin: '6px 0 0 16px', color: 'var(--gray-600)', lineHeight: 1.8 }}>
                  <li>Be specific about the work needed</li>
                  <li>Mention any special tools or materials required</li>
                  <li>Set a realistic budget if possible</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Posting…</> : '📋 Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
