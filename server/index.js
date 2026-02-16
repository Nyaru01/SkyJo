import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import pool from './db.js';

import { initFirebase, getFirebaseAdmin } from './firebase.js';

initFirebase();

import feedbackRoutes from './routes/feedback.js';
import pushRoutes from './routes/push.js';
import { sendInvitationNotification } from './utils/pushNotifications.js';

// Import game engine functions
import {
    initializeGame,
    revealInitialCards,
    drawFromPile,
    drawFromDiscard,
    replaceCard,
    discardAndReveal,
    endTurn,
    calculateFinalScores,
    performSwap,
    playActionCard,
    resolveBlackHole
} from '../src/lib/skyjoEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// --- Database Configuration ---

const initDb = async () => {
    console.log('[DB] Starting database initialization...');

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
                migrated_to_v2 BOOLEAN DEFAULT FALSE,
                firebase_uid TEXT UNIQUE
            );
        `);
        console.log('[DB] ✓ Users table ready');
    } catch (e) { console.error('[DB] Users table error:', e.message); }

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

    const migrations = [
        { table: 'users', col: 'firebase_uid', sql: 'ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE' },
        { table: 'feedbacks', col: 'type', sql: "ALTER TABLE feedbacks ADD COLUMN type VARCHAR(50) DEFAULT 'general'" },
        { table: 'feedbacks', col: 'status', sql: "ALTER TABLE feedbacks ADD COLUMN status VARCHAR(20) DEFAULT 'new'" },
        { table: 'feedbacks', col: 'device_info', sql: 'ALTER TABLE feedbacks ADD COLUMN device_info JSONB' },
        { table: 'push_subscriptions', col: 'username', sql: 'ALTER TABLE push_subscriptions ADD COLUMN username VARCHAR(100)' },
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
        } catch (e) { /* silent if already exists */ }
    }

    console.log('[DB] Database initialization complete!');
};

initDb();

// --- API ROUTES ---

app.get(['/api/config/version', '/api/version'], (req, res) => {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        res.json({ version: packageJson.version, status: 'online' });
    } catch (e) {
        res.json({ version: '3.1.0', status: 'online' });
    }
});

app.use('/api/feedback', feedbackRoutes);
app.use('/api/push', pushRoutes);

app.post('/api/social/migrate', async (req, res) => {
    // This endpoint is a stub to acknowledge V2 migration
    const { userId } = req.body;
    try {
        await pool.query('UPDATE users SET migrated_to_v2 = TRUE WHERE id = $1', [userId]);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Migration ack failed' });
    }
});

// --- Profile API ---

app.post('/api/social/profile', async (req, res) => {
    let { id, name, emoji, avatarId, vibeId, level, xp } = req.body;
    try {
        await pool.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, last_seen)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id, vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level, xp = EXCLUDED.xp, last_seen = CURRENT_TIMESTAMP
        `, [id, name, emoji, avatarId, vibeId, level, xp]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

app.get('/api/social/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ status: 'ok', db: 'connected', version: '3.1.0' });
    } catch (error) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
    }
});

app.post('/api/auth/google-link', async (req, res) => {
    const { idToken, dbId, force } = req.body;
    try {
        const firebaseApp = getFirebaseAdmin();
        if (!firebaseApp) {
            console.error('[AUTH] Firebase Admin not initialized');
            return res.status(500).json({ error: 'Server authentication unconfigured' });
        }

        const decodedToken = await admin.auth(firebaseApp).verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;

        // Check for existing link
        const existing = await pool.query('SELECT id, name, level, xp, vibe_id, emoji, avatar_id FROM users WHERE firebase_uid = $1', [firebaseUid]);

        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            if (user.id !== dbId) {
                if (force) {
                    console.log(`[AUTH] Force linking ${dbId}, unlinking ${user.id} from ${firebaseUid}`);
                    await pool.query('UPDATE users SET firebase_uid = NULL WHERE firebase_uid = $1', [firebaseUid]);
                } else {
                    return res.json({ status: 'conflict', existingUser: user });
                }
            } else {
                return res.json({ status: 'already_linked' });
            }
        }

        // Link the current profile
        await pool.query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [firebaseUid, dbId]);
        res.json({ status: 'linked_success' });
    } catch (error) {
        console.error('[AUTH] Link error details:', error);
        res.status(401).json({
            error: 'Authentication failed',
            message: error.message,
            code: error.code
        });
    }
});

