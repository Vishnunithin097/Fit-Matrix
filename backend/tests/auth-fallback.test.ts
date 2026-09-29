import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import { memoryStore } from '../src/config/db.ts';
import { register, login } from '../src/controllers/authController.ts';
import { massageModelResponse, sanitizeFoodLabelName } from '../src/controllers/chatbotController.ts';

function createRes() {
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    cookie: () => undefined,
    clearCookie: () => undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
    send(payload: any) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

test('register and login work with the in-memory fallback store', async () => {
  memoryStore.users.splice(0, memoryStore.users.length);

  const req = {
    body: {
      email: 'fallback@example.com',
      password: 'StrongPass123!',
      fullName: 'Fallback User'
    }
  } as any;

  const res = createRes();
  await register(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.email, 'fallback@example.com');
  assert.equal(res.body.user.full_name, 'Fallback User');

  const loginReq = {
    body: {
      email: 'fallback@example.com',
      password: 'StrongPass123!'
    }
  } as any;

  const loginRes = createRes();
  await login(loginReq, loginRes);

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.user.email, 'fallback@example.com');
  assert.equal(loginRes.body.user.full_name, 'Fallback User');
});

test('login accepts the seeded local demo user', async () => {
  memoryStore.users.splice(0, memoryStore.users.length);
  const hash = await bcrypt.hash('StrongPass123!', 10);
  memoryStore.users.push({
    id: 'seeded-demo-user',
    email: 'vishnunithin079@gmail.com',
    password_hash: hash,
    full_name: 'Vishnu Nithin P',
    legal_name: 'Vishnu Nithin P',
    is_onboarded: true,
    fitness_goal: 'Fat Loss',
    food_preference: 'Vegetarian',
    region_preference: 'South',
    activity_level: 'Moderate',
    age: 28,
    gender: 'Male',
    height: 175,
    weight: 72,
    bmi: 23.5,
    current_streak: 0,
    total_xp: 0,
    xp: 0,
    water_logged: 0,
    calories_logged: 0,
    protein_logged: 0,
    carbs_logged: 0,
    fats_logged: 0,
    activate_day: true,
    egg_today: false,
    veg_only_today: false,
    is_rest_day: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const loginReq = {
    body: {
      email: 'vishnunithin079@gmail.com',
      password: 'StrongPass123!'
    }
  } as any;

  const loginRes = createRes();
  await login(loginReq, loginRes);

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.user.email, 'vishnunithin079@gmail.com');
});

test('login auto-creates the required ben10 demo account when the runtime password is configured', async () => {
  memoryStore.users.splice(0, memoryStore.users.length);
  process.env.FITMIND_DEMO_PASSWORD = 'tennyson';

  const loginReq = {
    body: {
      email: 'ben10@gmail.com',
      password: 'tennyson'
    }
  } as any;

  const loginRes = createRes();
  await login(loginReq, loginRes);

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.user.email, 'ben10@gmail.com');
  assert.equal(loginRes.body.user.full_name, 'Ben Demo');
});

test('generic upload filenames are normalized to a useful meal label instead of a file name', () => {
  const normalized = sanitizeFoodLabelName('clear_food.png');
  assert.notEqual(normalized, 'clear_food.png');
  assert.match(normalized.toLowerCase(), /meal|bowl|food|healthy/i);
});

test('chat responses strip noisy raw model output and keep useful coaching language', () => {
  const response = massageModelResponse(
    'Guidance for nutrition: Here is a nutrition-first answer: Food image: GREEK YOGURT PLAIN',
    { intent: 'nutrition', cues: ['meal'], score: { recovery: 0, nutrition: 1, workout: 0, wellness: 0, lifestyle: 0, general: 0 }, isComparison: false, isPlanRequest: false, urgentConcern: false },
    { weight: 65, height: 170, age: 18, goal: 'Weight loss', diet: 'Vegetarian' },
    'ml_model',
    'How do I eat better for weight loss?'
  );

  assert.doesNotMatch(response, /Food image:/i);
  assert.match(response.toLowerCase(), /protein|fiber|balanced|meal|hydration|consistent/i);
});
