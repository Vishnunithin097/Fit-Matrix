import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { Calendar, Flame, Check, ChevronRight, LogOut, Sparkles, Droplets, Dumbbell, Moon, Shield } from 'lucide-react';
import { SocialMatrix } from './SocialMatrix.tsx';

const STORAGE_KEY = 'fit_matrix_daily_progress';

interface DailyPlan {
  title: string;
  focus: string;
  activities: string[];
}

const DAY_PLANS: DailyPlan[] = [
  {
    title: 'Day 1',
    focus: 'Foundation',
    activities: [
      'Hydrate before breakfast and log your first meal.',
      'Complete a 10-minute mobility flow.',
      'Capture one small win before the day ends.'
    ]
  },
  {
    title: 'Day 2',
    focus: 'Consistency',
    activities: [
      'Do a 20-minute walk or light cardio.',
      'Keep protein intake visible in your log.',
      'Check your sleep routine tonight.'
    ]
  },
  {
    title: 'Day 3',
    focus: 'Strength',
    activities: [
      'Add a short resistance circuit.',
      'Stay within your calorie target.',
      'Review your recovery habits.'
    ]
  },
  {
    title: 'Day 4',
    focus: 'Momentum',
    activities: [
      'Take a brisk walk after lunch.',
      'Prioritize meal prep for tomorrow.',
      'Keep one streak check-in in the evening.'
    ]
  },
  {
    title: 'Day 5',
    focus: 'Endurance',
    activities: [
      'Add a longer cardio block.',
      'Keep hydration at the top of your list.',
      'Reflect on what felt easiest today.'
    ]
  },
  {
    title: 'Day 6',
    focus: 'Recovery',
    activities: [
      'Ease into a mobility and stretching session.',
      'Stay consistent with your meals.',
      'Log your progress before bedtime.'
    ]
  },
  {
    title: 'Day 7',
    focus: 'Reflection',
    activities: [
      'Celebrate your week and review your wins.',
      'Plan your next week with one measurable goal.',
      'Keep your routine simple and repeatable.'
    ]
  }
];

const completionMessage = (value: number | null) => {
  if (value === 25) return 'Light progress today — keep the habit simple and stay consistent.';
  if (value === 50) return 'Solid rhythm — add one more focused effort and protect your streak.';
  if (value === 75) return 'Strong momentum — finish with a calm recovery routine.';
  if (value === 100) return 'Excellent day — you are ready to advance to the next focus block.';
  return 'Choose a completion level to guide today’s plan.';
};

const DailyProgressDashboard: React.FC = () => {
  const { user, logoutUser } = useUser();
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [completions, setCompletions] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.currentDay) setCurrentDay(Number(parsed.currentDay));
      if (parsed.completions) setCompletions(parsed.completions);
      if (parsed.completions?.[parsed.currentDay]) setSelected(Number(parsed.completions[parsed.currentDay]));
    } catch (e) {
      console.warn('Could not restore daily progress state.', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentDay, completions }));
    } catch (e) {
      console.warn('Could not persist daily progress state.', e);
    }
  }, [currentDay, completions]);

  const activePlan = useMemo(() => DAY_PLANS[Math.min(currentDay - 1, DAY_PLANS.length - 1)], [currentDay]);

  if (!user) return null;

  const persistCompletions = (next: Record<number, number>, nextDay?: number) => {
    setCompletions(next);
    if (nextDay) {
      setCurrentDay(nextDay);
    }
  };

  const recordCompletion = (pct: number) => {
    const updated = { ...completions, [currentDay]: pct };
    persistCompletions(updated, pct === 100 ? Math.min(currentDay + 1, 7) : currentDay);
    setSelected(pct);
  };

  const daysCompleted = Object.values(completions).filter((value) => value >= 100).length;
  const weekPercent = Math.round((daysCompleted / 7) * 100);

  const handleLogout = async () => {
    if (logoutProgress > 0) {
      const updated = { ...completions, [currentDay]: logoutProgress };
      const nextDay = logoutProgress === 100 ? Math.min(currentDay + 1, 7) : currentDay;
      persistCompletions(updated, nextDay);
      setSelected(logoutProgress);
    }
    await logoutUser(logoutProgress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] via-[#0a0510] to-[#050205] text-white p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{activePlan.title}</h1>
            <p className="text-xs text-gray-400">Focus: {activePlan.focus} • One guided day at a time</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-purple-900/40 border border-purple-600 flex items-center gap-2">
            <Flame size={14} /> {user.current_streak}d streak
          </div>
          <button onClick={() => setShowLogoutModal(true)} className="px-3 py-2 rounded bg-red-600/20 border border-red-500/30 flex items-center gap-2">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-purple-400 font-semibold">Today’s guide</p>
              <h2 className="text-xl font-semibold mt-1">{activePlan.title} plan</h2>
            </div>
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              Day {currentDay} of 7
            </div>
          </div>

          <div className="grid gap-3">
            {activePlan.activities.map((activity, index) => (
              <div key={index} className="rounded-lg border border-purple-500/10 bg-purple-950/20 p-3 text-sm text-gray-200 flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-purple-600/20 p-2 text-purple-300">
                  {index === 0 ? <Droplets size={14} /> : index === 1 ? <Dumbbell size={14} /> : <Moon size={14} />}
                </div>
                <span>{activity}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
              <Sparkles size={15} /> Recommendation
            </div>
            <p className="mt-2 text-sm text-gray-200">{completionMessage(selected)}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase text-gray-400">Mark today’s completion</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => recordCompletion(value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${selected === value ? 'border-purple-500 bg-purple-600/20 text-purple-200' : 'border-purple-500/10 bg-transparent text-gray-300 hover:border-purple-500/40'}`}
                >
                  {value}%
                </button>
              ))}
            </div>
            {selected !== null && (
              <div className="flex items-center gap-2 text-sm text-green-300">
                <Check size={14} /> Saved for {activePlan.title}: {selected}% complete
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
            <p className="text-xs uppercase text-gray-400">Your profile</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div className="font-semibold">{user.full_name || user.legal_name || user.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Fitness Goal</div>
                <div className="font-semibold">{user.fitness_goal || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Activity Level</div>
                <div className="font-semibold">{user.activity_level || '—'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
            <p className="text-xs uppercase text-gray-400">Week summary</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Days completed</div>
                <div className="text-lg font-semibold">{daysCompleted} / 7</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Week completion</div>
                <div className="text-lg font-semibold">{weekPercent}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-300">
              <Shield size={15} /> Session memory
            </div>
            <p className="mt-2 text-sm text-gray-400">Your current day and completion level are saved locally so the next login opens the right plan.</p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-2">
            <SocialMatrix />
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#09050f] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-purple-600/20 p-2 text-purple-300">
                <LogOut size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">End this day?</h3>
                <p className="text-sm text-gray-400">Save your progress and move forward with the next day if you completed 100%.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => setLogoutProgress(value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${logoutProgress === value ? 'border-purple-500 bg-purple-600/20 text-purple-200' : 'border-purple-500/10 text-gray-300'}`}
                >
                  {value}%
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 rounded-lg border border-purple-500/20 py-2 text-sm text-gray-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleLogout();
                  setShowLogoutModal(false);
                }}
                disabled={logoutProgress === 0}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Save & logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyProgressDashboard;
