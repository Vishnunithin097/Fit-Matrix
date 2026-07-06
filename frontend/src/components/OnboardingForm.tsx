import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Activity, Award, User, Layers, ArrowRight, ArrowLeft, Egg, Leaf } from 'lucide-react';

interface OnboardingFormProps {
  onSuccess: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSuccess }) => {
  const { submitOnboarding, error, clearError } = useUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Profile Form state
  const [formData, setFormData] = useState({
    full_name: '',
    age: 25,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    height: 175,
    weight: 70,
    fitness_goal: 'Maintenance' as 'Weight Loss' | 'Muscle Gain' | 'Lean Bulking' | 'Endurance Training' | 'Maintenance',
    food_preference: 'Vegetarian' as 'Vegetarian' | 'Non-Vegetarian' | 'Mixed',
    region_preference: 'South' as 'South' | 'North' | 'East' | 'West' | 'All',
    activity_level: 'Moderate' as 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active' | 'Professional Athlete' | 'Rehabilitation'
  });

  const [dailyPreferences, setDailyPreferences] = useState({
    add_egg_today: false,
    today_veg_only: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value
    }));
  };

  const handleSelectOption = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleDailyPreference = (field: string, value: boolean) => {
    setDailyPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    clearError();
    if (step === 1 && !formData.full_name.trim()) {
      return; // validate name
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    clearError();
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await submitOnboarding({ ...formData, ...dailyPreferences });
    setSubmitting(false);
    if (ok) {
      onSuccess();
    }
  };

  // Steps indicator configuration
  const stepsConfig = [
    { title: 'Identity', icon: User },
    { title: 'Vitals', icon: Activity },
    { title: 'Directives', icon: Layers },
    { title: 'Preferences', icon: Award }
  ];

  return (
    <div className="w-full max-w-xl mx-auto border border-cyber-purple/30 bg-cyber-dark/80 backdrop-blur-md p-8 rounded-lg shadow-cyber-purple text-gray-200">
      
      {/* Upper header diagnostics */}
      <div className="flex items-center justify-between mb-8 border-b border-cyber-purple/20 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-pink font-display">
            PHYSIOLOGICAL PROFILE MATRIX
          </h2>
          <p className="text-xs font-mono text-cyber-purple mt-1">BIOMETRICS PROTOCOL SEED_V2.0</p>
        </div>
        <Shield className="text-cyber-pink animate-pulse w-6 h-6" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-8">
        {stepsConfig.map((s, idx) => {
          const ActiveIcon = s.icon;
          const num = idx + 1;
          const isDone = step > num;
          const isActive = step === num;
          
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? 'bg-cyber-purple border-cyber-purple text-white shadow-cyber-purple'
                      : isActive
                      ? 'bg-cyber-bg border-cyber-pink text-cyber-pink shadow-cyber-pink'
                      : 'bg-cyber-bg border-gray-800 text-gray-600'
                  }`}
                >
                  <ActiveIcon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-mono mt-2 ${isActive ? 'text-cyber-pink font-bold' : 'text-gray-500'}`}>
                  {s.title.toUpperCase()}
                </span>
              </div>
              {idx < stepsConfig.length - 1 && (
                <div className={`flex-1 h-[2px] transition-all duration-300 ${step > num ? 'bg-cyber-purple' : 'bg-gray-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-500/20 bg-red-950/20 text-red-400 font-mono text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-xs font-mono text-cyber-purple tracking-wider">FULL USERNAME DEFINITION</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g., Vishnu Nithin"
                  className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-cyber-purple tracking-wider">AGE VECTOR</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="10"
                    max="120"
                    className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-cyber-purple tracking-wider">BIOLOGICAL GENDER</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.full_name.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyber-purple to-cyber-pink hover:from-cyber-purple/90 hover:to-cyber-pink/90 text-white font-mono text-sm font-bold tracking-wider py-3 px-6 rounded shadow-cyber-purple transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  NEXT METRICS <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-cyber-purple tracking-wider">HEIGHT VECTOR (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    min="100"
                    max="250"
                    className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                    required
                  />
                  <span className="text-[10px] font-mono text-gray-500 block mt-1">Limits: 100cm - 250cm</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-cyber-purple tracking-wider">WEIGHT VECTOR (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="30"
                    max="250"
                    className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                    required
                  />
                  <span className="text-[10px] font-mono text-gray-500 block mt-1">Limits: 30kg - 250kg</span>
                </div>
              </div>

              {/* Real-time BMI Diagnostic indicator preview */}
              <div className="p-4 border border-cyber-purple/20 bg-cyber-dark/80 rounded">
                <p className="text-[10px] font-mono text-cyber-purple">REAL-TIME TELEMETRY DIAGNOSTIC PREVIEW</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-mono">ESTIMATED BMI:</span>
                  <span className="text-xl font-mono text-cyber-pink font-bold">
                    {((formData.weight) / (((formData.height) / 100) * ((formData.height) / 100))).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 border border-cyber-purple/30 hover:border-cyber-purple/60 text-cyber-purple hover:text-white font-mono text-sm tracking-wider py-3 px-5 rounded transition cursor-pointer bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" /> RETRACT
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyber-purple to-cyber-pink hover:from-cyber-purple/90 hover:to-cyber-pink/90 text-white font-mono text-sm font-bold tracking-wider py-3 px-6 rounded shadow-cyber-purple transition cursor-pointer"
                >
                  NEXT TARGETS <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-xs font-mono text-cyber-purple tracking-wider">FITNESS PROTOCOL DIRECTIVE</label>
                <select
                  name="fitness_goal"
                  value={formData.fitness_goal}
                  onChange={handleChange}
                  className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                >
                  <option value="Weight Loss">Weight Loss (Caloric Deficit)</option>
                  <option value="Muscle Gain">Muscle Gain (Surplus + Resistance)</option>
                  <option value="Lean Bulking">Lean Bulking (Controlled Surplus)</option>
                  <option value="Endurance Training">Endurance Training (Cardiovascular Focus)</option>
                  <option value="Maintenance">Maintenance (Baseline Sustenance)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-cyber-purple tracking-wider">ACTIVITY LOAD FACTOR</label>
                <select
                  name="activity_level"
                  value={formData.activity_level}
                  onChange={handleChange}
                  className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                >
                  <option value="Sedentary">Sedentary (No Exercise)</option>
                  <option value="Light">Light (1-2 Days/Wk)</option>
                  <option value="Moderate">Moderate (3-4 Days/Wk)</option>
                  <option value="Active">Active (5-6 Days/Wk)</option>
                  <option value="Very Active">Very Active (Daily Training)</option>
                  <option value="Professional Athlete">Professional Athlete (Elite Training)</option>
                  <option value="Rehabilitation">Rehabilitation (Recovery Focus)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-cyber-purple tracking-wider">CULINARY FRAMEWORK</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOption('food_preference', 'Vegetarian')}
                    className={`py-2 px-1 border rounded text-xs font-mono transition cursor-pointer ${
                      formData.food_preference === 'Vegetarian'
                        ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink'
                        : 'border-cyber-purple/30 text-cyber-purple'
                    }`}
                  >
                    VEGETARIAN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOption('food_preference', 'Non-Vegetarian')}
                    className={`py-2 px-1 border rounded text-xs font-mono transition cursor-pointer ${
                      formData.food_preference === 'Non-Vegetarian'
                        ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink'
                        : 'border-cyber-purple/30 text-cyber-purple'
                    }`}
                  >
                    NON-VEG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOption('food_preference', 'Mixed')}
                    className={`py-2 px-1 border rounded text-xs font-mono transition cursor-pointer ${
                      formData.food_preference === 'Mixed'
                        ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink'
                        : 'border-cyber-purple/30 text-cyber-purple'
                    }`}
                  >
                    MIXED
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-cyber-purple tracking-wider">REGIONAL PALATE VECTOR</label>
                <select
                  name="region_preference"
                  value={formData.region_preference}
                  onChange={handleChange}
                  className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
                >
                  <option value="South">South Indian Palate</option>
                  <option value="North">North Indian Palate</option>
                  <option value="East">East Indian Palate</option>
                  <option value="West">West Indian Palate</option>
                  <option value="All">All Regional Cuisines</option>
                </select>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 border border-cyber-purple/30 hover:border-cyber-purple/60 text-cyber-purple hover:text-white font-mono text-sm tracking-wider py-3 px-5 rounded transition cursor-pointer bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" /> RETRACT
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyber-purple to-cyber-pink hover:from-cyber-purple/90 hover:to-cyber-pink/90 text-white font-mono text-sm font-bold tracking-wider py-3 px-6 rounded shadow-cyber-purple transition cursor-pointer"
                >
                  NEXT PREFERENCES <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-cyber-dark/40 border border-cyber-purple/20 rounded p-4">
                <p className="text-xs font-mono text-cyber-purple mb-4">DAILY NUTRITION TOGGLES - CONFIGURE YOUR DAILY FOOD PREFERENCES</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-cyber-purple/20 bg-cyber-dark/40 rounded hover:bg-cyber-dark/60 transition">
                  <div className="flex items-center gap-3">
                    <Egg className="w-5 h-5 text-cyber-pink" />
                    <div>
                      <p className="text-sm font-mono font-bold text-white">EGG DAY MODE</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">Include eggs in today's meal recommendations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDailyPreference('add_egg_today', !dailyPreferences.add_egg_today)}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      dailyPreferences.add_egg_today ? 'bg-cyber-pink' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        dailyPreferences.add_egg_today ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-cyber-purple/20 bg-cyber-dark/40 rounded hover:bg-cyber-dark/60 transition">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-mono font-bold text-white">VEG ONLY DAY</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">Recommend only vegetarian foods today</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDailyPreference('today_veg_only', !dailyPreferences.today_veg_only)}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      dailyPreferences.today_veg_only ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        dailyPreferences.today_veg_only ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-cyber-dark/40 border border-cyber-purple/20 rounded p-3 text-xs font-mono text-gray-400">
                <p>💡 TIP: These daily toggles override your general food preference for today only. Toggle them off tomorrow to reset.</p>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 border border-cyber-purple/30 hover:border-cyber-purple/60 text-cyber-purple hover:text-white font-mono text-sm tracking-wider py-3 px-5 rounded transition cursor-pointer bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" /> RETRACT
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:from-cyber-pink/90 hover:to-cyber-purple/90 text-white font-mono text-sm font-bold tracking-wider py-3 px-8 rounded shadow-cyber-pink transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'CALCULATING BIOMETRICS...' : 'INITIALIZE MATRIX'} <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
export default OnboardingForm;
