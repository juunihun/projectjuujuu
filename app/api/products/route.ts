import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerId = searchParams.get('seller_id');
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        let query = `
      SELECT p.*, u.name as seller_name 
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id
    `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (sellerId) {
            conditions.push('p.seller_id = ?');
            params.push(sellerId);
        }

        if (search) {
            conditions.push('p.title LIKE ?');
            params.push(`%${search}%`);
        }

        if (category && category !== 'Others') {
            conditions.push('p.category = ?');
            params.push(category);
        } else if (category === 'Others') {
            // Optional: Handle 'Others' specifically if needed, or just match string
            conditions.push('p.category = ?');
            params.push(category);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.id DESC';

        const [rows] = await pool.execute(query, params);

        // Parse images JSON
        const products = (rows as any[]).map(row => ({
            ...row,
            images: JSON.parse(row.images || '[]'),
            price: Number(row.price) // Ensure number
        }));

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title, price, images, category, seller_id } = await request.json(); // Expect images array

        const imagesJson = JSON.stringify(images);

        const [result] = await pool.execute(
            'INSERT INTO products (title, price, images, category, sold, seller_id) VALUES (?, ?, ?, ?, 0, ?)',
            [title, price, imagesJson, category, seller_id]
        );

        return NextResponse.json({
            id: (result as any).insertId,
            title,
            price,
            images,
            category,
            sold: 0,
            seller_id
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, title, price, images, category } = await request.json();

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const imagesJson = JSON.stringify(images);

        await pool.execute(
            'UPDATE products SET title = ?, price = ?, images = ?, category = ? WHERE id = ?',
            [title, price, imagesJson, category, id]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
