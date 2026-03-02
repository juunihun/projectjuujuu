
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Fetch orders
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE user_id = ? OR seller_id = ? ORDER BY created_at DESC',
            [userId, userId]
        );

        const ordersWithItems = [];
        for (const order of (orders as any[])) {
            const [items] = await pool.execute(
                `SELECT oi.*, p.title, p.images 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = ?`,
                [order.id]
            );

            // Parse images if they are strings
            const parsedItems = (items as any[]).map(item => ({
                ...item,
                images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
            }));

            ordersWithItems.push({
                ...order,
                date: order.created_at, // Map created_at to date for frontend
                items: parsedItems
            });
        }

        return NextResponse.json(ordersWithItems);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user_id, items, status, payment_method } = await request.json();

        // Determine initial status based on payment method
        let orderStatus = status || 'Pending';
        let paymentStatus = 'Unpaid';

        // Payment verification happens after redirect for Stripe
        // if (payment_method === 'Credit Card') { ... } // Removed

        // Group items by seller_id
        const ordersBySeller = items.reduce((acc: any, item: any) => {
            const sellerId = item.seller_id || 0; // Default to 0 if no seller (admin)
            if (!acc[sellerId]) acc[sellerId] = [];
            acc[sellerId].push(item);
            return acc;
        }, {});

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const orderIds = [];

            for (const sellerId of Object.keys(ordersBySeller)) {
                const sellerItems = ordersBySeller[sellerId];
                const total = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                const sId = sellerId === '0' ? null : sellerId;

                // Create Order
                const [orderResult] = await connection.execute(
                    'INSERT INTO orders (user_id, seller_id, total, status, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [user_id, sId, total, orderStatus, payment_method || 'Bank Transfer', paymentStatus]
                );
                const orderId = (orderResult as any).insertId;
                orderIds.push(orderId);

                // Add Items
                for (const item of sellerItems) {
                    await connection.execute(
                        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [orderId, item.id, item.quantity, item.price]
                    );

                    // Update Sold Count
                    await connection.execute(
                        'UPDATE products SET sold = sold + ? WHERE id = ?',
                        [item.quantity, item.id]
                    );
                }

                // Notify Seller
                if (sId) {
                    await connection.execute(
                        'INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, ?, ?, ?, ?)',
                        [sId, 'New Order Received', `You have a new order #${orderId} worth ฿${total} (${payment_method})`, '/profile?tab=orders', 'new_order']
                    );
                }
            }

            // Notify Buyer
            await connection.execute(
                'INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, ?, ?, ?, ?)',
                [user_id, 'Order Successful', `Your order for ${items.length} items has been placed via ${payment_method || 'Bank Transfer'}.`, '/profile?tab=purchases', 'order_update']
            );

            // Log the activity
            await connection.execute(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [user_id, 'Order Placed', `Placed an order for ${items.length} items (Total: ฿${Object.values(ordersBySeller).flat().reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)})`]
            );

            await connection.commit();
            return NextResponse.json({ success: true, orderIds });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
