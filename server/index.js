
import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import dotenv from 'dotenv';
import {
    initializeGame,
    revealInitialCards,
    drawFromPile,
    drawFromDiscard,
    replaceCard,
    discardAndReveal,
    calculateFinalScores,
    endTurn,
    performSwap,
    playActionCard,
    resolveBlackHole
} from '../src/lib/skyjoEngine.js';

dotenv.config();

import feedbackRoutes from './routes/feedback.js';
import pushRoutes from './routes/push.js';
import { sendInvitationNotification } from './utils/pushNotifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the dist folder (built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// --- Database Configuration ---
// Pool is now imported from ./db.js

const initDb = async () => {
    console.log('[DB] Starting database initialization...');

    // Step 1: Create users table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                emoji TEXT,
                avatar_id TEXT,
                vibe_id TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                migrated_to_v2 BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('[DB] ✓ Users table ready');
    } catch (e) { console.error('[DB] Users table error:', e.message); }

    // Step 2: Create friends table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS friends (
                user_id TEXT,
                friend_id TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, friend_id)
            );
        `);
        console.log('[DB] ✓ Friends table ready');
    } catch (e) { console.error('[DB] Friends table error:', e.message); }

    // Step 3: Create push_subscriptions table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100),
                subscription JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('[DB] ✓ Push subscriptions table ready');
    } catch (e) { console.error('[DB] Push subscriptions error:', e.message); }

    // Step 4: Create game_history table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_history (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                game_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[DB] ✓ Game history table ready');
    } catch (e) { console.error('[DB] Game history error:', e.message); }

    // Step 5: Create feedbacks table
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'general',
                status VARCHAR(20) DEFAULT 'new',
                device_info JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[DB] ✓ Feedbacks table ready');
    } catch (e) { console.error('[DB] Feedbacks table error:', e.message); }

    // Step 6: Add missing columns (individual migrations)
    const migrations = [
        { table: 'users', col: 'emoji', sql: 'ALTER TABLE users ADD COLUMN emoji TEXT' },
        { table: 'users', col: 'avatar_id', sql: 'ALTER TABLE users ADD COLUMN avatar_id TEXT' },
        { table: 'users', col: 'vibe_id', sql: 'ALTER TABLE users ADD COLUMN vibe_id TEXT' },
        { table: 'users', col: 'level', sql: 'ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1' },
        { table: 'users', col: 'xp', sql: 'ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0' },
        { table: 'users', col: 'migrated_to_v2', sql: 'ALTER TABLE users ADD COLUMN migrated_to_v2 BOOLEAN DEFAULT FALSE' },
        { table: 'feedbacks', col: 'type', sql: "ALTER TABLE feedbacks ADD COLUMN type VARCHAR(50) DEFAULT 'general'" },
        { table: 'feedbacks', col: 'status', sql: "ALTER TABLE feedbacks ADD COLUMN status VARCHAR(20) DEFAULT 'new'" },
        { table: 'feedbacks', col: 'device_info', sql: 'ALTER TABLE feedbacks ADD COLUMN device_info JSONB' },
        { table: 'push_subscriptions', col: 'username', sql: 'ALTER TABLE push_subscriptions ADD COLUMN username VARCHAR(100)' },
        { table: 'push_subscriptions', col: 'created_at', sql: 'ALTER TABLE push_subscriptions ADD COLUMN created_at TIMESTAMP DEFAULT NOW()' },
        { table: 'push_subscriptions', col: 'updated_at', sql: 'ALTER TABLE push_subscriptions ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()' },
    ];

    for (const m of migrations) {
        try {
            const check = await pool.query(
                `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
                [m.table, m.col]
            );
            if (check.rows.length === 0) {
                await pool.query(m.sql);
                console.log(`[DB] ✓ Added ${m.table}.${m.col}`);
            }
        } catch (e) { console.error(`[DB] Migration ${m.table}.${m.col} error:`, e.message); }
    }

    console.log('[DB] Database initialization complete!');
};

initDb();

// --- Web Push Configuration ---
// --- Web Push Configuration ---
// Config handled in utils/pushNotifications.js
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;

// Endpoint to expose VAPID public key to client
app.get('/api/config/vapid', (req, res) => {
    if (!vapidPublic) {
        return res.status(500).json({ error: 'VAPID public key not configured' });
    }
    res.json({ key: vapidPublic });
});

app.get('/api/config/version', (req, res) => {
    res.json({
        version: '1.2.2-env-debug',
        env: {
            node_env: process.env.NODE_ENV,
            f_project_id: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
            v_project_id: process.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
            v_sender_id: process.env.VITE_FIREBASE_SENDER_ID ? 'SET' : 'MISSING',
            f_client_email: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
            f_private_key: process.env.FIREBASE_PRIVATE_KEY ? (process.env.FIREBASE_PRIVATE_KEY.length > 50 ? 'SET_VALID' : 'TOO_SHORT') : 'MISSING'
        },
        t: Date.now()
    });
});

// --- Feedback API ---
app.use('/api/feedback', feedbackRoutes);
app.use('/api/push', pushRoutes);

// --- Social & Profile API ---

