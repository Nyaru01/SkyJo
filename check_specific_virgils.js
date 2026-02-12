import pool from './server/db.js';

async function checkSpecificIds() {
    const ids = ['u-1769612875523-a2h4z6niq', 'u-1769629092051-hxn2y43js'];
    try {
        for (const id of ids) {
            const res = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [id]);
            console.log(`\nID: ${id}`);
            if (res.rows.length > 0) {
                const s = res.rows[0];
                console.log(`User: ${s.username}`);
                console.log(`Sub: ${JSON.stringify(s.subscription).substring(0, 100)}...`);
            } else {
                console.log('No subscription found.');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSpecificIds();
