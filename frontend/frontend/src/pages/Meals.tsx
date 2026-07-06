import { motion } from 'framer-motion';
import { BadgeCheck, Flame, Sparkles, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFoodPlan } from '../lib/api';

interface MealCard {
  name: string;
  cuisine: string;
  mealType?: string;
}

const mealTypeFallback = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Meals() {
  const { user, currentDay } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState<Array<{ day?: string; meals?: any[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const response = await getFoodPlan(user || {});
        const weekly = response.data?.weekly_food_plan || [];
        setWeeklyPlan(weekly);
      } catch {
        setWeeklyPlan([]);
      } finally {
        setLoading(false);
      }
    };

    void loadMeals();
  }, [user]);

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

      <div className="meal-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="meal-card skeleton" />)
        ) : (() => {
          const dayIndex = Math.max(0, Math.min(currentDay - 1, weeklyPlan.length - 1));
          const todayPlan = weeklyPlan[dayIndex] || { day: `Day ${currentDay}`, meals: [] };
          const meals = todayPlan.meals || [];

          return meals.length > 0 ? meals.map((meal, index) => {
            const mealType = meal.mealType || meal.type || mealTypeFallback[index] || `Meal ${index + 1}`;
            const name = meal.name || meal.title || meal.mealName || 'Smart nutrition';
            const cuisine = meal.cuisine || meal.category || '';
            const calories = meal.calories ?? '—';
            const protein = meal.protein ?? '—';

            return (
              <motion.article key={`${mealType}-${index}`} className="meal-card" whileHover={{ y: -4 }}>
                <div className="meal-emoji"><Utensils size={20} /></div>
                <div className="meal-top">
                  <span className="meal-time">{mealType}</span>
                  <span className="meal-badge veg">AI</span>
                </div>
                <h3>{name}</h3>
                <p className="meal-meta">{cuisine}</p>
                <div className="meal-metrics"><span><Flame size={14} /> {calories} kcal</span><span><BadgeCheck size={14} /> {protein}g protein</span></div>
              </motion.article>
            );
          }) : <div className="panel-card">No meal recommendations are available right now. Try again in a moment.</div>;
        })()}
      </div>
    </div>
  );
}
