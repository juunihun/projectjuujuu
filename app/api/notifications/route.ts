
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId]
        );

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, markAll, user_id } = await request.json();

        if (markAll && user_id) {
            await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [user_id]);
        } else if (id) {
            await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id, user_id } = await request.json();

        if (id && user_id) {
            await pool.execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, user_id]);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
