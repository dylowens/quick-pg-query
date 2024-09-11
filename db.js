const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'philosophersdb',
  password: 'n0ne',
  port: 5431,
});

module.exports = pool;
