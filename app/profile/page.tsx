"use client";

import { useStore } from "@/context/StoreContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Package, User, LogOut, Settings, Camera, Sparkles, Shirt, PawPrint, Plug, Smartphone, Utensils, Home, ClipboardList, TrendingUp, Check, Truck, Trash, CreditCard, XCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CATEGORIES = [
    { name: 'Beauty', icon: Sparkles },
    { name: 'Clothing', icon: Shirt },
    { name: 'Pets', icon: PawPrint },
    { name: 'Appliances', icon: Plug },
    { name: 'Electronics', icon: Smartphone },
    { name: 'Food', icon: Utensils },
    { name: 'Home', icon: Home },
    { name: 'Others', icon: Package },
];

function ProfileContent() {
    const { user, products, orders, logout, addProduct, editProduct, removeProduct, updateOrderStatus, fetchOrders, updateProfile } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("");
    const [activityLogs, setActivityLogs] = useState([]);
    const [activeAnnouncement, setActiveAnnouncement] = useState<{ message: string; type: string } | null>(null);

    // Seller - Add Product Form State
    const [newProduct, setNewProduct] = useState({ title: '', price: '', category: 'Others', images: [] as string[] });
    const [editingProductId, setEditingProductId] = useState<string | number | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Customer - Profile Form State
    const [profileForm, setProfileForm] = useState({ fullname: '', address: '', tel: '', birthdate: '', gender: 'not_specified' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(true); // Start in edit mode for new profiles
    const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        } else if (activeTab === "") {
            // Set default tab based on role if no tab is specified and none is set yet
            if (user.role === 'seller') setActiveTab('products');
            else if (user.role === 'customer') setActiveTab('profile-info');
            else if (user.role === 'admin') setActiveTab('profile');
        }
    }, [user, searchParams, activeTab]);

    useEffect(() => {
        if (!user) return;

        fetchAnnouncement();
        if (user.role === 'admin') fetchActivityLogs();

        // Initialize profile form with existing data
        if (user.role === 'customer') {
            setProfileForm({
                fullname: user.fullname || '',
                address: user.address || '',
                tel: user.tel || '',
                birthdate: user.birthdate || '',
                gender: user.gender || 'not_specified'
            });
            // If user has data, start in locked mode
            if (user.fullname || user.address || user.tel) {
                setIsEditing(false);
            }
        }
    }, [user]);

    const fetchAnnouncement = async () => {
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();
            if (data && data.message) setActiveAnnouncement(data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const res = await fetch('/api/activity');
            const data = await res.json();
            setActivityLogs(data);
        } catch (error) {
            console.error('Failed to fetch activity logs', error);
        }
    };

    if (!user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            // Upload images first
            const uploadedUrls = [];
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => formData.append('files', file));

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    uploadedUrls.push(...data.urls);
                }
            }

            // Create or Update Product
            const finalImages = [...(newProduct.images || []), ...uploadedUrls];
            const imagesToSave = finalImages.length > 0 ? finalImages : ['/placeholder.png'];

            if (editingProductId) {
                const originalProduct = products.find(p => p.id === editingProductId);
                if (originalProduct) {
                    await editProduct({
                        ...originalProduct,
                        title: newProduct.title,
                        price: parseFloat(newProduct.price),
                        category: newProduct.category,
                        images: imagesToSave
                    });
                    alert("Product updated successfully!");
                }
            } else {
                await addProduct({
                    title: newProduct.title,
                    price: parseFloat(newProduct.price),
                    category: newProduct.category,
                    images: imagesToSave
                });
                alert("Product added successfully!");
            }

            setNewProduct({ title: '', price: '', category: 'Others', images: [] });
            setImageFiles([]);
            setEditingProductId(null);
        } catch (error) {
            console.error("Failed to save product", error);
            alert("Failed to save product");
        } finally {
            setUploading(false);
        }
    };



    const handleRetryPayment = async (order: any) => {
        setRetryingOrderId(order.id);
        try {
            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe failed to load");

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: order.items,
                    order_ids: [order.id]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!data.url) throw new Error('No checkout URL received from Stripe');

            window.location.href = data.url;
        } catch (error: any) {
            console.error('Retry Payment Error:', error.message);
            alert("Failed to initiate payment: " + error.message);
            setRetryingOrderId(null);
        }
    };

    const handleCancelOrder = async (orderId: number | string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        try {
            // Extract numeric ID
            const id = orderId.toString().startsWith('ord-') ? parseInt(orderId.toString().split('-')[1]) : parseInt(orderId as string);
            if (isNaN(id)) return;

            const success = await updateOrderStatus(id, 'Cancelled');
            if (success) {
                alert("Order cancelled successfully.");
                fetchOrders(); // Refresh
            } else {
                alert("Failed to cancel order.");
            }
        } catch (error) {
            console.error("Cancel Order Error:", error);
            alert("An error occurred while cancelling the order.");
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        // Extract numeric ID from "ord-123" or use direct ID if number
        const id = orderId.toString().startsWith('ord-') ? parseInt(orderId.toString().split('-')[1]) : parseInt(orderId as string);
        if (isNaN(id)) return;

        await updateOrderStatus(id, newStatus);
        await fetchOrders();
    };

    return (
        <div className="min-h-screen pt-[100px] md:pt-[130px] pb-20 px-4 md:px-0">
            <div className="container-custom grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                {/* Main Content Area (Inverted order on mobile to show Sidebar first if needed, or Content first) */}
                {/* User usually wants to see Sidebar first to navigate on mobile */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-6 md:space-y-8">
                    {/* Global Announcements (Visible to ALL roles) */}
                    {activeAnnouncement && (
                        <div className="rounded-t-md overflow-hidden border border-brand-navy/20 shadow-sm">
                            <div className="bg-brand-navy px-4 py-2 text-white font-bold text-sm flex items-center gap-2">
                                <Sparkles size={16} className="text-brand-light" /> Announcements
                            </div>
                            <div className="bg-white p-6 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {activeAnnouncement.message}
                            </div>
                        </div>
                    )}

                    {/* Activity Log / Status */}
                    {user.role === 'admin' && (
                        <div className="rounded-t-md overflow-hidden border border-brand-navy/20 shadow-sm">
                            <div className="bg-brand-navy px-4 py-2 text-white font-bold text-sm">
                                System Status & Activity Log
                            </div>
                            <div className="bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-brand-navy">
                                            <tr>
                                                <th className="px-4 py-3 font-bold">Time</th>
                                                <th className="px-4 py-3 font-bold">User</th>
                                                <th className="px-4 py-3 font-bold">Action</th>
                                                <th className="px-4 py-3 font-bold">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activityLogs.slice(0, 10).map((log: any) => (
                                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="px-4 py-2 font-medium">
                                                        {log.user_name} <span className="text-xs text-gray-400 font-normal">({log.user_role})</span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded textxs font-bold uppercase text-[10px]
                                                                ${log.action === 'Sign In' ? 'bg-blue-100 text-blue-800' :
                                                                log.action === 'Order Placed' ? 'bg-green-100 text-green-800' :
                                                                    'bg-gray-100 text-gray-800'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 truncate max-w-xs">{log.details}</td>
                                                </tr>
                                            ))}
                                            {activityLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No recent activity.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 p-2 text-center border-t text-xs">
                                    <button onClick={() => router.push('/admin')} className="text-brand-navy hover:underline font-bold">View All Activity in Dashboard</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CUSTOMER: Profile Information */}
                    {user.role === 'customer' && activeTab === 'profile-info' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-brand-primary" /> Profile Information</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setSavingProfile(true);
                                const success = await updateProfile(
                                    profileForm.fullname,
                                    profileForm.address,
                                    profileForm.tel,
                                    profileForm.birthdate,
                                    profileForm.gender
                                );
                                setSavingProfile(false);
                                if (success) {
                                    setIsEditing(false); // Lock form after successful save
                                    alert('Profile updated successfully!');
                                } else {
                                    alert('Failed to update profile');
                                }
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileForm.fullname}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profileForm.tel}
                                            onChange={(e) => setProfileForm({ ...profileForm, tel: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={profileForm.birthdate}
                                            onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Gender</label>
                                        <select
                                            value={profileForm.gender}
                                            onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="not_specified">ไม่ระบุ</option>
                                            <option value="male">ชาย</option>
                                            <option value="female">หญิง</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Address</label>
                                    <textarea
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        placeholder="Enter your delivery address"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="bg-brand-navy text-white px-6 py-2 rounded-md hover:bg-brand-dark transition-colors font-medium flex items-center gap-2"
                                        >
                                            <User size={16} /> Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            {(user.fullname || user.address || user.tel) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        // Reset form to original values
                                                        setProfileForm({
                                                            fullname: user.fullname || '',
                                                            address: user.address || '',
                                                            tel: user.tel || '',
                                                            birthdate: user.birthdate || '',
                                                            gender: user.gender || 'not_specified'
                                                        });
                                                    }}
                                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={savingProfile}
                                                className="bg-brand-navy text-white px-6 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                {savingProfile ? 'Saving...' : 'Save Profile'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* CUSTOMER: My Purchases */}
                    {user.role === 'customer' && activeTab === 'purchases' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ClipboardList className="text-brand-primary" /> My Purchases</h2>
                            <div className="space-y-4">
                                {orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <div key={order.id} className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center text-sm">
                                                <div>
                                                    <span className="font-bold text-gray-800">Order #{order.id}</span>
                                                    <span className="text-gray-400 text-xs ml-3 border-l pl-3">{new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                                order.status === 'Processing' ? 'bg-purple-100 text-purple-800' :
                                                                    order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                            'bg-red-100 text-red-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    {/* Payment Status Badge */}
                                                    {order.payment_method === 'Bank Transfer' && (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${order.payment_status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            order.payment_status === 'Pending Verification' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-gray-50 text-gray-600 border-gray-200'
                                                            }`}>
                                                            {order.payment_status || 'Unpaid'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex gap-4 mb-4 last:mb-0">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-sm relative overflow-hidden flex-shrink-0">
                                                            {item.images && item.images.length > 0 && (
                                                                <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium line-clamp-1">{item.title}</div>
                                                            <div className="text-xs text-gray-500">x{item.quantity}</div>
                                                        </div>
                                                        <div className="text-brand-primary font-bold">฿{(item.price * item.quantity).toLocaleString()}</div>
                                                    </div>
                                                ))}
                                                <div className="border-t mt-4 pt-4 flex justify-between items-center gap-2">
                                                    <div className="text-sm text-gray-500">
                                                        Payment: <span className="font-medium text-gray-900">{order.payment_method}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        Order Total: <span className="text-xl font-bold text-brand-primary">฿{order.total.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Upload Slip Area for Bank Transfer */}
                                                {order.payment_method === 'Bank Transfer' && order.payment_status !== 'Paid' && (
                                                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                            <ClipboardList size={16} /> Payment Proof
                                                        </h4>

                                                        {/* Action Buttons for Pending Orders */}
                                                        {order.status === 'Pending' && (
                                                            <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                                                {order.payment_status !== 'Paid' && (
                                                                    <button
                                                                        onClick={() => handleRetryPayment(order)}
                                                                        disabled={retryingOrderId === order.id}
                                                                        className={`flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-xs font-bold rounded-lg hover:bg-brand-dark transition-all ${retryingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <CreditCard size={14} />
                                                                        {retryingOrderId === order.id ? 'Processing...' : 'Pay with Stripe'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-all"
                                                                >
                                                                    <XCircle size={14} /> Cancel Order
                                                                </button>
                                                            </div>
                                                        )}

                                                        {order.payment_status === 'Pending Verification' && (
                                                            <div className="text-sm text-orange-600 flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                                Slip uploaded. Waiting for verification.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Tracking Steps for Customer */}
                                                <div className="mt-8 px-4">
                                                    <div className="relative flex items-center justify-between">
                                                        {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                                            const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
                                                            const currentStatusIndex = steps.indexOf(order.status);
                                                            const isCompleted = index <= currentStatusIndex;
                                                            const isCurrent = index === currentStatusIndex;

                                                            // Icons for each step
                                                            const Icons = [ClipboardList, Check, Package, Truck, Home];
                                                            const StepIcon = Icons[index];

                                                            return (
                                                                <div key={step} className="flex flex-col items-center relative z-10 w-full group">
                                                                    {/* Icon Circle */}
                                                                    <div className={`
                                                                        w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm transition-all duration-300 transform group-hover:scale-110
                                                                        ${isCompleted ? 'bg-green-500 text-white shadow-green-200' : 'bg-white border-2 border-gray-200 text-gray-300'}
                                                                        ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                                                                    `}>
                                                                        <StepIcon size={20} strokeWidth={2.5} />
                                                                    </div>

                                                                    {/* Text Label */}
                                                                    <div className="mt-3 flex flex-col items-center">
                                                                        <span className={`text-xs font-bold transition-colors duration-300 ${isCompleted ? 'text-green-600' : 'text-gray-300'}`}>{step}</span>
                                                                        {isCurrent && <span className="text-[10px] text-gray-400 font-medium animate-pulse">In Progress</span>}
                                                                    </div>

                                                                    {/* Connected Line */}
                                                                    {index < 4 && (
                                                                        <div className="absolute top-6 left-1/2 w-full h-1 -z-10 bg-gray-100">
                                                                            <div
                                                                                className={`h-full bg-green-500 transition-all duration-500 ease-out`}
                                                                                style={{ width: index < currentStatusIndex ? '100%' : '0%' }}
                                                                            ></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500">No purchases yet. Start shopping!</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SELLER: Product Management */}
                    {user.role === 'seller' && activeTab === 'products' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Package className="text-brand-primary" /> My Products</h2>

                            {/* Add Product Form */}
                            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
                                <h3 className="font-bold mb-4 text-brand-dark">
                                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <form onSubmit={handleAddProduct} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Product Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={newProduct.title}
                                                onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                                                className="w-full border rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Price (฿)</label>
                                            <input
                                                required
                                                type="number"
                                                value={newProduct.price}
                                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="w-full border rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Category</label>
                                            <select
                                                value={newProduct.category}
                                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                className="w-full border rounded-md px-3 py-2 bg-white focus:border-brand-primary outline-none text-sm"
                                            >
                                                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Upload Images</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="w-full border rounded-md px-3 py-2 bg-white text-sm file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-dark hover:file:bg-brand-primary/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={uploading}
                                        type="submit"
                                        className="w-full bg-brand-navy text-white font-bold py-2.5 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 mt-2"
                                    >
                                        {uploading ? 'Saving...' : (editingProductId ? 'Update Product' : 'Publish Product')}
                                    </button>
                                    {editingProductId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewProduct({ title: '', price: '', category: 'Others', images: [] });
                                                setEditingProductId(null);
                                                setImageFiles([]);
                                            }}
                                            className="w-full bg-gray-200 text-gray-700 font-bold py-2.5 rounded-md hover:bg-gray-300 transition-colors mt-2"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </form>
                            </div>

                            {/* Product List */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Package size={18} /> My Listed Products
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{products.filter(p => p.seller_id === user.id).length} items</span>
                                </h3>

                                {products.filter(p => p.seller_id === user.id).length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {products.filter(p => p.seller_id === user.id).map(p => (
                                            <div key={p.id} className="flex items-center gap-4 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all group">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0 border">
                                                    {p.images && p.images.length > 0 ? (
                                                        <Image src={p.images[0]} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400"><Package /></div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{p.title}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{p.category || 'Uncategorized'}</span>
                                                        <span>•</span>
                                                        <span className="font-medium text-black">{p.sold} sold</span>
                                                    </div>
                                                    <div className="font-bold text-brand-primary mt-1">฿{p.price.toLocaleString()}</div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setNewProduct({
                                                                title: p.title,
                                                                price: p.price.toString(),
                                                                category: p.category || 'Others',
                                                                images: p.images || []
                                                            });
                                                            setEditingProductId(p.id);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${editingProductId === p.id ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10'}`}
                                                        title="Edit (Populate Form)"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this product?')) removeProduct(p.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Product"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <Package size={40} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-medium">No products listed yet.</p>
                                        <p className="text-xs text-gray-400">Use the form above to add your first product.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SELLER: Order Management */}
                    {user.role === 'seller' && activeTab === 'orders' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ClipboardList className="text-brand-primary" /> Order Management</h2>
                            <div className="space-y-4">
                                {orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <div key={order.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center text-sm">
                                                <div>
                                                    <span className="font-bold text-lg text-gray-800">Order #{order.id}</span>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                        <User size={14} /> Buyer ID: {order.user}
                                                        <span className="text-gray-300">|</span>
                                                        <span>{new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'Processing' ? 'bg-purple-100 text-purple-800' :
                                                                order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                        'bg-red-100 text-red-800'
                                                        }`}>
                                                        {order.status === 'Pending' && <ClipboardList size={14} />}
                                                        {order.status === 'Confirmed' && <Check size={14} />}
                                                        {order.status === 'Processing' && <Package size={14} />}
                                                        {order.status === 'Shipped' && <Truck size={14} />}
                                                        {order.status === 'Delivered' && <Home size={14} />}
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                {/* Payment Info for Seller */}
                                                <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                                                    <div className="text-sm">
                                                        <span className="font-bold text-blue-900">Payment Method:</span> {order.payment_method}
                                                        <span className="mx-2 text-gray-300">|</span>
                                                        <span className="font-bold text-blue-900">Status:</span>
                                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${order.payment_status === 'Paid' ? 'bg-green-200 text-green-800' :
                                                            order.payment_status === 'Pending Verification' ? 'bg-orange-200 text-orange-800' :
                                                                'bg-gray-200 text-gray-700'
                                                            }`}>
                                                            {order.payment_status || 'Unpaid'}
                                                        </span>
                                                    </div>
                                                    {order.payment_slip && (
                                                        <a
                                                            href={order.payment_slip}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 flex items-center gap-1"
                                                        >
                                                            <ClipboardList size={12} /> View Slip
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Products Grid */}
                                                <div className="space-y-4 mb-6">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                            <div className="w-16 h-16 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0 border">
                                                                {item.images && item.images.length > 0 && <Image src={item.images[0]} alt={item.title} fill className="object-cover" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">{item.title}</div>
                                                                <div className="text-sm text-gray-500">Qty: {item.quantity} × ฿{item.price.toLocaleString()}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-brand-primary">฿{(item.price * item.quantity).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-end pt-4 border-t border-dashed">
                                                        <div className="text-right">
                                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Amount</span>
                                                            <div className="text-2xl font-bold text-brand-navy">฿{order.total.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Timeline for Seller */}
                                                <div className="mb-8 px-2">
                                                    <div className="relative flex items-center justify-between">
                                                        {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                                            const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
                                                            const currentStatusIndex = steps.indexOf(order.status);
                                                            const isCompleted = index <= currentStatusIndex;
                                                            const isCurrent = index === currentStatusIndex;

                                                            const Icons = [ClipboardList, Check, Package, Truck, Home];
                                                            const StepIcon = Icons[index];

                                                            return (
                                                                <div key={step} className="flex flex-col items-center relative z-10 w-full">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${isCompleted ? 'bg-brand-navy border-brand-navy text-white' : 'bg-white border-gray-200 text-gray-300'} ${isCurrent ? 'ring-2 ring-brand-navy/30 scale-110' : ''}`}>
                                                                        <StepIcon size={14} />
                                                                    </div>
                                                                    <span className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${isCompleted ? 'text-brand-navy' : 'text-gray-300'}`}>{step}</span>
                                                                    {index < 4 && (
                                                                        <div className="absolute top-4 left-1/2 w-full h-0.5 -z-10 bg-gray-100">
                                                                            <div className={`h-full bg-brand-navy transition-all duration-500`} style={{ width: index < currentStatusIndex ? '100%' : '0%' }}></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Action Area */}
                                                <div className="bg-gray-50 -mx-6 -mb-6 p-4 flex justify-between items-center px-6">
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                        Action Required
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {/* Verification Action */}
                                                        {order.payment_status === 'Pending Verification' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm('Verify this payment? This will mark the order as Confirmed.')) {
                                                                        try {
                                                                            await fetch('/api/orders/update', {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    order_id: order.id,
                                                                                    status: 'Confirmed',
                                                                                    payment_status: 'Paid'
                                                                                })
                                                                            });
                                                                            fetchOrders();
                                                                        } catch (e) { alert('Error verifying payment'); }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                                                            >
                                                                <Check size={16} /> Verify Payment
                                                            </button>
                                                        )}

                                                        {order.status === 'Pending' && order.payment_method !== 'Bank Transfer' && (
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Confirmed')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95">
                                                                <Check size={16} /> Accept Order
                                                            </button>
                                                        )}
                                                        {order.status === 'Confirmed' && (
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Processing')} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 shadow-md hover:shadow-lg transition-all active:scale-95">
                                                                <Package size={16} /> Start Packing
                                                            </button>
                                                        )}
                                                        {order.status === 'Processing' && (
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Shipped')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95">
                                                                <Truck size={16} /> Ship Order
                                                            </button>
                                                        )}
                                                        {order.status === 'Shipped' && (
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Delivered')} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all active:scale-95">
                                                                <Home size={16} /> Mark Delivered
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <ClipboardList size={48} className="mb-4 opacity-50" />
                                        <p className="font-medium">No incoming orders yet.</p>
                                        <p className="text-sm mt-1">Products you list will appear here when sold.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Order 2 -> Right) */}
                <div className="col-span-1 order-1 lg:order-2">
                    <div className="bg-white rounded-t-lg overflow-hidden border border-brand-navy/20 shadow-sm">
                        {/* Styled Header */}
                        <div className="bg-brand-navy px-4 py-3 text-white font-bold text-sm flex items-center justify-between">
                            <span>Welcome, {user.username}</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online"></div>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center mb-8 border-b border-gray-100 pb-6">
                                <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center text-brand-secondary mb-3 border-2 border-white shadow-md">
                                    <User size={40} />
                                </div>
                                <h2 className="font-bold text-lg text-brand-navy">{user.username}</h2>
                                <p className="text-sm text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full mt-1">{user.role}</p>
                            </div>

                            <nav className="space-y-2">
                                {user.role === 'customer' && (
                                    <>
                                        <button
                                            onClick={() => setActiveTab('profile-info')}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'profile-info' ? 'bg-brand-primary/10 text-brand-dark font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <User size={20} /> Profile Information
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('purchases')}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'purchases' ? 'bg-brand-primary/10 text-brand-dark font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <ClipboardList size={20} /> My Purchases
                                        </button>
                                    </>
                                )}

                                {user.role === 'seller' && (
                                    <>
                                        <button
                                            onClick={() => setActiveTab('products')}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'products' ? 'bg-brand-primary/10 text-brand-dark font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <Package size={20} /> My Products
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'orders' ? 'bg-brand-primary/10 text-brand-dark font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <ClipboardList size={20} /> Order Management
                                        </button>
                                    </>
                                )}

                                {user.role === 'admin' && (
                                    <button onClick={() => router.push('/admin')} className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-50 text-gray-600">
                                        <TrendingUp size={20} /> Full Admin Dashboard
                                    </button>
                                )}

                                <button onClick={logout} className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-50 mt-4 border-t pt-4">
                                    <LogOut size={20} /> Logout
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-brand-light/20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-brand-navy font-bold animate-pulse">Loading Profile...</p>
                </div>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}
