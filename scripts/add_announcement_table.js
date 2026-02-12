
const mysql = require('mysql2/promise');
require('dotenv').config(); // Load from .env

async function createTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `;

    try {
        await connection.execute(createTableQuery);
        console.log('announcements table created successfully.');

        // Insert a default welcome announcement if empty
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM announcements');
        if (rows[0].count === 0) {
            await connection.execute(`
                INSERT INTO announcements (message, type, is_active) 
                VALUES ('Welcome to JuuJuu! Check out our latest deals.', 'info', true)
            `);
            console.log('Default announcement added.');
        }

    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await connection.end();
    }
}

createTable();
