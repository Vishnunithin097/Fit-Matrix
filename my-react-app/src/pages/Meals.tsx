import { motion } from 'framer-motion';
import { BadgeCheck, Flame, Sparkles } from 'lucide-react';

const meals = [
  { name: 'Protein Oats Bowl', time: 'Breakfast', calories: 420, protein: 28, carbs: 48, fat: 10, region: 'South Indian', badge: 'Veg', emoji: '🥣' },
  { name: 'Chicken Wrap', time: 'Lunch', calories: 540, protein: 36, carbs: 52, fat: 16, region: 'Global', badge: 'Non-Veg', emoji: '🌯' },
  { name: 'Salmon Power Plate', time: 'Dinner', calories: 610, protein: 42, carbs: 34, fat: 24, region: 'Global', badge: 'Non-Veg', emoji: '🐟' },
];

export default function Meals() {
  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Meal intelligence</p>
          <h1 className="hero-title">Nutrition tailored for your goals.</h1>
        </div>
        <div className="hero-badge"><Sparkles size={18} /> <span>Daily nutrition summary</span></div>
      </section>
      <section className="meal-summary-card">
        <div><p className="stat-label">Calories</p><h3 className="stat-value">2,250</h3></div>
        <div><p className="stat-label">Protein</p><h3 className="stat-value">145g</h3></div>
        <div><p className="stat-label">Carbs</p><h3 className="stat-value">240g</h3></div>
        <div><p className="stat-label">Fat</p><h3 className="stat-value">68g</h3></div>
      </section>
      <div className="meal-grid">
        {meals.map((meal) => (
          <motion.article key={meal.name} className="meal-card" whileHover={{ y: -4 }}>
            <div className="meal-emoji">{meal.emoji}</div>
            <div className="meal-top">
              <span className="meal-time">{meal.time}</span>
              <span className={`meal-badge ${meal.badge === 'Veg' ? 'veg' : 'nonveg'}`}>{meal.badge}</span>
            </div>
            <h3>{meal.name}</h3>
            <p className="meal-meta">{meal.region}</p>
            <div className="meal-metrics"><span><Flame size={14} /> {meal.calories} kcal</span><span><BadgeCheck size={14} /> {meal.protein}g protein</span></div>
            <div className="meal-metrics secondary"><span>{meal.carbs}g carbs</span><span>{meal.fat}g fat</span></div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
