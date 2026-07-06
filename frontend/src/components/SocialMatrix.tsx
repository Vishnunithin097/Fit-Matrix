import React, { useMemo, useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { Shield, Users, Sparkles, KeyRound, ArrowRight } from 'lucide-react';

interface OnboardingFormProps {
  onSuccess?: () => void;
}

export const SocialMatrix: React.FC<OnboardingFormProps> = ({ onSuccess }) => {
  const { user, token, error, clearError, triggerCreateSquad, triggerJoinSquad, triggerLeaveSquad } = useUser();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasSquad = Boolean(user?.squad_id);

  const squadSummary = useMemo(() => {
    if (!user?.squad_id) return null;
    return {
      label: user.squad_id,
      hint: 'Authenticated account already connected to a squad.'
    };
  }, [user?.squad_id]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!token) {
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        if (!squadName.trim()) return;
        await triggerCreateSquad(squadName.trim());
      } else {
        if (!joinCode.trim()) return;
        await triggerJoinSquad(joinCode.trim().toUpperCase());
      }
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    clearError();
    await triggerLeaveSquad();
  };

  return (
    <div className="w-full max-w-xl mx-auto border border-cyber-purple/30 bg-cyber-dark/80 backdrop-blur-md p-8 rounded-lg shadow-cyber-purple text-gray-200">
      <div className="flex items-center justify-between mb-8 border-b border-cyber-purple/20 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-pink font-display">
            SQUAD CONNECT
          </h2>
          <p className="text-xs font-mono text-cyber-purple mt-1">SECURED WITH JWT AUTHENTICATION</p>
        </div>
        <Shield className="text-cyber-pink animate-pulse w-6 h-6" />
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-500/20 bg-red-950/20 text-red-400 font-mono text-xs rounded-md">
          {error}
        </div>
      )}

      {!token ? (
        <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 p-5 text-sm text-gray-300">
          <p className="font-semibold text-cyber-pink">Register or log in first to connect your squad.</p>
          <p className="mt-2 text-xs text-gray-400">Your squad connection is attached to the authenticated account and uses the same JWT session that powers the rest of Fit Matrix.</p>
        </div>
      ) : hasSquad ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-cyber-purple/20 bg-cyber-bg/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-wider">ACTIVE SQUAD LINK</p>
                <h3 className="text-lg font-black text-white mt-1">{squadSummary?.label || 'Connected squad'}</h3>
                <p className="text-xs text-gray-400 mt-2">{squadSummary?.hint}</p>
              </div>
              <Users className="text-cyber-pink w-5 h-5" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleLeave}
            className="w-full bg-transparent border border-cyber-pink/40 text-cyber-pink hover:bg-cyber-pink/10 py-3 rounded-lg font-mono text-sm font-black transition cursor-pointer"
          >
            LEAVE SQUAD
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-5">
          <div className="flex rounded-lg border border-cyber-purple/20 bg-cyber-bg/70 p-1">
            <button
              type="button"
              onClick={() => { clearError(); setMode('create'); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-mono font-black transition ${mode === 'create' ? 'bg-cyber-purple text-white' : 'text-cyber-purple'}`}
            >
              CREATE
            </button>
            <button
              type="button"
              onClick={() => { clearError(); setMode('join'); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-mono font-black transition ${mode === 'join' ? 'bg-cyber-pink text-white' : 'text-cyber-pink'}`}
            >
              JOIN
            </button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-3">
              <label className="block text-xs font-mono text-cyber-purple tracking-wider">SQUAD NAME</label>
              <input
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="e.g. Iron Titans"
                className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
              />
              <p className="text-xs text-gray-400">A new squad will be created for this authenticated account and linked instantly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-mono text-cyber-purple tracking-wider">INVITE CODE</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="MATRIX-1234"
                className="w-full bg-cyber-bg border border-cyber-purple/30 p-3 rounded text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition font-mono"
              />
              <p className="text-xs text-gray-400">Use the code from an existing squad to join it with your current account.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-purple to-cyber-pink hover:from-cyber-purple/90 hover:to-cyber-pink/90 text-white font-mono text-sm font-bold tracking-wider py-3 px-6 rounded shadow-cyber-purple transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? 'CONNECTING...' : 'CONNECT SQUAD'} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="rounded-lg border border-cyber-purple/10 bg-cyber-bg/40 p-4 text-xs text-gray-400 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-cyber-purple mt-0.5" />
            <span>The connect action uses the logged-in user identity and JWT token, so existing users can attach to a squad immediately after registration.</span>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-lg border border-cyber-purple/10 bg-cyber-bg/40 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-wider">AUTH STATUS</p>
          <p className="text-xs text-gray-400 mt-1">{token ? 'Authenticated session active' : 'No active session'}</p>
        </div>
        <Sparkles className="text-cyber-pink w-4 h-4" />
      </div>
    </div>
  );
};

export default SocialMatrix;
