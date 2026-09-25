const path = require('path');
const fs = require('fs');
require('dotenv').config();

let queryFn;
let driver = 'sqlite';

const dbUrl = process.env.DATABASE_URL || '';
const envDriver = (process.env.DB_DRIVER || '').toLowerCase();

if (envDriver === 'postgres' || dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: dbUrl });
    driver = 'postgres';
    queryFn = async (sql, params = []) => {
      const res = await pool.query(sql, params);
      return res;
    };
    console.log('[DB] Connected via PostgreSQL Pool');
  } catch (err) {
    console.warn('[DB] PostgreSQL init failed, falling back to SQLite:', err.message);
    driver = 'sqlite';
  }
} else if (envDriver === 'mysql' || dbUrl.startsWith('mysql://')) {
  try {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool(dbUrl);
    driver = 'mysql';
    queryFn = async (sql, params = []) => {
      // Replace $1, $2, etc with ?
      const formattedSql = sql.replace(/\$\d+/g, '?').replace(/ILIKE/gi, 'LIKE');
      const [rows] = await pool.execute(formattedSql, params);
      return { rows: Array.isArray(rows) ? rows : [rows] };
    };
    console.log('[DB] Connected via MySQL Pool');
  } catch (err) {
    console.warn('[DB] MySQL init failed, falling back to SQLite:', err.message);
    driver = 'sqlite';
  }
}

if (driver === 'sqlite' || !queryFn) {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'store_ratings.db');
  const db = new sqlite3.Database(dbPath);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  queryFn = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Replace ILIKE with LIKE, replace $1, $2 with ?
      let formattedSql = sql
        .replace(/ILIKE/gi, 'LIKE')
        .replace(/ROUND\(([^,]+)::numeric,\s*2\)/gi, 'ROUND($1, 2)')
        .replace(/COUNT\(\*\)::int/gi, 'COUNT(*)')
        .replace(/ANY\(\$1::int\[\]\)/gi, 'IN (SELECT value FROM json_each($1))')
        .replace(/\$\d+/g, '?');

      const isSelect = formattedSql.trim().toUpperCase().startsWith('SELECT') ||
                       formattedSql.trim().toUpperCase().startsWith('PRAGMA');

      if (isSelect) {
        db.all(formattedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [] });
        });
      } else {
        db.run(formattedSql, params, function (err) {
          if (err) return reject(err);
          // Return lastID or changes if available
          resolve({ rows: [{ id: this.lastID }], lastID: this.lastID, changes: this.changes });
        });
      }
    });
  };
  console.log('[DB] Connected via SQLite at:', dbPath);
}

module.exports = {
  query: queryFn,
  getDriver: () => driver,
};

