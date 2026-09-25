import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import api, { getUser } from '../api';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const user = getUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password complexity checks for new password
  const passLengthValid = newPassword.length >= 8 && newPassword.length <= 16;
  const passUpperValid = /[A-Z]/.test(newPassword);
  const passSpecialValid = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/;'`~+=]/.test(newPassword);
  const isNewPassValid = passLengthValid && passUpperValid && passSpecialValid;

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (user?.role === 'ADMIN') navigate('/admin');
      else if (user?.role === 'STORE_OWNER') navigate('/owner');
      else navigate('/dashboard');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!isNewPassValid) {
      setError('New password does not meet the specified security criteria.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put('/auth/password', { currentPassword, newPassword });
      setMessage(data.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '40px auto' }}>
      <button
        type="button"
        onClick={handleBack}
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
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Key size={22} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Update Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Change your account password securely
          </p>
        </div>

        {message && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="8-16 chars, 1 uppercase, 1 special char"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            disabled={loading || !isNewPassValid || !currentPassword}
            style={{ marginTop: 8, opacity: isNewPassValid && currentPassword ? 1 : 0.6 }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
