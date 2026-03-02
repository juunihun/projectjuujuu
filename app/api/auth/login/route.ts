import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        const [rows]: [any[], any] = await pool.execute(
            'SELECT * FROM users WHERE name = ?',
            [username]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Log the activity with fallback for missing table
        try {
            await pool.execute(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [user.id, 'Sign In', 'User logged into the system']
            );
        } catch (logError: any) {
            if (logError.code === 'ER_NO_SUCH_TABLE') {
                // Auto-create table on the remote server without dropping data
                await pool.execute(`
                    CREATE TABLE activity_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT,
                        action VARCHAR(255) NOT NULL,
                        details TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                    )
                `);
                // Retry insert
                await pool.execute(
                    'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                    [user.id, 'Sign In', 'User logged into the system']
                );
            } else {
                console.error("Failed to insert activity log:", logError);
            }
        }

        // Return user info (excluding password)
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
