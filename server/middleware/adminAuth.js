import crypto from 'crypto';

// Default hash for 'admin123'
const DEFAULT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const getConfiguredHash = () => {
    if (process.env.ADMIN_PASSWORD_HASH?.trim()) return process.env.ADMIN_PASSWORD_HASH.trim();

    // Railway's existing ADMIN_SECRET is supported as either plaintext or a SHA-256 hash.
    const legacySecret = process.env.ADMIN_SECRET?.trim();
    if (!legacySecret) return DEFAULT_HASH;
    return /^[a-f0-9]{64}$/i.test(legacySecret) ? legacySecret : sha256(legacySecret);
};

const hashesMatch = (left, right) => {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export function adminAuth(req, res, next) {
    const authHeader = req.headers['x-admin-auth']?.trim();

    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Compare hash
    const providedHash = sha256(authHeader);

    if (!hashesMatch(providedHash, getConfiguredHash())) {
        console.warn(`[SECURITY] Failed admin login attempt from ${req.ip}`);
        return res.status(403).json({ error: 'Invalid credentials' });
    }

    next();
}
