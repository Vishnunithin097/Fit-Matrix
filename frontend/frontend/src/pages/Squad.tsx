import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSquad, getSquadMatrix, inviteToSquad, joinSquad, leaveSquad } from '../lib/api';
import { Users, Plus, ArrowRight, Shield, LogOut } from 'lucide-react';

export default function Squad() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [inviteStatusMessage, setInviteStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [squadInfo, setSquadInfo] = useState<{ hasSquad: boolean; squad?: { name: string; code: string; creator_id?: string }; leaderboard?: any[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void refreshSquad();
  }, [user]);

  const refreshSquad = async () => {
    try {
      const res = await getSquadMatrix();
      setSquadInfo(res.data);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Could not load squad status.');
    }
  };

  const handleCreate = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (!squadName.trim()) {
      setErrorMessage('Enter a squad name first.');
      return;
    }
    setBusy(true);
    try {
      const res = await createSquad({ squadName: squadName.trim() });
      setStatusMessage(res.data.message || 'Squad created successfully.');
      setSquadName('');
      await refreshSquad();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to create squad.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (!joinCode.trim()) {
      setErrorMessage('Enter a squad code to join.');
      return;
    }
    setBusy(true);
    try {
      const res = await joinSquad({ code: joinCode.trim().toUpperCase() });
      setStatusMessage(res.data.message || 'Joined squad successfully.');
      setJoinCode('');
      await refreshSquad();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to join squad.');
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    setErrorMessage('');
    setInviteStatusMessage('');
    if (!inviteEmail.trim()) {
      setErrorMessage('Enter a teammate email to invite.');
      return;
    }

    setBusy(true);
    try {
      const res = await inviteToSquad({ friendEmail: inviteEmail.trim().toLowerCase() });
      setInviteStatusMessage(res.data.message || 'Invitation sent successfully.');
      setInviteEmail('');
      await refreshSquad();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to send squad invitation.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setBusy(true);
    try {
      await leaveSquad();
      setStatusMessage('Left the squad successfully.');
      setSquadInfo({ hasSquad: false });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to leave squad.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <section className="hero-panel compact">
          <div>
            <p className="eyebrow">Squad hub</p>
            <h1 className="hero-title">Loading squad status...</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Squad hub</p>
          <h1 className="hero-title">Stay accountable with your trusted circle.</h1>
        </div>
      </section>

      <div className="panel-card space-y-6">
        <div className="panel-card-body">
          <p className="hero-copy">Your squad invitations and streak syncs are ready to connect through the secured auth middleware.</p>
        </div>

        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

        {squadInfo?.hasSquad ? (
          <>
            <div className="panel-card-inner">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="panel-card-small">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Connected Squad</p>
                  <h2 className="font-bold text-xl mt-2">{squadInfo.squad?.name || 'Unknown Squad'}</h2>
                  <p className="text-sm text-slate-300 mt-2">Code: <span className="font-semibold">{squadInfo.squad?.code || '—'}</span></p>
                </div>
                <button onClick={handleLeave} disabled={busy} className="btn btn-danger gap-2">
                  <LogOut size={16} /> Leave Squad
                </button>
              </div>
            </div>

            <div className="panel-card-inner space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Connected Members</p>
                <p className="hero-copy">These are the squad members who are currently registered under your squad code.</p>
              </div>
              {squadInfo.leaderboard && squadInfo.leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {squadInfo.leaderboard.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-900/70 p-3">
                      <div>
                        <p className="font-semibold">{member.full_name || member.email || 'Member'}</p>
                        <p className="text-xs text-slate-400">Streak: {member.current_streak ?? 0} • XP: {member.xp ?? 0}</p>
                      </div>
                      <span className="text-xs text-slate-300">Last active: {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hero-copy text-slate-400">Your squad member details will appear once others join the group.</p>
              )}
            </div>

            <div className="panel-card-inner space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Connect new members</p>
                <p className="hero-copy">Invite friends or teammates by email so they can join your squad and sync their progress.</p>
              </div>
              {inviteStatusMessage && <div className="alert alert-success">{inviteStatusMessage}</div>}
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter teammate email"
                  className="input"
                />
                <button onClick={handleInvite} disabled={busy} className="btn btn-primary">
                  Invite
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="panel-card-inner space-y-5">
            <div className="flex items-center gap-2 text-slate-200">
              <Users size={20} />
              <h2 className="text-lg font-semibold">Connect with your squad</h2>
            </div>

            <div className="toggle-buttons">
              <button
                onClick={() => setMode('create')}
                className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Plus size={14} /> Create Squad
              </button>
              <button
                onClick={() => setMode('join')}
                className={`btn ${mode === 'join' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <ArrowRight size={14} /> Join Squad
              </button>
            </div>

            {mode === 'create' ? (
              <div className="space-y-3">
                <label className="text-sm font-semibold">Squad name</label>
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="Enter a squad name"
                  className="input"
                />
                <button onClick={handleCreate} disabled={busy} className="btn btn-primary">
                  <Plus size={14} /> Create and connect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-semibold">Squad invite code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="MATRIX-1234"
                  className="input"
                />
                <button onClick={handleJoin} disabled={busy} className="btn btn-primary">
                  <ArrowRight size={14} /> Join squad
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
