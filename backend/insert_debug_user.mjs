import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_db_password_here@localhost:5432/fit_matrix_db'
});

const sql = `INSERT INTO users (
  id, email, password_hash, legal_name, full_name, age, gender, height, weight, bmi,
  fitness_goal, food_preference, region_preference, activity_level, current_streak,
  total_xp, is_rest_day, add_egg_today, today_veg_only, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`;

try {
  const result = await pool.query(sql, [
    'debug-id-3',
    'debug3@example.com',
    '$2a$10$dummy',
    'Debug',
    'Debug',
    18,
    'Other',
    170,
    65,
    22.5,
    'Maintenance',
    'Vegetarian',
    'South',
    'Sedentary',
    0,
    0,
    false,
    false,
    false,
    new Date()
  ]);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
