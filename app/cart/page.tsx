"use client";

import { useStore } from "@/context/StoreContext";
import Link from "next/link";
import Image from "next/image";
import { Trash2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CartPage() {
    const { cart, removeFromCart, clearCart, createOrder, user } = useStore();
    const router = useRouter();
    const [isCheckout, setIsCheckout] = useState(false);
    const [processing, setProcessing] = useState(false);

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handlePlaceOrder = async () => {
        setProcessing(true);

        // 1. Create Order First (Pending Status)
        const orderIds = await createOrder();

        if (!orderIds) {
            alert("Failed to create order.");
            setProcessing(false);
            return;
        }

        // 2. Stripe Checkout Flow
        try {
            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe failed to load");

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    order_ids: orderIds
                })
            });

            const data = await response.json();
            console.log('Stripe API Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.url) {
                throw new Error('No checkout URL received from Stripe');
            }

            // Redirect to Stripe
            window.location.href = data.url;
        } catch (error: any) {
            console.error("Stripe Checkout Error:", error);
            alert("Payment initiation failed: " + error.message);
            setProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen pt-[130px] flex flex-col items-center justify-center gap-4">
                <div className="text-6xl animate-bounce">🛒</div>
                <h2 className="text-xl font-bold text-brand-navy">Your shopping cart is empty</h2>
                <Link href="/" className="bg-brand-dark text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-brand-navy transition-all uppercase text-sm">Go Shopping Now</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-[100px] md:pt-[130px] pb-20 relative px-4 md:px-0">
            <div className="container-custom">
                <h1 className="text-xl md:text-2xl font-bold py-4 md:py-6 text-brand-navy">Shopping Cart</h1>

                <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-4 border border-brand-light/20">
                    {/* Desktop Headers - Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-gray-100 text-gray-500 text-sm font-medium bg-gray-50/50">
                        <div className="col-span-6">Product</div>
                        <div className="col-span-2 text-center">Unit Price</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-1 text-center">Total Price</div>
                        <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {cart.map((item) => (
                        <div key={item.id} className="p-4 md:p-5 border-b border-gray-50 hover:bg-brand-light/5 transition-colors">
                            {/* Desktop View */}
                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-6 flex gap-4 items-center">
                                    <div className="relative w-20 h-20 border rounded-lg overflow-hidden shrink-0">
                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="line-clamp-2 font-medium text-brand-navy">{item.title}</div>
                                </div>
                                <div className="col-span-2 text-center text-gray-600">฿{item.price.toLocaleString()}</div>
                                <div className="col-span-2 text-center">
                                    <span className="border px-3 py-1 bg-white rounded-md text-sm">{item.quantity}</span>
                                </div>
                                <div className="col-span-1 text-center text-brand-dark font-bold">฿{(item.price * item.quantity).toLocaleString()}</div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                        <Trash2 size={18} className="mx-auto" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden flex gap-3">
                                <div className="relative w-20 h-20 border rounded-lg overflow-hidden shrink-0">
                                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="line-clamp-1 font-bold text-brand-navy text-sm mb-1">{item.title}</div>
                                        <div className="text-xs text-gray-500">Unit: ฿{item.price.toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-brand-dark font-bold text-sm">฿{(item.price * item.quantity).toLocaleString()}</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Qty: {item.quantity}</span>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1.5 bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md shadow-[0_-5px_20px_rgba(0,0,0,0.08)] p-4 flex flex-col md:flex-row justify-between items-center z-40 border-t border-brand-light/30 rounded-t-2xl gap-4 md:gap-0">
                    <div className="self-start md:self-auto">
                        <button onClick={clearCart} className="text-red-500 font-bold hover:underline text-xs md:text-sm px-4">Clear All</button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center w-full md:w-auto">
                        <div className="text-base md:text-lg text-brand-navy flex justify-between md:block w-full md:w-auto px-4 md:px-0">
                            <span className="md:inline hidden">Total ({cart.length} item):</span>
                            <span className="md:hidden">Total:</span>
                            <span className="text-2xl md:text-3xl text-brand-dark font-extrabold ml-2">฿{total.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => setIsCheckout(true)}
                            className="bg-brand-dark text-white text-base md:text-lg w-full md:w-auto px-10 md:px-12 py-3.5 md:py-3 rounded-full font-bold hover:bg-brand-navy shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase"
                        >
                            Check Out
                        </button>
                    </div>
                </div>
            </div>

            {isCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-brand-navy">Checkout & Payment</h2>
                            <button onClick={() => setIsCheckout(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
                            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">฿{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="font-medium">Free</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between font-bold text-brand-primary text-lg">
                                    <span>Total</span>
                                    <span>฿{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <MapPin size={18} className="text-brand-primary" /> Shipping Information
                            </h3>
                            {user && (user.fullname || user.address || user.tel) ? (
                                <div className="text-sm space-y-1 bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/10 text-brand-navy mb-6">
                                    <p className="font-bold">{user.fullname || 'Name not set'}</p>
                                    <p className="text-gray-600">{user.tel || 'Phone number not set'}</p>
                                    <p className="text-gray-600">{user.address || 'Address not set'}</p>
                                    <div className="mt-3 pt-2 border-t border-brand-navy/10 flex justify-end">
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="text-xs text-brand-primary hover:underline font-bold"
                                        >
                                            Update Profile
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800 mb-6">
                                    <p className="mb-2 italic">⚠️ Shipping information is missing. Please update your profile before checking out.</p>
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="font-bold underline hover:no-underline"
                                    >
                                        Add Shipping Info
                                    </button>
                                </div>
                            )}

                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <div className="w-20 h-20 bg-brand-navy/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-navy">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                </div>
                                <h3 className="font-bold text-brand-navy mb-2 text-lg">Pay securely with Stripe</h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                                    You will be redirected to Stripe's secure checkout page to complete your payment.
                                </p>
                                <div className="flex gap-2 justify-center opacity-50">
                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCheckout(false)}
                                className="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            {(() => {
                                const isMissingInfo = !user?.fullname || !user?.address || !user?.tel;
                                return (
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={processing || isMissingInfo}
                                        title={isMissingInfo ? "Please update your shipping info first" : ""}
                                        className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                                            ${(processing || isMissingInfo) ? 'bg-gray-400 cursor-not-allowed text-white/50' : 'bg-brand-navy hover:bg-brand-dark hover:shadow-xl hover:-translate-y-0.5'}`}
                                    >
                                        {processing ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                Pay with Stripe ฿{total.toLocaleString()}
                                            </>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
