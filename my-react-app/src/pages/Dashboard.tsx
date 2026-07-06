import { motion } from 'framer-motion';
import { Activity, Apple, Droplets, Dumbbell, Flame, ShieldCheck, Sparkles, Trophy, Waves } from 'lucide-react';

const statCards = [
  { label: 'Current Streak', value: '5 days', icon: Flame, accent: 'purple' },
  { label: 'Total XP', value: '4,280', icon: Trophy, accent: 'pink' },
  { label: 'BMI', value: '23.1', icon: ShieldCheck, accent: 'blue' },
  { label: 'Water', value: '1.5L', icon: Droplets, accent: 'cyan' },
];

const quickActions = [
  { title: 'Meals', detail: 'Tailored nutrition', icon: Apple },
  { title: 'Workout', detail: 'Today’s training', icon: Dumbbell },
  { title: 'Analytics', detail: 'Progress insights', icon: Activity },
  { title: 'AI Chat', detail: 'Ask anything', icon: Sparkles },
];

export default function Dashboard() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Welcome back, Vishnu</p>
          <h1 className="hero-title">Your fitness command center is glowing.</h1>
          <p className="hero-copy">Stay on track with adaptive plans, streaks, and AI guided recovery.</p>
        </div>
        <div className="hero-badge"><Waves size={18} /> <span>Maintain Weight • Day 14</span></div>
      </section>

      <section className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <motion.article key={label} className={`stat-card ${accent}`} whileHover={{ y: -4, scale: 1.01 }}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div>
              <p className="stat-label">{label}</p>
              <h3 className="stat-value">{value}</h3>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-head"><h3>Quick actions</h3><span className="panel-tag">Instant access</span></div>
          <div className="quick-grid">
            {quickActions.map(({ title, detail, icon: Icon }) => (
              <motion.div key={title} className="quick-card" whileHover={{ y: -3 }}>
                <Icon size={18} />
                <div>
                  <h4>{title}</h4>
                  <p>{detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="panel-card">
          <div className="panel-head"><h3>Daily controls</h3><span className="panel-tag">Adaptive toggles</span></div>
          <div className="toggle-list">
            {['Activate Day', 'Rest Day', 'Today Veg Only', 'Add Egg Today'].map((item) => (
              <label key={item} className="toggle-row">
                <span>{item}</span>
                <input type="checkbox" defaultChecked={item === 'Activate Day'} />
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
