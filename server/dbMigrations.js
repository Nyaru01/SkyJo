export const COLUMN_MIGRATIONS = Object.freeze([
    { table: 'users', col: 'firebase_uid', sql: 'ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE' },
    { table: 'feedbacks', col: 'type', sql: "ALTER TABLE feedbacks ADD COLUMN type VARCHAR(50) DEFAULT 'general'" },
    { table: 'feedbacks', col: 'status', sql: "ALTER TABLE feedbacks ADD COLUMN status VARCHAR(20) DEFAULT 'new'" },
    { table: 'feedbacks', col: 'device_info', sql: 'ALTER TABLE feedbacks ADD COLUMN device_info JSONB' },
    { table: 'push_subscriptions', col: 'username', sql: 'ALTER TABLE push_subscriptions ADD COLUMN username VARCHAR(100)' },
    { table: 'users', col: 'weekly_challenge_win_date', sql: 'ALTER TABLE users ADD COLUMN weekly_challenge_win_date DATE' },
    { table: 'users', col: 'weekly_challenge_id', sql: 'ALTER TABLE users ADD COLUMN weekly_challenge_id TEXT' },
]);

export const runColumnMigrations = async (pool, logger = console) => {
    for (const migration of COLUMN_MIGRATIONS) {
        try {
            const check = await pool.query(
                'SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
                [migration.table, migration.col],
            );

            if (check.rows.length === 0) {
                await pool.query(migration.sql);
                logger.log(`[DB] ✓ Added ${migration.table}.${migration.col}`);
            }
        } catch (error) {
            logger.warn?.(`[DB] Migration skipped for ${migration.table}.${migration.col}: ${error.message}`);
        }
    }
};
