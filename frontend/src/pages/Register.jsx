import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'customer' }
  });

  const role = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      flushSync(() => {
        login(res.data.token, res.data.user);
      });
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">🌿 LocalServices</div>
        <p className="auth-tagline">
          Join thousands of customers and service providers<br />
          building Kenya's most trusted local marketplace.
        </p>
        <div className="auth-features">
          {[
            { icon: '🪪', text: 'Secure digital ID registration' },
            { icon: '✅', text: 'Admin-verified providers only' },
            { icon: '💰', text: 'Transparent pricing & reviews' },
            { icon: '🤝', text: 'Post jobs, get matched fast' },
          ].map(({ icon, text }) => (
            <div key={text} className="auth-feature">
              <span className="icon">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-box slide-up" style={{ maxWidth: 480 }}>
          <h2 style={{ marginBottom: 6 }}>Create account</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 24 }}>
            Fill in the details below to get started
          </p>

          {/* Role toggle */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8 }}>I want to…</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'customer', label: '🛒 Hire Services', desc: 'Find & hire professionals' },
                { value: 'provider', label: '🔧 Offer Services', desc: 'Register as a provider' },
              ].map(opt => (
                <label
                  key={opt.value}
                  style={{
                    border: `2px solid ${role === opt.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: role === opt.value ? 'var(--primary-bg)' : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <input type="radio" value={opt.value} {...register('role')} style={{ display: 'none' }} />
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full name <span>*</span></label>
                <input
                  className="form-input"
                  placeholder="John Kamau"
                  {...register('full_name', { required: 'Full name required', minLength: { value: 2, message: 'Too short' } })}
                />
                {errors.full_name && <span className="form-error">⚠ {errors.full_name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+254712345678" {...register('phone')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email address <span>*</span></label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
              />
              {errors.email && <span className="form-error">⚠ {errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Digital ID Number <span>*</span>
                <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6, fontWeight: 400 }}>
                  KE-12345678 or ET-12345678
                </span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. KE-12345678"
                {...register('digital_id', {
                  required: 'Digital ID required',
                  pattern: {
                    value: /^(KE|ET)-\d{8}$/i,
                    message: 'Use KE-12345678 or ET-12345678 (8 digits after the hyphen)',
                  },
                })}
              />
              {errors.digital_id && <span className="form-error">⚠ {errors.digital_id.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <input
                className="form-input"
                type="password"
                placeholder="Minimum 6 characters"
                {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
              />
              {errors.password && <span className="form-error">⚠ {errors.password.message}</span>}
            </div>

            {role === 'provider' && (
              <div style={{
                background: 'var(--warning-bg)',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--warning)',
              }}>
                📋 As a provider, you'll need to complete your profile and upload verification documents. Admin will review and approve your account.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center' }}
            >
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
