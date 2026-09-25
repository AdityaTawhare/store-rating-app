const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Any logged-in user can browse stores with overall rating & their own submitted rating attached.
router.get('/', authenticate, async (req, res) => {
  const { name, address, sortBy = 'name', sortDir = 'asc' } = req.query;
  const allowedSort = ['name', 'address', 'rating'];
  const clauses = [];
  const values = [req.user.id];
  let i = 2;

  if (name) { clauses.push(`s.name ILIKE $${i++}`); values.push(`%${name}%`); }
  if (address) { clauses.push(`s.address ILIKE $${i++}`); values.push(`%${address}%`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderCol = allowedSort.includes(sortBy) ? sortBy : 'name';
  const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const orderExpression = orderCol === 'rating' ? `overall_rating ${dir}` : `s.${orderCol} ${dir}`;

  try {
    const result = await db.query(
      `SELECT s.id, s.name, s.address, s.email,
              ROUND(AVG(r.rating), 2) AS overall_rating,
              (SELECT rating FROM ratings WHERE store_id = s.id AND user_id = $1) AS my_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY ${orderExpression}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing stores' });
  }
});

// Submit or update a rating (upsert rating between 1 and 5)
router.post('/:storeId/ratings', authenticate, authorize('NORMAL'), async (req, res) => {
  const { storeId } = req.params;
  const { rating } = req.body;
  const value = Number(rating);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const store = await db.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (store.rows.length === 0) return res.status(404).json({ message: 'Store not found' });

    const existing = await db.query('SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2', [req.user.id, storeId]);
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3',
        [value, req.user.id, storeId]
      );
    } else {
      await db.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)',
        [req.user.id, storeId, value]
      );
    }

    const updatedRating = await db.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND store_id = $2',
      [req.user.id, storeId]
    );

    res.status(200).json(updatedRating.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error submitting rating' });
  }
});

// Store owner dashboard: view raters + average rating for store(s) they own
router.get('/owner/dashboard', authenticate, authorize('STORE_OWNER'), async (req, res) => {
  try {
    const stores = await db.query('SELECT id, name, address, email FROM stores WHERE owner_id = $1', [req.user.id]);
    if (stores.rows.length === 0) return res.json({ stores: [] });

    const resultStores = [];

    for (const store of stores.rows) {
      const avgRes = await db.query(
        'SELECT ROUND(AVG(rating), 2) AS average FROM ratings WHERE store_id = $1',
        [store.id]
      );
      const ratersRes = await db.query(
        `SELECT r.id, r.rating, r.created_at, r.updated_at,
                u.name AS user_name, u.email AS user_email, u.address AS user_address
         FROM ratings r
         JOIN users u ON u.id = r.user_id
         WHERE r.store_id = $1
         ORDER BY r.created_at DESC`,
        [store.id]
      );

      resultStores.push({
        ...store,
        averageRating: avgRes.rows[0]?.average || null,
        raters: ratersRes.rows,
      });
    }

    res.json({ stores: resultStores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading store owner dashboard' });
  }
});

module.exports = router;
