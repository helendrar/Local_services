import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const role = String(res.data.user?.role || '').toLowerCase().trim();
      const dest = role === 'admin' ? '/admin' : '/dashboard';
      // Commit auth to context before navigating so <Protected> does not see user=null and bounce to /login.
      flushSync(() => {
        login(res.data.token, res.data.user);
      });
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}!`);
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
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
          Connect with verified local professionals.<br />
          Trusted by thousands across Kenya.
        </p>
        <div className="auth-features">
          {[
            { icon: '🔒', text: 'Digital ID verification system' },
            { icon: '⭐', text: 'Ratings & reviews you can trust' },
            { icon: '⚡', text: 'Hire in minutes, not days' },
            { icon: '📱', text: 'Track jobs in real time' },
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
        <div className="auth-box slide-up">
          <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email address <span>*</span></label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="form-error">⚠ {errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <span className="form-error">⚠ {errors.password.message}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 500 }}>Create one</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
