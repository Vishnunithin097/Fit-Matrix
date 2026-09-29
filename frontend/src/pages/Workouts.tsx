import { motion } from 'framer-motion';
import { Clock3, Dumbbell, Flame, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { completeWorkoutStep, getTodayWorkout } from '../lib/api';

interface WorkoutExercise {
  name: string;
  bodyPart?: string;
  equipment?: string;
  sets?: number;
  reps?: number;
  rest?: number;
}

interface TodayWorkout {
  day: string;
  plan_type: string;
  exercises: WorkoutExercise[];
  model?: string;
  progress?: number;
}

export default function Workouts() {
  const { user } = useAuth();
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const response = await getTodayWorkout(user?.id || 'user-mock-1', user || {});
        const payload = response.data || {};
        setTodayWorkout(payload || null);
        setProgress(Math.max(0, Number(payload.progress || 0)));
      } catch {
        setTodayWorkout(null);
      } finally {
        setLoading(false);
      }
    };

    void loadWorkout();
  }, [user]);

  const currentExercise = todayWorkout?.exercises?.[stepIndex] || null;
  const totalSteps = todayWorkout?.exercises?.length || 0;
  const stepProgress = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const activeProgress = Math.max(progress, stepProgress);

  const startWorkout = () => {
    if (todayWorkout?.exercises?.length) {
      setStepIndex(0);
      setProgress(0);
    }
  };

  const completeStep = async () => {
    if (!todayWorkout?.exercises?.length) return;

    const nextStep = stepIndex + 1;
    const nextProgress = totalSteps > 0 ? Math.min(100, Math.round(((nextStep / totalSteps) * 100))) : 0;

    if (nextStep >= totalSteps) {
      setProgress(100);
      setStepIndex(totalSteps - 1);
      try {
        await completeWorkoutStep(user?.id || 'user-mock-1', totalSteps, totalSteps);
        setWorkoutCompleted(true);
      } catch {
        setProgress(0);
      }
      return;
    }

    setProgress(nextProgress);
    setStepIndex(nextStep);
  };

  const displayWorkout = useMemo(() => {
    if (!todayWorkout) return null;
    return {
      dayLabel: todayWorkout.day || `Day ${user?.current_day || 1}`,
      planType: todayWorkout.plan_type || 'Strength',
      exerciseNames: todayWorkout.exercises || [],
    };
  }, [todayWorkout]);

  if (loading) {
    return (
      <div className="page-stack">
        <section className="hero-panel compact">
          <div>
            <p className="eyebrow">Training intelligence</p>
            <h1 className="hero-title">Loading today's workout…</h1>
          </div>
        </section>
      </div>
    );
  }

  if (!todayWorkout || !displayWorkout) {
    return (
      <div className="page-stack">
        <section className="hero-panel compact">
          <div>
            <p className="eyebrow">Training intelligence</p>
            <h1 className="hero-title">No workout available for today.</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Training intelligence</p>
          <h1 className="hero-title">Today's workout</h1>
        </div>
        <div className="hero-badge"><Sparkles size={18} /><span>{displayWorkout.dayLabel}</span></div>
      </section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p className="eyebrow">{displayWorkout.dayLabel}</p>
            <h2 style={{ margin: 0 }}>{displayWorkout.planType}</h2>
          </div>
          <div className="meal-badge nonveg">{displayWorkout.exerciseNames[0]?.equipment || 'Bodyweight'}</div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Today's Activity</h3>
        <ol style={{ marginBottom: 18, paddingLeft: 18 }}>
          {displayWorkout.exerciseNames.map((exercise, index) => (
            <li key={`${exercise.name}-${index}`} style={{ marginBottom: 8 }}>{exercise.name}</li>
          ))}
        </ol>

        <div className="meal-metrics" style={{ marginBottom: 18 }}>
          <span><Clock3 size={14} /> 45 min</span>
          <span><Flame size={14} /> 320 kcal</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Progress</span>
            <strong>{activeProgress}%</strong>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${activeProgress}%`, height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#3b82f6)' }} />
          </div>
        </div>

        {workoutCompleted ? (
          <div className="panel-card" role="status">
            <h3>Workout completed</h3>
            <p>Day complete. Your next workout will be available after refresh.</p>
          </div>
        ) : currentExercise ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, background: 'rgba(15,23,42,0.35)' }}>
            <p className="eyebrow">STEP {stepIndex + 1} OF {totalSteps}</p>
            <h3 style={{ marginTop: 6 }}>{currentExercise.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginTop: 12 }}>
              <div><small>Sets</small><div>{currentExercise.sets || 3}</div></div>
              <div><small>Reps</small><div>{currentExercise.reps || 12}</div></div>
              <div><small>Rest</small><div>{currentExercise.rest || 60}s</div></div>
            </div>
            <button className="primary-btn" style={{ marginTop: 18 }} onClick={completeStep}>Complete Step</button>
          </div>
        ) : (
          <button className="primary-btn" onClick={startWorkout}>Start workout</button>
        )}
      </motion.section>
    </div>
  );
}
