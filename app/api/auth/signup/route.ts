import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password, name, role } = await request.json();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Allow role selection, fallback to 'customer'
        const userRole = ['admin', 'customer', 'seller'].includes(role) ? role : 'customer';

        // Check if username exists
        const [existing]: [any[], any] = await pool.execute('SELECT id FROM users WHERE name = ?', [name]);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        const [result] = await pool.execute(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, name || email.split('@')[0], userRole]
        );

        return NextResponse.json({ message: 'User created', userId: (result as any).insertId }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
