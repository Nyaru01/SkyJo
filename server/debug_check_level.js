import pool from './db.js';

async function checkUser() {
    try {
        const result = await pool.query("SELECT id, name, level, xp FROM users WHERE name ILIKE '%Virgil%'");
        console.log('Current DB State:', JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
