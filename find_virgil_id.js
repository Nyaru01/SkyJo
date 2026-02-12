import pool from './server/db.js';

async function findId() {
    try {
        const res = await pool.query("SELECT id, name, vibe_id FROM users WHERE name ILIKE '%Virgil RoG%' OR vibe_id = 'FUEUQT'");
        console.log('RESULT:' + JSON.stringify(res.rows));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findId();
