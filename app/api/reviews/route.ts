
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const [rows] = await pool.execute(`
            SELECT r.*, u.name as user_name 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = ? 
            ORDER BY r.created_at DESC
        `, [productId]);

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user_id, product_id, rating, comment } = await request.json();

        if (!user_id || !product_id || !rating) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        await pool.execute(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [user_id, product_id, rating, comment]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { review_id, user_id } = await request.json();

        if (!review_id || !user_id) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Get requester role
        const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [user_id]);
        const requester = (users as any[])[0];

        if (!requester) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get review owner
        const [reviews] = await pool.execute('SELECT user_id FROM reviews WHERE id = ?', [review_id]);
        const review = (reviews as any[])[0];

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Check permission: Admin OR Owner
        if (requester.role !== 'admin' && review.user_id !== user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute('DELETE FROM reviews WHERE id = ?', [review_id]);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
