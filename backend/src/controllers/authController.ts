import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { query } from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';
import { normalizeFoodPreference } from '../utils/foodPreference.js';

// Helper to generate JWT Token with dynamic expiration (Remember Me support)
const generateTokenAndSetCookie = (res: Response, id: string, email: string, rememberMe: boolean = false) => {
  const expiresIn = rememberMe ? '30d' : '1d';
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const token = jwt.sign({ id, email }, JWT_SECRET, {
    expiresIn
  });

  // Set as HttpOnly cookie for security
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });

  return token;
};

// 1. REGISTER
export async function register(req: Request, res: Response): Promise<any> {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Full Name, Email Address, and Password are required.' });
  }

  try {
    // Check if user exists
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkUser.rowCount > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = randomUUID();

    // Calculate BMI for registration
    const bmi = Number((65 / ((170 / 100) * (170 / 100))).toFixed(1));

    await query(
      `INSERT INTO users (
        id, email, password_hash, legal_name, age, gender, height, weight, bmi,
        fitness_goal, food_preference, region_preference, activity_level, current_streak,
        total_xp, is_rest_day, add_egg_today, today_veg_only, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        userId,
        email.toLowerCase(),
        hashedPassword,
        fullName,
        18,
        'Other',
        170,
        65,
        bmi,
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
      ]
    );

    const token = generateTokenAndSetCookie(res, userId, email, false);

    return res.status(201).json({
      message: 'Account created successfully. Please complete your onboarding.',
      user: {
        id: userId,
        email,
        full_name: fullName,
        is_onboarded: false
      },
      token
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
}

// 2. LOGIN with standard bcrypt validation and optional long-lived session
export async function login(req: Request, res: Response): Promise<any> {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const checkUser = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkUser.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = checkUser.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // SESSION RECOVERY: Check time elapsed since last activity
    const now = new Date();
    const lastActive = user.last_active ? new Date(user.last_active) : new Date();
    const msDiff = now.getTime() - lastActive.getTime();
    const hoursDiff = msDiff / (1000 * 60 * 60);

    let sessionStatus = 'ACTIVE';
    let updateQuery = 'UPDATE users SET last_active = $1 WHERE id = $2';
    let updateParams: any[] = [now, user.id];

    if (hoursDiff > 24 && user.is_onboarded) {
      // Over 24 hours elapsed. Reset logged nutrients for the new day,
      // but advance or evaluate streak based on progress!
      sessionStatus = 'RESET_DAY';
      
      // If they logged any calories or water yesterday, preserve streak, else reset streak if inactive
      const hadProgressYesterday = user.calories_logged > 0 || user.water_logged > 0;
      const newStreak = hadProgressYesterday ? user.current_streak + 1 : 0; // standard maintenance
      
      updateQuery = `
        UPDATE users 
        SET last_active = $1,
            water_logged = 0,
            calories_logged = 0,
            protein_logged = 0,
            carbs_logged = 0,
            fats_logged = 0,
            current_streak = $2
        WHERE id = $3
      `;
      updateParams = [now, newStreak, user.id];
      user.water_logged = 0;
      user.calories_logged = 0;
      user.protein_logged = 0;
      user.carbs_logged = 0;
      user.fats_logged = 0;
      user.current_streak = newStreak;
    } else {
      // Within 24 hours: Restore progress, continue active program
      sessionStatus = 'RESTORED';
    }

    await query(updateQuery, updateParams);

    const token = generateTokenAndSetCookie(res, user.id, user.email, !!rememberMe);

    // Omit sensitive data
    delete user.password_hash;

    return res.status(200).json({
      message: 'Logged in successfully.',
      sessionStatus,
      hoursSinceLastActive: hoursDiff.toFixed(1),
      user: {
        ...user,
        is_onboarded: !!user.is_onboarded
      },
      token
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

// 3. MANDATORY ONBOARDING & BIO-TELEMETRY MATRIX
export async function onboard(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const {
    full_name,
    age,
    gender,
    height, // cm
    weight, // kg
    fitness_goal,
    food_preference,
    region_preference,
    activity_level,
    add_egg_today,
    today_veg_only
  } = req.body;

  try {
    // A. BMI Calculation: kg / (m^2)
    const heightInMeters = height / 100;
    const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

    // B. BMR Calculation (Mifflin-St Jeor)
    let bmr = 0;
    if (gender === 'Male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'Female') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 78; // average neutral
    }
    bmr = Math.round(bmr);

    // C. Daily Calorie Target based on activity level
    let activityMultiplier = 1.2;
    if (activity_level === 'Light') activityMultiplier = 1.375;
    else if (activity_level === 'Moderate') activityMultiplier = 1.55;
    else if (activity_level === 'Active') activityMultiplier = 1.725;
    else if (activity_level === 'Very Active') activityMultiplier = 1.9;
    else if (activity_level === 'Professional Athlete') activityMultiplier = 2.1;
    else if (activity_level === 'Rehabilitation') activityMultiplier = 1.1;

    let calorieTarget = bmr * activityMultiplier;

    // Adjust based on goals
    if (fitness_goal === 'Weight Loss') {
      calorieTarget -= 500;
    } else if (fitness_goal === 'Muscle Gain') {
      calorieTarget += 500;
    } else if (fitness_goal === 'Lean Bulking') {
      calorieTarget += 250;
    } else if (fitness_goal === 'Endurance Training') {
      calorieTarget -= 200; // slight deficit for endurance
    }
    // 'Maintenance' has no adjustment
    calorieTarget = Math.max(1200, Math.round(calorieTarget)); // Floor at 1200

    // D. Macro Target Distributions
    // Protein target: Weight Loss (1.8g/kg), Muscle Gain (2.0g/kg), Lean Bulking (1.9g/kg), Endurance (1.6g/kg), Maintenance (1.6g/kg)
    let proteinPerKg = 1.6;
    if (fitness_goal === 'Muscle Gain') proteinPerKg = 2.0;
    else if (fitness_goal === 'Lean Bulking') proteinPerKg = 1.9;
    else if (fitness_goal === 'Weight Loss') proteinPerKg = 1.8;
    const proteinTarget = Math.round(weight * proteinPerKg);

    // Fats target: 25% of calories (9 kcal/g)
    const fatsTarget = Math.round((calorieTarget * 0.25) / 9);

    // Carbs target: Rest of the calories (4 kcal/g)
    const proteinKcal = proteinTarget * 4;
    const fatsKcal = fatsTarget * 9;
    const carbsKcal = Math.max(0, calorieTarget - (proteinKcal + fatsKcal));
    const carbsTarget = Math.round(carbsKcal / 4);

    // E. Water target based on activity and weight
    let waterTarget = 3000; // ml
    if (activity_level === 'Active' || activity_level === 'Very Active' || activity_level === 'Professional Athlete') {
      waterTarget = 4000;
    } else if (activity_level === 'Sedentary' || activity_level === 'Rehabilitation') {
      waterTarget = 2500;
    }

    const normalizedFoodPreference = normalizeFoodPreference(food_preference);

    // Save profile to database
    await query(
      `UPDATE users 
       SET legal_name = $1, age = $2, gender = $3, height = $4, weight = $5,
           bmi = $6, fitness_goal = $7, food_preference = $8, region_preference = $9,
           activity_level = $10, add_egg_today = $11, today_veg_only = $12,
           current_streak = COALESCE(current_streak, 1)
       WHERE id = $13`,
      [
        full_name, age, gender, height, weight,
        bmi, fitness_goal, normalizedFoodPreference, region_preference,
        activity_level, add_egg_today || false, today_veg_only || false, userId
      ]
    );

    return res.status(200).json({
      message: 'Onboarding bio-telemetry configured successfully.',
      profile: {
        legal_name: full_name, age, gender, height, weight,
        bmi, fitness_goal, normalizedFoodPreference, region_preference,
        activity_level, add_egg_today, today_veg_only, current_streak: 1
      }
    });
  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return res.status(500).json({ error: 'Server error processing bio-telemetry.' });
  }
}

// 4. FORGOT & RESET PASSWORD
export async function forgotPassword(req: Request, res: Response): Promise<any> {
  const { email, newPassword } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkUser.rowCount === 0) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const user = checkUser.rows[0];

    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);
    }

    // Direct confirmation that account exists
    return res.status(200).json({
      message: 'Email address verified. Enter a new password to proceed.',
      emailVerified: true
    });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ error: 'Server error during password recovery.' });
  }
}

// 5. SECURE LOGOUT WITH PROGRESS CHECK IN GIVEN 24-HOUR WINDOW
export async function logout(req: Request, res: Response): Promise<any> {
  const { progressPercentage } = req.body; // e.g., 25, 50, 75, 100
  const userId = req.user?.id;

  try {
    if (userId && progressPercentage) {
      const percentage = Number(progressPercentage);
      // Log progress to the PostgreSQL task progress tracker
      const logId = 'log_' + Math.random().toString(36).substring(2, 11);
      
      await query(
        `INSERT INTO daily_tasks_log (id, user_id, task_id, title, xp_value) 
         VALUES ($1, $2, $3, $4, $5)`,
        [logId, userId, 'logout_progress', `Logged out with today progress: ${percentage}%`, Math.round(percentage / 10)]
      );

      // Reward XP based on completion progress
      const rewardXp = Math.round(percentage * 0.5); // up to 50 XP
      await query(
        `UPDATE users 
         SET xp = xp + $1, last_active = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [rewardXp, userId]
      );
    }

    // Clear the HTTPOnly authentication cookie
    res.clearCookie('token');
    return res.status(200).json({ message: 'Disconnected from Fit Matrix.' });
  } catch (error: any) {
    console.error('Logout Error:', error);
    res.clearCookie('token');
    return res.status(200).json({ message: 'Disconnected (with database logger error).' });
  }
}

// 6. GET CURRENT PROFILE
export async function getProfile(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = result.rows[0];
    delete user.password_hash;

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ error: 'Server error retrieving profile.' });
  }
}
