import { motion } from 'framer-motion';
import { Clock3, Dumbbell, Flame, Sparkles } from 'lucide-react';

const workouts = [
  { name: 'Upper Body Sculpt', target: 'Chest • Back', equipment: 'Dumbbells', sets: '4 x 10', duration: '45 min', calories: 420, difficulty: 'Intermediate' },
  { name: 'Core Pulse Flow', target: 'Abs • Core', equipment: 'Bodyweight', sets: '3 x 15', duration: '25 min', calories: 220, difficulty: 'Beginner' },
  { name: 'Power Strength', target: 'Legs • Glutes', equipment: 'Barbell', sets: '5 x 8', duration: '55 min', calories: 510, difficulty: 'Advanced' },
];

export default function Workouts() {
  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Training intelligence</p>
          <h1 className="hero-title">High-impact sessions for every goal.</h1>
        </div>
        <div className="hero-badge"><Sparkles size={18} /> <span>Daily completion 72%</span></div>
      </section>
      <div className="workout-grid">
        {workouts.map((item) => (
          <motion.article key={item.name} className="workout-card" whileHover={{ y: -4 }}>
            <div className="workout-icon"><Dumbbell size={20} /></div>
            <div className="workout-top"><span className="meal-time">{item.difficulty}</span><span className="meal-badge nonveg">{item.equipment}</span></div>
            <h3>{item.name}</h3>
            <p>{item.target}</p>
            <div className="meal-metrics"><span><Clock3 size={14} /> {item.duration}</span><span><Flame size={14} /> {item.calories} kcal</span></div>
            <div className="workout-footer"><span>{item.sets}</span><button className="primary-btn small">Start</button></div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
