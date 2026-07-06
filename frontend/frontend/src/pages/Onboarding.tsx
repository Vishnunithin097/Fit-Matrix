import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onboardUser } from '../lib/api';

const steps = [
  { key: 'profile', title: 'Profile', subtitle: 'Your basics' },
  { key: 'goals', title: 'Goals', subtitle: 'Fitness direction' },
  { key: 'lifestyle', title: 'Lifestyle', subtitle: 'Habits & preferences' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: user?.legal_name || user?.full_name || '',
    age: user?.age?.toString() || '24',
    gender: user?.gender || 'Male',
    height: user?.height?.toString() || '175',
    weight: user?.weight?.toString() || '70',
    fitness_goal: user?.fitness_goal || 'Maintenance',
    food_preference: user?.food_preference || 'Vegetarian',
    region_preference: user?.region_preference || 'South Indian',
    activity_level: user?.activity_level || 'Moderate',
    add_egg_today: Boolean(user?.egg_today),
    today_veg_only: Boolean(user?.veg_only_today),
  });
  const [error, setError] = useState('');

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const goNext = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await onboardUser({
        ...form,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
      });
      login({ ...(user || {}), ...response.data.profile, is_onboarded: true });
      navigate('/');
    } catch {
      setError('Unable to save your profile right now. Please try again.');
    }
  };

  return (
    <div className="auth-shell">
      <motion.div className="auth-card onboarding-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-brand">
          <div className="brand-mark"><CheckCircle2 size={18} /></div>
          <div>
            <h1>Welcome to Fit Matrix</h1>
            <p>Build your context-aware profile and unlock hyper-local meal and workout recommendations.</p>
          </div>
        </div>

        <div className="step-list">
          {steps.map((item, index) => (
            <div key={item.key} className={`step-pill ${index === step ? 'active' : ''}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <div className="step-subtitle">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="progress-wrap">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <div className="progress-meta">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{progress}% complete</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {step === 0 && (
            <div className="onboarding-panel">
              <label><span>Full name</span><input name="full_name" value={form.full_name} onChange={handleChange} required /></label>
              <div className="form-grid">
                <label><span>Age</span><input type="number" name="age" value={form.age} onChange={handleChange} required /></label>
                <label><span>Gender</span><select name="gender" value={form.gender} onChange={handleChange}><option>Male</option><option>Female</option><option>Other</option></select></label>
              </div>
              <div className="form-grid">
                <label><span>Height (cm)</span><input type="number" name="height" value={form.height} onChange={handleChange} required /></label>
                <label><span>Weight (kg)</span><input type="number" name="weight" value={form.weight} onChange={handleChange} required /></label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-panel">
              <div className="form-grid">
                <label><span>Fitness goal</span><select name="fitness_goal" value={form.fitness_goal} onChange={handleChange}><option>Maintain Weight</option><option>Weight Gain</option><option>Fat Loss</option></select></label>
                <label><span>Activity level</span><select name="activity_level" value={form.activity_level} onChange={handleChange}><option>Sedentary</option><option>Light</option><option>Moderate</option><option>Active</option><option>Very Active</option></select></label>
              </div>
              <label><span>Region preference</span><select name="region_preference" value={form.region_preference} onChange={handleChange}><option>South Indian</option><option>North Indian</option><option>West Indian</option><option>East Indian</option></select></label>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-panel">
              <div className="form-grid">
                <label><span>Food preference</span><select name="food_preference" value={form.food_preference} onChange={handleChange}><option>Vegetarian</option><option>Non-Vegetarian</option><option>Vegan</option></select></label>
                <label><span>Diet format</span><select name="region_preference" value={form.region_preference} onChange={handleChange}><option>South Indian</option><option>North Indian</option><option>West Indian</option><option>East Indian</option></select></label>
              </div>
              <label className="checkbox-row"><input type="checkbox" name="add_egg_today" checked={Boolean(form.add_egg_today)} onChange={handleChange} /> Add egg today</label>
              <label className="checkbox-row"><input type="checkbox" name="today_veg_only" checked={Boolean(form.today_veg_only)} onChange={handleChange} /> Vegetarian-only today</label>
            </div>
          )}

          {error ? <p className="auth-alt" style={{ color: '#fda4af' }}>{error}</p> : null}

          <div className="auth-row">
            <button type="button" className="secondary-btn" onClick={goBack} disabled={step === 0}><ArrowLeft size={16} /> Back</button>
            {step < steps.length - 1 ? (
              <button type="button" className="primary-btn" onClick={goNext}>Next <ArrowRight size={16} /></button>
            ) : (
              <button className="primary-btn" type="submit">Save profile</button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
