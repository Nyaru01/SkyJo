import pool from './server/db.js';
import fs from 'fs';

async function exportUsers() {
    try {
        const res = await pool.query("SELECT id, name, vibe_id FROM users");
        fs.writeFileSync('all_users_debug.json', JSON.stringify(res.rows, null, 2));
        console.log('✅ Exported all users to all_users_debug.json');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

exportUsers();
