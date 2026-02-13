
import pool from './server/db.js';

async function check() {
    try {
        const userId = 'u-1769629092051-hxn2y43js'; // Virgil RoG
        const result = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);
        console.log('SUBSCRIPTION DATA FOR VIRGIL ROG:');
        if (result.rows.length === 0) {
            console.log('NO SUBSCRIPTION FOUND IN DB');
        } else {
            console.log(JSON.stringify(result.rows[0], null, 2));
        }
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        process.exit();
    }
}

check();
