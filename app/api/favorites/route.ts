
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const userId = searchParams.get('user_id');

        if (!productId || !userId) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM favorites WHERE product_id = ? AND user_id = ?',
            [productId, userId]
        );

        return NextResponse.json({ isFavorite: (rows as any[]).length > 0 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user_id, product_id } = await request.json();

        // Check if exists
        const [rows] = await pool.execute(
            'SELECT id FROM favorites WHERE product_id = ? AND user_id = ?',
            [product_id, user_id]
        );

        if ((rows as any[]).length > 0) {
            // Remove
            await pool.execute('DELETE FROM favorites WHERE id = ?', [(rows as any[])[0].id]);
            return NextResponse.json({ isFavorite: false });
        } else {
            // Add
            await pool.execute('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [user_id, product_id]);
            return NextResponse.json({ isFavorite: true });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
