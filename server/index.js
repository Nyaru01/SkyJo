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
import socialRoutes from './routes/social.js';

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
    resolveBlackHole,
    generateChestResults
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
                firebase_uid TEXT UNIQUE,
                weekly_challenge_win_date DATE
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
        { table: 'users', col: 'weekly_challenge_win_date', sql: 'ALTER TABLE users ADD COLUMN weekly_challenge_win_date DATE' },
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
app.use('/api/social', socialRoutes);

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
    let { id, name, emoji, avatarId, vibeId, level, xp, weeklyChallengeWinDate } = req.body;
    console.log(`[PROFILE] Update request for ${name} (${id}): Level ${level}, XP ${xp}, WeeklyChallenge: ${weeklyChallengeWinDate}`);
    try {
        await pool.query(`
            INSERT INTO users (id, name, emoji, avatar_id, vibe_id, level, xp, weekly_challenge_win_date, last_seen)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, emoji = EXCLUDED.emoji,
                avatar_id = EXCLUDED.avatar_id, vibe_id = EXCLUDED.vibe_id,
                level = EXCLUDED.level, xp = EXCLUDED.xp, 
                weekly_challenge_win_date = EXCLUDED.weekly_challenge_win_date,
                last_seen = CURRENT_TIMESTAMP
        `, [id, name, emoji, avatarId, vibeId, level, xp, weeklyChallengeWinDate]);
        console.log(`[PROFILE] ✓ Saved ${name} (${id})`);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

app.get('/api/social/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            console.log(`[PROFILE] Fetch 404: ${userId} not found`);
            return res.status(404).json({ error: 'Not found' });
        }
        console.log(`[PROFILE] Fetched: ${result.rows[0].name} (Lvl ${result.rows[0].level}, XP ${result.rows[0].xp})`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[PROFILE] Fetch error:', err);
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
                emoji: room.players.find(p => p.isHost)?.emoji || '🎮',
                gameMode: room.gameMode || 'classic',
                isPaused: !!room.isPaused
            });
        }
    }
    return publicRooms;
};

