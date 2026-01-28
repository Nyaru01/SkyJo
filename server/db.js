import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('[DB ERROR] DATABASE_URL is not defined in .env');
} else {
    console.log('[DB] Connecting to:', process.env.DATABASE_URL.split('@')[1] || 'Unknown Host');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default pool;
