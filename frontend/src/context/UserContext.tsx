import React, { createContext, useState, useEffect, useContext } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  legal_name?: string;
  full_name?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  height: number;
  weight: number;
  bmi: number;
  bmr?: number;
  calorie_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fats_target?: number;
  water_target?: number;
  fitness_goal?: string;
  food_preference?: string;
  region_preference?: string;
  activity_level?: string;
  is_onboarded: boolean;
  is_rest_day?: boolean;
  activate_day?: boolean;
  add_egg_today?: boolean;
  egg_today?: boolean;
  today_veg_only?: boolean;
  veg_only_today?: boolean;
  current_streak: number;
  total_xp?: number;
  xp?: number;
  water_logged?: number;
  calories_logged?: number;
  protein_logged?: number;
  carbs_logged?: number;
  fats_logged?: number;
  squad_id?: string | null;
  [key: string]: any;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  error: string | null;
  mealsPlan: any | null;
  workoutPlan: any | null;
  squadMatrix: any | null;
  invitations: any[];
  logs: any[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  registerUser: (fullName: string, email: string, password: string) => Promise<boolean>;
  submitOnboarding: (data: Partial<UserProfile>) => Promise<boolean>;
  logoutUser: (progress: number) => Promise<void>;
  logNutrientIntake: (water: number, cals: number, prot: number, carbs: number, fats: number) => Promise<void>;
  triggerCompleteTask: (taskId: string, title: string, xp: number) => Promise<void>;
  toggleOperationMode: (mode: 'ACTIVATE' | 'REST') => Promise<void>;
  toggleDietaryRules: (eggToday: boolean, vegOnlyToday: boolean) => Promise<void>;
  triggerCreateSquad: (name: string) => Promise<void>;
  triggerJoinSquad: (code: string) => Promise<void>;
  triggerInviteFriend: (email: string) => Promise<void>;
  resolveFriendInvite: (inviteId: string, action: 'ACCEPTED' | 'REJECTED') => Promise<void>;
  triggerLeaveSquad: () => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fit_matrix_token') || sessionStorage.getItem('fit_matrix_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mealsPlan, setMealsPlan] = useState<any | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null);
  const [squadMatrix, setSquadMatrix] = useState<any | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Load user session on startup
  useEffect(() => {
    const fetchSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          await refreshPlans(token, data.user);
          await refreshSquadData(token);
          await refreshActivityLogs(token);
        } else {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem('fit_matrix_token');
          sessionStorage.removeItem('fit_matrix_token');
        }
      } catch (err) {
        console.warn('Backend server offline during startup. Loading mock offline session...');
        loadMockSession();
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  const loadMockSession = () => {
    // Elegant local storage persistence fallback for frictionless sandbox testing
    const saved = localStorage.getItem('fit_matrix_mock_user');
    if (saved) {
      setUser(JSON.parse(saved));
      setMealsPlan(JSON.parse(localStorage.getItem('fit_matrix_mock_meals') || 'null'));
      setWorkoutPlan(JSON.parse(localStorage.getItem('fit_matrix_mock_workout') || 'null'));
      setSquadMatrix(JSON.parse(localStorage.getItem('fit_matrix_mock_squad') || 'null'));
    }
  };

  const syncMockSession = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('fit_matrix_mock_user', JSON.stringify(updatedUser));
  };

  const refreshPlans = async (authToken: string, profile?: UserProfile) => {
    const activeProfile = profile || user;
    if (!activeProfile) return;

    try {
      const foodRes = await fetch('/api/dashboard/food-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipe_name: 'Weekly Nutrition Matrix',
          cuisine: activeProfile.region_preference,
          diet: activeProfile.food_preference,
          prep_time: 20,
          cook_time: 25,
          servings: 2,
          userProfile: activeProfile
        })
      });

      if (foodRes.ok) {
        const data = await foodRes.json();
        setMealsPlan({ weekly_food_plan: data.weekly_food_plan });
        localStorage.setItem('fit_matrix_mock_meals', JSON.stringify({ weekly_food_plan: data.weekly_food_plan }));
      }
    } catch (err) {
      console.warn('Could not sync food dashboard plan from backend API.', err);
    }

    try {
      const workoutRes = await fetch('/api/dashboard/gym-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          workout_type: activeProfile.activity_level === 'Active' ? 'Strength' : 'Conditioning',
          body_part: 'Full Body',
          equipment: 'Bodyweight',
          userProfile: activeProfile
        })
      });

      if (workoutRes.ok) {
        const data = await workoutRes.json();
        setWorkoutPlan({ weekly_workout_plan: data.weekly_workout_plan });
        localStorage.setItem('fit_matrix_mock_workout', JSON.stringify({ weekly_workout_plan: data.weekly_workout_plan }));
      }
    } catch (err) {
      console.warn('Could not sync workout dashboard plan from backend API.', err);
    }
  };

  const refreshSquadData = async (authToken: string) => {
    try {
      const res = await fetch('/api/squad/matrix', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSquadMatrix(data);
        localStorage.setItem('fit_matrix_mock_squad', JSON.stringify(data));
      }
      
      const resInv = await fetch('/api/squad/invites', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (resInv.ok) {
        const dataInv = await resInv.json();
        setInvitations(dataInv.invitations);
      }
    } catch (err) {
      console.warn('Could not sync squad data.');
    }
  };

  const refreshActivityLogs = async (authToken: string) => {
    try {
      const res = await fetch('/api/streak/logs', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.tasks);
      }
    } catch (err) {
      console.warn('Could not sync logs.');
    }
  };

  // 1. LOGIN
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        if (rememberMe) {
          localStorage.setItem('fit_matrix_token', data.token);
          sessionStorage.removeItem('fit_matrix_token');
        } else {
          sessionStorage.setItem('fit_matrix_token', data.token);
          localStorage.removeItem('fit_matrix_token');
        }
        setUser(data.user);
        await refreshPlans(data.token, data.user);
        await refreshSquadData(data.token);
        await refreshActivityLogs(data.token);
        return true;
      } else {
        setError(data.error || 'Login failed.');
        return false;
      }
    } catch (err) {
      // Offline fallback for AI Studio Preview
      setError(null);
      console.log('Server offline. Bypassing login with test credentials...');
      const mockProfile: UserProfile = {
        id: 'user-mock-1',
        email: email,
        full_name: 'Vishnu Nithin',
        age: 26,
        gender: 'Male',
        height: 180,
        weight: 75,
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
        squad_id: 'squad-1'
      };
      setToken('mock_token_xyz_123');
      if (rememberMe) {
        localStorage.setItem('fit_matrix_token', 'mock_token_xyz_123');
        sessionStorage.removeItem('fit_matrix_token');
      } else {
        sessionStorage.setItem('fit_matrix_token', 'mock_token_xyz_123');
        localStorage.removeItem('fit_matrix_token');
      }
      syncMockSession(mockProfile);
      return true;
    }
  };

  // 2. REGISTER
  const registerUser = async (fullName: string, email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        sessionStorage.setItem('fit_matrix_token', data.token);
        localStorage.removeItem('fit_matrix_token');
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Registration failed.');
        return false;
      }
    } catch (err) {
      setError(null);
      // Fallback
      const mockProfile: UserProfile = {
        id: 'user_new_' + Math.random().toString(36).substring(2, 7),
        email: email,
        full_name: fullName,
        age: 0,
        gender: 'Other',
        height: 0,
        weight: 0,
        bmi: 0,
        bmr: 0,
        calorie_target: 0,
        protein_target: 0,
        carbs_target: 0,
        fats_target: 0,
        water_target: 0,
        fitness_goal: 'Maintain Weight',
        food_preference: 'Vegetarian',
        region_preference: 'South Indian',
        activity_level: 'Sedentary',
        is_onboarded: false,
        activate_day: true,
        egg_today: false,
        veg_only_today: false,
        current_streak: 0,
        xp: 0,
        water_logged: 0,
        calories_logged: 0,
        protein_logged: 0,
        carbs_logged: 0,
        fats_logged: 0,
        squad_id: null
      };
      setToken('mock_token_new_user');
      sessionStorage.setItem('fit_matrix_token', 'mock_token_new_user');
      localStorage.removeItem('fit_matrix_token');
      syncMockSession(mockProfile);
      return true;
    }
  };

  // 3. ONBOARDING SUBMIT
  const submitOnboarding = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();

      if (res.ok) {
        const updatedProfile = { ...user, ...data.profile } as UserProfile;
        setUser(updatedProfile);
        if (token) {
          await refreshPlans(token, updatedProfile);
        }
        return true;
      } else {
        setError(data.error || 'Onboarding configuration failed.');
        return false;
      }
    } catch (err) {
      // Mock calculation fallback
      setError(null);
      const h = profileData.height || 170;
      const w = profileData.weight || 65;
      const a = profileData.age || 25;
      const g = profileData.gender || 'Male';

      const bmi = Number((w / ((h / 100) * (h / 100))).toFixed(1));
      let bmr = g === 'Male' ? (10 * w) + (6.25 * h) - (5 * a) + 5 : (10 * w) + (6.25 * h) - (5 * a) - 161;
      bmr = Math.round(bmr);

      const calorie_target = Math.round(bmr * 1.55);
      const protein_target = Math.round(w * 1.8);
      const fats_target = Math.round((calorie_target * 0.25) / 9);
      const carbs_target = Math.round((calorie_target - (protein_target * 4 + fats_target * 9)) / 4);

      const updatedUser: UserProfile = {
        ...user!,
        ...profileData,
        bmi,
        bmr,
        calorie_target,
        protein_target,
        carbs_target,
        fats_target,
        water_target: 3000,
        is_onboarded: true,
        current_streak: 1,
        xp: 10
      } as UserProfile;

      syncMockSession(updatedUser);
      
      // Seed mock plans
      const mockMealsPlan = {
        days: Array(7).fill({
          Breakfast: { name: "Pesarattu Moong Dosa", calories: 310, protein: 12, carbs: 45, fats: 7, fiber: 6, description: "Spiced green lentil crepe." },
          "Mid-Morning Snack": { name: "Epigamia Greek Yogurt", calories: 95, protein: 8, carbs: 4, fats: 3, fiber: 0, description: "Packed probiotic yogurt." },
          Lunch: { name: "Sambar Rice with Beetroot Poriyal", calories: 410, protein: 11, carbs: 65, fats: 9, fiber: 7, description: "Lentils vegetable curry rice." },
          "Evening Snack": { name: "Roasted Makhana", calories: 110, protein: 3, carbs: 22, fats: 1, fiber: 3, description: "Lotus seeds baked snack." },
          Dinner: { name: "Roti with Paneer Bhurji & Salad", calories: 440, protein: 18, carbs: 42, fats: 18, fiber: 6, description: "Paneer scrambled spiced cheese." }
        })
      };
      setMealsPlan(mockMealsPlan);
      localStorage.setItem('fit_matrix_mock_meals', JSON.stringify(mockMealsPlan));

      const mockWorkoutPlan = {
        routine: {
          warmUp: [{ exercise: "Dynamic Stretching", sets: 1, reps: 10, duration: 5, caloriesBurned: 15, targetMuscle: "Full Body", difficulty: "Beginner" }],
          strength: [
            { exercise: "Goblet Squats", sets: 3, reps: 12, duration: 10, caloriesBurned: 75, targetMuscle: "Legs", difficulty: "Beginner" },
            { exercise: "Standard Push-ups", sets: 3, reps: 10, duration: 8, caloriesBurned: 55, targetMuscle: "Chest", difficulty: "Beginner" }
          ],
          cardio: [{ exercise: "Threadmill Run", sets: 1, reps: 1, duration: 15, caloriesBurned: 120, targetMuscle: "Cardio", difficulty: "Beginner" }],
          flexibility: [{ exercise: "Cobra Stretch", sets: 2, reps: 1, duration: 5, caloriesBurned: 10, targetMuscle: "Abs", difficulty: "Beginner" }],
          coolDown: [{ exercise: "Child pose relax", sets: 1, reps: 1, duration: 5, caloriesBurned: 5, targetMuscle: "Mind", difficulty: "Beginner" }],
          totalDuration: 43,
          totalCaloriesBurned: 280
        }
      };
      setWorkoutPlan(mockWorkoutPlan);
      localStorage.setItem('fit_matrix_mock_workout', JSON.stringify(mockWorkoutPlan));

      return true;
    }
  };

  // 4. SECURE LOGOUT WITH PROGRESS CHECK
  const logoutUser = async (progressPercentage: number): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progressPercentage })
      });
    } catch (err) {
      console.warn('Logging out offline. Safe state clean.');
    } finally {
      setToken(null);
      setUser(null);
      setMealsPlan(null);
      setWorkoutPlan(null);
      setSquadMatrix(null);
      setInvitations([]);
      setLogs([]);
      localStorage.removeItem('fit_matrix_token');
      sessionStorage.removeItem('fit_matrix_token');
      localStorage.removeItem('fit_matrix_mock_user');
      localStorage.removeItem('fit_matrix_mock_meals');
      localStorage.removeItem('fit_matrix_mock_workout');
      localStorage.removeItem('fit_matrix_mock_squad');
    }
  };

  // 5. LOG NUTRIENT INTAKE
  const logNutrientIntake = async (water: number, cals: number, prot: number, carbs: number, fats: number): Promise<void> => {
    try {
      const res = await fetch('/api/streak/log-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          waterLogged: water,
          caloriesLogged: cals,
          proteinLogged: prot,
          carbsLogged: carbs,
          fatsLogged: fats
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          ...user!,
          ...data.logged
        });
        if (data.awardedXp > 0) {
          setUser(prev => prev ? { ...prev, xp: prev.xp + data.awardedXp } : null);
        }
        await refreshActivityLogs(token!);
      }
    } catch (err) {
      // Mock log local
      if (user) {
        const updated = {
          ...user,
          water_logged: Math.max(0, (user.water_logged || 0) + water),
          calories_logged: Math.max(0, (user.calories_logged || 0) + cals),
          protein_logged: Math.max(0, (user.protein_logged || 0) + prot),
          carbs_logged: Math.max(0, (user.carbs_logged || 0) + carbs),
          fats_logged: Math.max(0, (user.fats_logged || 0) + fats),
          xp: (user.xp ?? user.total_xp ?? 0) + (water > 0 ? 5 : 10)
        };
        syncMockSession(updated);
      }
    }
  };

  // 6. COMPLETE TASK (Daily verification click)
  const triggerCompleteTask = async (taskId: string, title: string, xp: number): Promise<void> => {
    try {
      const res = await fetch('/api/streak/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, title, xpValue: xp })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, xp: data.xp, current_streak: data.current_streak } : null);
        await refreshActivityLogs(token!);
      } else {
        const errData = await res.json();
        setError(errData.message || errData.error);
      }
    } catch (err) {
      // Mock local
      if (user) {
        const updated = {
          ...user,
          xp: (user.xp ?? user.total_xp ?? 0) + xp,
          current_streak: Math.max(1, user.current_streak)
        };
        syncMockSession(updated);
      }
    }
  };

  // 7. TOGGLE DAY OPERATION MODE (Activate Day vs. Rest Day)
  const toggleOperationMode = async (mode: 'ACTIVATE' | 'REST'): Promise<void> => {
    try {
      const res = await fetch('/api/streak/toggle-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, activate_day: data.activate_day } : null);
        await refreshPlans(token!);
      }
    } catch (err) {
      if (user) {
        const updated = {
          ...user,
          activate_day: mode === 'ACTIVATE'
        };
        syncMockSession(updated);
      }
    }
  };

  // 8. TOGGLE DIETARY OPTION RULES
  const toggleDietaryRules = async (eggToday: boolean, vegOnlyToday: boolean): Promise<void> => {
    try {
      const res = await fetch('/api/streak/toggle-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eggToday, vegOnlyToday })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, egg_today: data.egg_today, veg_only_today: data.veg_only_today } : null);
        await refreshPlans(token!);
      }
    } catch (err) {
      if (user) {
        const updated = {
          ...user,
          egg_today: eggToday,
          veg_only_today: vegOnlyToday
        };
        syncMockSession(updated);
      }
    }
  };

  // 9. SQUAD ACTIONS
  const triggerCreateSquad = async (squadName: string): Promise<void> => {
    try {
      const res = await fetch('/api/squad/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ squadName })
      });
      if (res.ok) {
        await refreshSquadData(token!);
        // Re-get user to update squad_id
        const userRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (err) {
      console.warn('Squad operations offline.');
    }
  };

  const triggerJoinSquad = async (code: string): Promise<void> => {
    try {
      const res = await fetch('/api/squad/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        await refreshSquadData(token!);
        const userRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const userData = await userRes.json();
        setUser(userData.user);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      console.warn('Squad operations offline.');
    }
  };

  const triggerInviteFriend = async (friendEmail: string): Promise<void> => {
    try {
      const res = await fetch('/api/squad/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendEmail })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      console.warn('Invite offline.');
    }
  };

  const resolveFriendInvite = async (inviteId: string, action: 'ACCEPTED' | 'REJECTED'): Promise<void> => {
    try {
      const res = await fetch('/api/squad/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invitationId: inviteId, status: action })
      });
      if (res.ok) {
        await refreshSquadData(token!);
        const userRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (err) {
      console.warn('Invite resolve offline.');
    }
  };

  const triggerLeaveSquad = async (): Promise<void> => {
    try {
      const res = await fetch('/api/squad/leave', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, squad_id: null } : null);
        setSquadMatrix(null);
      }
    } catch (err) {
      console.warn('Leave squad offline.');
    }
  };

  const clearError = () => setError(null);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        token,
        error,
        mealsPlan,
        workoutPlan,
        squadMatrix,
        invitations,
        logs,
        login,
        registerUser,
        submitOnboarding,
        logoutUser,
        logNutrientIntake,
        triggerCompleteTask,
        toggleOperationMode,
        toggleDietaryRules,
        triggerCreateSquad,
        triggerJoinSquad,
        triggerInviteFriend,
        resolveFriendInvite,
        triggerLeaveSquad,
        clearError
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
