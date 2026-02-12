require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function updateSchema() {
    try {
        console.log('Updating orders table schema...');

        // Add payment_method column
        try {
            await pool.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer'");
            console.log('Added payment_method column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('payment_method column already exists.');
            else console.error('Error adding payment_method:', e.message);
        }

        // Add payment_slip column
        try {
            await pool.query("ALTER TABLE orders ADD COLUMN payment_slip VARCHAR(255)");
            console.log('Added payment_slip column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('payment_slip column already exists.');
            else console.error('Error adding payment_slip:', e.message);
        }

        // Add payment_status column
        try {
            await pool.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('Unpaid', 'Pending Verification', 'Paid') DEFAULT 'Unpaid'");
            console.log('Added payment_status column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('payment_status column already exists.');
            else console.error('Error adding payment_status:', e.message);
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Schema update failed:', error);
        process.exit(1);
    }
}

updateSchema();
