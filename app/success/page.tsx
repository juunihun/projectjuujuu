
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session_id = searchParams.get('session_id');
    const order_ids_str = searchParams.get('order_ids');
    const { clearCart, fetchOrders } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session_id && order_ids_str) {
            const verifyPayment = async () => {
                try {
                    const order_ids = order_ids_str.split(',');

                    // Update all orders to Paid
                    await Promise.all(order_ids.map(id =>
                        fetch('/api/orders/update', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                order_id: id,
                                status: 'Confirmed',
                                payment_status: 'Paid'
                            })
                        })
                    ));

                    clearCart();
                    await fetchOrders();
                    setLoading(false);
                } catch (error) {
                    console.error("Payment verification failed", error);
                    setLoading(false);
                }
            };

            verifyPayment();
        } else {
            setLoading(false);
        }
    }, [session_id, order_ids_str]);

    if (loading) {
        return (
            <div className="min-h-screen pt-[100px] flex flex-col items-center justify-center" style={{ backgroundColor: '#FFF7E6' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                <h1 className="text-xl font-bold text-gray-700">Verifying Payment...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-[130px] pb-20 px-4" style={{ backgroundColor: '#FFF7E6' }}>
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600 w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-500 mb-8">
                    Thank you for your purchase. Your orders <span className="font-bold text-gray-800">#{order_ids_str}</span> have been confirmed.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/profile"
                        className="block w-full bg-brand-navy text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
                    >
                        View Order
                    </Link>
                    <Link
                        href="/"
                        className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-[130px] text-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
