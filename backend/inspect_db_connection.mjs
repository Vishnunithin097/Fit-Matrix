import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_db_password_here@localhost:5432/fit_matrix_db'
});

try {
  const res = await pool.query('SELECT current_database(), current_user, version()');
  console.log(JSON.stringify(res.rows[0], null, 2));
} finally {
  await pool.end();
}
