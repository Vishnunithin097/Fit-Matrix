import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { Flame, Droplet, Plus, Sparkles, Database } from 'lucide-react';

export const NutrientCard: React.FC = () => {
  const { user, logNutrientIntake } = useUser();
  const [quickCal, setQuickCal] = useState('');
  const [quickProt, setQuickProt] = useState('');
  const [customWater, setCustomWater] = useState('');
  const [logging, setLogging] = useState(false);

  if (!user) return null;

  // Percentage calculations
  const calPercent = Math.min(100, Math.round(((user.calories_logged || 0) / (user.calorie_target || 2000)) * 100)) || 0;
  const waterPercent = Math.min(100, Math.round(((user.water_logged || 0) / (user.water_target || 3000)) * 100)) || 0;
  const protPercent = Math.min(100, Math.round(((user.protein_logged || 0) / (user.protein_target || 120)) * 100)) || 0;
  const carbsPercent = Math.min(100, Math.round(((user.carbs_logged || 0) / (user.carbs_target || 250)) * 100)) || 0;
  const fatsPercent = Math.min(100, Math.round(((user.fats_logged || 0) / (user.fats_target || 70)) * 100)) || 0;

  const handleQuickAddWater = async () => {
    setLogging(true);
    await logNutrientIntake(250, 0, 0, 0, 0);
    setLogging(false);
  };

  const handleCustomWater = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customWater);
    if (!val || val <= 0) return;
    setLogging(true);
    await logNutrientIntake(val, 0, 0, 0, 0);
    setCustomWater('');
    setLogging(false);
  };

  const handleQuickLogCal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(quickCal);
    const prot = parseInt(quickProt) || 0;
    if (!cal || cal <= 0) return;

    setLogging(true);
    // Rough estimate of macro splits for quick calorie adds if not specified
    const carbsEst = Math.round((cal * 0.5) / 4);
    const fatsEst = Math.round((cal * 0.2) / 9);

    await logNutrientIntake(0, cal, prot, carbsEst, fatsEst);
    setQuickCal('');
    setQuickProt('');
    setLogging(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. CALORIC LOGS & QUICK ADD */}
      <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono tracking-widest text-cyber-purple font-black flex items-center gap-2 font-display uppercase">
              <Flame size={16} className="text-cyber-pink animate-pulse" /> ENERGY TELEMETRY
            </h3>
            <span className="text-xs font-mono text-gray-500 font-bold">{calPercent}%</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white font-display">{user.calories_logged || 0}</span>
            <span className="text-xs font-mono text-cyber-purple font-bold">/ {user.calorie_target || 2000} KCAL</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-cyber-bg h-2.5 rounded-full overflow-hidden mb-6 border border-cyber-purple/20">
            <div
              className="bg-gradient-to-r from-cyber-purple to-cyber-pink h-full rounded-full shadow-cyber-purple transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Log Form */}
        <form onSubmit={handleQuickLogCal} className="space-y-3 border-t border-cyber-purple/15 pt-4">
          <p className="text-[10px] font-mono text-cyber-purple font-bold">// QUICK ADD NUTRITIONAL INTAKE</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={quickCal}
              onChange={e => setQuickCal(e.target.value)}
              placeholder="Calories (kcal)"
              className="bg-cyber-bg border border-cyber-purple/30 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-cyber-pink font-mono"
              disabled={logging}
              required
            />
            <input
              type="number"
              value={quickProt}
              onChange={e => setQuickProt(e.target.value)}
              placeholder="Protein (g)"
              className="bg-cyber-bg border border-cyber-purple/30 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-cyber-pink font-mono"
              disabled={logging}
            />
          </div>
          <button
            type="submit"
            disabled={logging}
            className="w-full bg-cyber-purple/20 hover:bg-cyber-purple/35 border border-cyber-purple text-white font-mono text-xs font-black tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition shadow-cyber-purple"
          >
            <Sparkles size={12} /> SYNC MEAL LOAD
          </button>
        </form>
      </div>

      {/* 2. HYDRATION LOGS & QUICK +250ML */}
      <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-cyan/20 w-3 h-3 rounded-tr" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-cyan/20 w-3 h-3 rounded-bl" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono tracking-widest text-cyber-cyan font-black flex items-center gap-2 font-display uppercase">
              <Droplet size={16} className="text-cyber-cyan animate-pulse" /> WATER SYSTEM COOLANT
            </h3>
            <span className="text-xs font-mono text-gray-500 font-bold">{waterPercent}%</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white font-display">{user.water_logged || 0}</span>
            <span className="text-xs font-mono text-cyber-cyan font-bold">/ {user.water_target || 3000} ML</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-cyber-bg h-2.5 rounded-full overflow-hidden mb-6 border border-cyber-cyan/20">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyber-cyan h-full rounded-full shadow-cyber-cyan transition-all duration-500"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-cyber-purple/15 pt-4">
          <p className="text-[10px] font-mono text-cyber-cyan font-bold">// HYDRATION MODIFIER CONTROLS</p>
          <div className="flex gap-2">
            <button
              onClick={handleQuickAddWater}
              disabled={logging}
              className="flex-1 bg-cyber-cyan/15 hover:bg-cyber-cyan/30 border border-cyber-cyan text-white font-mono text-xs font-black py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-cyber-cyan"
            >
              <Plus size={12} /> ADD 250ML
            </button>
            <form onSubmit={handleCustomWater} className="flex-1 flex gap-1">
              <input
                type="number"
                value={customWater}
                onChange={e => setCustomWater(e.target.value)}
                placeholder="Custom ml"
                className="w-full bg-cyber-bg border border-cyber-purple/30 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-cyber-cyan font-mono"
                disabled={logging}
                required
              />
              <button
                type="submit"
                disabled={logging}
                className="bg-cyber-cyan hover:bg-cyber-cyan/85 border border-cyber-cyan px-3 text-white font-black rounded-lg cursor-pointer transition shadow-cyber-cyan"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. MACRO DISTRIBUTION VECTORS */}
      <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono tracking-widest text-cyber-purple font-black flex items-center gap-2 font-display uppercase">
              <Database size={16} className="text-cyber-purple" /> MACRO METRIC BALANCERS
            </h3>
            <span className="text-[9px] font-mono text-cyber-purple font-bold">// REAL-TIME INJECTS</span>
          </div>

          <div className="space-y-4">
            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 font-bold">PROTEIN (N2)</span>
                <span className="text-white font-black">{user.protein_logged || 0}g / {user.protein_target || 120}g</span>
              </div>
              <div className="w-full bg-cyber-bg h-1.5 rounded-full overflow-hidden border border-cyber-purple/10">
                <div className="bg-cyber-pink h-full rounded-full transition-all duration-500 shadow-cyber-pink" style={{ width: `${protPercent}%` }} />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 font-bold">CARBOHYDRATES</span>
                <span className="text-white font-black">{user.carbs_logged || 0}g / {user.carbs_target || 250}g</span>
              </div>
              <div className="w-full bg-cyber-bg h-1.5 rounded-full overflow-hidden border border-cyber-purple/10">
                <div className="bg-cyber-purple h-full rounded-full transition-all duration-500 shadow-cyber-purple" style={{ width: `${carbsPercent}%` }} />
              </div>
            </div>

            {/* Fats */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 font-bold">LIPIDS (FATS)</span>
                <span className="text-white font-black">{user.fats_logged || 0}g / {user.fats_target || 70}g</span>
              </div>
              <div className="w-full bg-cyber-bg h-1.5 rounded-full overflow-hidden border border-cyber-purple/10">
                <div className="bg-cyber-violet h-full rounded-full transition-all duration-500 shadow-cyber-purple" style={{ width: `${fatsPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-mono text-gray-500 text-center mt-4 font-bold">
          // MULTIPLIER RULES APPLIED BASED ON {user.weight}KG CHASSIS TARGET.
        </div>
      </div>

    </div>
  );
};
export default NutrientCard;
