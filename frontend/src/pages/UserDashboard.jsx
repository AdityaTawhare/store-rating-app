import { useEffect, useState } from 'react';
import { Search, Store, Star, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../api';
import StarRating from '../components/StarRating';

export default function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadStores() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/stores', {
        params: { name: nameFilter, address: addressFilter, sortBy, sortDir },
      });
      setStores(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
  }, [sortBy, sortDir]); // eslint-disable-line

  async function handleRatingSubmit(storeId, storeName, newRating) {
    setSuccessMsg('');
    setError('');
    try {
      await api.post(`/stores/${storeId}/ratings`, { rating: newRating });
      setSuccessMsg(`Your rating of ${newRating} ★ for "${storeName}" has been saved!`);
      loadStores();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  }

  function toggleSort(field) {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  function handleResetFilters() {
    setNameFilter('');
    setAddressFilter('');
    setSortBy('name');
    setSortDir('asc');
    api.get('/stores', { params: { name: '', address: '', sortBy: 'name', sortDir: 'asc' } }).then(({ data }) => setStores(data));
  }

  return (
    <div style={{ marginTop: 24, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
          Explore Stores & Rate
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 4 }}>
          Browse registered stores, view overall ratings, and submit or update your ratings.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ padding: 18, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            placeholder="Search stores by Name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <input
            placeholder="Search stores by Address..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={loadStores} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={16} /> Search
          </button>
          {(nameFilter || addressFilter) && (
            <button className="btn-secondary" onClick={handleResetFilters} style={{ padding: '10px 14px' }}>
              Reset
            </button>
          )}
        </div>
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
              <th>Your Submitted Rating</th>
              <th style={{ textAlign: 'center' }}>Submit / Modify Rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {loading ? 'Searching stores...' : 'No stores match your search query.'}
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <StoreRow key={s.id} store={s} onSubmitRating={handleRatingSubmit} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StoreRow({ store, onSubmitRating }) {
  const [selectedRating, setSelectedRating] = useState(store.my_rating || 5);

  useEffect(() => {
    setSelectedRating(store.my_rating || 5);
  }, [store.my_rating]);

  return (
    <tr>
      <td style={{ fontWeight: 700, color: 'white', minWidth: 200 }}>{store.name}</td>
      <td style={{ maxWidth: 300 }}>{store.address}</td>
      <td>
        {store.overall_rating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarRating value={Number(store.overall_rating)} readonly size={16} />
            <span style={{ fontWeight: 800, color: '#fbbf24' }}>{store.overall_rating} / 5.0</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No ratings yet</span>
        )}
      </td>
      <td>
        {store.my_rating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarRating value={Number(store.my_rating)} readonly size={14} />
            <span className="badge badge-normal" style={{ textTransform: 'none' }}>
              {store.my_rating} Stars
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Not rated yet</span>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <StarRating
            value={selectedRating}
            onChange={(val) => setSelectedRating(val)}
            size={20}
          />
          <button
            type="button"
            className={store.my_rating ? 'btn-secondary' : 'btn-primary'}
            onClick={() => onSubmitRating(store.id, store.name, selectedRating)}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            {store.my_rating ? 'Modify' : 'Submit'}
          </button>
        </div>
      </td>
    </tr>
  );
}
