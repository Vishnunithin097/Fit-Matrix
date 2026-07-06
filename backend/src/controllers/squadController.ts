import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../config/db.js';

export async function listRegisteredUsers(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const usersResult = await query(
      `SELECT id, full_name, email, current_streak, xp
       FROM users
       WHERE id <> $1
       ORDER BY full_name ASC
       LIMIT 100`,
      [userId]
    );

    return res.status(200).json({ users: usersResult.rows });
  } catch (error: any) {
    console.error('List Registered Users Error:', error);
    return res.status(500).json({ error: 'Server error retrieving user directory.' });
  }
}

export async function listAvailableSquads(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const userResult = await query('SELECT squad_id FROM users WHERE id = $1', [userId]);
    const currentSquadId = userResult.rows[0]?.squad_id;

    const squadsResult = currentSquadId
      ? await query(
          `SELECT s.id, s.name, s.code, s.creator_id,
                  COALESCE(u.full_name, '') AS creator_name,
                  COALESCE((SELECT COUNT(*) FROM users WHERE squad_id = s.id), 0) AS member_count
           FROM squads s
           LEFT JOIN users u ON u.id = s.creator_id
           WHERE s.id <> $1
           ORDER BY member_count DESC, s.created_at ASC`,
          [currentSquadId]
        )
      : await query(
          `SELECT s.id, s.name, s.code, s.creator_id,
                  COALESCE(u.full_name, '') AS creator_name,
                  COALESCE((SELECT COUNT(*) FROM users WHERE squad_id = s.id), 0) AS member_count
           FROM squads s
           LEFT JOIN users u ON u.id = s.creator_id
           ORDER BY member_count DESC, s.created_at ASC`
        );

    return res.status(200).json({ squads: squadsResult.rows });
  } catch (error: any) {
    console.error('List Available Squads Error:', error);
    return res.status(500).json({ error: 'Server error retrieving squads.' });
  }
}

export async function connectUser(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { receiverId } = req.body;

  if (!userId || !receiverId) {
    return res.status(400).json({ error: 'Receiver user ID is required.' });
  }

  if (receiverId === userId) {
    return res.status(400).json({ error: 'You cannot connect with yourself.' });
  }

  try {
    const receiverResult = await query('SELECT id, email FROM users WHERE id = $1', [receiverId]);
    if (receiverResult.rowCount === 0) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    const existing = await query(
      `SELECT id FROM invitations
       WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
         AND status = 'PENDING'`,
      [userId, receiverId]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'A connection request already exists between these users.' });
    }

    const inviteId = randomUUID();
    await query(
      `INSERT INTO invitations (id, sender_id, receiver_id, invitee_email, status, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)`,
      [inviteId, userId, receiverId, receiverResult.rows[0].email.toLowerCase()]
    );

    return res.status(200).json({ message: 'Connection request sent successfully.' });
  } catch (error: any) {
    console.error('Connect User Error:', error);
    return res.status(500).json({ error: 'Server error sending connection request.' });
  }
}

export async function requestSquadJoin(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { squadId } = req.body;

  if (!userId || !squadId) {
    return res.status(400).json({ error: 'Squad ID is required.' });
  }

  try {
    const squadResult = await query('SELECT * FROM squads WHERE id = $1', [squadId]);
    if (squadResult.rowCount === 0) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    const squad = squadResult.rows[0];
    if (squad.creator_id === userId) {
      return res.status(400).json({ error: 'You are already the leader of this squad.' });
    }

    const userResult = await query('SELECT squad_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0]?.squad_id) {
      return res.status(400).json({ error: 'You must leave your current squad before requesting to join another.' });
    }

    const creatorResult = await query('SELECT id, email FROM users WHERE id = $1', [squad.creator_id]);
    if (creatorResult.rowCount === 0) {
      return res.status(404).json({ error: 'Squad creator not found.' });
    }

    const existing = await query(
      `SELECT id FROM invitations
       WHERE sender_id = $1 AND receiver_id = $2 AND squad_id = $3 AND status = 'PENDING'`,
      [userId, squad.creator_id, squadId]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'You already have a pending join request for this squad.' });
    }

    const inviteId = randomUUID();
    await query(
      `INSERT INTO invitations (id, squad_id, sender_id, receiver_id, invitee_email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)`,
      [inviteId, squadId, userId, squad.creator_id, creatorResult.rows[0].email.toLowerCase()]
    );

    return res.status(200).json({ message: 'Join request sent to squad leader.' });
  } catch (error: any) {
    console.error('Request Squad Join Error:', error);
    return res.status(500).json({ error: 'Server error sending squad join request.' });
  }
}

