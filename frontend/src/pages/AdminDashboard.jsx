import { useEffect, useState } from 'react';
import {
  Users,
  Store,
  Star,
  UserPlus,
  Building2,
  Search,
  ArrowUpDown,
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import api from '../api';
import StarRating from '../components/StarRating';

const TABS = [
  { id: 'Overview', label: 'Overview', icon: Users },
  { id: 'Users', label: 'All Users', icon: Users },
  { id: 'Stores', label: 'All Stores', icon: Store },
  { id: 'Add User', label: 'Add User / Admin', icon: UserPlus },
  { id: 'Add Store', label: 'Add Store', icon: Building2 },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');

  return (
    <div style={{ marginTop: 24, paddingBottom: 60 }}>
      {/* Header Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
          System Administrator Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 4 }}>
          Manage stores, users, store owners, and monitor overall platform ratings.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: 6,
          borderRadius: 14,
          border: '1px solid var(--border-color)',
        }}
      >
        {TABS.map((t) => {
          const IconComponent = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                background: isActive ? 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.9rem',
                boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
              }}
            >
              <IconComponent size={16} color={isActive ? 'white' : '#94a3b8'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {tab === 'Overview' && <OverviewTab onNavigate={setTab} />}
      {tab === 'Users' && <UsersListTab />}
      {tab === 'Stores' && <StoresListTab />}
      {tab === 'Add User' && <AddUserTab onBack={() => setTab('Users')} />}
      {tab === 'Add Store' && <AddStoreTab onBack={() => setTab('Stores')} />}
    </div>
  );
}

function OverviewTab({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading metrics...</div>;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={Users}
          iconBg="rgba(99, 102, 241, 0.2)"
          iconColor="#818cf8"
          label="Total Registered Users"
          value={stats.totalUsers}
          onClick={() => onNavigate('Users')}
        />
        <StatCard
          icon={Store}
          iconBg="rgba(16, 185, 129, 0.2)"
          iconColor="#34d399"
          label="Total Registered Stores"
          value={stats.totalStores}
          onClick={() => onNavigate('Stores')}
        />
        <StatCard
          icon={Star}
          iconBg="rgba(245, 158, 11, 0.2)"
          iconColor="#fbbf24"
          label="Total Submitted Ratings"
          value={stats.totalRatings}
        />
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onNavigate('Add User')}>
            + Add New User / Admin
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('Add Store')}>
            + Register New Store
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, onClick }) {
  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        transition: 'var(--transition)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={26} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function UsersListTab() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { ...filters, sortBy, sortDir } });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [sortBy, sortDir]); // eslint-disable-line

  function toggleSort(field) {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  return (
    <div>
      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{ padding: 18, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}
      >
        <div style={{ flex: '1 1 180px' }}>
          <input
            placeholder="Filter by Name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <input
            placeholder="Filter by Email..."
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <input
            placeholder="Filter by Address..."
            value={filters.address}
            onChange={(e) => setFilters({ ...filters, address: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="ADMIN">System Admin</option>
            <option value="NORMAL">Normal User</option>
            <option value="STORE_OWNER">Store Owner</option>
          </select>
        </div>
        <button className="btn-primary" onClick={loadUsers} style={{ padding: '10px 18px' }}>
          Apply Filters
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('email')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Email {sortBy === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('address')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Address {sortBy === 'address' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('role')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Role {sortBy === 'role' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th>Owner Rating</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {loading ? 'Loading users...' : 'No users found matching filters.'}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.address}
                  </td>
                  <td>
                    {u.role === 'ADMIN' && <span className="badge badge-admin">Admin</span>}
                    {u.role === 'STORE_OWNER' && <span className="badge badge-owner">Store Owner</span>}
                    {u.role === 'NORMAL' && <span className="badge badge-normal">Normal User</span>}
                  </td>
                  <td>
                    {u.role === 'STORE_OWNER' ? (
                      u.rating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <StarRating value={Number(u.rating)} readonly size={14} />
                          <span style={{ fontWeight: 700, color: '#fbbf24' }}>{u.rating}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No ratings yet</span>
                      )
                    ) : (
                      <span style={{ color: '#475569' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setSelectedUser(u)}
                      style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={14} /> Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>User Account Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Full Name</label>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginTop: 2 }}>{selectedUser.name}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Email Address</label>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)', marginTop: 2 }}>{selectedUser.email}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Address</label>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)', marginTop: 2 }}>{selectedUser.address}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>System Role</label>
                <div style={{ marginTop: 4 }}>
                  {selectedUser.role === 'ADMIN' && <span className="badge badge-admin">Admin</span>}
                  {selectedUser.role === 'STORE_OWNER' && <span className="badge badge-owner">Store Owner</span>}
                  {selectedUser.role === 'NORMAL' && <span className="badge badge-normal">Normal User</span>}
                </div>
              </div>

              {selectedUser.role === 'STORE_OWNER' && (
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Overall Store Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <StarRating value={Number(selectedUser.rating || 0)} readonly size={18} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                      {selectedUser.rating ? `${selectedUser.rating} / 5.0` : 'No ratings yet'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-secondary" onClick={() => setSelectedUser(null)} style={{ marginTop: 24, width: '100%' }}>
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoresListTab() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);

  async function loadStores() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stores', { params: { ...filters, sortBy, sortDir } });
      setStores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
  }, [sortBy, sortDir]); // eslint-disable-line

  function toggleSort(field) {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: 18, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            placeholder="Filter by Store Name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <input
            placeholder="Filter by Store Email..."
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <input
            placeholder="Filter by Address..."
            value={filters.address}
            onChange={(e) => setFilters({ ...filters, address: e.target.value })}
          />
        </div>
        <button className="btn-primary" onClick={loadStores} style={{ padding: '10px 18px' }}>
          Apply Filters
        </button>
      </div>

      {/* Stores Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Store Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('email')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Email {sortBy === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('address')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Address {sortBy === 'address' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="sortable" onClick={() => toggleSort('rating')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Overall Rating {sortBy === 'rating' && (sortDir === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th>Store Owner</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {loading ? 'Loading stores...' : 'No stores registered.'}
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, color: 'white' }}>{s.name}</td>
                  <td>{s.email}</td>
                  <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.address}
                  </td>
                  <td>
                    {s.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating value={Number(s.rating)} readonly size={16} />
                        <span style={{ fontWeight: 800, color: '#fbbf24' }}>{s.rating}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No ratings yet</span>
                    )}
                  </td>
                  <td>
                    {s.owner_name ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{s.owner_name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.owner_email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddUserTab({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '', role: 'NORMAL' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  // Validations
  const nameLength = form.name.trim().length;
  const isNameValid = nameLength >= 20 && nameLength <= 60;
  const addressLength = form.address.trim().length;
  const isAddressValid = addressLength >= 1 && addressLength <= 400;
  const passLengthValid = form.password.length >= 8 && form.password.length <= 16;
  const passUpperValid = /[A-Z]/.test(form.password);
  const passSpecialValid = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/;'`~+=]/.test(form.password);
  const isPasswordValid = passLengthValid && passUpperValid && passSpecialValid;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const canSubmit = isNameValid && isEmailValid && isAddressValid && isPasswordValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError('Please fix form validation errors before submitting.');
      return;
    }
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await api.post('/admin/users', form);
      setMessage(`Successfully registered new user: "${form.name}" as ${form.role}`);
      setForm({ name: '', email: '', address: '', password: '', role: 'NORMAL' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
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
          <ArrowLeft size={16} /> Back to Users List
        </button>
      )}

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Add New User or Admin</h3>

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
              Full Name (20 - 60 Characters)
            </label>
            <input
              placeholder="e.g. System Administrator Account"
              value={form.name}
              onChange={update('name')}
              required
              maxLength={60}
            />
            <div className="validation-hint">
              <span className={nameLength === 0 ? 'hint-muted' : isNameValid ? 'hint-valid' : 'hint-invalid'}>
                {nameLength < 20 ? `Min 20 chars (${20 - nameLength} needed)` : nameLength > 60 ? 'Max 60 exceeded' : '✓ Valid'}
              </span>
              <span style={{ color: nameLength > 60 ? '#f87171' : 'var(--text-muted)' }}>{nameLength}/60</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Email Address</label>
            <input type="email" placeholder="e.g. newuser@storeratings.com" value={form.email} onChange={update('email')} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Address (Max 400 Chars)</label>
            <textarea placeholder="e.g. 100 Main St, Tech District" value={form.address} onChange={update('address')} required maxLength={400} rows={2} />
            <div className="validation-hint">
              <span className={isAddressValid ? 'hint-valid' : 'hint-invalid'}>{isAddressValid ? '✓ Valid' : 'Required'}</span>
              <span>{addressLength}/400</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="8-16 chars, 1 uppercase, 1 special char" value={form.password} onChange={update('password')} required />
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.8rem' }}>
              <span style={{ color: passLengthValid ? '#34d399' : '#94a3b8' }}>{passLengthValid ? '✓' : '○'} 8-16 chars</span>
              <span style={{ color: passUpperValid ? '#34d399' : '#94a3b8' }}>{passUpperValid ? '✓' : '○'} 1 Uppercase letter</span>
              <span style={{ color: passSpecialValid ? '#34d399' : '#94a3b8' }}>{passSpecialValid ? '✓' : '○'} 1 Special char</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Role Assignment</label>
            <select value={form.role} onChange={update('role')}>
              <option value="NORMAL">Normal User</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !canSubmit} style={{ marginTop: 8, opacity: canSubmit ? 1 : 0.6 }}>
            {loading ? 'Creating User...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddStoreTab({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', address: '' });
  const [owner, setOwner] = useState({ name: '', email: '', address: '', password: '' });
  const [createOwner, setCreateOwner] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Store validations
  const storeNameLen = form.name.trim().length;
  const isStoreNameValid = storeNameLen >= 20 && storeNameLen <= 60;
  const storeAddressLen = form.address.trim().length;
  const isStoreAddressValid = storeAddressLen >= 1 && storeAddressLen <= 400;
  const isStoreEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  // Owner validations
  const ownerNameLen = owner.name.trim().length;
  const isOwnerNameValid = ownerNameLen >= 20 && ownerNameLen <= 60;
  const ownerAddressLen = owner.address.trim().length;
  const isOwnerAddressValid = ownerAddressLen >= 1 && ownerAddressLen <= 400;
  const ownerPassLength = owner.password.length >= 8 && owner.password.length <= 16;
  const ownerPassUpper = /[A-Z]/.test(owner.password);
  const ownerPassSpecial = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/;'`~+=]/.test(owner.password);
  const isOwnerPassValid = ownerPassLength && ownerPassUpper && ownerPassSpecial;
  const isOwnerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email.trim());

  const canSubmitStore = isStoreNameValid && isStoreEmailValid && isStoreAddressValid;
  const canSubmitOwner = !createOwner || (isOwnerNameValid && isOwnerEmailValid && isOwnerAddressValid && isOwnerPassValid);
  const canSubmit = canSubmitStore && canSubmitOwner;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError('Please resolve store & owner form validation requirements.');
      return;
    }
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const payload = { ...form };
      if (createOwner) payload.owner = owner;
      await api.post('/admin/stores', payload);
      setMessage(`Successfully registered store "${form.name}"!`);
      setForm({ name: '', email: '', address: '' });
      setOwner({ name: '', email: '', address: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 540 }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
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
          <ArrowLeft size={16} /> Back to Stores List
        </button>
      )}

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Register New Store</h3>

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
              Store Name (20 - 60 Characters)
            </label>
            <input
              placeholder="e.g. Gourmet Bistro & Artisanal Bakery"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={60}
            />
            <div className="validation-hint">
              <span className={storeNameLen === 0 ? 'hint-muted' : isStoreNameValid ? 'hint-valid' : 'hint-invalid'}>
                {storeNameLen < 20 ? `Min 20 chars (${20 - storeNameLen} needed)` : storeNameLen > 60 ? 'Max 60 exceeded' : '✓ Valid'}
              </span>
              <span>{storeNameLen}/60</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Store Email Address</label>
            <input
              type="email"
              placeholder="e.g. contact@gourmetbistro.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Store Physical Address (Max 400 Chars)</label>
            <textarea
              placeholder="e.g. 123 Culinary Way, Downtown Commercial Plaza"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              maxLength={400}
              rows={2}
            />
            <div className="validation-hint">
              <span className={isStoreAddressValid ? 'hint-valid' : 'hint-invalid'}>{isStoreAddressValid ? '✓ Valid' : 'Required'}</span>
              <span>{storeAddressLen}/400</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={createOwner}
                onChange={(e) => setCreateOwner(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
              Create & Assign a Store Owner Account
            </label>
          </div>

          {createOwner && (
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 18, borderRadius: 10, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa' }}>Store Owner Account Info</h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Owner Name (20 - 60 Chars)</label>
                <input
                  placeholder="e.g. Alice Elizabeth OwnerAccount"
                  value={owner.name}
                  onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                  required={createOwner}
                  maxLength={60}
                />
                <div className="validation-hint">
                  <span className={isOwnerNameValid ? 'hint-valid' : 'hint-invalid'}>
                    {ownerNameLen < 20 ? `Min 20 chars (${20 - ownerNameLen} needed)` : '✓ Valid'}
                  </span>
                  <span>{ownerNameLen}/60</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Owner Email</label>
                <input
                  type="email"
                  placeholder="e.g. owner@gourmetbistro.com"
                  value={owner.email}
                  onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                  required={createOwner}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Owner Address (Max 400 Chars)</label>
                <textarea
                  placeholder="e.g. 45 Owner Residence Way"
                  value={owner.address}
                  onChange={(e) => setOwner({ ...owner, address: e.target.value })}
                  required={createOwner}
                  maxLength={400}
                  rows={2}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Owner Initial Password</label>
                <input
                  type="password"
                  placeholder="8-16 chars, 1 uppercase, 1 special char"
                  value={owner.password}
                  onChange={(e) => setOwner({ ...owner, password: e.target.value })}
                  required={createOwner}
                />
                <div style={{ marginTop: 4, fontSize: '0.78rem', color: isOwnerPassValid ? '#34d399' : '#94a3b8' }}>
                  {isOwnerPassValid ? '✓ Meets password requirements' : 'Must be 8-16 chars with 1 uppercase & 1 special char'}
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !canSubmit} style={{ marginTop: 8, opacity: canSubmit ? 1 : 0.6 }}>
            {loading ? 'Creating Store...' : 'Register Store'}
          </button>
        </form>
      </div>
    </div>
  );
}
