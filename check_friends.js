import pool from './server/db.js';

async function checkFriends(userId) {
    try {
        console.log(`Checking friends for user: ${userId}`);
        const res = await pool.query(`
            SELECT u.id, u.name, f.status 
            FROM users u
            JOIN friends f ON (f.user_id = $1 AND f.friend_id = u.id) OR (f.friend_id = $1 AND f.user_id = u.id)
            WHERE u.id != $1
        `, [userId]);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

const targetId = process.argv[2] || 'u-1769629092051-hxn2y43js'; // Virgil RoG
checkFriends(targetId);
