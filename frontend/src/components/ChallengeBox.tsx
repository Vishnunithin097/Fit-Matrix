import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { Award, CheckCircle2, Lock, Sparkles, HelpCircle } from 'lucide-react';

export const ChallengeBox: React.FC = () => {
  const { user, triggerCompleteTask, logs, error, clearError } = useUser();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const dailyTasks = [
    { id: 'water_100', title: 'Achieve Daily Hydration Threshold (3.5L)', xp: 15, desc: 'Drink 3500ml water to optimize cellular recovery.' },
    { id: 'warmup_done', title: 'Complete Warm-up & Flexibility Routines', xp: 20, desc: 'Trigger 10-minute kinetic joint rotations to unlock motion lines.' },
    { id: 'calories_adherence', title: 'Strict Nutritional Meal Compliance', xp: 30, desc: 'Log and consume within +/- 150 kcal of target daily load.' }
  ];

  const handleClaim = async (taskId: string, title: string, xp: number) => {
    setLoadingId(taskId);
    clearError();
    await triggerCompleteTask(taskId, title, xp);
    setLoadingId(null);
  };

  const isTaskLoggedToday = (taskId: string): boolean => {
    if (!logs) return false;
    // Check if task exists in logs completed recently
    return logs.some(log => log.task_id === taskId);
  };

  return (
    <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple relative overflow-hidden">
      <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
      <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
      <div className="flex items-center justify-between mb-4 border-b border-cyber-purple/15 pb-3">
        <h3 className="text-sm font-mono tracking-widest text-cyber-purple font-black flex items-center gap-2 font-display uppercase">
          <Award size={16} className="text-cyber-pink" /> DAILY CHALLENGE DIRECTIVES
        </h3>
        <span className="text-[10px] font-mono bg-cyber-purple/10 px-2.5 py-0.5 rounded-full text-cyber-purple border border-cyber-purple/20 font-bold">
          RESET AT MIDNIGHT
        </span>
      </div>

      <p className="text-xs font-mono text-gray-400 mb-4">
        Clear daily protocols to award physical XP to your cyber-profile. Lock in streak progress.
      </p>

      {error && error.includes('Anti-Cheat') && (
        <div className="mb-4 p-3 border border-cyber-pink/30 bg-cyber-pink/10 text-cyber-pink font-mono text-[10px] rounded-lg relative shadow-cyber-pink">
          <button onClick={clearError} className="absolute right-2 top-1 hover:text-white cursor-pointer font-bold">✕</button>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {dailyTasks.map(task => {
          const cleared = isTaskLoggedToday(task.id);
          const loading = loadingId === task.id;

          return (
            <div
              key={task.id}
              className={`border p-4 rounded-xl transition duration-300 flex items-center justify-between ${
                cleared
                  ? 'border-green-500/20 bg-green-950/10 shadow-[inset_0_0_10px_rgba(34,197,94,0.05)]'
                  : 'border-cyber-purple/20 bg-cyber-bg hover:border-cyber-purple/45'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-black font-display ${cleared ? 'text-green-400' : 'text-gray-200'}`}>
                    {task.title}
                  </span>
                  <span className="text-[9px] font-mono bg-cyber-pink/15 border border-cyber-pink/30 px-2 py-0.5 rounded-full text-cyber-pink font-bold">
                    +{task.xp} XP
                  </span>
                </div>
                <p className="text-[10px] font-mono text-gray-500 mt-1">{task.desc}</p>
              </div>

              <div>
                {cleared ? (
                  <div className="flex items-center gap-1.5 text-green-400 font-mono text-[10px] bg-green-950/30 border border-green-500/35 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 size={12} /> SECURED
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(task.id, task.title, task.xp)}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyber-purple to-cyber-pink border border-cyber-purple text-white font-mono text-[10px] font-black py-1.5 px-3.5 rounded-lg shadow-cyber-purple transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'SYNCING...' : 'CLAIM PROTOCOL'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ChallengeBox;
