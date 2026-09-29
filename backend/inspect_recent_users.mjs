import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_db_password_here@localhost:5432/fit_matrix_db'
});

try {
  const res = await pool.query('SELECT id, email, legal_name, full_name, password_hash FROM users WHERE email LIKE $1 LIMIT 20', ['%fitmatrix%']);
  console.log(JSON.stringify(res.rows, null, 2));
} finally {
  await pool.end();
}
