import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSquad, getSquadMatrix, joinSquad, leaveSquad, createSquadChallenge, updateSquadChallengeProgress, resolveSquadInvite } from '../lib/api';

export default function Squad() {
  const { user } = useAuth();
  const [squad, setSquad] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [challengeTargetId, setChallengeTargetId] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeValue, setChallengeValue] = useState('10');

  const loadSquad = async () => {
    try {
      const response = await getSquadMatrix();
      const payload = response.data || {};
      setSquad(payload.squad || null);
      setMembers(payload.members || []);
      setLeaderboard(payload.leaderboard || []);
      setJoinRequests(payload.joinRequests || []);
      setChallenges(payload.challenges || []);
      setLoading(false);
    } catch {
      setSquad(null);
      setMembers([]);
      setLeaderboard([]);
      setJoinRequests([]);
      setChallenges([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSquad();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const response = await createSquad({ squadName: name });
      setMessage(response.data?.message || 'Squad created.');
      await loadSquad();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Unable to create squad.');
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    try {
      const response = await joinSquad({ code });
      setMessage(response.data?.message || 'Join request sent.');
      await loadSquad();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Unable to join squad.');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveSquad();
      setMessage('Left squad network.');
      setSquad(null);
      setMembers([]);
      setLeaderboard([]);
      setJoinRequests([]);
      setChallenges([]);
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Unable to leave squad.');
    }
  };

  const handleChallengeCreate = async () => {
    if (!challengeTargetId || !challengeTitle.trim() || !challengeValue) return;
    try {
      const response = await createSquadChallenge({
        targetUserId: challengeTargetId,
        title: challengeTitle.trim(),
        targetValue: Number(challengeValue),
      });
      setMessage(response.data?.message || 'Challenge created.');
      await loadSquad();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Unable to create challenge.');
    }
  };

  const handleChallengeProgress = async (challengeId: string, currentValue: number) => {
    try {
      const response = await updateSquadChallengeProgress(challengeId, currentValue);
      setMessage(response.data?.message || 'Challenge updated.');
      await loadSquad();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Unable to update challenge.');
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Squad hub</p>
          <h1 className="hero-title">Stay accountable with your trusted circle.</h1>
        </div>
      </section>

      {message ? <div className="panel-card"><p className="hero-copy">{message}</p></div> : null}

      {!squad ? (
        <div className="panel-card">
          <p className="hero-copy">Create a new squad or join one using a secure invite code linked to your authenticated session.</p>
          <div className="auth-form" style={{ marginTop: 16 }}>
            <label>
              <span>Squad name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="IRON WARRIORS" />
            </label>
            <button className="primary-btn" onClick={handleCreate}>Create squad</button>
            <label>
              <span>Squad code</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="FIT-X7K92" />
            </label>
            <button className="secondary-btn" onClick={handleJoin}>Join squad</button>
          </div>
        </div>
      ) : (
        <div className="panel-card">
          <div className="panel-head">
            <h3>{squad.name}</h3>
            <span className="panel-tag">Code: {squad.code}</span>
          </div>

          <div className="meal-metrics" style={{ marginTop: 12 }}>
            <span>{squad.memberCount || members.length} / {squad.maxMembers || 5} members</span>
            <span>Overall progress: {squad.overallProgress || 0}%</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Squad members</h3>
            {members.length > 0 ? members.map((member) => (
              <div key={member.id} className="toggle-row" style={{ marginBottom: 8, display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{member.name}</span>
                  <span>{member.role}</span>
                </div>
                <small>{member.current_activity || 'Inactive'} • Workout {member.workout || 0}% • Meals {member.meals || 0}%</small>
              </div>
            )) : <p className="hero-copy">No members yet.</p>}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Leaderboard</h3>
            {leaderboard.length > 0 ? leaderboard.map((member) => (
              <div key={member.id} className="toggle-row" style={{ marginBottom: 8 }}>
                <span>{member.name}</span>
                <span>{member.overall || 0}%</span>
              </div>
            )) : <p className="hero-copy">No leaderboard data yet.</p>}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Join requests</h3>
            {joinRequests.length > 0 ? joinRequests.map((request) => (
              <div key={request.id} className="toggle-row" style={{ marginBottom: 8 }}>
                <span>{request.sender_name || 'User'} wants to join</span>
                <span>
                  <button className="secondary-btn" onClick={async () => { await resolveSquadInvite({ invitationId: request.id, status: 'ACCEPTED' }); await loadSquad(); }}>Accept</button>
                  <button className="secondary-btn" onClick={async () => { await resolveSquadInvite({ invitationId: request.id, status: 'REJECTED' }); await loadSquad(); }}>Reject</button>
                </span>
              </div>
            )) : <p className="hero-copy">No pending join requests.</p>}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Create challenge</h3>
            <label>
              <span>Member</span>
              <select value={challengeTargetId} onChange={(event) => setChallengeTargetId(event.target.value)}>
                <option value="">Select member</option>
                {members.filter((member) => member.id !== user?.id).map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Challenge</span>
              <input value={challengeTitle} onChange={(event) => setChallengeTitle(event.target.value)} placeholder="Complete 10 Push-Ups" />
            </label>
            <label>
              <span>Target value</span>
              <input type="number" value={challengeValue} onChange={(event) => setChallengeValue(event.target.value)} />
            </label>
            <button className="primary-btn" onClick={handleChallengeCreate}>Set challenge</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Challenges</h3>
            {challenges.length > 0 ? challenges.map((challenge) => (
              <div key={challenge.id} className="toggle-row" style={{ marginBottom: 8, display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{challenge.title}</span>
                  <span>{challenge.status}</span>
                </div>
                <small>{challenge.current_value || 0} / {challenge.target_value || 1}</small>
                <div style={{ marginTop: 8 }}>
                  <button className="secondary-btn" onClick={() => handleChallengeProgress(challenge.id, Number(challenge.current_value || 0) + 1)}>Update progress</button>
                </div>
              </div>
            )) : <p className="hero-copy">No challenges yet.</p>}
          </div>

          <button className="secondary-btn" style={{ marginTop: 12 }} onClick={handleLeave}>Leave squad</button>
        </div>
      )}
    </div>
  );
}