app.post('/api/social/profile', async (req, res) => {
    let { id, name, emoji, avatarId, vibeId, level, currentXP } = req.body;

    // --- FORCE FIX FOR SPECIFIC USERS (REMOVED) ---
    // User can now progress normally

    try {
        // Sanitize vibeId: empty string -> null to prevent UNIQUE constraint violation
        const sanitizedVibeId = vibeId && vibeId.trim() !== '' ? vibeId : null;

        await pool.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, last_seen)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id,
                vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                last_seen = CURRENT_TIMESTAMP
        `, [id, name, emoji, avatarId, sanitizedVibeId, level, currentXP]);
        res.json({ status: 'ok' });
    } catch (err) {
        console.error('[API] Profile Sync Error (User ID:', id, '):', err);
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

app.get('/api/social/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT id, name, emoji, avatar_id, vibe_id, level, xp FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[API] Get Profile Error:', err);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.get('/api/social/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(`
            SELECT id, name, avatar_id, vibe_id FROM users
            WHERE name ILIKE $1 OR vibe_id ILIKE $1
            LIMIT 10
        `, [`%${query}%`]);

        // Inject real-time status
        const searchResultsWithStatus = result.rows.map(u => {
            const sockets = userStatus.get(String(u.id));
            const metadata = userMetadata.get(String(u.id));
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(searchResultsWithStatus);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// --- Migration API (LocalStorage -> DB) ---

app.post('/api/social/migrate', async (req, res) => {
    const { userId, profile, history } = req.body;

    if (!userId || !profile) {
        return res.status(400).json({ error: 'Missing userId or profile' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Sync Profile & Mark as Migrated
        await client.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, last_seen, migrated_to_v2)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, TRUE)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id,
                vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                last_seen = CURRENT_TIMESTAMP,
                migrated_to_v2 = TRUE
        `, [
            userId,
            profile.name || 'Joueur',
            profile.emoji || '🐱',
            profile.avatarId || 'cat',
            profile.vibeId && profile.vibeId.trim() !== '' ? profile.vibeId : null,
            profile.level || 1,
            profile.currentXP || 0
        ]);

        // 2. Sync History (if any)
        if (history && Array.isArray(history) && history.length > 0) {
            for (const game of history) {
                await client.query(`
                    INSERT INTO game_history (id, user_id, game_data, created_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id) DO NOTHING
                `, [game.id, userId, JSON.stringify(game), game.date]);
            }
        }

        await client.query('COMMIT');
        console.log(`[MIGRATION] User ${userId} successfully migrated (${history?.length || 0} games)`);
        res.json({ status: 'ok', migratedCount: history?.length || 0 });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[MIGRATION] Critical Error for user', userId, ':', err);
        res.status(500).json({ error: 'Migration failed', details: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/social/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, f.status, f.user_id as requester_id
            FROM users u
            JOIN friends f ON (f.user_id = $1 AND f.friend_id = u.id) OR (f.friend_id = $1 AND f.user_id = u.id)
            WHERE u.id != $1
        `, [userId]);

        // Inject real-time status from memory
        const friendsWithStatus = result.rows.map(f => {
            const sockets = userStatus.get(String(f.id));
            const metadata = userMetadata.get(String(f.id));
            return {
                ...f,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(friendsWithStatus);
    } catch (err) {
        console.error('[API] Fetch friends failed:', err);
        res.status(500).json({ error: 'Fetch friends failed', details: err.message });
    }
});

app.post('/api/social/friends/request', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES ($1, $2, 'PENDING')
            ON CONFLICT DO NOTHING
        `, [userId, friendId]);

        // Real-time notification for recipient
        const friendSockets = userStatus.get(String(friendId));
        if (friendSockets && friendSockets.size > 0) {
            friendSockets.forEach(socketId => {
                io.to(socketId).emit('friend_request', { fromUserId: userId });
                io.to(socketId).emit('presence_refresh');
            });
        }

        res.json({ status: 'sent' });
    } catch (err) {
        res.status(500).json({ error: 'Request failed' });
    }
});

app.post('/api/social/friends/accept', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            UPDATE friends SET status = 'ACCEPTED'
            WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);

        // Refresh lists for both sides immediately
        [userId, friendId].forEach(id => {
            const sockets = userStatus.get(String(id));
            if (sockets) {
                sockets.forEach(socketId => io.to(socketId).emit('presence_refresh'));
            }
        });

        res.json({ status: 'accepted' });
    } catch (err) {
        res.status(500).json({ error: 'Accept failed' });
    }
});

app.post('/api/social/friends/delete', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await pool.query(`
            DELETE FROM friends 
            WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);
        res.json({ status: 'deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.get('/api/social/leaderboard/global', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, avatar_id, vibe_id, level, xp FROM users
            ORDER BY CAST(level AS INTEGER) DESC, CAST(xp AS INTEGER) DESC LIMIT 20
        `);


        // Inject real-time status
        const usersWithStatus = result.rows.map(u => {
            const userId = String(u.id);
            const sockets = userStatus.get(userId);
            const metadata = userMetadata.get(userId);
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error('[API] Global Leaderboard failed:', err);
        res.status(500).json({ error: 'Leaderboard failed', details: err.message });
    }
});

