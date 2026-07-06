export interface DailyTask {
  id: string;
  user_id: string;
  task_id: string; // e.g., 'water_100', 'workout_complete', 'meals_adhered'
  title: string;
  xp_value: number;
  completed_at: Date;
}
