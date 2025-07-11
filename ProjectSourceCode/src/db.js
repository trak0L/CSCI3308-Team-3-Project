// this db.js file allows for anywhere in the rest of the app to communicate with the PostgreSQL database
// EXAMPLE- so other modules can do:
// import db from './db.js';  *load connection from this file*
// const { rows } = await db.query('SELECT * FROM users WHERE user_id = $1', [id]); *run a query bc of the already existing connection*

import { Pool } from 'pg'; // import Pool class from pg (node‑postgres) lib- Pool is the connection‑pool manager used to talk to PostgreSQL database; a new Pool(...), allows for the call pool.query(...) throughout code to run SQL
import dotenv from 'dotenv'; // import dotenv library, which reads a file named .env in project root and loads any KEY=VALUE pairs into process.env- makes environment variables (like DATABASE_URL, SESSION_SECRET, etc.) available via process.env.DATABASE_URL in Node.js code

// load environment variables from .env into process.env
dotenv.config();

// create a pool [a managed collection of live database connections that application keeps open and re‑uses] to Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional pool settings - adjustable as needed:
  // max: 20,                     // maximum number of clients in the pool
  // idleTimeoutMillis: 30000,    // close idle clients after 30 seconds
  // connectionTimeoutMillis: 2000 // return an error after 2 seconds if connection could not be established
});

// listen for errors on any idle clients in the pool
pool.on('error', (err) => {
  console.error('Unexpected Postgres client error', err);
  process.exit(-1);
});

export default pool;