// --- Friends API ---

app.get('/api/social/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.avatar_id, u.vibe_id, f.status
            FROM users u
            JOIN friends f ON (f.user_id = $1 AND f.friend_id = u.id) OR (f.friend_id = $1 AND f.user_id = u.id)
            WHERE u.id != $1
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// --- Leaderboard API ---

app.get('/api/social/leaderboard/global', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, name, avatar_id, vibe_id, level, xp FROM users ORDER BY level DESC, xp DESC LIMIT 20`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Leaderboard failed' });
    }
});

// --- Socket.io Configuration ---

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const userStatus = new Map();
const userMetadata = new Map();
const rooms = new Map();

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

io.on('connection', (socket) => {
    socket.emit('room_list_update', getPublicRooms());

    socket.on('register_user', ({ id, name }) => {
        socket.dbId = String(id);
        if (!userStatus.has(socket.dbId)) userStatus.set(socket.dbId, new Set());
        userStatus.get(socket.dbId).add(socket.id);
        io.emit('user_presence_update', { userId: socket.dbId, status: 'ONLINE' });
        console.log(`[USER] Registered: ${name} (${socket.dbId})`);
    });

    socket.on('create_room', ({ playerName, emoji, isPublic }) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms.set(roomCode, {
            players: [{ id: socket.dbId || socket.id, socketId: socket.id, name: playerName, emoji, isHost: true }],
            gameStarted: false,
            gameMode: 'classic',
            isPublic: !!isPublic
        });
        socket.join(roomCode);
        socket.emit('room_created', roomCode);
        io.emit('room_list_update', getPublicRooms());
    });

    socket.on('join_room', ({ roomCode, playerName, emoji }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) { socket.emit('error', 'Salle non trouvée'); return; }
        if (room.gameStarted) { socket.emit('error', 'Partie déjà commencée'); return; }
        if (room.players.length >= 8) { socket.emit('error', 'Salle pleine'); return; }

        room.players.push({ id: socket.dbId || socket.id, socketId: socket.id, name: playerName, emoji, isHost: false });
        socket.join(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit('player_list_update', room.players);
        io.emit('room_list_update', getPublicRooms());
    });

    socket.on('start_game', (roomCode) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;
        const gamePlayers = room.players.map(p => ({ id: p.id, name: p.name, emoji: p.emoji }));
        room.gameState = initializeGame(gamePlayers, { isBonusMode: room.gameMode === 'bonus' });
        room.gameStarted = true;

        io.to(roomCode.toUpperCase()).emit('game_started', {
            gameState: room.gameState,
            totalScores: {},
            roundNumber: 1,
            gameMode: room.gameMode
        });
    });

    socket.on('game_action', ({ roomCode, action, payload }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room || !room.gameState) return;
        const pIdx = room.gameState.players.findIndex(p => p.id === (socket.dbId || socket.id));
        if (pIdx === -1) return;

        try {
            let newState = JSON.parse(JSON.stringify(room.gameState));
            // Apply actions... (Simplified for now, using core engine)
            switch (action) {
                case 'draw_pile': newState = drawFromPile(newState); break;
                case 'draw_discard': newState = drawFromDiscard(newState); break;
                // Add all other actions...
            }
            room.gameState = newState;
            io.to(roomCode).emit('game_update', { gameState: newState });
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('disconnect', () => {
        if (socket.dbId && userStatus.has(socket.dbId)) {
            userStatus.get(socket.dbId).delete(socket.id);
            if (userStatus.get(socket.dbId).size === 0) {
                userStatus.delete(socket.dbId);
                io.emit('user_presence_update', { userId: socket.dbId, status: 'OFFLINE' });
            }
        }
    });
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(__dirname, '../dist', 'index.html'), (err) => {
        if (err) res.status(200).send('<h1>SkyJo Server Running</h1>');
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
