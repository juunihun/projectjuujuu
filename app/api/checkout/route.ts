
import { NextResponse } from 'next/server';
import Stripe from 'stripe';



export async function POST(request: Request) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Stripe Secret Key is missing in .env');
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2026-01-28.clover' as any,
        });

        const { items, order_ids } = await request.json();
        const orderIdStr = Array.isArray(order_ids) ? order_ids.join(',') : order_ids;

        console.log('Creating Stripe session for order IDs:', orderIdStr);
        console.log('Items:', items);

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map((item: any) => ({
                price_data: {
                    currency: 'thb',
                    product_data: {
                        name: item.title,
                        images: item.images && item.images.length > 0
                            ? item.images.map((img: string) =>
                                img.startsWith('http')
                                    ? img
                                    : `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${img.startsWith('/') ? '' : '/'}${img}`
                            )
                            : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Amount in cents (satang)
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&order_ids=${orderIdStr}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/cart`,
            metadata: {
                order_ids: orderIdStr,
            },
        });

        console.log('Stripe session created:', session.id);
        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error.message);
        console.error('Full error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

