import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from '../components/StarRating';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tab, setTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm();
  const skills = watch('skills') || [];

  useEffect(() => {
    Promise.all([
      api.get("/users/me"),
      api.get('/categories'),
      api.get('/locations'),
      api.get('/notifications'),
    ]).then(([me, cats, locs, notifs]) => {
      const p = me.data.user;
      setProfile(p);
      setCategories(cats.data.categories);
      setLocations(locs.data.locations);
      setNotifications(notifs.data.notifications);
      reset({
        full_name: p.full_name,
        phone: p.phone || '',
        bio: p.bio || '',
        skills: p.skills || [],
        years_experience: p.years_experience || 0,
        hourly_rate: p.hourly_rate || '',
        category_id: p.category_id || '',
        location_id: p.location_id || '',
      });
    }).catch(() => {});
  }, []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    const current = getValues('skills') || [];
    if (!current.includes(s)) setValue('skills', [...current, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => {
    const current = getValues('skills') || [];
    setValue('skills', current.filter(x => x !== s));
  };

  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      if (user.role === 'provider') {
        await api.put('/providers/profile', data);
      } else {
        await api.put('/users/me', data);
      }
      updateUser({ full_name: data.full_name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onUploadDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('document', file);
    setUploading(true);
    try {
      await api.post('/providers/upload-document', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded! Await admin verification.');
      const me = await api.get("/users/me");
      setProfile(me.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout title="My Profile">
      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius-lg)', padding: '24px 28px',
        marginBottom: 24,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)',
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ marginBottom: 2 }}>{user?.full_name}</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ textTransform: 'capitalize' }}>🏷️ {user?.role}</span>
            <span>📧 {user?.email}</span>
            {profile?.avg_rating > 0 && (
              <span>⭐ {Number(profile.avg_rating).toFixed(1)} ({profile.total_ratings} reviews)</span>
            )}
            {profile?.verification_status && (
              <span className={`badge ${profile.verification_status === 'verified' ? 'badge-green' : profile.verification_status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                {profile.verification_status === 'verified' ? '✅' : '⏳'} {profile.verification_status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile Info</button>
        {user?.role === 'provider' && (
          <button className={`tab ${tab === 'verification' ? 'active' : ''}`} onClick={() => setTab('verification')}>Verification</button>
        )}
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
          Notifications {notifications.filter(n => !n.is_read).length > 0 && `(${notifications.filter(n => !n.is_read).length})`}
        </button>
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: 15 }}>Edit Profile</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSaveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-input" {...register('full_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" {...register('phone')} placeholder="+254712345678" />
                </div>
              </div>

              {user?.role === 'provider' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-textarea" rows={4}
                      placeholder="Describe your experience and services…"
                      {...register('bio')} />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" {...register('category_id')}>
                        <option value="">Select…</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <select className="form-select" {...register('location_id')}>
                        <option value="">Select…</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <input className="form-input" type="number" min={0} {...register('years_experience')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hourly Rate (KSh)</label>
                      <input className="form-input" type="number" min={0} placeholder="e.g. 500" {...register('hourly_rate')} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Skills</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        className="form-input"
                        placeholder="Add a skill e.g. Pipe fitting"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <button type="button" className="btn btn-secondary" onClick={addSkill}>Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(skills || []).map(s => (
                        <span key={s} className="badge badge-primary" style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}
                          onClick={() => removeSkill(s)}>
                          {s} ✕
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {tab === 'verification' && user?.role === 'provider' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: 15 }}>Verification Status</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 48 }}>
                  {profile?.verification_status === 'verified' ? '✅' : profile?.verification_status === 'rejected' ? '❌' : '⏳'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, textTransform: 'capitalize' }}>
                    {profile?.verification_status || 'Not submitted'}
                  </div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>
                    {profile?.verification_status === 'verified'
                      ? `Verified on ${new Date(profile.verified_at).toLocaleDateString('en-KE')}`
                      : profile?.verification_status === 'rejected'
                      ? `Reason: ${profile?.rejection_reason || 'Contact admin for details'}`
                      : 'Upload your documents below and wait for admin review.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: 15 }}>Verification Documents</h3></div>
            <div className="card-body">
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 16 }}>
                Upload a clear photo or scan of your National ID, Passport, or professional certificate.
                Accepted formats: JPEG, PNG, PDF (max 5MB).
              </p>

              {profile?.document_url && (
                <div style={{
                  background: 'var(--success-bg)', border: '1px solid #86efac',
                  borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13,
                  marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  ✅ Document uploaded: <strong>{profile.document_name || 'verification document'}</strong>
                  <a href={profile.document_url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'var(--primary)' }}>
                    View →
                  </a>
                </div>
              )}

              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '32px 20px', border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-lg)', cursor: uploading ? 'not-allowed' : 'pointer',
                background: 'var(--gray-50)', transition: 'border-color .15s',
              }}
                onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}
              >
                <span style={{ fontSize: 36 }}>📄</span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                  {uploading ? 'Uploading…' : 'Click to upload document'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>or drag and drop</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onUploadDoc}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15 }}>Notifications</h3>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{notifications.length} total</span>
          </div>
          <div style={{ padding: 0 }}>
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <span className="emoji">🔔</span>
                <h3>No notifications yet</h3>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} style={{
                  padding: '14px 24px',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  background: !n.is_read ? 'var(--primary-bg)' : '#fff',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 18 }}>
                    {n.type === 'success' ? '✅' : n.type === 'danger' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString('en-KE')}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
