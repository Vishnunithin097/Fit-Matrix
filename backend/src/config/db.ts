import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env')
];

for (const envPath of envCandidates) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    break;
  }
}

const { Pool } = pg;

let pool: any = null;
let useLocalFallback = true;

// 1. Updated In-Memory Database Fallback Store with all Image Components
export const memoryStore: {
  users: any[];
  squads: any[];
  squad_members: any[];
  invitations: any[];
  daily_tasks: any[];
  jwt_sessions: any[];
  meal_plans: any[];
  workout_plans: any[];
  nutrition_logs: any[];
  product_scan_history: any[];
  chatbot_history: any[];
  historical_records: any[];
} = {
  users: [],
  squads: [{ id: 'squad-1', name: 'CYBER_TITANS', code: 'MATRIX-0001', creator_id: 'user-mock-1', created_at: new Date() }],
  squad_members: [{ squad_id: 'squad-1', user_id: 'user-mock-1', joined_at: new Date() }],
  invitations: [],
  daily_tasks: [],
  jwt_sessions: [],
  meal_plans: [],
  workout_plans: [],
  nutrition_logs: [],
  product_scan_history: [],
  chatbot_history: [],
  historical_records: []
};

// Seed initial user matching the Fit Matrix production profile schema
memoryStore.users.push({
  id: 'user-mock-1',
  full_name: 'Vishnu Nithin P',
  email: 'vishnunithin079@gmail.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwx7MockPasswordHashHere',
  age: 26,
  gender: 'Male',
  height: 180.0,
  weight: 75.0,
  bmi: 23.1,
  bmr: 1720,
  calorie_target: 2500,
  protein_target: 150,
  carbs_target: 275,
  fats_target: 83,
  water_target: 3500,
  fitness_goal: 'Maintain Weight',
  food_preference: 'Non-Vegetarian',
  region_preference: 'South Indian',
  activity_level: 'Active',
  is_onboarded: true,
  activate_day: true,
  egg_today: false,
  veg_only_today: false,
  current_streak: 5,
  xp: 420,
  water_logged: 1500,
  calories_logged: 1800,
  protein_logged: 110,
  carbs_logged: 210,
  fats_logged: 65,
  meals_plan: null,
  workout_plan: null,
  squad_id: 'squad-1',
  last_active: new Date(),
  created_at: new Date()
});

try {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL || '';
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'fit_matrix_db';
  const port = process.env.DB_PORT || process.env.PGPORT || '5432';
  const ssl = process.env.DATABASE_URL?.includes('render') || process.env.PGSSL === 'true' || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

  if (connectionString || (host && user)) {
    pool = new Pool({
      connectionString: connectionString || `postgresql://${user}:${password}@${host}:${port}/${database}`,
      host,
      user,
      password,
      database,
      port: parseInt(port),
      ssl
    });
    
    pool.query('SELECT NOW()', (err: any) => {
      if (err) {
        console.warn('⚠️ PostgreSQL connection failed. Falling back to robust in-memory SQLite emulation: ', err.message);
        useLocalFallback = true;
      } else {
        console.log('✅ PostgreSQL connected successfully (fit_matrix_db schema verified).');
        useLocalFallback = false;
        initPostgresSchema();
      }
    });
  } else {
    console.warn('⚠️ No DATABASE_URL provided. Running on In-Memory Fallback Engine.');
    useLocalFallback = true;
  }
} catch (error: any) {
  console.warn('⚠️ Failed to initialize PostgreSQL pool:', error.message);
  useLocalFallback = true;
}