io.on('connection', (socket) => {
    socket.emit('room_list_update', getPublicRooms());

    socket.on('register_user', ({ id, name }) => {
        if (!id) {
            console.warn(`[USER] Registration failed: Missing ID for ${name}`);
            return;
        }
        socket.dbId = String(id);
        if (!userStatus.has(socket.dbId)) userStatus.set(socket.dbId, new Set());
        userStatus.get(socket.dbId).add(socket.id);
        io.emit('user_presence_update', { userId: socket.dbId, status: 'ONLINE' });
        console.log(`[USER] Registered: ${name} (${socket.dbId}) | Socket: ${socket.id} | Total Sockets: ${userStatus.get(socket.dbId).size}`);
    });

    socket.on('create_room', ({ playerName, emoji, isPublic, autoInviteFriendId }) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms.set(roomCode, {
            players: [{ id: socket.dbId || socket.id, socketId: socket.id, dbId: socket.dbId, name: playerName, emoji, isHost: true }],
            gameStarted: false,
            gameMode: null,  // Force Host to select
            isPublic: !!isPublic
        });
        socket.join(roomCode);
        socket.emit('room_created', roomCode);
        io.emit('room_list_update', getPublicRooms());
        console.log(`[ROOM] Created: ${roomCode} by ${playerName} | Public: ${isPublic}`);

        // Handle Atomic Auto-Invite
        if (autoInviteFriendId) {
            const fId = String(autoInviteFriendId);
            if (userStatus.has(fId)) {
                userStatus.get(fId).forEach(sid => {
                    io.to(sid).emit('game_invitation', { roomCode, fromName: playerName });
                });
                console.log(`[INVITE] Auto-inviting ${fId} to ${roomCode}`);
            } else {
                console.log(`[INVITE] Friend ${fId} offline, auto-invite failed`);
            }
        }
    });

    socket.on('join_room', ({ roomCode, playerName, emoji }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) { socket.emit('error', 'Salle non trouvée'); return; }
        if (room.gameStarted) { socket.emit('error', 'Partie déjà commencée'); return; }
        if (room.players.length >= 8) { socket.emit('error', 'Salle pleine'); return; }

        room.players.push({ id: socket.dbId || socket.id, socketId: socket.id, dbId: socket.dbId, name: playerName, emoji, isHost: false });
        socket.join(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit('player_list_update', room.players);

        // Synchronise le nouvel arrivant avec l'état de la salle
        socket.emit('room_sync', {
            gameMode: room.gameMode,
            isPaused: !!room.isPaused,
            isHost: false
        });

        io.emit('room_list_update', getPublicRooms());
    });

    socket.on('toggle_pause', ({ roomCode, paused }) => {
        const code = roomCode?.toUpperCase();
        const room = rooms.get(code);
        if (!room) {
            console.warn(`[PAUSE] Room not found: ${code}`);
            return;
        }
        room.isPaused = !!paused;
        io.to(code).emit('room_paused', { isPaused: room.isPaused });
        io.emit('room_list_update', getPublicRooms());
        console.log(`[ROOM] ${code} pause status updated to: ${room.isPaused}`);
    });

    socket.on('change_mode', ({ roomCode, mode, dbId }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;
        room.gameMode = mode;
        io.to(roomCode.toUpperCase()).emit('mode_changed', mode);
        io.emit('room_list_update', getPublicRooms());
        console.log(`[ROOM] ${roomCode} mode changed to: ${mode} by ${dbId}`);
    });

    socket.on('start_game', (roomCode) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;
        const gamePlayers = room.players.map(p => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            dbId: p.dbId,
            socketId: p.socketId
        }));
        room.gameState = initializeGame(gamePlayers, { isBonusMode: room.gameMode === 'bonus' });
        room.gameStarted = true;
        room.totalScores = {};
        gamePlayers.forEach(p => {
            room.totalScores[p.id] = 0;
        });

        io.to(roomCode.toUpperCase()).emit('game_started', {
            gameState: room.gameState,
            totalScores: room.totalScores,
            roundNumber: 1,
            gameMode: room.gameMode,
            isPaused: !!room.isPaused
        });
    });

    socket.on('game_action', ({ roomCode, action, payload }) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room || !room.gameState) return;

        const myId = socket.dbId || socket.id;
        const pIdx = room.gameState.players.findIndex(p => p.id === myId);
        if (pIdx === -1) return;

        try {
            let newState = JSON.parse(JSON.stringify(room.gameState));
            let lastAction = { type: action, playerId: myId, ...payload };

            switch (action) {
                case 'reveal_initial':
                    newState = revealInitialCards(newState, pIdx, payload.cardIndices);
                    // For animation, take the last revealed card
                    const initialCard = newState.players[pIdx].hand[payload.cardIndices[1]];
                    lastAction.card = initialCard;
                    lastAction.cardValue = initialCard ? initialCard.value : null;
                    break;
                case 'draw_pile':
                    newState = drawFromPile(newState);
                    lastAction.card = newState.drawnCard;
                    break;
                case 'draw_discard':
                    newState = drawFromDiscard(newState);
                    lastAction.card = newState.drawnCard;
                    lastAction.cardValue = newState.drawnCard.value;
                    break;
                case 'replace_card':
                    lastAction.card = room.gameState.drawnCard;
                    lastAction.cardValue = room.gameState.drawnCard?.value;
                    newState = replaceCard(newState, payload.cardIndex);
                    newState = endTurn(newState);
                    break;
                case 'discard_drawn':
                    lastAction.card = room.gameState.drawnCard;
                    lastAction.cardValue = room.gameState.drawnCard?.value;
                    // Simply move to reveal phase
                    newState.discardPile.push({ ...newState.drawnCard, isRevealed: true });
                    newState.drawnCard = null;
                    newState.turnPhase = 'MUST_REVEAL';
                    break;
                case 'discard_and_reveal':
                    lastAction.card = room.gameState.drawnCard;
                    lastAction.cardValue = room.gameState.drawnCard?.value;
                    newState = discardAndReveal(newState, payload.cardIndex);
                    newState = endTurn(newState);
                    break;
                case 'reveal_hidden':
                    const hiddenPlayer = newState.players[pIdx];
                    const hiddenCard = hiddenPlayer.hand[payload.cardIndex];
                    if (hiddenCard) {
                        hiddenCard.isRevealed = true;
                        if (hiddenCard.value === 20) hiddenCard.lockCount = 3;
                        lastAction.cardValue = hiddenCard.value;
                        lastAction.card = hiddenCard;
                    }
                    newState.turnPhase = 'DRAW'; // Preparation for endTurn
                    newState = endTurn(newState);
                    break;
                case 'perform_swap':
                    newState = performSwap(newState, payload.sourceCardIndex, payload.targetPlayerIndex, payload.targetCardIndex);
                    break;
                case 'activate_black_hole':
                    newState = resolveBlackHole(newState);
                    break;
                case 'use_action_card':
                    newState = playActionCard(newState);
                    newState = endTurn(newState);
                    break;
                case 'undo_draw_discard':
                    if (newState.drawnCard) {
                        lastAction.card = newState.drawnCard;
                        newState.discardPile.push(newState.drawnCard);
                        newState.drawnCard = null;
                        newState.turnPhase = 'DRAW';
                    }
                    break;
            }

            // Handle round end and chest revelation synchronization
            if (newState.phase === 'FINISHED') {
                // Check if any player has chests in Bonus Mode
                let hasChests = false;
                newState.players.forEach(p => {
                    p.hand.forEach(c => {
                        if (c && (c.specialType === 'CH' || c.value === 'CH')) hasChests = true;
                    });
                });

                if (hasChests) {
                    console.log(`[GAME] ${roomCode} transitioning to REVEALING_CHESTS phase`);
                    newState.phase = 'REVEALING_CHESTS';
                    newState.chestResults = generateChestResults(newState, Date.now().toString());

                    // Auto-reveal all cards for final round visibility
                    newState.players.forEach(p => {
                        p.hand.forEach(c => {
                            if (c && !c.isRevealed) {
                                c.isRevealed = true;
                                c.wasAutoRevealed = true;
                            }
                        });
                    });
                }

                // Calculate scores immediately (they will be displayed after revelation overlay on client)
                const roundResults = calculateFinalScores(newState);
                roundResults.forEach(r => {
                    room.totalScores[r.playerId] = (room.totalScores[r.playerId] || 0) + r.finalScore;
                });

                // Check for absolute game end (100 points)
                const gameOver = Object.values(room.totalScores).some(s => s >= 100);
                if (gameOver) {
                    const sorted = Object.entries(room.totalScores).sort((a, b) => a[1] - b[1]);
                    const winner = room.players.find(p => p.id === sorted[0][0]);
                    io.to(roomCode.toUpperCase()).emit('game_over', {
                        totalScores: room.totalScores,
                        winner: winner ? { id: winner.id, name: winner.name, score: sorted[0][1] } : null
                    });
                }
            }

            room.gameState = newState;
            io.to(roomCode.toUpperCase()).emit('game_update', { gameState: newState, lastAction });
        } catch (e) {
            console.error('[GAME ERROR]', e);
            socket.emit('gameplay_error', e.message);
        }
    });

    socket.on('next_round', (roomCode) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;

        const gamePlayers = room.players.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, dbId: p.dbId, socketId: p.socketId }));
        room.gameState = initializeGame(gamePlayers, { isBonusMode: room.gameMode === 'bonus' });
        room.roundNumber = (room.roundNumber || 1) + 1;

        io.to(roomCode.toUpperCase()).emit('game_started', {
            gameState: room.gameState,
            totalScores: room.totalScores,
            roundNumber: room.roundNumber,
            gameMode: room.gameMode,
            isPaused: !!room.isPaused
        });
    });

    socket.on('rematch', (roomCode) => {
        const room = rooms.get(roomCode?.toUpperCase());
        if (!room) return;

        room.totalScores = {};
        room.players.forEach(p => room.totalScores[p.id] = 0);
        room.roundNumber = 1;

        const gamePlayers = room.players.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, dbId: p.dbId, socketId: p.socketId }));
        room.gameState = initializeGame(gamePlayers, { isBonusMode: room.gameMode === 'bonus' });

        io.to(roomCode.toUpperCase()).emit('game_started', {
            gameState: room.gameState,
            totalScores: room.totalScores,
            roundNumber: 1,
            gameMode: room.gameMode,
            isPaused: !!room.isPaused
        });
    });

    socket.on('invite_friend', ({ friendId, roomCode, fromName }) => {
        const fId = String(friendId);
        console.log(`[INVITE] ${fromName} inviting ${fId} to ${roomCode}`);

        if (userStatus.has(fId)) {
            const sockets = userStatus.get(fId);
            console.log(`[INVITE] Sending to ${sockets.size} sockets for user ${fId}`);
            sockets.forEach(sid => {
                io.to(sid).emit('game_invitation', { roomCode, fromName });
            });
            socket.emit('invitation_sent');
        } else {
            console.log(`[INVITE] Friend ${fId} is OFFLINE`);
            socket.emit('invitation_failed', { reason: 'OFFLINE' });
        }
    });

    socket.on('private_message', (msg) => {
        const { toId, text, replyTo } = msg;
        const fromId = socket.dbId;
        if (!fromId) return;

        const fullMsg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            fromId,
            toId: String(toId),
            text,
            timestamp: Date.now(),
            replyTo
        };

        if (userStatus.has(String(toId))) {
            userStatus.get(String(toId)).forEach(sid => {
                io.to(sid).emit('private_message', fullMsg);
            });
        }
    });

    socket.on('chat_typing', ({ toId, isTyping }) => {
        const fromId = socket.dbId;
        if (!fromId) return;

        if (userStatus.has(String(toId))) {
            userStatus.get(String(toId)).forEach(sid => {
                io.to(sid).emit('chat_typing', { fromId, isTyping });
            });
        }
    });

    const handlePlayerLeft = (socket, roomCode) => {
        const code = roomCode?.toUpperCase();
        const room = rooms.get(code);
        if (!room) return;

        const myId = socket.dbId || socket.id;
        const playerIdx = room.players.findIndex(p => p.id === myId);

        if (playerIdx !== -1) {
            const player = room.players[playerIdx];
            room.players.splice(playerIdx, 1);

            console.log(`[ROOM] ${player.name} left ${code}. Remaining: ${room.players.length}`);

            if (room.players.length === 0) {
                rooms.delete(code);
                console.log(`[ROOM] ${code} deleted (empty)`);
            } else {
                // If it was the host who left, promote someone else OR close room if game was started
                if (player.isHost) {
                    if (room.gameStarted) {
                        io.to(code).emit('game_cancelled', { reason: "L'hôte a quitté la partie." });
                        rooms.delete(code);
                    } else {
                        room.players[0].isHost = true;
                        io.to(code).emit('player_left', {
                            playerId: myId,
                            playerName: player.name,
                            newHost: room.players[0].name
                        });
                        io.to(code).emit('player_list_update', room.players);
                    }
                } else {
                    // Just notify others
                    if (room.gameStarted) {
                        // In a 1v1 game, if one leaves, the other wins or game ends
                        // For now, let's cancel the game if anyone leaves a started game (simpler)
                        io.to(code).emit('game_cancelled', { reason: `${player.name} a quitté la partie.` });
                        rooms.delete(code);
                    } else {
                        io.to(code).emit('player_left', {
                            playerId: myId,
                            playerName: player.name
                        });
                        io.to(code).emit('player_list_update', room.players);
                    }
                }
            }
            io.emit('room_list_update', getPublicRooms());
        }
    };

    socket.on('leave_room', (roomCode) => {
        handlePlayerLeft(socket, roomCode);
        socket.leave(roomCode?.toUpperCase());
    });

    socket.on('disconnect', () => {
        // Find which room this socket was in and clean up
        for (const [code, room] of rooms.entries()) {
            const isMember = room.players.some(p => p.socketId === socket.id);
            if (isMember) {
                handlePlayerLeft(socket, code);
            }
        }

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
