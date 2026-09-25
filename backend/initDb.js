const db = require('./db');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    const driver = db.getDriver();
    console.log(`[InitDB] Initializing schema for driver: ${driver}...`);

    if (driver === 'postgres') {
      await db.query(`
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('ADMIN', 'NORMAL', 'STORE_OWNER');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(60) NOT NULL CHECK (char_length(name) >= 20),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          role user_role NOT NULL DEFAULT 'NORMAL',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS stores (
          id SERIAL PRIMARY KEY,
          name VARCHAR(60) NOT NULL CHECK (char_length(name) >= 20),
          email VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ratings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (user_id, store_id)
        );
      `);
    } else {
      // SQLite or MySQL
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY ${driver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
          name VARCHAR(60) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS stores (
          id INTEGER PRIMARY KEY ${driver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
          name VARCHAR(60) NOT NULL,
          email VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY ${driver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, store_id)
        );
      `);
    }

    console.log('[InitDB] Schema created successfully.');

    // Seed data if empty
    const checkUsers = await db.query('SELECT COUNT(*) AS count FROM users');
    const userCount = Number(checkUsers.rows[0].count || checkUsers.rows[0].COUNT || 0);

    if (userCount === 0) {
      console.log('[InitDB] Database is empty. Seeding initial demo data...');
      const defaultPasswordHash = await bcrypt.hash('Password1!', 10);

      // 1. Create Admin
      await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'System Administrator Account',
          'admin@storeratings.com',
          defaultPasswordHash,
          '100 Admin HQ Boulevard, Tech Park Suite 500, Metro City',
          'ADMIN',
        ]
      );

      // 2. Create Store Owners
      const owner1Res = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Alice Elizabeth OwnerAccount',
          'owner1@storeratings.com',
          defaultPasswordHash,
          '45 Market Street Avenue, Downtown Plaza, Bay Area',
          'STORE_OWNER',
        ]
      );
      const owner1Id = owner1Res.rows[0].id || owner1Res.lastID || 2;

      const owner2Res = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Robert Benedict OwnerAccount',
          'owner2@storeratings.com',
          defaultPasswordHash,
          '88 Technology Drive, Innovation Park, West Coast',
          'STORE_OWNER',
        ]
      );
      const owner2Id = owner2Res.rows[0].id || owner2Res.lastID || 3;

      // 3. Create Normal Users
      const user1Res = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Johnathan Alexander Customer',
          'user1@storeratings.com',
          defaultPasswordHash,
          '12 Pine Tree Lane, Greenfield Residential Suburb',
          'NORMAL',
        ]
      );
      const user1Id = user1Res.rows[0].id || user1Res.lastID || 4;

      const user2Res = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          'Samantha Eleanor RatingUser',
          'user2@storeratings.com',
          defaultPasswordHash,
          '505 Sunset Boulevard Apartment 4B, Coastal District',
          'NORMAL',
        ]
      );
      const user2Id = user2Res.rows[0].id || user2Res.lastID || 5;

      // 4. Create Stores
      const store1Res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          'Gourmet Bistro & Artisanal Bakery',
          'contact@gourmetbistro.com',
          '123 Culinary Way, Downtown Food Court, Suite A',
          owner1Id,
        ]
      );
      const store1Id = store1Res.rows[0].id || store1Res.lastID || 1;

      const store2Res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          'Tech World Digital Electronics',
          'support@techworlddigital.com',
          '770 Cybernetic Mall Highway, Tech Hub District',
          owner2Id,
        ]
      );
      const store2Id = store2Res.rows[0].id || store2Res.lastID || 2;

      const store3Res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          'Urban Fashion & Apparel Outlet',
          'info@urbanfashionoutlet.com',
          '99 Boulevard Fashion District, Shopping Promenade',
          null,
        ]
      );
      const store3Id = store3Res.rows[0].id || store3Res.lastID || 3;

      // 5. Create Initial Ratings
      await db.query(
        `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
        [user1Id, store1Id, 5]
      );
      await db.query(
        `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
        [user2Id, store1Id, 4]
      );
      await db.query(
        `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
        [user1Id, store2Id, 5]
      );
      await db.query(
        `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
        [user2Id, store3Id, 3]
      );

      console.log('[InitDB] Demo data seeded successfully!');
      console.log('--- Initial Credentials ---');
      console.log('Admin: admin@storeratings.com / Password1!');
      console.log('Store Owner 1: owner1@storeratings.com / Password1!');
      console.log('Normal User 1: user1@storeratings.com / Password1!');
      console.log('---------------------------');
    }
  } catch (err) {
    console.error('[InitDB] Failed to initialize DB:', err);
  }
}

module.exports = initDb;

if (require.main === module) {
  initDb().then(() => process.exit(0));
}
