import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { NutrientCard } from './NutrientCard.tsx';
import { ChallengeBox } from './ChallengeBox.tsx';
import { SocialMatrix } from './SocialMatrix.tsx';
import { ChatBubble } from './ChatBubble.tsx';
import { MotivationBlock } from './MotivationBlock.tsx';
import {
  Shield,
  Activity,
  Flame,
  Utensils,
  Dumbbell,
  BarChart3,
  MessageSquareCode,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Layers,
  HeartPulse,
  Egg,
  Check,
  Zap,
  Info
} from 'lucide-react';

export const DashboardCore: React.FC = () => {
  const {
    user,
    mealsPlan,
    workoutPlan,
    toggleOperationMode,
    toggleDietaryRules,
    logoutUser,
    logs
  } = useUser();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'workouts' | 'analytics' | 'chatbot' | 'squad' | 'settings'>('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(100);
  const [activeMealDay, setActiveMealDay] = useState(0); // 0-6 represent Day 1-7
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(0);
  const [savingMode, setSavingMode] = useState(false);

  if (!user) return null;

  const handleToggleMode = async () => {
    setSavingMode(true);
    const targetMode = user.activate_day ? 'REST' : 'ACTIVATE';
    await toggleOperationMode(targetMode);
    setSavingMode(false);
  };

  const handleToggleDiet = async (field: 'egg' | 'veg') => {
    setSavingMode(true);
    const nextEgg = field === 'egg' ? !user.egg_today : user.egg_today;
    const nextVeg = field === 'veg' ? !user.veg_only_today : user.veg_only_today;
    
    // Clear conflicting toggles if necessary
    const clearedVeg = field === 'egg' && nextEgg ? false : nextVeg ?? false;
    const clearedEgg = field === 'veg' && nextVeg ? false : nextEgg ?? false;

    await toggleDietaryRules(clearedEgg, clearedVeg);
    setSavingMode(false);
  };

  const handleTriggerLogout = async () => {
    await logoutUser(logoutProgress);
    setShowLogoutModal(false);
  };

  // Nav configuration
  const navigationItems = [
    { id: 'dashboard', name: 'DASHBOARD CORE', icon: Layers },
    { id: 'meals', name: 'NUTRITION PROTOCOLS', icon: Utensils },
    { id: 'workouts', name: 'KINETIC WORKOUTS', icon: Dumbbell },
    { id: 'analytics', name: 'BIOLOGIC ANALYTICS', icon: BarChart3 },
    { id: 'chatbot', name: 'CYBER ORACLE AI', icon: MessageSquareCode },
    { id: 'squad', name: 'SQUAD WORKSPACE', icon: Users },
    { id: 'settings', name: 'BIO-METRIC CONFIG', icon: Settings }
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030303] text-slate-100 flex flex-col md:flex-row font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(188,19,254,0.14),_transparent_35%),linear-gradient(120deg,_#040307_0%,_#020202_55%,_#0a050f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,255,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_65%,transparent_100%)] opacity-25" />

      <aside className="relative z-10 w-full md:w-64 border-r border-fuchsia-400/20 bg-black/75 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Cyber Brand Emblem */}
          <div className="p-6 border-b border-cyber-purple/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyber-purple to-cyber-pink flex items-center justify-center text-white shadow-cyber-purple border border-cyber-purple/20">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-pink font-display">FIT MATRIX</h1>
              <span className="text-[9px] text-cyber-purple block uppercase font-bold">// SYSTEM HUB V4.2</span>
            </div>
          </div>

          {/* User Bio telemetry widget */}
          <div className="p-4 mx-4 my-4 bg-cyber-violet/40 border border-cyber-purple/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-cyber-purple uppercase font-bold">SYS_OPERATOR:</span>
              <span className="text-[9px] text-cyber-pink font-bold">STREAK: {user.current_streak}D 🔥</span>
            </div>
            <p className="text-xs text-white font-black truncate font-display">{user.full_name || 'ANONYMOUS'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-cyber-purple font-bold">{user.xp ?? user.total_xp ?? 0} XP</span>
              <div className="flex-1 bg-cyber-bg h-1 rounded overflow-hidden border border-cyber-purple/10">
                <div className="bg-cyber-pink h-full shadow-cyber-pink" style={{ width: `${Math.min(100, ((user.xp ?? user.total_xp ?? 0) % 100))}%` }} />
              </div>
            </div>
          </div>

          {/* Nav list */}
          <nav className="px-3 space-y-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs tracking-wider transition font-mono border cursor-pointer ${
                    isActive
                      ? 'bg-cyber-purple/10 border-l-2 border-cyber-purple text-cyber-purple shadow-[inset_0_0_10px_rgba(188,19,254,0.15)]'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-cyber-purple/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-cyber-purple' : 'text-gray-500'} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-cyber-purple/10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-900/40 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 py-2.5 rounded-lg text-xs font-bold tracking-wider transition cursor-pointer"
          >
            <LogOut size={14} /> DISCONNECT CORE
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 flex flex-col h-screen overflow-y-auto bg-black/20 backdrop-blur-sm">
        <header className="border-b border-fuchsia-400/20 bg-black/70 backdrop-blur-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] text-cyber-purple tracking-widest block uppercase font-bold">// MATRIX NODE SYNC</span>
            <h2 className="text-lg font-black text-white tracking-tight uppercase font-display">
              {activeTab === 'dashboard' ? 'SYS_INTEGRATOR_DASHBOARD' : `${activeTab}_PROTOCOL_SHELL`}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode indicators */}
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
              user.activate_day
                ? 'bg-green-950/30 border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                : 'bg-yellow-950/30 border-yellow-600 text-yellow-400 shadow-[0_0_8px_rgba(202,138,4,0.15)]'
            }`}>
              {user.activate_day ? '● ACTIVE WORKOUT MODE' : '☾ REST & RECOVERY MODE'}
            </div>
            
            <div className="bg-cyber-purple/10 border border-cyber-purple/25 px-3 py-1 rounded-full text-[10px] text-cyber-purple font-bold">
              SYS_TEMPEST: {(user.bmi || 22).toFixed(1)} BMI
            </div>
          </div>
        </header>

        {/* View Routing */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          <section className="rounded-[1.35rem] border border-cyber-purple/20 bg-gradient-to-br from-black/80 via-zinc-950/80 to-fuchsia-950/20 p-5 shadow-[0_0_30px_rgba(255,0,255,0.12)] relative overflow-hidden">
            <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
            <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black tracking-[0.3em] text-cyber-pink uppercase">IDEA PART 2:4</p>
                <h3 className="text-sm font-black tracking-widest text-white font-display mt-1">INTERACTIVE LIVE TELEMETRY & REAL-TIME OVERRIDES</h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-2">
                  Your fitness OS now combines live tracking, instant diet overrides, an AI coaching chatbot, a squad synchronization hub, and recovery-aware session handling into one adaptive workflow.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-gray-300">
                <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 px-3 py-2">
                  <span className="text-cyber-purple font-black block">LIVE TELEMETRY</span>
                  Workout, meal, water, and macro events update the system instantly.
                </div>
                <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 px-3 py-2">
                  <span className="text-cyber-pink font-black block">REAL-TIME OVERRIDES</span>
                  Add egg today or switch to veg-only for one day without changing your profile.
                </div>
                <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 px-3 py-2">
                  <span className="text-cyber-purple font-black block">AI HEALTH CHATBOT</span>
                  Ask for guidance or scan a nutrition label for fast macro feedback.
                </div>
                <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 px-3 py-2">
                  <span className="text-cyber-pink font-black block">SQUAD & RECOVERY</span>
                  Sync progress with teammates and preserve your state with smart session recovery.
                </div>
              </div>
            </div>
          </section>
          
          {/* TAB 1: DASHBOARD CORE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Operational state and diet triggers */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Day vs. Rest Day controller */}
                <div className="rounded-[1.35rem] border border-fuchsia-400/20 bg-gradient-to-br from-black/80 via-zinc-950/80 to-fuchsia-950/20 p-5 shadow-[0_0_30px_rgba(255,0,255,0.12)] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                  <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                  <div>
                    <h4 className="text-xs font-black tracking-wider text-white flex items-center gap-1.5 mb-1 font-display">
                      <HeartPulse size={12} className="text-cyber-pink" /> STREAK TIMELINE CONTROL
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                      Toggle active protocols. Rest mode suspends physical programs and switches nutrients to stomach-friendly recovery meals.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleMode}
                    disabled={savingMode}
                    className={`w-full py-2.5 rounded-lg font-black text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      user.activate_day
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 border-yellow-400 text-white shadow-[0_0_10px_#facc15]'
                        : 'bg-gradient-to-r from-cyber-purple via-cyber-pink to-cyber-purple border-cyber-purple text-white shadow-cyber-purple animate-cyber-glow'
                    }`}
                  >
                    <Zap size={12} /> {user.activate_day ? 'ACTIVATE REST PROTOCOLS' : 'ACTIVATE HIGH KINETICS'}
                  </button>
                </div>

                {/* Dietary Overrides (Egg Today & Veg Only Today) */}
                <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-5 rounded-xl col-span-2 shadow-cyber-purple flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                  <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                  <div>
                    <h4 className="text-xs font-black tracking-wider text-white flex items-center gap-1.5 mb-1 font-display">
                      <Egg size={12} className="text-cyber-purple" /> DAILY DIETARY RULE OVERRIDES
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                      Modify meals dynamically. "Add Egg Today" injects protein boosters into today's schedule. "Today Veg Only" shifts non-vegetarian meals to clean plant substitutes.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleToggleDiet('egg')}
                      disabled={savingMode}
                      className={`py-2.5 px-3 border rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                        user.egg_today
                          ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink shadow-cyber-pink'
                          : 'border-cyber-purple/30 text-cyber-purple hover:border-cyber-purple/60'
                      }`}
                    >
                      <Egg size={14} /> ADD EGG TODAY: {user.egg_today ? 'ACTIVE' : 'OFF'}
                    </button>
                    <button
                      onClick={() => handleToggleDiet('veg')}
                      disabled={savingMode}
                      className={`py-2.5 px-3 border rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                        user.veg_only_today
                          ? 'border-cyber-purple bg-cyber-purple/10 text-cyber-purple shadow-cyber-purple'
                          : 'border-cyber-purple/30 text-cyber-purple hover:border-cyber-purple/60'
                      }`}
                    >
                      <Check size={14} /> TODAY VEG ONLY: {user.veg_only_today ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                </div>

              </section>

              {/* Motivational Hacker Block */}
              <MotivationBlock />

              {/* Nutrient and Water Telemetry widgets */}
              <NutrientCard />

              {/* Bento bottom block: Daily directives challenge + Squad micro sync */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChallengeBox />
                <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                  <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                  <div>
                    <h4 className="text-xs font-black tracking-wider text-cyber-purple flex items-center gap-1.5 mb-1.5 font-display">
                      <Users size={14} /> SQUAD SYNCHRONIZER
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Keep updated with your connected cluster teammates. Clear streaks together and share macro achievements across social indices.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('squad')}
                    className="w-full bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple text-cyber-purple hover:text-white font-mono text-xs py-2.5 rounded-lg font-black cursor-pointer transition text-center shadow-cyber-purple"
                  >
                    LAUNCH SQUAD CORE INTERFACE
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: MEALS PLANS */}
          {activeTab === 'meals' && (
            <div className="space-y-6">
              <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple relative overflow-hidden">
                <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyber-purple/15 pb-4 mb-6 gap-4">
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-cyber-purple font-mono uppercase">
                      7-DAY INTEGRATED DIET RECOGNIZER
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Weight protocol filtering: {user.weight < 50 ? 'Weight Gain (+20%)' : user.weight > 80 ? 'Fat Loss (-20%)' : 'Balanced Maintenance'}</p>
                  </div>
                  
                  {/* Days tab Selector */}
                  <div className="flex flex-wrap gap-1 bg-cyber-bg p-1 border border-cyber-purple/20 rounded-lg">
                    {Array(7).fill(0).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMealDay(idx)}
                        className={`px-3 py-1 text-xs font-mono rounded-md cursor-pointer ${
                          activeMealDay === idx
                            ? 'bg-cyber-pink text-white font-black shadow-cyber-pink'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        DAY {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day Meals output */}
                {mealsPlan && (mealsPlan.weekly_food_plan ? mealsPlan.weekly_food_plan[activeMealDay] : mealsPlan.days?.[activeMealDay]) ? (
                  <div className="space-y-4">
                    {(mealsPlan.weekly_food_plan ? mealsPlan.weekly_food_plan[activeMealDay].meals : Object.entries(mealsPlan.days[activeMealDay]).map(([mealType, dish]: any) => ({ ...dish, mealType })) ).map((dish: any, idx: number) => (
                      <div key={`${dish.mealType || dish.name}-${idx}`} className="border border-cyber-purple/10 bg-cyber-bg/50 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 transition hover:border-cyber-purple/35">
                        <div>
                          <span className="text-[10px] font-mono text-cyber-pink font-black uppercase tracking-wider">{dish.mealType || dish.mealType}</span>
                          <h4 className="text-sm font-black text-white font-display mt-1">{dish.name}</h4>
                          {dish.description && <p className="text-xs text-gray-400 mt-1 italic">{dish.description}</p>}
                        </div>
                        <div className="flex flex-wrap md:flex-col justify-end text-right gap-x-4 gap-y-1 shrink-0 min-w-[140px] border-t md:border-t-0 md:border-l border-cyber-purple/15 pt-2 md:pt-0 md:pl-4">
                          <span className="text-xs font-mono text-cyber-purple font-black">{dish.calories ?? 'N/A'} kcal</span>
                          <span className="text-[10px] font-mono text-gray-500">P: {dish.protein ?? '--'}g | C: {dish.carbs ?? '--'}g | F: {dish.fats ?? '--'}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-cyber-purple/25 rounded text-gray-500 text-xs">
                    No nutrition plan currently generated. Try refreshing your biometrics profile.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WORKOUTS PLANS */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple relative overflow-hidden">
                <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                <div className="border-b border-cyber-purple/15 pb-4 mb-6">
                  <h3 className="text-sm font-black tracking-widest text-cyber-purple font-mono uppercase">
                    KINETIC PROTOCOLS: {user.weight < 50 ? 'Hypertrophy Muscle-Building' : user.weight > 80 ? 'Fat Loss Metabolic Burn' : 'Stamina Maintenance'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Constructed dynamically to fit physical specs.</p>
                </div>

                {workoutPlan && workoutPlan.routine ? (
                  <div className="space-y-6">
                    {/* Totals overview widget */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-cyber-violet/40 border border-cyber-purple/20 p-4 rounded-xl text-center shadow-cyber-purple">
                      <div>
                        <span className="text-[9px] text-cyber-purple block font-bold">TOTAL EXPENSE</span>
                        <span className="text-sm font-black text-white">{workoutPlan.routine.totalCaloriesBurned} KCAL</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-cyber-purple block font-bold">PROTOCOL DURATION</span>
                        <span className="text-sm font-black text-white">{workoutPlan.routine.totalDuration} MIN</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-cyber-purple block font-bold">SYSTEM LOAD LEVEL</span>
                        <span className="text-sm font-black text-cyber-pink uppercase font-display">METABOLIC</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-cyber-purple block font-bold">STABILITY CONTROL</span>
                        <span className="text-sm font-black text-cyber-cyan uppercase font-display">ACTIVE</span>
                      </div>
                    </div>

                    {/* Breakdown routines */}
                    {['warmUp', 'strength', 'cardio', 'flexibility', 'coolDown'].map(phase => {
                      const list = workoutPlan.routine[phase];
                      if (!list || list.length === 0) return null;

                      return (
                        <div key={phase} className="space-y-3">
                          <span className="text-[10px] font-mono text-cyber-purple font-black uppercase tracking-widest block border-l-2 border-cyber-pink pl-2">
                            {phase.replace(/([A-Z])/g, ' $1')} Phase
                          </span>
                          <div className="space-y-2">
                            {list.map((ex: any, idx: number) => (
                              <div key={idx} className="border border-cyber-purple/10 bg-cyber-bg/50 p-3 rounded-xl flex items-center justify-between text-xs font-mono transition hover:border-cyber-purple/30">
                                <div>
                                  <span className="text-white font-black font-display">{ex.exercise}</span>
                                  <p className="text-[10px] text-gray-500 mt-0.5">Target: {ex.targetMuscle} | Difficulty: {ex.difficulty}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-cyber-pink font-black block">{ex.sets} Sets x {ex.reps} Reps</span>
                                  <span className="text-[10px] text-gray-500">{ex.duration} Min | {ex.caloriesBurned} Kcal</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-cyber-purple/25 rounded text-gray-500 text-xs">
                    No workout routines found. Transition Day Mode to ACTIVATE to initialize routines.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS CELL */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                <div>
                  <h3 className="text-sm font-black tracking-widest text-cyber-purple font-mono uppercase">
                    BIOLOGIC ANALYTICS MONITOR
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Synthesized biometric outputs across the active session.</p>
                </div>

                {/* Simulated visual analytics grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Calorie completion bar chart mock */}
                  <div className="border border-cyber-purple/10 p-4 rounded-xl bg-cyber-bg/60">
                    <span className="text-[10px] font-mono text-cyber-purple block mb-4 font-bold">WEEKLY CALORIC COMPLIANCE RATIO</span>
                    <div className="h-40 flex items-end justify-between gap-2 pt-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                        const hRatio = [85, 95, 100, 70, 90, 80, 100][i];
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span className="text-[8px] font-mono text-gray-500">{hRatio}%</span>
                            <div className="w-full bg-cyber-violet rounded-t overflow-hidden flex items-end" style={{ height: '80%' }}>
                              <div className="w-full bg-gradient-to-t from-cyber-purple to-cyber-pink rounded-t shadow-cyber-purple" style={{ height: `${hRatio}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-gray-400">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Water intake timeline */}
                  <div className="border border-cyber-purple/10 p-4 rounded-xl bg-cyber-bg/60">
                    <span className="text-[10px] font-mono text-cyber-cyan block mb-4 font-bold">WEEKLY FLUID INGESTION TIMELINE (ML)</span>
                    <div className="h-40 flex items-end justify-between gap-2 pt-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                        const amount = [2800, 3100, 3500, 2900, 3200, 3600, 3500][i];
                        const pct = Math.min(100, Math.round((amount / 3500) * 100));
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span className="text-[8px] font-mono text-gray-500">{amount}</span>
                            <div className="w-full bg-[#0a2335] rounded-t overflow-hidden flex items-end" style={{ height: '80%' }}>
                              <div className="w-full bg-cyber-cyan rounded-t shadow-cyber-cyan" style={{ height: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-gray-400">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Progress summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-cyber-purple/20 pt-6">
                  <div>
                    <span className="text-xl font-black text-white font-display">{user.weight} kg</span>
                    <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 font-bold">CURRENT CHASSIS LOAD</p>
                  </div>
                  <div>
                    <span className="text-xl font-black text-cyber-pink font-display">{(user.bmi || 21).toFixed(1)}</span>
                    <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 font-bold">ESTIMATED BMI VECTOR</p>
                  </div>
                  <div>
                    <span className="text-xl font-black text-cyber-purple font-display">{(user.bmr || 1500)} kcal</span>
                    <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 font-bold">BASAL METABOLIC RATING</p>
                  </div>
                  <div>
                    <span className="text-xl font-black text-cyber-cyan font-display">{user.current_streak} days</span>
                    <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 font-bold">CONSECUTIVE DAYS ACTIVE</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI ORACLE */}
          {activeTab === 'chatbot' && <ChatBubble />}

          {/* TAB 6: SQUAD SECTOR */}
          {activeTab === 'squad' && <SocialMatrix />}

          {/* TAB 7: PROFILE CONFIGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
                <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
                <div>
                  <h3 className="text-sm font-black tracking-widest text-cyber-purple font-mono uppercase">
                    BIOMETRIC CONFIGURATION DATA
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Review locked bio-vectors of your cyber-profile.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono">
                  <div className="space-y-3.5 border border-cyber-purple/10 p-4 rounded-xl bg-cyber-bg/50">
                    <span className="text-[10px] text-cyber-pink block font-bold">// BASIC PROFILE SPECIFICS</span>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">OPERATOR NAME:</span>
                      <span className="text-white font-black">{user.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">EMAIL LINK:</span>
                      <span className="text-white font-black">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">AGE:</span>
                      <span className="text-white font-black">{user.age} Years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">GENDER VECTOR:</span>
                      <span className="text-white font-black">{user.gender}</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 border border-cyber-purple/10 p-4 rounded-xl bg-cyber-bg/50">
                    <span className="text-[10px] text-cyber-purple block font-bold">// CRITICAL CALCULATED COEFFICIENTS</span>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">DAILY CALORIES BUDGET:</span>
                      <span className="text-white font-black">{user.calorie_target} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">WATER FLOOD TARGET:</span>
                      <span className="text-white font-black">{user.water_target} ml</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">TARGET PROTEIN INTAKE:</span>
                      <span className="text-white font-black">{user.protein_target}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">TARGET ACTIVE DIRECTION:</span>
                      <span className="text-white font-black">{user.fitness_goal}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-cyber-purple/20 bg-cyber-purple/5 text-[10.5px] text-gray-400 leading-relaxed font-mono flex gap-2.5 rounded-lg">
                  <Info size={16} className="shrink-0 text-cyber-purple" />
                  <span>
                    These biometrics parameters are calculated dynamically at onboarding based on the Mifflin-St Jeor equation factoring your height, weight, activity load, and body mass calculations. Re-register to reset database telemetry values.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. INTELLIGENT LOGOUT RECOVERY MODAL OVERLAY */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-cyber-bg/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-cyber-pink/40 bg-cyber-dark p-6 rounded-xl shadow-cyber-pink text-gray-200 text-center font-mono space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink w-4 h-4 rounded-tr" />
            <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink w-4 h-4 rounded-bl" />
            <div>
              <span className="text-[9px] text-cyber-pink tracking-widest block uppercase font-bold">// METRIC COMPLIANCE LOGGER</span>
              <h3 className="text-lg font-black text-white tracking-tight font-display">SECURE COGNITIVE SESSION LOGOUT</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Before releasing your network connection, choose today's complete biometric schedule compliance percentage. Re-logging within 24 hours preserves your active streaks!
              </p>
            </div>

            {/* Slider / Button loggers options */}
            <div className="space-y-3">
              <span className="text-[10px] text-cyber-purple block uppercase font-bold">CHOOSE COMPLIANCE LEVEL: {logoutProgress}%</span>
              <div className="flex gap-2">
                {[25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => setLogoutProgress(val)}
                    className={`flex-1 py-2.5 border rounded-lg text-xs font-black transition cursor-pointer ${
                      logoutProgress === val
                        ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink shadow-cyber-pink'
                        : 'border-cyber-purple/20 bg-cyber-bg text-cyber-purple'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Progress detail mapping */}
            <div className="bg-cyber-purple/5 border border-cyber-purple/20 p-3.5 rounded-lg text-left text-[11px] space-y-1.5 leading-relaxed text-gray-300">
              {logoutProgress === 25 && <p>⚠️ [ALERT] Commencing log with 25% completed metrics. Streak could be compromised if calories remain un-logged.</p>}
              {logoutProgress === 50 && <p>⚠️ [ALERT] Commencing log with 50% completed metrics. Partially secured daily schedule.</p>}
              {logoutProgress === 75 && <p>✅ [PASS] Commencing log with 75% completed metrics. Majority criteria met. Solid effort today!</p>}
              {logoutProgress === 100 && <p>🔥 [MAXIMUM] Commencing log with 100% completed metrics. Flawless execution. Double-checked biometric compliance recorded.</p>}
            </div>

            {/* Actions buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 border border-cyber-purple/30 hover:border-cyber-purple text-cyber-purple py-2.5 rounded-lg text-xs tracking-wider transition cursor-pointer bg-transparent hover:text-white"
              >
                RETRACT DISCONNECT
              </button>
              <button
                onClick={handleTriggerLogout}
                className="flex-1 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:from-cyber-pink/90 hover:to-cyber-purple/90 text-white font-black py-2.5 rounded-lg text-xs tracking-wider shadow-cyber-pink transition cursor-pointer flex items-center justify-center gap-1"
              >
                DISCONNECT CHANNEL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default DashboardCore;
