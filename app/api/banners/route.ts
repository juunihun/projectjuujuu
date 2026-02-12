import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.execute('SELECT * FROM banners ORDER BY position, sort_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { image_url, title, link_url, position, sort_order } = await request.json();

        if (!image_url || !position) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [result] = await pool.execute(
            'INSERT INTO banners (image_url, title, link_url, position, sort_order) VALUES (?, ?, ?, ?, ?)',
            [image_url, title, link_url, position, sort_order || 0]
        );

        return NextResponse.json({
            id: (result as any).insertId,
            image_url, title, link_url, position, sort_order
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM banners WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
