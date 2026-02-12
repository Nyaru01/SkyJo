import pool from './server/db.js';

async function checkDb() {
    try {
        const subs = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions');
        console.log('--- ALL SUBSCRIPTIONS ---');
        subs.rows.forEach(s => {
            const isFCM = s.subscription && !!s.subscription.token;
            console.log(`User: ${s.username} | ID: ${s.user_id} | FCM: ${isFCM}`);
        });

        const virgil = await pool.query("SELECT id, name FROM users WHERE name ILIKE '%Virgil%'");
        console.log('\n--- VIRGIL USERS ---');
        virgil.rows.forEach(u => console.log(`Name: ${u.name} | ID: ${u.id}`));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDb();
