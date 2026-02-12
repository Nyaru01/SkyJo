import pool from './server/db.js';

async function checkDb() {
    try {
        const users = await pool.query("SELECT id, name FROM users WHERE name ILIKE '%Virgil%'");
        console.log('--- VIRGIL ACCOUNTS FULL IDs ---');
        users.rows.forEach(u => {
            console.log(`- NAME: ${u.name}`);
            console.log(`  ID:   ${u.id}`);
        });

        // Also check who HAS a valid FCM token
        const fcmUsers = await pool.query("SELECT user_id, username FROM push_subscriptions WHERE subscription->>'token' IS NOT NULL");
        console.log('\n--- USERS WITH VALID FCM TOKEN ---');
        fcmUsers.rows.forEach(f => console.log(`USER: ${f.username} | ID: ${f.user_id}`));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDb();
