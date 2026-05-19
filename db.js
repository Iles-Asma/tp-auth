const Database = require('better-sqlite3');
const db = new Database('auth_demo.db');

// Création de la table  avec `username` unique
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`
).run();

module.exports = db;
