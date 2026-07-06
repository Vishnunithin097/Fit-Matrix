import { randomUUID } from 'crypto';
import { query } from '../config/db.js';
// 1. CREATE SQUAD (2-5 members)
export async function createSquad(req, res) {
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
        await query(`INSERT INTO squads (id, name, code, creator_id, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`, [squadId, squadName.trim().toUpperCase(), code, userId]);
        // Assign user to squad
        await query('UPDATE users SET squad_id = $1 WHERE id = $2', [squadId, userId]);
        return res.status(201).json({
            message: `Squad ${squadName.toUpperCase()} initialized successfully.`,
            squad: { id: squadId, name: squadName, code }
        });
    }
    catch (error) {
        console.error('Create Squad Error:', error);
        return res.status(500).json({ error: 'Server error spawning squad node.' });
    }
}
// 2. JOIN SQUAD VIA CODE
export async function joinSquadByCode(req, res) {
    const userId = req.user?.id;
    const { code } = req.body;
    if (!userId || !code) {
        return res.status(400).json({ error: 'Invite code is required.' });
    }
    try {
        // Check if squad exists
        const checkSquad = await query('SELECT * FROM squads WHERE code = $1', [code.trim().toUpperCase()]);
        if (checkSquad.rowCount === 0) {
            return res.status(404).json({ error: 'Target squad matrix not found.' });
        }
        const squad = checkSquad.rows[0];
        // Check member density limits (max 5)
        const checkMembers = await query('SELECT COUNT(*) as count FROM users WHERE squad_id = $1', [squad.id]);
        const memberCount = parseInt(checkMembers.rows[0].count);
        if (memberCount >= 5) {
            return res.status(400).json({ error: 'Target squad has reached its absolute density limit of 5 members.' });
        }
        // Join
        await query('UPDATE users SET squad_id = $1 WHERE id = $2', [squad.id, userId]);
        return res.status(200).json({
            message: `Joined squad ${squad.name} successfully.`,
            squad: { id: squad.id, name: squad.name, code: squad.code }
        });
    }
    catch (error) {
        console.error('Join Squad Error:', error);
        return res.status(500).json({ error: 'Server error joining squad.' });
    }
}
// 3. GET SQUAD LEADERBOARD AND MATRIX SYNCHRONIZATION
export async function getSquadMatrix(req, res) {
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
        const membersResult = await query(`SELECT id, full_name, email, current_streak, xp, water_logged, water_target,
              calories_logged, calorie_target, last_active 
       FROM users 
       WHERE squad_id = $1 
       ORDER BY xp DESC`, [squadId]);
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
    }
    catch (error) {
        console.error('Get Squad Matrix Error:', error);
        return res.status(500).json({ error: 'Server error retrieving squad logs.' });
    }
}
// 4. SEND SQUAD INVITATION
export async function inviteFriend(req, res) {
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
        await query(`INSERT INTO invitations (id, squad_id, sender_id, invitee_email, status, created_at) 
       VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)`, [inviteId, squadId, userId, friendEmail.toLowerCase().trim()]);
        return res.status(200).json({
            message: `Invitation dispatched to ${friendEmail.toLowerCase()}.`
        });
    }
    catch (error) {
        console.error('Invite Friend Error:', error);
        return res.status(500).json({ error: 'Server error creating invitation.' });
    }
}
// 5. LIST INCOMING INVITATIONS
export async function listInvitations(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        // Get user email
        const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
        const email = userResult.rows[0]?.email;
        if (!email) {
            return res.status(404).json({ error: 'User email not found.' });
        }
        const invites = await query(`SELECT * FROM invitations 
       WHERE invitee_email = $1 AND status = 'PENDING'`, [email]);
        return res.status(200).json({ invitations: invites.rows });
    }
    catch (error) {
        console.error('List Invitations Error:', error);
        return res.status(500).json({ error: 'Server error fetching invitations.' });
    }
}
// 6. RESOLVE INVITATION (ACCEPT or REJECT)
export async function resolveInvitation(req, res) {
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
            // Add user to the squad
            await query('UPDATE users SET squad_id = $1 WHERE id = $2', [invite.squad_id, userId]);
        }
        // Resolve invitation status
        await query('UPDATE invitations SET status = $1 WHERE id = $2', [status, invitationId]);
        return res.status(200).json({
            message: `Invitation successfully ${status.toLowerCase()}.`,
            squad_id: status === 'ACCEPTED' ? invite.squad_id : null
        });
    }
    catch (error) {
        console.error('Resolve Invitation Error:', error);
        return res.status(500).json({ error: 'Server error processing invitation.' });
    }
}
// 7. LEAVE OR LEAK OUT OF SQUAD
export async function leaveSquad(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        await query('UPDATE users SET squad_id = NULL WHERE id = $1', [userId]);
        return res.status(200).json({ message: 'Exited squad network successfully.' });
    }
    catch (error) {
        console.error('Leave Squad Error:', error);
        return res.status(500).json({ error: 'Server error leaving squad.' });
    }
}
