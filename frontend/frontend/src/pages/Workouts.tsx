import { motion } from 'framer-motion';
import { Clock3, Dumbbell, Flame, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlan } from '../lib/api';

interface WorkoutCard {
  day: string;
  plan_type: string;
  exercises: Array<{ name: string; bodyPart: string; equipment: string }>;
  guidance: string;
}

export default function Workouts() {
  const { user, currentDay } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await getWorkoutPlan(user || {});
        setWorkouts(response.data?.weekly_workout_plan || []);
      } catch {
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadWorkouts();
  }, [user]);

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Training intelligence</p>
          <h1 className="hero-title">High-impact sessions for every goal.</h1>
        </div>
        <div className="hero-badge"><Sparkles size={18} /><span>AI-driven training blocks</span></div>
      </section>


      <div className="workout-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="workout-card skeleton" />)
        ) : (() => {
          const dayIndex = Math.max(0, Math.min(currentDay - 1, workouts.length - 1));
          const selectedWorkout = workouts[dayIndex];

          if (!selectedWorkout) {
            return <div className="panel-card">Workout recommendations are temporarily unavailable for Day {currentDay}. Please try again soon.</div>;
          }

          return (
            <motion.article key={selectedWorkout.day || `day-${currentDay}`} className="workout-card" whileHover={{ y: -4 }}>
              <div className="workout-icon"><Dumbbell size={20} /></div>
              <div className="workout-top">
                <span className="meal-time">{selectedWorkout.plan_type || 'Workout session'}</span>
                <span className="meal-badge nonveg">{selectedWorkout.exercises?.[0]?.equipment || 'Bodyweight'}</span>
              </div>
              <h3>Today's workout</h3>
              <p>{selectedWorkout.exercises?.map((exercise) => exercise.name).join(' • ') || 'Full-body workout session'}</p>
              <div className="meal-metrics"><span><Clock3 size={14} /> 45 min</span><span><Flame size={14} /> 320 kcal</span></div>
              <div className="workout-footer"><span>{selectedWorkout.guidance || 'Complete the set with strong form and recovery focus.'}</span><button className="primary-btn small">Start</button></div>
            </motion.article>
          );
        })()}
      </div>
    </div>
  );
}
