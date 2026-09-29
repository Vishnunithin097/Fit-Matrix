import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  LogOut,
  Calendar,
  TrendingUp,
  Flame,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const motivationalQuotes = {
  nutrition: [
    'Nourish the body that carries you toward your goals.',
    'Small, consistent choices create lasting strength.'
  ],
  movement: [
    'Progress begins with the next deliberate rep.',
    'Show up for yourself today, one movement at a time.'
  ]
};

export default function DailyProgressDashboard() {
  const { user, logout } = useAuth();
  const [activityCompletion, setActivityCompletion] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      setQuoteIndex((currentIndex) => (currentIndex + 1) % motivationalQuotes.nutrition.length);
    }, 7000);
    return () => window.clearInterval(quoteTimer);
  }, []);

  if (!user) return null;

  const handleProgressToNextDay = () => {
    if (activityCompletion === null) {
      alert('Please select an activity completion percentage first!');
      return;
    }
    setActivityCompletion(null);
  };

  const handleLogout = async () => {
    try {
      await logout(logoutProgress);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="relative z-10 flex flex-col h-screen">
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">TODAY</h1>
              <p className="text-xs text-gray-400 font-mono">Live meal, workout, and wellness recommendations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-950/40 border border-blue-500/30 rounded-full text-xs text-blue-300 font-bold">
              <Flame size={14} className="text-orange-400" />
              {user.current_streak || 0} Day Streak
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-xs font-bold transition cursor-pointer"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-800/70 to-cyan-950/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">Fit Matrix core idea</p>
              <h2 className="mt-2 text-2xl font-black text-white">An intelligent, hyper-local, and context-aware Indian fitness and nutrition ecosystem.</h2>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Secure authentication, guided onboarding, ML-powered meal and workout routing, and squad accountability work together in one premium experience built around your goals, preferences, and daily context.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-6"
              >
                <div className="border border-blue-500/30 bg-slate-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <div className="mb-4">
                    <h2 className="text-sm font-black text-white tracking-wider flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-blue-400" /> TODAY'S PROGRESS
                    </h2>
                    <p className="text-xs text-gray-400 font-mono">Select completion percentage</p>
                  </div>

                  <div className="space-y-3">
                    {[25, 50, 75, 100].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => setActivityCompletion(percentage)}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition border-2 cursor-pointer flex items-center justify-between ${
                          activityCompletion === percentage
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-lg'
                            : 'border-blue-500/20 bg-blue-950/10 text-gray-400 hover:border-blue-500/50 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {activityCompletion === percentage && <Check size={18} />}
                          {percentage}% Complete
                        </span>
                        <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {activityCompletion && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-green-950/20 border border-green-500/30 rounded-lg text-xs text-green-400 font-mono flex items-center gap-2">
                      <Check size={14} /> Completion recorded for today!
                    </motion.div>
                  )}

                  <button
                    onClick={handleProgressToNextDay}
                    disabled={activityCompletion === null}
                    className="w-full mt-4 py-3 px-4 rounded-lg font-bold text-sm transition border-2 border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Save today's progress <ChevronRight size={18} />
                  </button>
                </div>

                <div className="border border-blue-500/20 bg-slate-800/60 backdrop-blur-md p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 font-mono mb-3">TODAY'S PRIORITY</p>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">• {user.fitness_goal || 'Balanced training'} target</div>
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2">• {user.food_preference || 'Vegetarian'} preferences applied</div>
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">• Recovery focus: {user.activity_level || 'Moderate'} day</div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
                <div className="border border-emerald-500/30 bg-slate-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Nutrition mindset</p>
                  <p className="mt-4 text-xl font-bold leading-relaxed text-white">“{motivationalQuotes.nutrition[quoteIndex]}”</p>
                  <p className="mt-3 text-xs text-slate-400 font-mono">Your complete meal plan is available in Meals.</p>
                </div>

                <div className="border border-purple-500/30 bg-slate-800/60 backdrop-blur-md p-6 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">Movement mindset</p>
                  <p className="mt-4 text-xl font-bold leading-relaxed text-white">“{motivationalQuotes.movement[quoteIndex]}”</p>
                  <p className="mt-3 text-xs text-slate-400 font-mono">Your complete workout plan is available in Workout.</p>
                </div>

                <div className="border border-blue-500/20 bg-slate-800/60 backdrop-blur-md p-6 rounded-xl">
                  <p className="text-xs font-bold text-blue-300 font-mono mb-3">YOUR PROFILE</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">Fitness Goal</span>
                      <span className="font-bold text-blue-300">{user.fitness_goal}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">Activity Level</span>
                      <span className="font-bold text-blue-300">{user.activity_level}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">Food Preference</span>
                      <span className="font-bold text-blue-300">{user.food_preference}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">BMI</span>
                      <span className="font-bold text-blue-300">{user.bmi}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">Age</span>
                      <span className="font-bold text-blue-300">{user.age} years</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-mono block">Total XP</span>
                      <span className="font-bold text-blue-300">{user.xp || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle size={28} className="text-orange-400" />
                <h2 className="text-xl font-black text-white">End Session?</h2>
              </div>

              <p className="text-gray-300 text-sm mb-6 font-mono">Before logging out, how much of today's workout did you complete?</p>

              <div className="space-y-3 mb-6">
                {[25, 50, 75, 100].map((percentage) => (
                  <button key={percentage} onClick={() => setLogoutProgress(percentage)} className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition border-2 cursor-pointer ${logoutProgress === percentage ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-blue-500/20 bg-blue-950/10 text-gray-400 hover:border-blue-500/50'}`}>
                    {percentage}% Complete
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2 px-4 rounded-lg font-bold text-sm border border-blue-500/30 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 transition cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleLogout} disabled={logoutProgress === 0} className="flex-1 py-2 px-4 rounded-lg font-bold text-sm border border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer">
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
