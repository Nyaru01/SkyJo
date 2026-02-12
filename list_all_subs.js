import pool from './server/db.js';

async function listSubs() {
    try {
        const res = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions');
        console.log('--- REGISTERED PUSH USERS ---');
        res.rows.forEach(s => {
            const isFCM = s.subscription && !!s.subscription.token;
            console.log(`- ${s.username} | ID: ${s.user_id} | Type: ${isFCM ? 'FCM' : 'Legacy'}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listSubs();
