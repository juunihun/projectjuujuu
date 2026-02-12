require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true // Important for running the schema
    });

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await connection.query(schema);
        console.log('Database schema created!');

        // Seed Data
        const passwordHash = await bcrypt.hash('password123', 10);

        // Insert Users
        // Note: IDs will likely be 1 (Admin) and 2 (Seller) if tables were dropped.
        // We use INSERT IGNORE or just INSERT since we just dropped tables.
        console.log('Seeding users...');
        await connection.query(`
            INSERT INTO users (name, email, password, role) VALUES 
            ('Admin User', 'admin@example.com', ?, 'admin'),
            ('Seller One', 'seller1@example.com', ?, 'seller')
        `, [passwordHash, passwordHash]);

        // Insert Products (linked to Seller One - ID 2)
        console.log('Seeding products...');
        const productsParams = [
            'Blue T-Shirt', 299.00, JSON.stringify(["https://picsum.photos/seed/prod-0/300/300", "https://picsum.photos/seed/prod-0-1/300/300"]), 'Clothing', 2,
            'Wireless Headphones', 1290.00, JSON.stringify(["https://picsum.photos/seed/prod-1/300/300"]), 'Electronics', 2,
            'Gaming Mouse', 890.00, JSON.stringify(["https://picsum.photos/seed/prod-2/300/300"]), 'Electronics', 2
        ];

        // Using parameterized query for safety, though hardcoded values are fine here
        await connection.query(`
            INSERT INTO products (title, price, images, category, sold, seller_id) VALUES 
            (?, ?, ?, ?, 120, ?),
            (?, ?, ?, ?, 450, ?),
            (?, ?, ?, ?, 89, ?)
        `, productsParams);

        console.log('Seeding banners...');
        await connection.query(`
            INSERT INTO banners (image_url, title, position, sort_order) VALUES 
            ('https://picsum.photos/seed/banner1/800/300', 'Big Sale 50%', 'carousel', 1),
            ('https://picsum.photos/seed/banner2/800/300', 'New Arrivals', 'carousel', 2),
            ('https://picsum.photos/seed/side1/400/150', 'Free Shipping', 'side_1', 1),
            ('https://picsum.photos/seed/side2/400/150', 'Crazy Deals', 'side_2', 1)
        `);

        console.log('Database seeded successfully!');
        console.log('Admin: admin@example.com / password123');
        console.log('Seller: seller1@example.com / password123');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await connection.end();
    }
}

main();
