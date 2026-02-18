import express from 'express';
import pool from '../db.js';

const router = express.Router();

// --- Friend Request Logic ---

// Send Friend Request
router.post('/friends/request', async (req, res) => {
    const { userId, friendId } = req.body;
    console.log(`[SOCIAL] Friend request: From ${userId} to ${friendId}`);

    if (!userId || !friendId) {
        console.warn('[SOCIAL] Missing IDs in request:', { userId, friendId });
        return res.status(400).json({ error: 'Missing user IDs' });
    }

    if (String(userId) === String(friendId)) {
        return res.status(400).json({ error: 'You cannot add yourself' });
    }

    try {
        // Check if already friends or requested
        const existing = await pool.query(
            'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [String(userId), String(friendId)]
        );

        if (existing.rows.length > 0) {
            console.log('[SOCIAL] Relation already exists between:', userId, friendId);
            return res.status(400).json({ error: 'Relation already exists' });
        }

        await pool.query(
            'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
            [String(userId), String(friendId), 'PENDING']
        );

        console.log(`[SOCIAL] Request sent from ${userId} to ${friendId}`);
        res.json({ status: 'sent' });
    } catch (err) {
        console.error('[SOCIAL] Request database error:', err);
        res.status(500).json({ error: 'Request database failed', details: err.message });
    }
});

// Accept Friend Request
router.post('/friends/accept', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // userId is the one ACCEPTING, so friendId sent the request
        // The record might be user_id=friendId, friend_id=userId
        await pool.query(
            `UPDATE friends 
             SET status = 'ACCEPTED' 
             WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [userId, friendId]
        );
        res.json({ status: 'accepted' });
    } catch (err) {
        console.error('[SOCIAL] Accept error:', err);
        res.status(500).json({ error: 'Accept failed' });
    }
});

// Delete Friend / Cancel Request
router.post('/friends/delete', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(
            'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [userId, friendId]
        );
        res.json({ status: 'deleted' });
    } catch (err) {
        console.error('[SOCIAL] Delete error:', err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// --- Search Logic ---

router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 2) return res.json([]);

    try {
        const result = await pool.query(
            `SELECT id, name, avatar_id, vibe_id FROM users 
             WHERE name ILIKE $1 
             LIMIT 10`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[SOCIAL] Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// --- Leaderboard Logic ---
// Note: Global leaderboard is handled here to avoid route conflicts

router.get('/leaderboard/global', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, name, avatar_id, vibe_id, level, xp FROM users ORDER BY level DESC, xp DESC LIMIT 20`);
        res.json(result.rows);
    } catch (err) {
        console.error('[SOCIAL] Global Leaderboard error:', err);
        res.status(500).json({ error: 'Leaderboard failed' });
    }
});

router.get('/leaderboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Get user + friends leaderboard
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, u.level, u.xp 
            FROM users u
            LEFT JOIN friends f ON (f.user_id = u.id AND f.friend_id = $1) OR (f.friend_id = u.id AND f.user_id = $1)
            WHERE u.id = $1 OR f.status = 'ACCEPTED'
            ORDER BY u.level DESC, u.xp DESC
            LIMIT 50
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('[SOCIAL] Leaderboard error:', err);
        res.status(500).json({ error: 'Leaderboard failed' });
    }
});

export default router;
