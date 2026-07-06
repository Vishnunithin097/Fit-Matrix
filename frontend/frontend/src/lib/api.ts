import axios from 'axios';

const AUTH_TOKEN_KEY = 'fit_matrix_token';

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
}

export function saveAuthToken(token: string, rememberMe: boolean = false) {
  if (typeof window === 'undefined') return;
  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

const resolvedBase = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const api = axios.create({
  baseURL: resolvedBase,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (!err.response) {
      err.message = 'Network or CORS error. Ensure the backend is reachable and CORS allows requests from this origin.';
    }
    return Promise.reject(err);
  }
);

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  legal_name?: string;
  is_onboarded?: boolean;
  fitness_goal?: string;
  food_preference?: string;
  region_preference?: string;
  activity_level?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  calorie_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fats_target?: number;
  water_target?: number;
  squad_id?: string | null;
  current_streak?: number;
  xp?: number;
  water_logged?: number;
  calories_logged?: number;
  protein_logged?: number;
  carbs_logged?: number;
  fats_logged?: number;
  activate_day?: boolean;
  egg_today?: boolean;
  veg_only_today?: boolean;
}

export async function loginUser(payload: { email: string; password: string; rememberMe?: boolean }) {
  return api.post('/api/auth/login', payload);
}

export async function registerUser(payload: { fullName: string; email: string; password: string }) {
  return api.post('/api/auth/register', payload);
}

export async function onboardUser(payload: Record<string, unknown>) {
  return api.post('/api/auth/onboard', payload);
}

export async function fetchProfile() {
  return api.get('/api/auth/me');
}

export async function logoutUser(payload?: { progressPercentage?: number }) {
  return api.post('/api/auth/logout', payload || {});
}

export async function getFoodPlan(profile: Record<string, any>, overrides?: Record<string, any>) {
  return api.post('/api/dashboard/food-profile', {
    recipe_name: 'Regional Hybrid Bowl',
    cuisine: profile.region_preference || 'South Indian',
    diet: profile.food_preference || 'Vegetarian',
    prep_time: 15,
    cook_time: 20,
    servings: 2,
    userProfile: {
      weightTier: profile.weight && profile.weight < 50 ? 1 : profile.weight && profile.weight > 80 ? 3 : 2,
      isRestDayMode: false,
      addEggToday: !!profile.egg_today,
      todayVegOnly: !!profile.veg_only_today,
      currentXp: profile.xp || 0,
      completedPercentageLogout: 75,
      fitness_goal: profile.fitness_goal,
      food_preference: profile.food_preference,
      activity_level: profile.activity_level,
      ...overrides,
    },
  });
}

export async function getWorkoutPlan(profile: Record<string, any>, overrides?: Record<string, any>) {
  return api.post('/api/dashboard/gym-view', {
    workout_type: 'Strength',
    body_part: profile.fitness_goal === 'Fat Loss' ? 'CORE' : 'FULL BODY',
    equipment: 'Bodyweight',
    userProfile: {
      weightTier: profile.weight && profile.weight < 50 ? 1 : profile.weight && profile.weight > 80 ? 3 : 2,
      isRestDayMode: false,
      addEggToday: !!profile.egg_today,
      todayVegOnly: !!profile.veg_only_today,
      currentXp: profile.xp || 0,
      completedPercentageLogout: 75,
      fitness_goal: profile.fitness_goal,
      food_preference: profile.food_preference,
      activity_level: profile.activity_level,
      ...overrides,
    },
  });
}

export async function sendChatMessage(message: string) {
  return api.post('/api/chatbot/query', { message });
}

export async function uploadScan(file: File) {
  const formData = new FormData();
  formData.append('labelImage', file);
  return api.post('/api/chatbot/scan-label', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getSquadMatrix() {
  return api.get('/api/squad/matrix');
}

export async function listRegisteredUsers() {
  return api.get('/api/squad/users');
}

export async function listAvailableSquads() {
  return api.get('/api/squad/available');
}

export async function connectUser(payload: { receiverId: string }) {
  return api.post('/api/squad/connect', payload);
}

export async function requestSquadJoin(payload: { squadId: string }) {
  return api.post('/api/squad/request-join', payload);
}

export async function createSquad(payload: { squadName: string }) {
  return api.post('/api/squad/create', payload);
}

export async function joinSquad(payload: { code: string }) {
  return api.post('/api/squad/join', payload);
}

export async function inviteToSquad(payload: { friendEmail: string }) {
  return api.post('/api/squad/invite', payload);
}

export async function listSquadInvites() {
  return api.get('/api/squad/invites');
}

export async function resolveSquadInvite(payload: { invitationId: string; status: 'ACCEPTED' | 'REJECTED' }) {
  return api.post('/api/squad/resolve', payload);
}

export async function leaveSquad() {
  return api.post('/api/squad/leave', {});
}

export default api;
