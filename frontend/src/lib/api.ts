import axios from 'axios';

const resolvedBase = import.meta.env.VITE_API_BASE_URL || '/';

const api = axios.create({
  baseURL: resolvedBase,
  withCredentials: true,
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
  current_day?: number;
  logout_percent?: number;
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

export async function updateProfile(payload: {
  full_name: string;
  fitness_goal: string;
  food_preference: string;
  region_preference: string;
  activity_level: string;
}) {
  return api.patch('/api/auth/me', payload);
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

export async function getTodayMeals(userId: string) {
  return api.post('/api/dashboard/today-meals', { userId });
}

export async function getTodayWorkout(userId: string, profile?: Record<string, any>) {
  return api.post('/api/dashboard/today-workout', { userId, userProfile: profile || {} });
}

export async function completeMeal(userId: string, mealSlot: string) {
  return api.post('/api/dashboard/complete-meal', { userId, mealSlot });
}

export async function completeExercise(userId: string) {
  return api.post('/api/dashboard/complete-exercise', { userId });
}

export async function getWorkoutPlan(profile: Record<string, any>, overrides?: Record<string, any>) {
  return api.post('/api/dashboard/gym-view', {
    workout_type: profile.fitness_goal === 'Muscle Gain' ? 'Strength' : profile.fitness_goal === 'Fat Loss' ? 'Cardio' : 'Balanced',
    body_part: profile.fitness_goal === 'Fat Loss' ? 'CORE' : profile.fitness_goal === 'Muscle Gain' ? 'FULL BODY' : 'FULL BODY',
    equipment: profile.activity_level === 'Active' ? 'Gym' : 'Bodyweight',
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
      current_day: profile.current_day,
      workout_progress: profile.workout_progress,
      ...overrides,
    },
  });
}

export async function completeWorkoutStep(userId: string, completedCount?: number, totalExercises?: number) {
  return api.post('/api/dashboard/complete-exercise', {
    userId,
    completedCount,
    totalExercises,
  });
}

export async function sendChatMessage(message: string, chatHistory?: Array<{ role: 'user' | 'assistant'; text: string }>) {
  return api.post('/api/chatbot/query', { message, chatHistory: chatHistory || [] });
}

export async function getModelStatus() {
  return api.get('/api/chatbot/models');
}

export async function uploadScan(file: File) {
  const formData = new FormData();
  formData.append('labelImage', file);
  return api.post('/api/chatbot/scan-label', formData);
}

export async function getSquadMatrix() {
  return api.get('/api/squad/matrix');
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

export async function createSquadChallenge(payload: {
  targetUserId: string;
  title: string;
  description?: string;
  targetValue: number;
  deadline?: string;
}) {
  return api.post('/api/squad/challenge/create', payload);
}

export async function updateSquadChallengeProgress(challengeId: string, currentValue: number) {
  return api.post(`/api/squad/challenge/${challengeId}/progress`, { currentValue });
}

export default api;