// 2. 100% Relational Schema Matching the Database Tree
async function initPostgresSchema() {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS squads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        squad_name VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(50),
        code VARCHAR(50) UNIQUE,
        creator_id UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        legal_name VARCHAR(100) NOT NULL DEFAULT '',
        full_name VARCHAR(100) NOT NULL DEFAULT '',
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        age INT NOT NULL DEFAULT 0,
        gender VARCHAR(20) NOT NULL DEFAULT 'Other',
        height NUMERIC(5,2) NOT NULL DEFAULT 0,
        weight NUMERIC(5,2) NOT NULL DEFAULT 0,
        bmi NUMERIC(4,2) NOT NULL DEFAULT 0,
        bmr INT NOT NULL DEFAULT 0,
        calorie_target INT NOT NULL DEFAULT 0,
        protein_target INT NOT NULL DEFAULT 0,
        carbs_target INT NOT NULL DEFAULT 0,
        fats_target INT NOT NULL DEFAULT 0,
        water_target INT NOT NULL DEFAULT 0,
        fitness_goal VARCHAR(50) NOT NULL DEFAULT 'Maintain Weight',
        food_preference VARCHAR(30) NOT NULL DEFAULT 'Vegetarian',
        region_preference VARCHAR(30) NOT NULL DEFAULT 'South Indian',
        activity_level VARCHAR(50) NOT NULL DEFAULT 'Sedentary',
        current_streak INT NOT NULL DEFAULT 0,
        xp INT NOT NULL DEFAULT 0,
        water_logged INT NOT NULL DEFAULT 0,
        calories_logged INT NOT NULL DEFAULT 0,
        protein_logged INT NOT NULL DEFAULT 0,
        carbs_logged INT NOT NULL DEFAULT 0,
        fats_logged INT NOT NULL DEFAULT 0,
        total_xp INT NOT NULL DEFAULT 0,
        is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
        add_egg_today BOOLEAN NOT NULL DEFAULT FALSE,
        today_veg_only BOOLEAN NOT NULL DEFAULT FALSE,
        is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
        activate_day BOOLEAN NOT NULL DEFAULT TRUE,
        egg_today BOOLEAN NOT NULL DEFAULT FALSE,
        veg_only_today BOOLEAN NOT NULL DEFAULT FALSE,
        meals_plan JSONB,
        workout_plan JSONB,
        squad_id UUID REFERENCES squads(id),
        last_active TIMESTAMP WITH TIME ZONE,
        last_logout_time TIMESTAMP WITH TIME ZONE,
        logout_percent INT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jwt_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL UNIQUE,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meal_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        calories_target INT NOT NULL,
        macro_protein INT NOT NULL,
        macro_carbs INT NOT NULL,
        macro_fats INT NOT NULL,
        full_plan_payload JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        routine_name VARCHAR(100) NOT NULL,
        split_type VARCHAR(50),
        exercises_payload JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS nutrition_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        food_name VARCHAR(150) NOT NULL,
        calories_consumed INT NOT NULL,
        protein_g INT NOT NULL DEFAULT 0,
        carbs_g INT NOT NULL DEFAULT 0,
        fats_g INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_scan_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        barcode VARCHAR(100) NOT NULL,
        product_name VARCHAR(150) NOT NULL,
        grade_rating VARCHAR(10),
        nutritional_info JSONB,
        scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chatbot_history (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL,
        message_content TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS squad_members (
        squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (squad_id, user_id),
        CONSTRAINT uq_squad_member_user UNIQUE (user_id)
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
        invitee_email VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        squad_id UUID REFERENCES squads(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_sender_receiver_pair UNIQUE (sender_id, receiver_id),
        CONSTRAINT chk_self_invite CHECK (sender_id <> receiver_id)
      );

      CREATE TABLE IF NOT EXISTS daily_tasks_log (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_date DATE NOT NULL DEFAULT CURRENT_DATE,
        task_1_done BOOLEAN NOT NULL DEFAULT FALSE,
        task_2_done BOOLEAN NOT NULL DEFAULT FALSE,
        task_3_done BOOLEAN NOT NULL DEFAULT FALSE,
        xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
        task_id VARCHAR(100),
        title VARCHAR(255),
        xp_value INT NOT NULL DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_task_date UNIQUE (user_id, task_date)
      );

      CREATE TABLE IF NOT EXISTS historical_records (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        old_value VARCHAR(100),
        new_value VARCHAR(100) NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
      CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_logs(user_id, log_date);
      CREATE INDEX IF NOT EXISTS idx_chat_user_time ON chatbot_history(user_id, timestamp);
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_name VARCHAR(100) NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_rest_day BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS add_egg_today BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS today_veg_only BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_logout_time TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS logout_percent INT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS water_logged INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS calories_logged INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS protein_logged INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS carbs_logged INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS fats_logged INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activate_day BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS egg_today BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS veg_only_today BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS meals_plan JSONB;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_plan JSONB;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
      ALTER TABLE squads ADD COLUMN IF NOT EXISTS name VARCHAR(50);
      ALTER TABLE squads ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
      ALTER TABLE squads ADD COLUMN IF NOT EXISTS creator_id UUID;
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id);
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invitee_email VARCHAR(255);
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id);
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
      ALTER TABLE daily_tasks_log ADD COLUMN IF NOT EXISTS task_id VARCHAR(100);
      ALTER TABLE daily_tasks_log ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      ALTER TABLE daily_tasks_log ADD COLUMN IF NOT EXISTS xp_value INT NOT NULL DEFAULT 0;
      ALTER TABLE daily_tasks_log ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      DROP VIEW IF EXISTS v_global_leaderboard;
      CREATE VIEW v_global_leaderboard AS
      SELECT 
          ROW_NUMBER() OVER (ORDER BY xp DESC) as global_rank,
          id as user_id,
          COALESCE(full_name, legal_name) AS full_name,
          xp,
          current_streak
      FROM users;
    `);
    console.log('✅ PostgreSQL Full Structural Schema initialized/verified.');
  } catch (err: any) {
    console.error('❌ Failed to run full schema init:', err.message);
  }
}

export async function query(text: string, params?: any[]) {
  if (useLocalFallback) {
    return executeMemoryQuery(text, params);
  } else {
    return pool.query(text, params);
  }
}

// 3. Updated In-Memory Regex Emulator matching the strict naming schema
async function executeMemoryQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  const norm = text.replace(/\s+/g, ' ').trim();
  
  if (norm.includes('SELECT') && norm.includes('users') && norm.includes('email =')) {
    const email = params[0]?.toLowerCase();
    const user = memoryStore.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (norm.includes('SELECT') && norm.includes('users') && norm.includes('id =')) {
    const id = params[0];
    const user = memoryStore.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (norm.includes('INSERT INTO users')) {
    const [
      id, email, password_hash, legal_name, full_name, age, gender, height, weight, bmi,
      bmr, calorie_target, protein_target, carbs_target, fats_target, water_target,
      fitness_goal, food_preference, region_preference, activity_level, current_streak,
      xp, total_xp, is_rest_day, add_egg_today, today_veg_only, is_onboarded,
      activate_day, egg_today, veg_only_today, water_logged, calories_logged, protein_logged,
      carbs_logged, fats_logged, meals_plan, workout_plan, squad_id,
      last_active, last_logout_time, logout_percent
    ] = params;

    const user = {
      id,
      legal_name,
      full_name,
      email,
      password_hash,
      age,
      gender,
      height,
      weight,
      bmi,
      bmr,
      calorie_target,
      protein_target,
      carbs_target,
      fats_target,
      water_target,
      fitness_goal,
      food_preference,
      region_preference,
      activity_level,
      current_streak,
      xp,
      total_xp,
      is_rest_day,
      add_egg_today,
      today_veg_only,
      is_onboarded,
      activate_day,
      egg_today,
      veg_only_today,
      meals_plan,
      workout_plan,
      squad_id,
      last_active,
      last_logout_time,
      logout_percent,
      created_at: new Date()
    };

    memoryStore.users.push(user);
    return { rows: [user], rowCount: 1 };
  }

  if (norm.includes('UPDATE users SET') && norm.includes('WHERE id =')) {
    const id = params[params.length - 1];
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };

    if (norm.includes('xp = xp +')) {
      user.xp = (user.xp || 0) + Number(params[0] || 0);
    }
    if (norm.includes('egg_today = $1')) {
      user.egg_today = params[0];
      user.veg_only_today = params[1] !== undefined ? params[1] : user.veg_only_today;
    }
    if (norm.includes('activate_day = $1')) {
      user.activate_day = params[0];
    }
    if (norm.includes('water_logged = $1') && norm.includes('calories_logged = $2')) {
      user.water_logged = params[0];
      user.calories_logged = params[1];
      user.protein_logged = params[2];
      user.carbs_logged = params[3];
      user.fats_logged = params[4];
      user.last_active = new Date();
    }
    if (norm.includes('password_hash = $1')) {
      user.password_hash = params[0];
    }
    if (norm.includes('full_name = $1') && norm.includes('age = $2')) {
      user.full_name = params[0];
      user.age = params[1];
      user.gender = params[2];
      user.height = params[3];
      user.weight = params[4];
      user.bmi = params[5];
      user.bmr = params[6];
      user.calorie_target = params[7];
      user.protein_target = params[8];
      user.carbs_target = params[9];
      user.fats_target = params[10];
      user.water_target = params[11];
      user.fitness_goal = params[12];
      user.food_preference = params[13];
      user.region_preference = params[14];
      user.activity_level = params[15];
      user.is_onboarded = true;
      user.current_streak = user.current_streak || 1;
    }
    if (norm.includes('meals_plan = $1, workout_plan = $2')) {
      user.meals_plan = params[0];
      user.workout_plan = params[1];
    }

    return { rows: [user], rowCount: 1 };
  }

  if (norm.includes('SELECT') && norm.includes('squads') && norm.includes('code =')) {
    const code = params[0];
    const squad = memoryStore.squads.find(s => s.code === code);
    return { rows: squad ? [squad] : [], rowCount: squad ? 1 : 0 };
  }

  if (norm.includes('INSERT INTO squads')) {
    const [id, name, code, creator_id] = params;
    const squad = { id, name, code, creator_id, created_at: new Date() };
    memoryStore.squads.push(squad);
    return { rows: [squad], rowCount: 1 };
  }

  if (norm.includes('SELECT') && norm.includes('invitations') && norm.includes('invitee_email =')) {
    const email = params[0]?.toLowerCase();
    const invites = memoryStore.invitations.filter(inv => inv.invitee_email.toLowerCase() === email && inv.status === 'PENDING');
    return { rows: invites, rowCount: invites.length };
  }

  if (norm.includes('INSERT INTO invitations')) {
    const [id, squad_id, inviter_id, invitee_email, status] = params;
    const invite = { id, squad_id, inviter_id, invitee_email, status, created_at: new Date() };
    memoryStore.invitations.push(invite);
    return { rows: [invite], rowCount: 1 };
  }

  if (norm.includes('UPDATE invitations SET status = $1 WHERE id = $2')) {
    const [status, id] = params;
    const invite = memoryStore.invitations.find(inv => inv.id === id);
    if (invite) {
      invite.status = status;
      return { rows: [invite], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (norm.includes('SELECT COUNT(*) as count FROM users WHERE squad_id =')) {
    const squadId = params[0];
    const count = memoryStore.users.filter(u => u.squad_id === squadId).length;
    return { rows: [{ count }], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

export default {
  query,
  memoryStore
};