import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMN_MIGRATIONS, runColumnMigrations } from './dbMigrations.js';

test('la migration hebdomadaire est additive', () => {
    const migration = COLUMN_MIGRATIONS.find(item => item.col === 'weekly_challenge_id');
    assert.deepEqual(migration, {
        table: 'users',
        col: 'weekly_challenge_id',
        sql: 'ALTER TABLE users ADD COLUMN weekly_challenge_id TEXT',
    });
});

test('une colonne existante ne déclenche aucun ALTER TABLE', async () => {
    const altered = [];
    const pool = {
        query: async (sql) => {
            if (sql.startsWith('SELECT 1')) return { rows: [{}] };
            altered.push(sql);
            return { rows: [] };
        },
    };

    await runColumnMigrations(pool, { log() {}, warn() {} });
    assert.deepEqual(altered, []);
});

test('une colonne absente est ajoutée une seule fois', async () => {
    const altered = [];
    const pool = {
        query: async (sql, params) => {
            if (sql.startsWith('SELECT 1')) {
                return { rows: params[1] === 'weekly_challenge_id' ? [] : [{}] };
            }
            altered.push(sql);
            return { rows: [] };
        },
    };

    await runColumnMigrations(pool, { log() {}, warn() {} });
    assert.deepEqual(altered, ['ALTER TABLE users ADD COLUMN weekly_challenge_id TEXT']);
});
