import pool from './server/db.js';

async function checkDb() {
    try {
        console.log('--- SEARCH BY LEVEL 10 or NAME VIRGIL ---');
        const search = await pool.query("SELECT id, name, vibe_id, level FROM users WHERE level >= 9 OR name ILIKE '%Virgil%'");
        search.rows.forEach(u => {
            console.log(`NAME:${u.name}|LVL:${u.level}|VIBE:${u.vibe_id}|ID:${u.id}`);
        });

        console.log('\n--- ALL SUBSCRIPTIONS ---');
        const subs = await pool.query('SELECT user_id, username FROM push_subscriptions');
        subs.rows.forEach(s => console.log(`USER:${s.username}|ID:${s.user_id}`));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDb();