app.get('/api/social/leaderboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Includes user and their accepted friends
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, u.level, u.xp FROM users u
            WHERE u.id = $1 OR u.id IN (
                SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END
                FROM friends WHERE (user_id = $1 OR friend_id = $1) AND status = 'ACCEPTED'
            )
            ORDER BY CAST(level AS INTEGER) DESC, CAST(xp AS INTEGER) DESC
        `, [userId]);

        // Inject real-time status
        const usersWithStatus = result.rows.map(u => {
            const userId = String(u.id);
            const sockets = userStatus.get(userId);
            const metadata = userMetadata.get(userId);
            return {
                ...u,
                isOnline: sockets && sockets.size > 0,
                currentStatus: metadata?.status || 'OFFLINE'
            };
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error('[API] Friend Leaderboard failed:', err);
        res.status(500).json({ error: 'Friend leaderboard failed', details: err.message });
    }
});



// --- Server Utilities ---

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.locals.io = io;

const rooms = new Map();
const userStatus = new Map(); // userId -> Set of socketIds
const userMetadata = new Map(); // userId -> {status, etc}
const pendingDisconnections = new Map(); // userId -> setTimeout ID
const connectionAttempts = new Map(); // userId -> { count, lastAttempt }

const getPublicRooms = () => {
    const publicRooms = [];
    for (const [code, room] of rooms.entries()) {
        if (!room.gameStarted && room.players.length < 8 && room.isPublic) {
            publicRooms.push({
                code,
                hostName: room.players.find(p => p.isHost)?.name || 'Inconnu',
                playerCount: room.players.length,
                emoji: room.players.find(p => p.isHost)?.emoji || '🎮'
            });
        }
    }
    return publicRooms;
};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const startNextRoundForRoom = (roomCode, room, ioInstance) => {
    room.playersReadyForNextRound = new Set();
    if (room.nextRoundTimeout) {
        clearTimeout(room.nextRoundTimeout);
        room.nextRoundTimeout = null;
    }

    if (!room.roundScored) {
        const roundScores = calculateFinalScores(room.gameState);
        roundScores.forEach(score => {
            // Force string ID for safety
            const pid = String(score.playerId);
            const additional = score.finalScore || 0;
            const currentTotal = room.totalScores[pid] || 0;
            room.totalScores[pid] = currentTotal + additional;
            console.log(`[SCORING] Player ${pid} (${score.playerName}): ${currentTotal} + ${additional} = ${room.totalScores[pid]}`);
        });
        console.log('[SCORING] Updated Total Scores:', JSON.stringify(room.totalScores));
        room.roundScored = true;
    }

    const maxScore = Math.max(...Object.values(room.totalScores));
    if (maxScore >= 100) {
        room.isGameOver = true;
        const minScore = Math.min(...Object.values(room.totalScores));
        const winnerId = Object.keys(room.totalScores).find(id => room.totalScores[id] === minScore);
        const winnerPlayer = room.players.find(p => p.id === winnerId);
        room.gameWinner = { id: winnerId, name: winnerPlayer?.name, emoji: winnerPlayer?.emoji, score: minScore };
        ioInstance.to(roomCode).emit('game_over', { totalScores: room.totalScores, winner: room.gameWinner });

        // Return players to 'ONLINE' status
        room.players.forEach(p => {
            const stringId = String(p.dbId);
            userMetadata.set(stringId, { status: 'ONLINE' });
            io.emit('user_presence_update', { userId: stringId, status: 'ONLINE' });
        });
    } else {
        room.roundNumber++;
        room.roundScored = false;
        const gamePlayers = room.players.map(p => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            dbId: p.dbId
        }));
        const isBonusMode = room.gameMode === 'bonus';
        room.gameState = initializeGame(gamePlayers, { isBonusMode });
        ioInstance.to(roomCode).emit('game_started', {
            gameState: room.gameState,
            totalScores: room.totalScores,
            roundNumber: room.roundNumber,
            gameMode: room.gameMode
        });
    }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.emit('room_list_update', getPublicRooms());

    socket.on('register_user', ({ id, name, emoji, vibeId }) => {
        const stringId = String(id);
        const now = Date.now();

        // --- 1. RATE LIMITING ---
        const attempt = connectionAttempts.get(stringId) || { count: 0, lastAttempt: 0 };
        if (attempt.count >= 3 && (now - attempt.lastAttempt) < 5000) {
            console.warn(`[RATE LIMIT] ${name} (${stringId}) connecting too fast`);
            socket.emit('error', 'Trop de connexions. Attends 5 secondes.');
            socket.disconnect(true);
            return;
        }
        if (now - attempt.lastAttempt > 5000) attempt.count = 0;
        attempt.count++;
        attempt.lastAttempt = now;
        connectionAttempts.set(stringId, attempt);

        socket.dbId = stringId;
        socket.playerName = name;

        // --- 2. MULTI-TAB PRESENCE ---
        // Cancel any pending disconnection for this user
        if (pendingDisconnections.has(stringId)) {
            console.log(`[PRESENCE] Cancelling offline timer for ${stringId} (Active socket)`);
            clearTimeout(pendingDisconnections.get(stringId));
            pendingDisconnections.delete(stringId);
        }

        // Ensure user has a socket pool
        if (!userStatus.has(stringId)) {
            userStatus.set(stringId, new Set());
        }

        const pool = userStatus.get(stringId);
        pool.add(socket.id);

        // Update metadata
        userMetadata.set(stringId, { status: 'ONLINE', lastSeen: Date.now() });

        // Broadcast presence update
        io.emit('user_presence_update', { userId: stringId, status: 'ONLINE' });
        console.log(`[USER] Registered: ${name} (${stringId}). Socket: ${socket.id}. Pool size: ${pool.size}`);
    });

    socket.on('create_room', ({ playerName, emoji, dbId, isPublic = true, autoInviteFriendId }) => {
        const roomCode = generateRoomCode();
        const effectiveDbId = dbId || socket.dbId;
        // Use dbId as ID if available to ensure persistence across reloads
        // Fallback to socket.id only for guests without dbId
        const playerId = effectiveDbId || socket.id;

        rooms.set(roomCode, {
            gameState: null,
            players: [{
                id: playerId,
                socketId: socket.id, // Keep track of current socket separately
                dbId: effectiveDbId,
                name: playerName,
                emoji,
                isHost: true
            }],
            totalScores: {},
            roundNumber: 1,
            gameStarted: false,
            isGameOver: false,
            gameWinner: null,
            isPublic: !!isPublic,
            gameMode: null
        });
        socket.join(roomCode);
        socket.emit('room_created', roomCode);

        // ATOMIC INVITE v2: Invitation with Retry and Feedback
        if (autoInviteFriendId) {
            const stringFriendId = String(autoInviteFriendId);
            console.log(`[ATOMIC INVITE] Starting retry loop for ${stringFriendId}`);

            const sendWithRetry = async (retriesLeft) => {
                const sockets = userStatus.get(stringFriendId);
                if (sockets && sockets.size > 0) {
                    console.log(`[ATOMIC INVITE] Success on attempt ${4 - retriesLeft}. Sending to ${sockets.size} sockets.`);
                    sockets.forEach(socketId => {
                        io.to(socketId).emit('game_invitation', { fromName: playerName, roomCode });
                    });
                    socket.emit('invitation_sent', { friendId: stringFriendId });
                    return true;
                }

                if (retriesLeft > 0) {
                    const delay = (4 - retriesLeft) * 300; // 300ms, 600ms, 900ms
                    console.log(`[ATOMIC INVITE] Friend ${stringFriendId} offline. Retrying in ${delay}ms...`);
                    setTimeout(() => sendWithRetry(retriesLeft - 1), delay);
                    return false;
                }

                console.log(`[ATOMIC INVITE] Final Failure for ${stringFriendId} on Socket. Trying Push...`);

                // Fallback to Push Notification if offline after retries
                console.log(`[ATOMIC_INVITE_DEBUG] Initial sockets failed. Starting PUSH fallback for ${stringFriendId}...`);
                sendInvitationNotification(String(effectiveDbId), playerName, stringFriendId, roomCode)
                    .then(res => {
                        if (res.success) {
                            console.log(`[ATOMIC_INVITE_DEBUG] PUSH success for ${stringFriendId}`);
                            socket.emit('invitation_sent', { friendId: stringFriendId, method: 'push' });
                        } else {
                            console.error(`[ATOMIC_INVITE_DEBUG] PUSH failed for ${stringFriendId}:`, res.error || res.reason);
                            const reason = res.reason === 'No subscription' ? 'PUSH_DISABLED' : 'OFFLINE';
                            socket.emit('invitation_failed', { reason, friendId: stringFriendId });
                        }
                    })
                    .catch(err => {
                        console.error(`[ATOMIC_INVITE_DEBUG] PUSH exception for ${stringFriendId}:`, err);
                        socket.emit('invitation_failed', { reason: 'OFFLINE', friendId: stringFriendId });
                    });

                return false;
            };

            sendWithRetry(3); // Start with 3 retries
        }

        io.to(roomCode).emit('player_list_update', rooms.get(roomCode).players);
        io.emit('room_list_update', getPublicRooms());
    });

    socket.on('join_room', ({ roomCode, playerName, emoji, dbId }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) { socket.emit('error', 'Salle introuvable'); return; }

        const effectiveDbId = dbId || socket.dbId;

        // Check for reconnection (Player exists in room)
        // Match by dbId if available
        const existingPlayer = room.players.find(p =>
            (p.dbId && String(p.dbId) === String(effectiveDbId))
        );

        if (existingPlayer) {
            console.log(`[Server] Player ${playerName} reconnecting to ${roomCode}`);
            // Update socket ID reference
            existingPlayer.socketId = socket.id;

            // NOTE: We DO NOT change existingPlayer.id because that is what gameState uses!
            // If the game started with dbId as ID, it must stay dbId.

            // Update latest name/emoji if changed (optional)
            if (playerName) existingPlayer.name = playerName;
            if (emoji) existingPlayer.emoji = emoji;

            socket.join(roomCode.toUpperCase());
            socket.dbId = effectiveDbId;

            // Notify everyone (to update socket ID mapping on clients)
            io.to(roomCode.toUpperCase()).emit('player_list_update', room.players);

            // If game is running, send state immediately
            if (room.gameStarted) {
                socket.emit('game_started', {
                    gameState: room.gameState,
                    totalScores: room.totalScores,
                    roundNumber: room.roundNumber
                });
                // Sync mode on reconnect
                socket.emit('mode_changed', room.gameMode);
            } else {
                io.emit('room_list_update', getPublicRooms());
            }
            return;
        }

        if (room.gameStarted) { socket.emit('error', 'La partie a déjà commencé'); return; }
        if (room.players.some(p => p.socketId === socket.id)) return; // Already joined with this socket
        if (room.players.length >= 8) { socket.emit('error', 'Salle pleine'); return; }

        const playerId = effectiveDbId || socket.id;

        room.players.push({
            id: playerId,
            socketId: socket.id,
            dbId: effectiveDbId,
            name: playerName,
            emoji,
            isHost: false
        });

        socket.join(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit('player_list_update', room.players);

        // Robust Sync: Send current room state to the newly joined player
        const isHost = playerId === room.players.find(p => p.isHost)?.id;
        console.log(`[Sync] Sending room_sync to ${playerName} for room ${roomCode}. Mode: ${room.gameMode}, isHost: ${isHost}`);
        socket.emit('room_sync', {
            gameMode: room.gameMode,
            gameStarted: room.gameStarted,
            roundNumber: room.roundNumber,
            isHost
        });

        io.emit('room_list_update', getPublicRooms());
        socket.to(roomCode.toUpperCase()).emit('new_player_joined', { playerName, emoji });
    });

    socket.on('start_game', (roomCode) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;
        // Include dbId for robust player identification on client (reconnects)
        const gamePlayers = room.players.map(p => ({
            id: p.id, // This is now stable (dbId or first socketId)
            name: p.name,
            emoji: p.emoji,
            dbId: p.dbId
        }));
        const isBonusMode = room.gameMode === 'bonus';
        console.log(`[ENGINE] Initializing ONLINE game for room ${roomCode}. Mode: ${room.gameMode}, isBonusMode: ${isBonusMode}`);
        room.gameState = initializeGame(gamePlayers, { isBonusMode });
        console.log(`[ENGINE] Deck created with ${room.gameState.drawPile.length} cards.`);
        room.gameStarted = true;

        // Update presence to IN_GAME
        room.players.forEach(p => {
            if (p.dbId) {
                const stringId = String(p.dbId);
                userMetadata.set(stringId, { status: 'IN_GAME' });
                io.emit('user_presence_update', { userId: stringId, status: 'IN_GAME' });
            }
        });

        io.emit('room_list_update', getPublicRooms());
        // ALWAYS reset scores and round when starting a new game (not just when empty)
        room.totalScores = {};
        room.roundNumber = 1;
        room.isGameOver = false;
        room.gameWinner = null;
        gamePlayers.forEach(p => room.totalScores[String(p.id)] = 0);
        io.to(roomCode.toUpperCase()).emit('game_started', {
            gameState: room.gameState,
            totalScores: room.totalScores,
            roundNumber: room.roundNumber,
            gameMode: room.gameMode
        });
    });

    socket.on('change_mode', ({ roomCode, mode, dbId }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) {
            console.error(`[Room] change_mode failed: Room ${roomCode} not found`);
            return;
        }

        // Only host can change mode
        console.log(`[DEBUG] change_mode request: Room=${roomCode}, Mode=${mode}, Socket=${socket.id}, DB_ID=${dbId}`);

        // Robust check: Socket ID matches OR persistent DB ID matches
        const player = room.players.find(p => {
            const matchSocket = p.socketId === socket.id;
            const matchDb = (dbId && String(p.dbId) === String(dbId));
            const matchSocketDb = (socket.dbId && String(p.dbId) === String(socket.dbId));
            if (matchSocket || matchDb || matchSocketDb) {
                console.log(`[DEBUG] Host identified via: ${matchSocket ? 'Socket' : ''} ${matchDb ? 'PayloadDB' : ''} ${matchSocketDb ? 'SocketDB' : ''}`);
                return true;
            }
            return false;
        });

        if (!player) {
            console.warn(`[DEBUG] Player not found in room ${roomCode}. Socket=${socket.id}`);
        } else if (!player.isHost) {
            console.warn(`[DEBUG] Player ${player.name} found but is NOT host.`);
        }

        if (!player || !player.isHost) {
            console.warn(`[Room] change_mode unauthorized in ${roomCode}: Player ${player?.name || 'Unknown'}/${socket.id} (dbId: ${dbId}) is not host`);
            socket.emit('error', 'Seul l\'hôte peut changer le mode de jeu');
            return;
        }

        // Valid modes check
        if (!['classic', 'bonus'].includes(mode)) {
            console.error(`[DEBUG] Invalid mode requested: ${mode}`);
            return;
        }

        console.log(`[Socket] Room ${roomCode} mode change REQUEST for ${mode} from ${player.name} (${socket.id})`);
        room.gameMode = mode;
        console.log(`[Room] Mode officially changed to ${mode} for room ${roomCode}. Final state: ${room.gameMode}`);

        // Force broadcast to everyone in room
        io.to(roomCode.toUpperCase()).emit('mode_changed', mode);
        // Also send explicit room_sync to be safe
        io.to(roomCode.toUpperCase()).emit('room_sync', {
            gameMode: room.gameMode,
            gameStarted: room.gameStarted,
            roundNumber: room.roundNumber
        });
    });

    socket.on('game_action', ({ roomCode, action, payload }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room || !room.gameState) return;
        // Find the player in the room using their CURRENT socketId
        const playerInRoom = room.players.find(p => p.socketId === socket.id);
        if (!playerInRoom) return;

        // Find their index in the gameState using the STABLE id
        const pIdx = room.gameState.players.findIndex(p => p.id === playerInRoom.id);
        if (pIdx === -1) return;

        let lastAction = { type: action, playerId: playerInRoom.id, playerName: room.gameState.players[pIdx]?.name, card: null, timestamp: Date.now() };

        try {
            // IMPORTANT: Deep copy to avoid mutating shared references
            let newState = JSON.parse(JSON.stringify(room.gameState));
            if (newState.phase === 'INITIAL_REVEAL') {
                if (action === 'reveal_initial') newState = revealInitialCards(newState, pIdx, payload.cardIndices);
            } else {
                if (room.gameState.players[room.gameState.currentPlayerIndex].id !== playerInRoom.id) return;
                switch (action) {
                    case 'draw_pile': newState = drawFromPile(newState); break;
                    case 'draw_discard': newState = drawFromDiscard(newState); break;
                    case 'replace_card':
                        const replacedCard = room.gameState.players[pIdx].hand[payload.cardIndex];
                        lastAction.card = replacedCard ? { ...replacedCard, isRevealed: true } : null;
                        newState = replaceCard(newState, payload.cardIndex);
                        newState = endTurn(newState);
                        break;
                    case 'discard_and_reveal': newState = discardAndReveal(newState, payload.cardIndex); newState = endTurn(newState); break;
                    case 'discard_drawn':
                        if (!newState.drawnCard) return;
                        lastAction.card = { ...newState.drawnCard, isRevealed: true };
                        newState = { ...newState, discardPile: [...newState.discardPile, { ...newState.drawnCard, isRevealed: true }], drawnCard: null, turnPhase: 'MUST_REVEAL' };
                        break;
                    case 'reveal_hidden':
                        const player = newState.players[pIdx];
                        if (player.hand[payload.cardIndex].isRevealed) {
                            throw new Error('Cette carte est déjà révélée !');
                        }
                        const newHand = player.hand.map((card, i) => {
                            if (i === payload.cardIndex) {
                                const revealedCard = { ...card, isRevealed: true };
                                if (revealedCard.value === 20) {
                                    revealedCard.lockCount = 3;
                                }
                                return revealedCard;
                            }
                            return card;
                        });
                        newState.players[pIdx] = { ...player, hand: newHand };
                        newState.turnPhase = 'DRAW';
                        newState = endTurn(newState);
                        break;
                    case 'undo_draw_discard':
                        if (newState.turnPhase !== 'MUST_REPLACE' || !newState.drawnCard) return;
                        newState = { ...newState, discardPile: [...newState.discardPile, newState.drawnCard], drawnCard: null, turnPhase: 'DRAW' };
                        lastAction.type = 'undo_draw_discard';
                        lastAction.card = null;
                        break;
                    case 'perform_swap':
                        newState = performSwap(newState, payload.sourceCardIndex, payload.targetPlayerIndex, payload.targetCardIndex);
                        break;
                    case 'use_action_card':
                        newState = playActionCard(newState);
                        break;
                    case 'activate_black_hole':
                        newState = resolveBlackHole(newState);
                        break;
                }
            }
            if (newState.phase === 'FINISHED') {
                // Check for chest cards (?)
                let hasChests = false;
                const chestResults = {};

                newState.players.forEach(p => {
                    p.hand.forEach(c => {
                        if (c && (c.specialType === 'CH' || c.value === 'CH')) {
                            hasChests = true;
                            // Deterministic result based on roomCode and cardId
                            const seed = `${roomCode}-${c.id}`;
                            let hash = 0;
                            for (let i = 0; i < seed.length; i++) {
                                hash = (hash << 5) - hash + seed.charCodeAt(i);
                                hash |= 0;
                            }
                            const chestValue = Math.abs(hash) % 2 === 0 ? -15 : 15;
                            chestResults[c.id] = chestValue;
                        }
                    });
                });

                if (hasChests) {
                    newState.phase = 'REVEALING_CHESTS';
                    newState.chestResults = chestResults;
                }

                // Reveal all cards for all players so clients can calculate scores correctly
                // Fixes the bug where scores were 0 because cards were hidden
                newState.players.forEach(p => {
                    p.hand.forEach(c => {
                        if (c) c.isRevealed = true;
                    });
                });
            }
            room.gameState = newState;
            io.to(roomCode.toUpperCase()).emit('game_update', { gameState: newState, lastAction });
        } catch (e) {
            socket.emit('gameplay_error', e.message);
        }
    });

    socket.on('next_round', (roomCode) => {
        console.log(`[DEBUG] next_round received for: ${roomCode} from ${socket.id}`);
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) {
            console.log(`[DEBUG] Room not found for code: ${roomCode}`);
            return;
        }

        // Find player by current socket
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Initialize set if not exists (handling rooms created before patch)
        if (!room.playersReadyForNextRound) room.playersReadyForNextRound = new Set();

        room.playersReadyForNextRound.add(player.id); // Use stable ID
        console.log(`[DEBUG] Player valid. Headcount: ${room.playersReadyForNextRound.size}/${room.players.length}`);

        const readyCount = room.playersReadyForNextRound.size;
        const totalPlayers = room.players.length;

        io.to(roomCode.toUpperCase()).emit('player_ready_next_round', {
            playerId: socket.id, // Use emitting socket ID so client recognizes "me"
            playerName: player?.name || 'Joueur',
            playerEmoji: player?.emoji || '👤',
            readyCount,
            totalPlayers
        });

        // 10 second timeout first time a player is ready
        if (readyCount === 1 && !room.nextRoundTimeout) {
            room.nextRoundTimeout = setTimeout(() => {
                io.to(roomCode).emit('timeout_expired', { message: "L'hôte peut lancer la manche suivante" });
            }, 10000);
        }

        // Auto start if everyone is ready
        if (readyCount === totalPlayers) {
            startNextRoundForRoom(roomCode, room, io);
        }
    });

    socket.on('force_next_round', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = room.players.find(p => p.socketId === socket.id);

        // Only host can force (or anyone if timeout expired logic is handled on client, 
        // but safer to restrict to host or check timeout on server. 
        // For simplicity assuming UI only shows button to host after timeout)
        if (player && player.isHost) {
            startNextRoundForRoom(roomCode.toUpperCase(), room, io);
        }
    });

    socket.on('invite_friend', async ({ friendId, roomCode, fromName }) => {
        const stringFriendId = String(friendId);
        console.log(`[INVITE_DEBUG] From: ${fromName} (UID: ${socket.dbId}) | To: ${stringFriendId} | Room: ${roomCode}`);

        const sockets = userStatus.get(stringFriendId);
        if (sockets && sockets.size > 0) {
            console.log(`[INVITE_DEBUG] Target ${stringFriendId} is ONLINE. Sending via Socket.`);
            sockets.forEach(socketId => {
                io.to(socketId).emit('game_invitation', { fromName, roomCode });
            });
            // Also try push as backup even if online (ensures reliability)
        } else {
            console.log(`[INVITE_DEBUG] Target ${stringFriendId} is OFFLINE (Socket pool empty).`);
        }

        // Try Push Notification
        console.log(`[INVITE_DEBUG] Attempting PUSH for ${stringFriendId}...`);
        sendInvitationNotification(String(socket.dbId), fromName, stringFriendId, roomCode)
            .then(res => {
                if (res.success) {
                    console.log(`[INVITE_DEBUG] PUSH success for ${stringFriendId}`);
                    socket.emit('invitation_sent', { friendId: stringFriendId, method: 'push' });
                } else {
                    console.error(`[INVITE_DEBUG] PUSH failed for ${stringFriendId}:`, res.error || res.reason);
                    const reason = res.reason === 'No subscription' ? 'PUSH_DISABLED' : 'OFFLINE';
                    socket.emit('invitation_failed', { reason, friendId: stringFriendId });
                }
            })
            .catch(err => {
                console.error(`[INVITE_DEBUG] PUSH exception for ${stringFriendId}:`, err);
                socket.emit('invitation_failed', { reason: 'OFFLINE', friendId: stringFriendId });
            });
    });

    const handlePlayerLeave = (socket) => {
        for (const [roomCode, room] of rooms.entries()) {
            // FIX: Lookup by socketId because p.id is now the STABLE id (dbId)
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex !== -1) {
                const leavingPlayer = room.players[playerIndex];

                // Remove from "Ready" set if they were ready
                if (room.playersReadyForNextRound?.has(socket.id)) {
                    room.playersReadyForNextRound.delete(socket.id);
                    // Notify others that ready count changed
                    const readyCount = room.playersReadyForNextRound.size;
                    io.to(roomCode).emit('player_ready_next_round', {
                        playerId: socket.id,
                        playerName: leavingPlayer.name,
                        playerEmoji: leavingPlayer.emoji,
                        readyCount,
                        totalPlayers: room.players.length
                    });
                }

                if (room.gameStarted) {
                    // CRITICAL: If HOST leaves, we must cancel the game (as per user request "adversaire ejecté")
                    if (leavingPlayer.isHost) {
                        console.log(`[Room] Host ${leavingPlayer.name} disconnected from active game ${roomCode} - CANCELLING GAME`);

                        io.to(roomCode).emit('game_cancelled', {
                            reason: `L'hôte ${leavingPlayer.name} a quitté la partie.`
                        });

                        rooms.delete(roomCode);
                        io.emit('room_list_update', getPublicRooms());

                        // Force everyone to leave socket room
                        io.in(roomCode).socketsLeave(roomCode);
                        return;
                    }

                    // IF NON-HOST LEAVES:
                    // Stop the game immediately to avoid stranding the host
                    console.log(`[Room] Player ${leavingPlayer.name} disconnected from active game ${roomCode} - CANCELLING GAME`);

                    io.to(roomCode).emit('game_cancelled', {
                        reason: `Le joueur ${leavingPlayer.name} a quitté la partie.`
                    });

                    // Cleanup room
                    rooms.delete(roomCode);
                    io.emit('room_list_update', getPublicRooms());

                    // Force everyone to leave socket room
                    io.in(roomCode).socketsLeave(roomCode);
                    return;

                } else {
                    // LOBBY MODE: Remove player normally
                    room.players.splice(playerIndex, 1);

                    if (room.players.length === 0) {
                        rooms.delete(roomCode);
                    } else {
                        let newHostName = null;
                        if (leavingPlayer.isHost) {
                            room.players[0].isHost = true;
                            newHostName = room.players[0].name;
                        }

                        io.to(roomCode).emit('player_left', { playerId: socket.id, playerName: leavingPlayer.name, newHost: newHostName });
                        io.to(roomCode).emit('player_list_update', room.players);
                    }
                    io.emit('room_list_update', getPublicRooms());
                    socket.leave(roomCode);
                    break;
                }
            }
        }
    };

    socket.on('chat_typing', ({ toId, isTyping }) => {
        const friendSockets = userStatus.get(String(toId));
        if (friendSockets) {
            friendSockets.forEach(socketId => {
                io.to(socketId).emit('chat_typing', { fromId: socket.dbId, isTyping });
            });
        }
    });

    socket.on('private_message', (data) => {
        const { toId, text, replyTo } = data;
        if (!socket.dbId) {
            console.warn('[CHAT] Message drop: No dbId for sender socket:', socket.id);
            return;
        }

        console.log(`[CHAT] Private message from ${socket.dbId} to ${toId}: ${text} (Reply to: ${replyTo ? replyTo.id : 'none'})`);

        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            fromId: socket.dbId,
            toId: String(toId),
            text,
            timestamp: Date.now(),
            replyTo: replyTo || null
        };

        // Send to recipient
        const recipientSockets = userStatus.get(String(toId));
        if (recipientSockets && recipientSockets.size > 0) {
            console.log(`[CHAT] Sending to ${recipientSockets.size} sockets for recipient ${toId}`);
            recipientSockets.forEach(sid => io.to(sid).emit('private_message', msg));
        } else {
            console.warn(`[CHAT] Recipient ${toId} has no active sockets!`);
        }

        // Send back to sender's other tabs
        const senderSockets = userStatus.get(socket.dbId);
        if (senderSockets) {
            senderSockets.forEach(sid => {
                if (sid !== socket.id) {
                    console.log(`[CHAT] Syncing to sender other socket: ${sid}`);
                    io.to(sid).emit('private_message', msg);
                }
            });
        }
    });

    socket.on('leave_room', (code) => {
        handlePlayerLeave(socket);
    });

    socket.on('disconnect', () => {
        if (socket.dbId) {
            const stringId = String(socket.dbId);
            const sockets = userStatus.get(stringId);
            if (sockets) {
                sockets.delete(socket.id);
                console.log(`[USER] Socket detached: ${socket.id} from ${stringId}. Remaining: ${sockets.size}`);
                if (sockets.size === 0) {
                    // GRACE PERIOD: Wait 10 seconds before marking OFFLINE
                    // This is long enough for most mobile micro-disconnects/reloads
                    console.log(`[PRESENCE] Starting 10s grace period for ${stringId}`);
                    const timer = setTimeout(() => {
                        // ULTIMATE CHECK: Did they really stay disconnected?
                        // We check the userStatus Map which is updated by any new socket registration
                        const currentSockets = userStatus.get(stringId);

                        if (!currentSockets || currentSockets.size === 0) {
                            userStatus.delete(stringId);
                            userMetadata.delete(stringId);
                            io.emit('user_presence_update', { userId: stringId, status: 'OFFLINE' });
                            console.log(`[USER] Offline (Confirmed): ${stringId}`);
                        } else {
                            console.log(`[USER] Offline cancelled for ${stringId} (Active sockets found: ${currentSockets.size})`);
                        }
                        pendingDisconnections.delete(stringId);
                    }, 10000); // 10s is safer for mobile
                    pendingDisconnections.set(stringId, timer);
                }
            }
        }
        handlePlayerLeave(socket);
    });
});

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            db: 'connected',
            env_db_url: !!process.env.DATABASE_URL,
            table_feedbacks: (await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedbacks')")).rows[0].exists
        });
    } catch (error) {
        console.error('[HEALTH ERROR]', error);
        res.status(500).json({
            status: 'error',
            db: 'disconnected',
            error: error.message,
            env_db_url: !!process.env.DATABASE_URL
        });
    }
});

// Version Check Endpoint
app.get('/api/version', (req, res) => {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        res.json({ version: packageJson.version, t: Date.now() });
    } catch (error) {
        console.error('[VERSION CHECK]', error);
        res.status(500).json({ error: 'Version check failed' });
    }
});

app.get('*', (req, res) => {
    // If it's an API request that didn't match anything, return 404 JSON instead of HTML
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    res.sendFile(path.join(__dirname, '../dist', 'index.html'), (err) => {
        if (err) {
            // In dev mode, dist/index.html doesn't exist. 
            // Return 200 with HTML only for root or frontend-y paths, 404 otherwise.
            if (req.path === '/' || !req.path.includes('.')) {
                res.status(200).send('<h1>SkyJo Server Running</h1>');
            } else {
                res.status(404).send('Not found');
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
