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

        // Removed activity log insertion since activity_logs table does not exist

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
