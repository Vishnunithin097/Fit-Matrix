import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Zap,
  Coffee,
  Sun,
  Moon,
  LogOut,
  Calendar,
  Flame,
  Check,
  AlertCircle,
  MessageCircle,
  X,
  Send
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  name: string;
  calories: number;
  protein: number;
  icon: ReactNode;
}

interface DailyMeal {
  Breakfast: Meal;
  Lunch: Meal;
  Snack: Meal;
  Dinner: Meal;
}

const sampleMeals: DailyMeal[] = [
  {
    Breakfast: { type: 'Breakfast', name: 'Protein Oatmeal with Berries', calories: 450, protein: 25, icon: <Coffee size={20} /> },
    Lunch: { type: 'Lunch', name: 'Grilled Chicken Rice Bowl', calories: 650, protein: 45, icon: <Sun size={20} /> },
    Snack: { type: 'Snack', name: 'Greek Yogurt & Granola', calories: 250, protein: 15, icon: <Zap size={20} /> },
    Dinner: { type: 'Dinner', name: 'Salmon with Sweet Potato', calories: 580, protein: 50, icon: <Moon size={20} /> }
  },
  // ... other days omitted for brevity in sample array
];

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
}

export default function DailyProgressDashboard() {
  const { user, logout, currentDay, setCurrentDay } = useAuth();
  const [activityCompletion, setActivityCompletion] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);

  // Chat states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const mealsIndex = Math.min(currentDay - 1, sampleMeals.length - 1);
  const todayMeals = sampleMeals[mealsIndex] ?? sampleMeals[0];
  const totalDailyCalories = Object.values(todayMeals).reduce((sum, meal) => sum + meal.calories, 0);
  const totalDailyProtein = Object.values(todayMeals).reduce((sum, meal) => sum + meal.protein, 0);

  const nextDay = Math.min(currentDay + 1, 7);
  const canAdvanceDay = activityCompletion === 100;

  const handleAdvanceDay = () => {
    if (!canAdvanceDay) {
      alert('You must complete today at 100% before moving to the next day.');
      return;
    }
    if (currentDay >= 7) return;
    setCurrentDay(nextDay);
    setActivityCompletion(null);
  };

  const handleLogout = async () => {
    try {
      const progressToSend = logoutProgress || activityCompletion || 0;
      await logout(progressToSend);
      if (progressToSend === 100 && currentDay < 7) {
        setCurrentDay(nextDay);
      }
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev, { role: 'user', message: text }]);
    setChatInput('');
    // Mock AI reply
    setTimeout(() => setChatMessages(prev => [...prev, { role: 'ai', message: 'Thanks — try focusing on consistent tempo and full range of motion.' }]), 600);
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
              <h1 className="text-2xl font-black tracking-tight">DAY {currentDay}</h1>
              <p className="text-xs text-gray-400 font-mono">Progress: Day {currentDay} of 7</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-950/40 border border-blue-500/30 rounded-full text-xs text-blue-300 font-bold">
              <Flame size={14} className="text-orange-400" />
              {user.current_streak} Day Streak
            </div>

            <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-xs font-bold transition">
              <LogOut size={16} /> Logout
            </button>

            {activityCompletion !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-green-950/20 border border-green-500/30 rounded-lg text-xs text-green-400 font-mono flex items-center gap-2">
                <Check size={14} /> Completion recorded for today!
              </motion.div>
            )}

            {currentDay < 7 ? (
              <button onClick={handleAdvanceDay} disabled={!canAdvanceDay} className="ml-4 py-2 px-3 rounded-lg font-bold text-sm border-2 border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50">
                Advance to Day {nextDay} <ChevronRight size={18} />
              </button>
            ) : (
              <div className="ml-4 mt-2 p-3 bg-yellow-950/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 font-mono font-bold">🎉 Final Day Complete!</div>
            )}
          </div>
        </header>

        <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-auto">
          <section className="lg:col-span-2 space-y-6">
            <div className="border border-blue-500/20 bg-slate-800/60 backdrop-blur-md p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-400 font-mono mb-3">WEEK PROGRESS</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div className="rounded-lg border border-blue-500/20 bg-blue-950/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Current phase</p>
                  <p className="mt-1 font-bold text-white">Day {currentDay}</p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-950/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Unlock next day</p>
                  <p className="mt-1 font-bold text-white">Complete today at 100%</p>
                </div>
              </div>
            </div>

            <div className="border border-blue-500/30 bg-gradient-to-r from-purple-950/20 via-slate-800/40 to-black/10 p-6 rounded-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">Profile Summary</p>
              <h3 className="mt-2 text-lg font-black text-white">Your core stats</h3>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-400">Fitness Goal</div>
                  <div className="font-bold text-white">{user.fitness_goal || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Activity Level</div>
                  <div className="font-bold text-white">{user.activity_level || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Food Preference</div>
                  <div className="font-bold text-white">{user.food_preference || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">BMI</div>
                  <div className="font-bold text-white">{user.bmi ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Age</div>
                  <div className="font-bold text-white">{user.age ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">XP</div>
                  <div className="font-bold text-white">{user.xp || 0}</div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-gray-400">Today's Nutrition</p>
                <div className="mt-2 text-sm">Calories: <span className="font-bold">{totalDailyCalories}</span> • Protein: <span className="font-bold">{totalDailyProtein}g</span></div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-gray-400 mb-2">Today's Workout Completion</p>
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map(p => (
                    <button key={p} onClick={() => setActivityCompletion(p)} className={`py-2 px-3 rounded-lg text-sm font-bold border-2 ${activityCompletion === p ? 'border-green-500 bg-green-500/10 text-green-300' : 'border-blue-500/20 text-gray-300'}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="border border-blue-500/30 bg-gradient-to-r from-purple-950/10 p-4 rounded-2xl">
              <h4 className="text-sm font-black">Quick Actions</h4>
              <div className="mt-3 grid gap-2">
                <button className="py-2 px-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-sm">Go to Meals</button>
                <button className="py-2 px-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-sm">View Workouts</button>
                <button className="py-2 px-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-sm" onClick={() => setShowChatbot(true)}>Open Coach</button>
              </div>
            </div>

            <div className="border border-blue-500/30 p-4 rounded-2xl bg-slate-800/60">
              <p className="text-xs text-gray-400">Weekly Summary</p>
              <div className="mt-2 text-sm">Keep consistent — 3 workouts this week</div>
            </div>
          </aside>
        </main>

        {/* Chatbot FAB and Modal */}
        <AnimatePresence>
          {!showChatbot && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setShowChatbot(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition">
              <MessageCircle size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChatbot && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed bottom-6 right-6 z-50 w-96 h-[600px] rounded-2xl border border-blue-500/30 bg-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="border-b border-blue-500/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-sm">CYBER ORACLE</h3>
                  <p className="text-xs text-gray-400 font-mono">AI Fitness Coach</p>
                </div>
                <button className="p-1" onClick={() => setShowChatbot(false)}><X size={18} className="text-gray-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`max-w-xs px-4 py-2 rounded-lg ${m.role === 'user' ? 'ml-auto bg-blue-600/40 text-white' : 'bg-blue-950/40 text-gray-300'}`}>
                    {m.message}
                  </div>
                ))}
              </div>

              <div className="border-t border-blue-500/20 p-3 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask me anything..." className="flex-1 bg-blue-950/30 border border-blue-500/20 rounded-lg px-3 py-2 text-sm text-white" />
                <button onClick={handleSendMessage} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg"><Send size={18} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={28} className="text-orange-400" />
                  <h2 className="text-xl font-black">End Session?</h2>
                </div>
                <p className="text-gray-300 text-sm mb-4">Before logging out, how much of today's workout did you complete?</p>
                <div className="space-y-3 mb-4">
                  {[25, 50, 75, 100].map(p => (
                    <button key={p} onClick={() => setLogoutProgress(p)} className={`w-full py-2 px-4 rounded-lg font-bold text-sm ${logoutProgress === p ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-blue-500/20 bg-blue-950/10 text-gray-400'}`}>
                      {p}% Complete
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2 px-4 rounded-lg border border-blue-500/30">Cancel</button>
                  <button onClick={handleLogout} disabled={logoutProgress === 0} className="flex-1 py-2 px-4 rounded-lg border bg-red-500/20 disabled:opacity-50">Logout</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
