// this db.js file allows for anywhere in the rest of the app to communicate with the PostgreSQL database
// EXAMPLE- so other modules can do:
// import db from './db.js';  *load connection from this file*
// const { rows } = await db.query('SELECT * FROM users WHERE user_id = $1', [id]); *run a query bc of the already existing connection*
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');

// load environment variables from .env into process.env
dotenv.config();

// create a pool [a managed collection of live database connections that application keeps open and re‑uses] to Postgres
const pool = new Pool({
  host:     process.env.POSTGRES_HOST || 'db', 
  port:     process.env.POSTGRES_PORT || 5432,
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// listen for errors on any idle clients in the pool
pool.on('error', (err) => {
  console.error('Unexpected Postgres client error', err);
  process.exit(-1);
});

module.exports = pool;