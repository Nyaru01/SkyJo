import pool from './server/db.js';

async function checkDb() {
    try {
        const users = await pool.query("SELECT id, name FROM users WHERE name ILIKE '%Virgil%'");
        console.log('--- VIRGIL ACCOUNTS ---');
        for (const u of users.rows) {
            console.log(`\nACCOUNT: ${u.name}`);
            console.log(`FULL ID: ${u.id}`);

            const sub = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [u.id]);
            if (sub.rows.length > 0) {
                const s = sub.rows[0];
                const isFCM = s.subscription && !!s.subscription.token;
                console.log(`SUB STATUS: ${isFCM ? 'MIGRATED (FCM)' : 'LEGACY (WebPush)'}`);
                // console.log(`SUB RAW: ${JSON.stringify(s.subscription)}`);
            } else {
                console.log('SUB STATUS: NONE');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDb();
