import { Request, Response } from 'express';
import { query } from '../config/db.js';

// 1. COMPLETE A DAILY CHALLENGE TASK (Anti-Cheat Validation & XP Payload)
export async function completeTask(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { taskId, title, xpValue } = req.body;

  if (!userId || !taskId || !title) {
    return res.status(400).json({ error: 'User ID, Task ID, and Title are required.' });
  }

  try {
    // ANTI-CHEAT check: Ensure user hasn't completed this task in the last 18 hours
    const lastCheck = await query(
      `SELECT completed_at FROM daily_tasks_log 
       WHERE user_id = $1 AND task_id = $2 
       ORDER BY completed_at DESC LIMIT 1`,
      [userId, taskId]
    );

    if (lastCheck.rowCount > 0) {
      const lastCompleted = new Date(lastCheck.rows[0].completed_at);
      const hoursSince = (new Date().getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < 18) {
        return res.status(429).json({
          error: 'ANTI_CHEAT_BLOCKED',
          message: `Anti-Cheat Sensor: You have already claimed rewards for "${title}" recently. Claim window opens in ${(18 - hoursSince).toFixed(1)} hours.`
        });
      }
    }

    // Award XP and log task
    const logId = 'task_' + Math.random().toString(36).substring(2, 11);
    const xpReward = Number(xpValue) || 10;

    await query(
      `INSERT INTO daily_tasks_log (id, user_id, task_id, title, xp_value, completed_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [logId, userId, taskId, title, xpReward]
    );

    // Update user's total XP and streak status
    await query(
      `UPDATE users 
       SET xp = xp + $1, 
           current_streak = GREATEST(current_streak, 1) 
       WHERE id = $2`,
      [xpReward, userId]
    );

    // Fetch updated score
    const updatedUser = await query('SELECT xp, current_streak FROM users WHERE id = $1', [userId]);

    return res.status(200).json({
      message: `Progress synchronized! +${xpReward} XP awarded.`,
      xp: updatedUser.rows[0].xp,
      current_streak: updatedUser.rows[0].current_streak
    });

  } catch (error: any) {
    console.error('Complete Task Error:', error);
    return res.status(500).json({ error: 'Server error logging progression.' });
  }
}

// 2. LOG DAILY INTAKE (Calories, Macros, and Water)
export async function logIntake(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { waterLogged, caloriesLogged, proteinLogged, carbsLogged, fatsLogged } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    // Fetch current logs
    const result = await query(
      'SELECT water_logged, calories_logged, protein_logged, carbs_logged, fats_logged, water_target, calorie_target, current_streak FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const row = result.rows[0];

    // Compute updated logs
    const newWater = Math.max(0, (row.water_logged || 0) + (Number(waterLogged) || 0));
    const newCalories = Math.max(0, (row.calories_logged || 0) + (Number(caloriesLogged) || 0));
    const newProtein = Math.max(0, (row.protein_logged || 0) + (Number(proteinLogged) || 0));
    const newCarbs = Math.max(0, (row.carbs_logged || 0) + (Number(carbsLogged) || 0));
    const newFats = Math.max(0, (row.fats_logged || 0) + (Number(fatsLogged) || 0));

    // Update DB
    await query(
      `UPDATE users 
       SET water_logged = $1, calories_logged = $2, protein_logged = $3, carbs_logged = $4, fats_logged = $5, last_active = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [newWater, newCalories, newProtein, newCarbs, newFats, userId]
    );

    // Auto-complete challenges on target threshold triggers
    let achievedXp = 0;
    const rewards = [];

    if (newWater >= row.water_target && row.water_logged < row.water_target) {
      achievedXp += 15;
      rewards.push({ key: 'water_100', title: 'Hydration Target Cleared' });
    }
    if (newCalories >= (row.calorie_target - 150) && newCalories <= (row.calorie_target + 150) && row.calories_logged < (row.calorie_target - 150)) {
      achievedXp += 25;
      rewards.push({ key: 'calories_adherence', title: 'Dietary Calorie Target Met' });
    }

    if (achievedXp > 0) {
      for (const rew of rewards) {
        const logId = 'auto_' + Math.random().toString(36).substring(2, 11);
        await query(
          `INSERT INTO daily_tasks_log (id, user_id, task_id, title, xp_value) 
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [logId, userId, rew.key, rew.title, achievedXp]
        );
      }
      await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [achievedXp, userId]);
    }

    return res.status(200).json({
      message: 'Nutrients logged successfully.',
      logged: {
        water_logged: newWater,
        calories_logged: newCalories,
        protein_logged: newProtein,
        carbs_logged: newCarbs,
        fats_logged: newFats
      },
      awardedXp: achievedXp
    });

  } catch (error: any) {
    console.error('Log Intake Error:', error);
    return res.status(500).json({ error: 'Server error updating intake logs.' });
  }
}

// 3. RETRIEVE CURRENT DAY PROGRESS LOGS
export async function getProgressLogs(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const result = await query(
      `SELECT * FROM daily_tasks_log 
       WHERE user_id = $1 
       ORDER BY completed_at DESC LIMIT 20`,
      [userId]
    );

    return res.status(200).json({
      tasks: result.rows
    });
  } catch (error: any) {
    console.error('Get Progress Logs Error:', error);
    return res.status(500).json({ error: 'Server error retrieving logs.' });
  }
}
