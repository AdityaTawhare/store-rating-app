import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, MapPin, Lock, CheckCircle2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import api, { setSession } from '../api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  // Password checks
  const passLengthValid = form.password.length >= 8 && form.password.length <= 16;
  const passUpperValid = /[A-Z]/.test(form.password);
  const passSpecialValid = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/;'`~+=]/.test(form.password);
  const isPasswordValid = passLengthValid && passUpperValid && passSpecialValid;

  // Name check
  const nameLength = form.name.trim().length;
  const isNameValid = nameLength >= 20 && nameLength <= 60;

  // Address check
  const addressLength = form.address.trim().length;
  const isAddressValid = addressLength >= 1 && addressLength <= 400;

  // Email check
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const canSubmit = isNameValid && isEmailValid && isAddressValid && isPasswordValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError('Please resolve form validation errors before submitting.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      setSession(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto 80px' }}>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          fontSize: '0.88rem',
          padding: '8px 14px',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Back to Login
      </button>

      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Register as a Normal User to explore and rate stores
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="e.g. Johnathan Alexander Customer"
                value={form.name}
                onChange={update('name')}
                required
                maxLength={60}
              />
            </div>
            <div className="validation-hint">
              <span className={nameLength === 0 ? 'hint-muted' : isNameValid ? 'hint-valid' : 'hint-invalid'}>
                {nameLength < 20 ? `Min 20 chars (need ${20 - nameLength} more)` : nameLength > 60 ? 'Max 60 chars exceeded' : '✓ Length valid'}
              </span>
              <span style={{ color: nameLength > 60 ? '#f87171' : 'var(--text-muted)' }}>
                {nameLength}/60
              </span>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. user@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
            {form.email.length > 0 && (
              <div className="validation-hint">
                <span className={isEmailValid ? 'hint-valid' : 'hint-invalid'}>
                  {isEmailValid ? '✓ Valid email format' : 'Enter a valid email address'}
                </span>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Residential Address
            </label>
            <textarea
              placeholder="e.g. 12 Pine Tree Lane, Greenfield Suburb, City"
              value={form.address}
              onChange={update('address')}
              required
              maxLength={400}
              rows={3}
            />
            <div className="validation-hint">
              <span className={addressLength === 0 ? 'hint-muted' : isAddressValid ? 'hint-valid' : 'hint-invalid'}>
                {addressLength === 0 ? 'Required' : addressLength <= 400 ? '✓ Address valid' : 'Max 400 chars exceeded'}
              </span>
              <span style={{ color: addressLength > 400 ? '#f87171' : 'var(--text-muted)' }}>
                {addressLength}/400
              </span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="8-16 chars, 1 uppercase, 1 special char"
              value={form.password}
              onChange={update('password')}
              required
            />

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem' }}>
              <span style={{ color: passLengthValid ? '#34d399' : '#94a3b8' }}>
                {passLengthValid ? '✓' : '○'} 8 to 16 characters long
              </span>
              <span style={{ color: passUpperValid ? '#34d399' : '#94a3b8' }}>
                {passUpperValid ? '✓' : '○'} At least 1 uppercase letter (A-Z)
              </span>
              <span style={{ color: passSpecialValid ? '#34d399' : '#94a3b8' }}>
                {passSpecialValid ? '✓' : '○'} At least 1 special character (!@#$%^&*)
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !canSubmit}
            style={{ marginTop: 8, opacity: canSubmit ? 1 : 0.6 }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