// 1. CREATE SQUAD (2-5 members)
export async function createSquad(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { squadName } = req.body;

  if (!userId || !squadName) {
    return res.status(400).json({ error: 'Squad name is required.' });
  }

  try {
    // Check if user is already in a squad
    const checkUser = await query('SELECT squad_id FROM users WHERE id = $1', [userId]);
    if (checkUser.rows[0]?.squad_id) {
      return res.status(400).json({ error: 'You are already registered in a squad. Dissolve or leave first.' });
    }

    const squadId = randomUUID();
    const code = 'MATRIX-' + Math.floor(1000 + Math.random() * 9000);

    // Save squad
    await query(
      `INSERT INTO squads (id, name, code, creator_id, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [squadId, squadName.trim().toUpperCase(), code, userId]
    );

    // Assign user to squad
    await query('UPDATE users SET squad_id = $1 WHERE id = $2', [squadId, userId]);

    return res.status(201).json({
      message: `Squad ${squadName.toUpperCase()} initialized successfully.`,
      squad: { id: squadId, name: squadName, code }
    });
  } catch (error: any) {
    console.error('Create Squad Error:', error);
    return res.status(500).json({ error: 'Server error spawning squad node.' });
  }
}

// 2. REQUEST TO JOIN SQUAD
export async function joinSquadByCode(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: 'Invite code is required.' });
  }

  try {
    const checkSquad = await query('SELECT * FROM squads WHERE code = $1', [code.trim().toUpperCase()]);
    if (checkSquad.rowCount === 0) {
      return res.status(404).json({ error: 'Target squad matrix not found.' });
    }

    const squad = checkSquad.rows[0];
    if (squad.creator_id === userId) {
      return res.status(400).json({ error: 'You are already the leader of this squad.' });
    }

    const userResult = await query('SELECT squad_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0]?.squad_id) {
      return res.status(400).json({ error: 'Leave your current squad before requesting to join another.' });
    }

    const creatorResult = await query('SELECT id, email FROM users WHERE id = $1', [squad.creator_id]);
    if (creatorResult.rowCount === 0) {
      return res.status(404).json({ error: 'Squad creator not found.' });
    }

    const existing = await query(
      `SELECT id FROM invitations
       WHERE sender_id = $1 AND receiver_id = $2 AND squad_id = $3 AND status = 'PENDING'`,
      [userId, squad.creator_id, squad.id]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'You already have a pending join request for this squad.' });
    }

    const inviteId = randomUUID();
    await query(
      `INSERT INTO invitations (id, squad_id, sender_id, receiver_id, invitee_email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)`,
      [inviteId, squad.id, userId, squad.creator_id, creatorResult.rows[0].email.toLowerCase()]
    );

    return res.status(200).json({
      message: `Join request sent to ${creatorResult.rows[0].email}.`,
      squad: { id: squad.id, name: squad.name, code: squad.code }
    });
  } catch (error: any) {
    console.error('Join Squad Error:', error);
    return res.status(500).json({ error: 'Server error requesting to join squad.' });
  }
}

// 3. GET SQUAD LEADERBOARD AND MATRIX SYNCHRONIZATION
export async function getSquadMatrix(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const userResult = await query('SELECT squad_id FROM users WHERE id = $1', [userId]);
    const squadId = userResult.rows[0]?.squad_id;

    if (!squadId) {
      return res.status(200).json({ hasSquad: false });
    }

    // Fetch squad metadata
    const squadMeta = await query('SELECT * FROM squads WHERE id = $1', [squadId]);
    const squad = squadMeta.rows[0];

    // Fetch members metrics (streaks, xp, logged ratios)
    const membersResult = await query(
      `SELECT id, full_name, email, current_streak, xp, water_logged, water_target,
              calories_logged, calorie_target, last_active 
       FROM users 
       WHERE squad_id = $1 
       ORDER BY xp DESC`,
      [squadId]
    );

    // Midnight motivational quotes context injects
    const midnightAdvice = [
      "Keep pushing, titans. Our collective synchronization is exceeding 85% efficiency today.",
      "A squad that lifts together, transcends together. Lock in your daily metrics.",
      "Stay hydrated, lock in the meals, and out-perform your yesterday limits."
    ];

    return res.status(200).json({
      hasSquad: true,
      squad: {
        id: squad.id,
        name: squad.name,
        code: squad.code,
        creator_id: squad.creator_id
      },
      leaderboard: membersResult.rows,
      motivationalAdvice: midnightAdvice[Math.floor(Math.random() * midnightAdvice.length)]
    });

  } catch (error: any) {
    console.error('Get Squad Matrix Error:', error);
    return res.status(500).json({ error: 'Server error retrieving squad logs.' });
  }
}

// 4. SEND SQUAD INVITATION
export async function inviteFriend(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { friendEmail } = req.body;

  if (!userId || !friendEmail) {
    return res.status(400).json({ error: 'Friend email is required.' });
  }

  try {
    const userResult = await query('SELECT squad_id, full_name FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    const squadId = user?.squad_id;

    if (!squadId) {
      return res.status(400).json({ error: 'You must build or join a squad before inviting network links.' });
    }

    // Check if friend exists (optional fallback, we can create invite by email directly)
    const inviteId = randomUUID();
    
    await query(
      `INSERT INTO invitations (id, squad_id, sender_id, invitee_email, status, created_at) 
       VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)`,
      [inviteId, squadId, userId, friendEmail.toLowerCase().trim()]
    );

    return res.status(200).json({
      message: `Invitation dispatched to ${friendEmail.toLowerCase()}.`
    });
  } catch (error: any) {
    console.error('Invite Friend Error:', error);
    return res.status(500).json({ error: 'Server error creating invitation.' });
  }
}

// 5. LIST INCOMING INVITATIONS
export async function listInvitations(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    const email = userResult.rows[0]?.email;

    if (!email) {
      return res.status(404).json({ error: 'User email not found.' });
    }

    const invites = await query(
      `SELECT i.*, u.full_name AS inviter_name, s.name AS squad_name, s.code AS squad_code
       FROM invitations i
       LEFT JOIN users u ON u.id = i.sender_id
       LEFT JOIN squads s ON s.id = i.squad_id
       WHERE (i.receiver_id = $1 OR i.invitee_email = $2)
         AND i.status = 'PENDING'`,
      [userId, email]
    );

    return res.status(200).json({ invitations: invites.rows });
  } catch (error: any) {
    console.error('List Invitations Error:', error);
    return res.status(500).json({ error: 'Server error fetching invitations.' });
  }
}

// 6. RESOLVE INVITATION (ACCEPT or REJECT)
export async function resolveInvitation(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  const { invitationId, status } = req.body; // 'ACCEPTED' or 'REJECTED'

  if (!userId || !invitationId || !status) {
    return res.status(400).json({ error: 'Invitation ID and Action status are required.' });
  }

  try {
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Action must be ACCEPTED or REJECTED.' });
    }

    const inviteResult = await query('SELECT * FROM invitations WHERE id = $1', [invitationId]);
    if (inviteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const invite = inviteResult.rows[0];

    if (status === 'ACCEPTED') {
      if (invite.squad_id) {
        const squadResult = await query('SELECT * FROM squads WHERE id = $1', [invite.squad_id]);
        if (squadResult.rowCount === 0) {
          return res.status(404).json({ error: 'Squad not found.' });
        }

        await query('UPDATE users SET squad_id = $1 WHERE id = $2', [invite.squad_id, userId]);
      } else {
        const senderResult = await query('SELECT id, full_name, squad_id FROM users WHERE id = $1', [invite.sender_id]);
        const receiverResult = await query('SELECT id, full_name, squad_id FROM users WHERE id = $1', [userId]);

        if (senderResult.rowCount === 0) {
          return res.status(404).json({ error: 'Sender not found.' });
        }

        const sender = senderResult.rows[0];
        const receiver = receiverResult.rows[0];
        const senderSquad = sender.squad_id;
        const receiverSquad = receiver.squad_id;

        if (senderSquad && receiverSquad && senderSquad !== receiverSquad) {
          return res.status(400).json({ error: 'Both users belong to different squads. Leave the existing squad before accepting this connection.' });
        }

        let targetSquadId = senderSquad || receiverSquad;

        if (!targetSquadId) {
          targetSquadId = randomUUID();
          const squadName = `${sender.full_name?.split(' ')[0] || 'Partner'} & ${receiver.full_name?.split(' ')[0] || 'Partner'}`.substring(0, 50).toUpperCase();
          const code = `DUO-${Math.floor(1000 + Math.random() * 9000)}`;

          await query(
            `INSERT INTO squads (id, name, code, creator_id, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [targetSquadId, squadName, code, invite.sender_id]
          );
        }

        if (!senderSquad) {
          await query('UPDATE users SET squad_id = $1 WHERE id = $2', [targetSquadId, invite.sender_id]);
        }
        if (!receiverSquad) {
          await query('UPDATE users SET squad_id = $1 WHERE id = $2', [targetSquadId, userId]);
        }
      }
    }

    await query('UPDATE invitations SET status = $1 WHERE id = $2', [status, invitationId]);

    return res.status(200).json({
      message: `Invitation successfully ${status.toLowerCase()}.`,
      squad_id: status === 'ACCEPTED' ? invite.squad_id : null
    });
  } catch (error: any) {
    console.error('Resolve Invitation Error:', error);
    return res.status(500).json({ error: 'Server error processing invitation.' });
  }
}

// 7. LEAVE OR LEAK OUT OF SQUAD
export async function leaveSquad(req: Request, res: Response): Promise<any> {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    await query('UPDATE users SET squad_id = NULL WHERE id = $1', [userId]);
    return res.status(200).json({ message: 'Exited squad network successfully.' });
  } catch (error: any) {
    console.error('Leave Squad Error:', error);
    return res.status(500).json({ error: 'Server error leaving squad.' });
  }
}
