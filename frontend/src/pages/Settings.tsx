import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/api';

const goals = ['Maintenance', 'Muscle Gain', 'Weight Loss', 'Lean Bulking', 'Endurance Training'];
const foodPreferences = ['Vegetarian', 'Non-Vegetarian', 'Mixed'];
const regions = ['South Indian', 'North Indian', 'West Indian', 'East Indian'];
const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Maintenance');
  const [foodPreference, setFoodPreference] = useState('Vegetarian');
  const [regionPreference, setRegionPreference] = useState('South Indian');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.full_name || user?.legal_name || '');
    setFitnessGoal(user?.fitness_goal || 'Maintenance');
    setFoodPreference(user?.food_preference || 'Vegetarian');
    setRegionPreference(user?.region_preference || 'South Indian');
    setActivityLevel(user?.activity_level || 'Sedentary');
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        full_name: name.trim(),
        fitness_goal: fitnessGoal,
        food_preference: foodPreference,
        region_preference: regionPreference,
        activity_level: activityLevel,
      });
      await refreshUser();
      setMessage('Preferences saved. Meal and workout recommendations will use them next time they load.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1 className="hero-title">Personalize your Fit Matrix experience.</h1>
        </div>
      </section>

      <form className="panel-card auth-form" onSubmit={saveProfile}>
        <div className="panel-head">
          <h3>Profile and recommendations</h3>
          <span className="panel-tag">Synced</span>
        </div>
        <label>
          <span>Full name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          <span>Fitness goal</span>
          <select value={fitnessGoal} onChange={(event) => setFitnessGoal(event.target.value)}>
            {goals.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Food preference</span>
          <select value={foodPreference} onChange={(event) => setFoodPreference(event.target.value)}>
            {foodPreferences.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Region preference</span>
          <select value={regionPreference} onChange={(event) => setRegionPreference(event.target.value)}>
            {regions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Activity level</span>
          <select value={activityLevel} onChange={(event) => setActivityLevel(event.target.value)}>
            {activityLevels.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</button>
        {message ? <p className="hero-copy" role="status">{message}</p> : null}
      </form>
    </div>
  );
}
