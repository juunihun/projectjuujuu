
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request) {
    try {
        const { order_id, status, payment_status } = await request.json();

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Update Order Status & Payment Status
            if (status) {
                await connection.execute(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    [status, order_id]
                );
            }

            if (payment_status) {
                await connection.execute(
                    'UPDATE orders SET payment_status = ? WHERE id = ?',
                    [payment_status, order_id]
                );
            }

            // Get Buyer ID to notify
            const [orders] = await connection.execute('SELECT user_id FROM orders WHERE id = ?', [order_id]);
            const order = (orders as any[])[0];

            if (order) {
                // Notify Buyer
                const msg = payment_status === 'Paid'
                    ? `Your payment for order #${order_id} has been verified!`
                    : `Your order #${order_id} status updated to ${status}`;

                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, ?, ?, ?, ?)',
                    [order.user_id, 'Order Update', msg, '/profile?tab=purchases', 'order_update']
                );
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
