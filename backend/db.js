const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'task_app',
    password: 'postgres',
    port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

module.exports = pool;