import pool from './server/db.js';
import fs from 'fs';

async function exportSubs() {
    try {
        const res = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions');
        const subs = res.rows.map(s => ({
            username: s.username,
            userId: s.user_id,
            type: s.subscription && !!s.subscription.token ? 'FCM' : 'Legacy'
        }));
        fs.writeFileSync('all_subs_debug.json', JSON.stringify(subs, null, 2));
        console.log('✅ Exported all subs to all_subs_debug.json');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

exportSubs();
