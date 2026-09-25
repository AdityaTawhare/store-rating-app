require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDb = require('./initDb');

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'super_secret_jwt_store_ratings_key_2026';
}

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/stores');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initDb();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();

