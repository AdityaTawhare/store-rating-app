import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Shield, Building2, User, AlertCircle, Sparkles } from 'lucide-react';
import api, { setSession } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(eMailToUse, passToUse) {
    const finalEmail = eMailToUse || email;
    const finalPass = passToUse || password;

    if (!finalEmail || !finalPass) {
      setError('Please provide email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email: finalEmail, password: finalPass });
      setSession(data.token, data.user);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'STORE_OWNER') navigate('/owner');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleLogin();
  }

  function fillDemo(demoEmail, demoPass) {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
  }

  return (
    <div style={{ maxWidth: 440, margin: '50px auto 80px' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <LogIn size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Single Login Portal for Admins, Store Owners & Users
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. admin@storeratings.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            <Sparkles size={14} color="#f59e0b" />
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              One-Click Demo Portals
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fillDemo('admin@storeratings.com', 'Password1!')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} color="#c084fc" />
                <span>Log in as <strong>Admin</strong></span>
              </div>
              <span className="badge badge-admin">System Admin</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => fillDemo('owner1@storeratings.com', 'Password1!')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="#60a5fa" />
                <span>Log in as <strong>Store Owner</strong></span>
              </div>
              <span className="badge badge-owner">Store Owner</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => fillDemo('user1@storeratings.com', 'Password1!')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="#34d399" />
                <span>Log in as <strong>Normal User</strong></span>
              </div>
              <span className="badge badge-normal">Normal User</span>
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account yet? <Link to="/signup" style={{ fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
