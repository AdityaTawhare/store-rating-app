import { useEffect, useState } from 'react';
import { Store, Star, Users, AlertCircle, Building2, Calendar, Mail, User } from 'lucide-react';
import api from '../api';
import StarRating from '../components/StarRating';

export default function StoreOwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/stores/owner/dashboard')
      .then(({ data }) => {
        setStores(data.stores);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load store owner dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ marginTop: 40, color: 'var(--text-muted)' }}>Loading store dashboard...</div>;
  if (error) return <div className="alert alert-error" style={{ marginTop: 40 }}><AlertCircle size={18} /> {error}</div>;

  return (
    <div style={{ marginTop: 24, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
          Store Owner Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 4 }}>
          Monitor your store performance, average customer ratings, and user reviews.
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
          <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>No Stores Assigned</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            There are currently no stores assigned to your Store Owner account. Contact your System Administrator.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {stores.map((store) => (
            <div key={store.id} className="glass-card" style={{ padding: 28 }}>
              {/* Store Header Banner */}
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  paddingBottom: 20,
                  marginBottom: 20,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Store size={20} color="#60a5fa" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{store.name}</h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: 48 }}>{store.address}</p>
                </div>

                {/* Rating Card */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-glow)',
                    borderRadius: 14,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <Star size={32} fill="#f59e0b" color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.1 }}>
                      {store.averageRating ? `${store.averageRating}` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Average Store Rating
                    </div>
                  </div>
                </div>
              </div>

              {/* Raters Table */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="var(--primary)" />
                  Customer Ratings & Submissions ({store.raters.length})
                </h3>

                {store.raters.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>
                    No customer ratings have been submitted for this store yet.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Email Address</th>
                          <th>User Address</th>
                          <th>Rating Submitted</th>
                          <th>Submission Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {store.raters.map((r, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'white' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <User size={14} color="var(--primary)" />
                                {r.user_name}
                              </div>
                            </td>
                            <td>{r.user_email}</td>
                            <td style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.user_address || '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StarRating value={Number(r.rating)} readonly size={16} />
                                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{r.rating} / 5</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} />
                                {new Date(r.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
