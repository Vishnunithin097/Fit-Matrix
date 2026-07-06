import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resolveSquadInvite } from '../lib/api';

export default function Settings() {
  const { pendingInvites, refreshNotifications, refreshUser } = useAuth();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const handleInvitationResponse = async (invitationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setErrorMessage('');
    setStatusMessage('');
    setBusyInviteId(invitationId);

    try {
      const response = await resolveSquadInvite({ invitationId, status });
      setStatusMessage(response.data.message || `Invitation ${status.toLowerCase()} successfully.`);
      await refreshNotifications();
      if (status === 'ACCEPTED') {
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Unable to process the invitation response.');
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1 className="hero-title">Personalize your Fit Matrix experience.</h1>
        </div>
      </section>

      <div className="settings-grid">
        <div className="panel-card">
          <div className="panel-head">
            <h3>Notifications</h3>
            <span className="panel-tag">{pendingInvites.length > 0 ? `${pendingInvites.length} pending` : 'No new alerts'}</span>
          </div>

          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

          {pendingInvites.length > 0 ? (
            <div className="space-y-4">
              <p className="hero-copy">You have squad invitations waiting for your response. Accept to join the circle or reject if this was sent in error.</p>
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="panel-card-inner">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Invite to join squad</p>
                        <p className="text-sm text-slate-400">Invite sent to {invite.invitee_email}</p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{invite.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary"
                        disabled={busyInviteId === invite.id}
                        onClick={() => handleInvitationResponse(invite.id, 'ACCEPTED')}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={busyInviteId === invite.id}
                        onClick={() => handleInvitationResponse(invite.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="hero-copy">No squad notifications at the moment. Invitations will appear here when someone sends a request to your registered email.</p>
          )}
        </div>

        {['Personal Information', 'Account', 'Theme', 'Security'].map((title) => (
          <div key={title} className="panel-card">
            <div className="panel-head">
              <h3>{title}</h3>
              <span className="panel-tag">Managed</span>
            </div>
            <p className="hero-copy">Premium controls for your profile, experience, and privacy.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
