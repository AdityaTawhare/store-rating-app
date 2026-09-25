import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Store, Key, LogOut, Shield, User, Building2, ArrowLeft } from 'lucide-react';
import { getUser, clearSession } from '../api';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  function logout() {
    clearSession();
    navigate('/login');
  }

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'STORE_OWNER') return '/owner';
    return '/dashboard';
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return <span className="badge badge-admin"><Shield size={12} /> Admin</span>;
    if (role === 'STORE_OWNER') return <span className="badge badge-owner"><Building2 size={12} /> Store Owner</span>;
    return <span className="badge badge-normal"><User size={12} /> Normal User</span>;
  };

  return (
    <header
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="app-container"
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          paddingTop: 14,
          paddingBottom: 14,
        }}
      >
        <Link
          to={getDashboardPath()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Store size={20} color="white" />
          </div>
          Store Ratings
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name}
              </span>
              {getRoleBadge(user.role)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {location.pathname === '/account/password' ? (
                <Link
                  to={getDashboardPath()}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.88rem',
                    padding: '8px 14px',
                  }}
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </Link>
              ) : (
                <Link
                  to="/account/password"
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.88rem',
                    padding: '8px 14px',
                  }}
                >
                  <Key size={14} /> Password
                </Link>
              )}
              <button
                onClick={logout}
                className="btn-danger"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.88rem',
                  padding: '8px 14px',
                }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
