import pool from './db.js';

async function resetLevels() {
    try {
        const usersToReset = [
            { id: 'u-1769612875523-a2h4z6niq', name: 'Virgil', targetLevel: 9 },
            { id: 'u-1769508082490-jdrjpr01h', name: 'Virgil Assus', targetLevel: 2 }
        ];

        for (const user of usersToReset) {
            const result = await pool.query("UPDATE users SET level = $1, xp = 0 WHERE id = $2", [user.targetLevel, user.id]);
            console.log(`Update Result for ${user.name}:`, result.rowCount, 'row(s) updated.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

resetLevels();
