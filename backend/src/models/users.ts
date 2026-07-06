export interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  bmi: number;
  bmr: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
  water_target: number; // in ml
  fitness_goal: 'Weight Loss' | 'Muscle Gain' | 'Lean Bulking' | 'Endurance Training' | 'Maintenance';
  food_preference: 'Vegetarian' | 'Non-Vegetarian' | 'Mixed';
  region_preference: 'South' | 'North' | 'East' | 'West' | 'All';
  activity_level: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active' | 'Professional Athlete' | 'Rehabilitation';
  is_onboarded: boolean;
  activate_day: boolean; // True = Activate Day, False = Rest Day
  add_egg_today: boolean; // Add Egg Today Toggle
  today_veg_only: boolean; // Today Veg Only Toggle
  current_streak: number;
  total_xp: number;
  water_logged: number; // in ml
  calories_logged: number;
  protein_logged: number;
  carbs_logged: number;
  fats_logged: number;
  meals_plan: MealPlan | null; // JSONB storage for 7 days
  workout_plan: WorkoutPlan | null; // JSONB storage
  squad_id: string | null;
  last_active: Date;
  created_at?: Date;
}

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  description: string;
  isCompleted?: boolean;
}

export interface DayMealPlan {
  Breakfast: Meal;
  'Mid-Morning Snack': Meal;
  Lunch: Meal;
  'Evening Snack': Meal;
  Dinner: Meal;
}

export interface MealPlan {
  days: DayMealPlan[]; // 7 days of meals
}

export interface Workout {
  exercise: string;
  sets: number;
  reps: number;
  duration: number; // in mins
  caloriesBurned: number;
  targetMuscle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface WorkoutRoutine {
  warmUp: Workout[];
  strength: Workout[];
  cardio: Workout[];
  flexibility: Workout[];
  coolDown: Workout[];
  totalDuration: number;
  totalCaloriesBurned: number;
}

export interface WorkoutPlan {
  routine: WorkoutRoutine;
}
