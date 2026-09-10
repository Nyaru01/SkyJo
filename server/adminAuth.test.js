import test from 'node:test';
import assert from 'node:assert/strict';
import { adminAuth } from './middleware/adminAuth.js';

const authenticate = (password) => {
    let statusCode;
    let payload;
    let nextCalled = false;
    adminAuth(
        { headers: { 'x-admin-auth': password }, ip: '127.0.0.1' },
        { status: (code) => { statusCode = code; return { json: (body) => { payload = body; } }; } },
        () => { nextCalled = true; },
    );
    return { nextCalled, statusCode, payload };
};

const withEnvironment = async (variables, callback) => {
    const previous = Object.fromEntries(Object.keys(variables).map(key => [key, process.env[key]]));
    Object.entries(variables).forEach(([key, value]) => {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    });
    try {
        await callback();
    } finally {
        Object.entries(previous).forEach(([key, value]) => {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        });
    }
};

test('accepts Railway ADMIN_SECRET as a plaintext admin password', async () => {
    await withEnvironment({ ADMIN_PASSWORD_HASH: undefined, ADMIN_SECRET: 'railway-secret' }, () => {
        assert.equal(authenticate('railway-secret').nextCalled, true);
        assert.equal(authenticate('incorrect').statusCode, 403);
    });
});

test('ADMIN_PASSWORD_HASH takes priority over ADMIN_SECRET', async () => {
    const hash = '4e598f5daafc2fda61641ddbb5956deb23fde6616366dc9dd5a7c9f47da4d787';
    await withEnvironment({ ADMIN_PASSWORD_HASH: hash, ADMIN_SECRET: 'other-secret' }, () => {
        assert.equal(authenticate('hashed-secret').nextCalled, true);
        assert.equal(authenticate('other-secret').statusCode, 403);
    });
});
