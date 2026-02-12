import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        let query = 'SELECT id, name, email, role, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY id DESC';

        const [rows] = await pool.execute(query, params);

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { user_id, fullname, address, tel, birthdate, gender } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await pool.execute(
            'UPDATE users SET fullname = ?, address = ?, tel = ?, birthdate = ?, gender = ? WHERE id = ?',
            [fullname, address, tel, birthdate, gender, user_id]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
