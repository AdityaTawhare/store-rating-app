const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateName, validateAddress, validatePassword, validateEmail } = require('../validators');

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));

const ALLOWED_USER_SORT = ['name', 'email', 'address', 'role', 'created_at'];
const ALLOWED_STORE_SORT = ['name', 'email', 'address', 'rating'];

function getSortClause(field, dir, allowed, fallback) {
  const col = allowed.includes(field) ? field : fallback;
  const order = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `${col} ${order}`;
}

// Dashboard totals
router.get('/dashboard', async (req, res) => {
  try {
    const [{ rows: u }, { rows: s }, { rows: r }] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM users'),
      db.query('SELECT COUNT(*) AS count FROM stores'),
      db.query('SELECT COUNT(*) AS count FROM ratings'),
    ]);
    res.json({
      totalUsers: Number(u[0].count || u[0].COUNT || 0),
      totalStores: Number(s[0].count || s[0].COUNT || 0),
      totalRatings: Number(r[0].count || r[0].COUNT || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

// Add a user (NORMAL or ADMIN)
router.post('/users', async (req, res) => {
  const { name, email, password, address, role } = req.body;
  const finalRole = ['ADMIN', 'NORMAL', 'STORE_OWNER'].includes(role) ? role : 'NORMAL';

  if (!validateName(name)) return res.status(400).json({ message: 'Name must be between 20 and 60 characters' });
  if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (!validateAddress(address)) return res.status(400).json({ message: 'Address must be between 1 and 400 characters' });
  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be 8-16 characters with at least one uppercase letter and one special character' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Email address already in use' });

    const hashed = await bcrypt.hash(password, 10);
    let newUser;
    if (db.getDriver() === 'postgres') {
      const result = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role`,
        [name, email, hashed, address, finalRole]
      );
      newUser = result.rows[0];
    } else {
      await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [name, email, hashed, address, finalRole]
      );
      const inserted = await db.query('SELECT id, name, email, address, role FROM users WHERE email = $1', [email]);
      newUser = inserted.rows[0];
    }
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding user' });
  }
});

// List users (NORMAL + ADMIN + STORE_OWNER) with filters + sorting
router.get('/users', async (req, res) => {
  const { name, email, address, role, sortBy = 'name', sortDir = 'asc' } = req.query;
  const clauses = [];
  const values = [];
  let i = 1;

  if (name) { clauses.push(`u.name ILIKE $${i++}`); values.push(`%${name}%`); }
  if (email) { clauses.push(`u.email ILIKE $${i++}`); values.push(`%${email}%`); }
  if (address) { clauses.push(`u.address ILIKE $${i++}`); values.push(`%${address}%`); }
  if (role) { clauses.push(`u.role = $${i++}`); values.push(role); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderCol = ALLOWED_USER_SORT.includes(sortBy) ? sortBy : 'name';
  const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
              CASE WHEN u.role = 'STORE_OWNER' THEN
                (SELECT ROUND(AVG(r.rating), 2) FROM ratings r
                 JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id)
              END AS rating
       FROM users u
       ${where}
       ORDER BY u.${orderCol} ${dir}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing users' });
  }
});

// Single user detail (includes rating if store owner)
router.get('/users/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
              CASE WHEN u.role = 'STORE_OWNER' THEN
                (SELECT ROUND(AVG(r.rating), 2) FROM ratings r
                 JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id)
              END AS rating
       FROM users u WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// Add a store (optionally assigning/creating a store owner)
router.post('/stores', async (req, res) => {
  const { name, email, address, ownerId, owner } = req.body;
  if (!validateName(name)) return res.status(400).json({ message: 'Store name must be between 20 and 60 characters' });
  if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid store email address' });
  if (!validateAddress(address)) return res.status(400).json({ message: 'Address must be between 1 and 400 characters' });

  try {
    let finalOwnerId = ownerId || null;

    // Optionally create a new store-owner account inline
    if (!finalOwnerId && owner && owner.name) {
      if (!validateName(owner.name)) return res.status(400).json({ message: 'Store owner name must be 20-60 characters' });
      if (!validateEmail(owner.email)) return res.status(400).json({ message: 'Invalid store owner email address' });
      if (!validateAddress(owner.address)) return res.status(400).json({ message: 'Store owner address must be 1-400 characters' });
      if (!validatePassword(owner.password)) return res.status(400).json({ message: 'Store owner password must be 8-16 chars with an uppercase letter and a special character' });

      const dupe = await db.query('SELECT id FROM users WHERE email = $1', [owner.email]);
      if (dupe.rows.length > 0) return res.status(409).json({ message: 'Store owner email already in use' });

      const hashed = await bcrypt.hash(owner.password, 10);
      await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, 'STORE_OWNER')`,
        [owner.name, owner.email, hashed, owner.address]
      );
      const ownerRes = await db.query('SELECT id FROM users WHERE email = $1', [owner.email]);
      finalOwnerId = ownerRes.rows[0]?.id;
    }

    await db.query(
      `INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4)`,
      [name, email, address, finalOwnerId]
    );

    const createdStore = await db.query('SELECT * FROM stores WHERE email = $1 AND name = $2 ORDER BY id DESC LIMIT 1', [email, name]);
    res.status(201).json(createdStore.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error adding store' });
  }
});

// List stores with filters + sorting + average rating
router.get('/stores', async (req, res) => {
  const { name, email, address, sortBy = 'name', sortDir = 'asc' } = req.query;
  const clauses = [];
  const values = [];
  let i = 1;

  if (name) { clauses.push(`s.name ILIKE $${i++}`); values.push(`%${name}%`); }
  if (email) { clauses.push(`s.email ILIKE $${i++}`); values.push(`%${email}%`); }
  if (address) { clauses.push(`s.address ILIKE $${i++}`); values.push(`%${address}%`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderCol = ALLOWED_STORE_SORT.includes(sortBy) ? sortBy : 'name';
  const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const orderExpression = orderCol === 'rating' ? `rating ${dir}` : `s.${orderCol} ${dir}`;

  try {
    const result = await db.query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(AVG(r.rating), 2) AS rating,
              u.name AS owner_name, u.email AS owner_email
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       LEFT JOIN users u ON u.id = s.owner_id
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

module.exports = router;
