import pool from './db.js';

async function verifyLevel() {
    try {
        const vibeId = '#14UYU9';
        console.log(`Checking level for user ${vibeId}...`);

        const res = await pool.query(
            "SELECT name, level, xp FROM users WHERE vibe_id = $1",
            [vibeId]
        );

        if (res.rows.length > 0) {
            console.log('Current DB State:', res.rows[0]);
        } else {
            console.log('❌ User not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

verifyLevel();
