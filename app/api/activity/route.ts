import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const [rows] = await pool.execute(`
            SELECT a.*, u.name as user_name, u.role as user_role 
            FROM activity_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 50
        `);
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user_id, action, details } = await request.json();

        try {
            await pool.execute(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [user_id, action, details]
            );
        } catch (logError: any) {
            if (logError.code === 'ER_NO_SUCH_TABLE') {
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
                await pool.execute(
                    'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                    [user_id, action, details]
                );
            } else {
                throw logError;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
