
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

export async function GET() {
    try {
        const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 1');
        return NextResponse.json(rows[0] || null);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { message, type, is_active } = await request.json();

        // Deactivate all previous active announcements (optional, if we only want 1 active)
        await pool.execute('UPDATE announcements SET is_active = false');

        await pool.execute(
            'INSERT INTO announcements (message, type, is_active) VALUES (?, ?, ?)',
            [message, type || 'info', is_active !== undefined ? is_active : true]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
