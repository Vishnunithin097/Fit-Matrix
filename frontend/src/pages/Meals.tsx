import { motion } from 'framer-motion';
import { BadgeCheck, Flame, Sparkles, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { completeMeal, getFoodPlan } from '../lib/api';

interface MealCard {
  name: string;
  cuisine: string;
  mealType: string;
}

export default function Meals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const response = await getFoodPlan(user || {});
        const weekly = response.data?.weekly_food_plan || [];
        const todayMeals = weekly[0]?.meals || [];
        setMeals(todayMeals);
        const savedPercent = Math.max(0, Number(user?.logout_percent || 0));
        const completedCount = Math.min(4, Math.floor(savedPercent / 25));
        setCompletedMeals(['Breakfast', 'Lunch', 'Snack', 'Dinner'].slice(0, completedCount));
        setCompletionPercent(savedPercent);
      } catch {
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };

    void loadMeals();
  }, [user]);

  const handleCompleteMeal = async (meal: MealCard) => {
    const mealSlot = meal.mealType;
    if (!user?.id || completedMeals.includes(mealSlot)) return;

    try {
      const response = await completeMeal(user.id, mealSlot);
      const nextCompleted = [...completedMeals, mealSlot];
      setCompletedMeals(nextCompleted);
      setCompletionPercent(Math.max(
        Number(response.data?.completionPercent || 0),
        Math.round((nextCompleted.length / Math.max(1, meals.length)) * 100)
      ));
    } catch {
      // Keep the meal available when the completion request fails.
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Meal intelligence</p>
          <h1 className="hero-title">Nutrition tailored for your goals.</h1>
        </div>
        <div className="hero-badge">
          <Sparkles size={18} />
          <span>Daily nutrition summary</span>
        </div>
      </section>

      <section className="meal-summary-card">
        <div><p className="stat-label">Calories</p><h3 className="stat-value">{user?.calorie_target || 2200}</h3></div>
        <div><p className="stat-label">Protein</p><h3 className="stat-value">{user?.protein_target || 145}g</h3></div>
        <div><p className="stat-label">Carbs</p><h3 className="stat-value">{user?.carbs_target || 240}g</h3></div>
        <div><p className="stat-label">Fat</p><h3 className="stat-value">{user?.fats_target || 68}g</h3></div>
      </section>

      <section className="panel-card" aria-label="Today's meal progress">
        <div className="panel-head">
          <h3>Today's meal progress</h3>
          <strong>{completionPercent}%</strong>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#14b8a6)' }} />
        </div>
      </section>

      <div className="meal-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="meal-card skeleton" />)
        ) : meals.length > 0 ? meals.map((meal) => (
          <motion.article key={meal.name} className="meal-card" whileHover={{ y: -4 }}>
            <div className="meal-emoji"><Utensils size={20} /></div>
            <div className="meal-top">
              <span className="meal-time">{meal.mealType}</span>
              <span className="meal-badge veg">AI</span>
            </div>
            <h3>{meal.name}</h3>
            <p className="meal-meta">{meal.cuisine}</p>
            <div className="meal-metrics"><span><Flame size={14} /> Smart recommendation</span><span><BadgeCheck size={14} /> Balanced macros</span></div>
            <button
              className={completedMeals.includes(meal.mealType) ? 'secondary-btn' : 'primary-btn'}
              style={{ marginTop: 14 }}
              disabled={completedMeals.includes(meal.mealType)}
              onClick={() => void handleCompleteMeal(meal)}
            >
              {completedMeals.includes(meal.mealType) ? 'Completed' : `Complete ${meal.mealType}`}
            </button>
          </motion.article>
        )) : <div className="panel-card">No meal recommendations are available right now. Please try again in a moment.</div>}
      </div>
    </div>
  );
}
