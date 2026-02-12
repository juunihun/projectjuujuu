"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, Package, ArrowLeft } from "lucide-react";

export default function AdminPage() {
    const { products, orders, removeProduct } = useStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"products" | "orders" | "sellers" | "banners" | "activity" | "announcements">("products");
    const [sellers, setSellers] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    // Announcement State
    const [announcementMsg, setAnnouncementMsg] = useState("");
    const [announcementActive, setAnnouncementActive] = useState(true);

    // Banner Form
    const [bannerForm, setBannerForm] = useState({ image_url: "", title: "", link_url: "", position: "carousel", sort_order: 0 });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (activeTab === "sellers") {
            fetch('/api/users?role=seller').then(res => res.json()).then(data => setSellers(data));
        } else if (activeTab === "banners") {
            fetchBanners();
        } else if (activeTab === "activity") {
            fetch('/api/activity').then(res => res.json()).then(data => setActivityLogs(data));
        } else if (activeTab === "announcements") {
            fetch('/api/announcements').then(res => res.json()).then(data => {
                if (data) {
                    setAnnouncementMsg(data.message || "");
                    setAnnouncementActive(!!data.is_active);
                }
            });
        }
    }, [activeTab]);

    const handleAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: announcementMsg, is_active: announcementActive })
            });
            alert("Announcement updated!");
        } catch (error) {
            console.error(error);
            alert("Failed to update announcement");
        }
    };

    const fetchBanners = () => {
        fetch('/api/banners')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBanners(data);
                else setBanners([]);
            })
            .catch(() => setBanners([]));
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("files", e.target.files[0]);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.urls?.[0]) {
                setBannerForm(prev => ({ ...prev, image_url: data.urls[0] }));
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bannerForm.image_url) return alert("Image required");

        await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bannerForm)
        });
        setBannerForm({ image_url: "", title: "", link_url: "", position: "carousel", sort_order: 0 });
        fetchBanners();
    };

    const handleDeleteBanner = async (id: number) => {
        if (!confirm("Delete this banner?")) return;
        await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
        fetchBanners();
    };

    const handleDeleteProduct = (id: string | number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            removeProduct(id);
        }
    };

    return (
        <div className="min-h-screen pt-[130px] pb-20 flex justify-center">
            <div className="container-custom w-full max-w-6xl">
                <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-navy mb-6 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Back to Profile
                </button>

                <h1 className="text-2xl font-bold mb-6 text-brand-navy">Admin Dashboard</h1>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
                    {[
                        { id: "products", label: `All Products (${products.length})` },
                        { id: "sellers", label: "Sellers" },
                        { id: "orders", label: `Orders (${orders.length})` },
                        { id: "banners", label: "Banners" },
                        { id: "activity", label: "Activity Log" },
                        { id: "announcements", label: "Announcements" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 px-4 font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                ? "border-brand-dark text-brand-dark"
                                : "border-transparent text-gray-500 hover:text-brand-navy hover:bg-gray-50 rounded-t-lg"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "products" && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-lg mb-2">Manage Products</h2>
                        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 border-b">
                                    <tr>
                                        <th className="p-4">Product</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Sold</th>
                                        <th className="p-4">Seller</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="p-4 flex gap-4 items-center">
                                                <div className="w-12 h-12 relative border rounded-sm overflow-hidden flex-shrink-0">
                                                    <Image src={p.images && p.images[0] ? p.images[0] : "https://picsum.photos/200"} alt={p.title} fill className="object-cover" />
                                                </div>
                                                <div className="font-medium line-clamp-2 max-w-[200px]">{p.title}</div>
                                            </td>
                                            <td className="p-4">฿{p.price.toLocaleString()}</td>
                                            <td className="p-4">{p.sold}</td>
                                            <td className="p-4 text-gray-500">{p.seller_name || 'Admin'}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/admin/edit/${p.id}`} className="text-blue-500 hover:bg-blue-50 p-2 rounded">
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "sellers" && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-lg mb-2">Manage Sellers</h2>
                        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 border-b">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sellers.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="p-4">#{s.id}</td>
                                            <td className="p-4 font-bold">{s.name}</td>
                                            <td className="p-4">{s.email}</td>
                                            <td className="p-4 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {sellers.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No sellers found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "orders" && (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-sm shadow-sm">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <div>
                                        <div className="font-bold text-lg">Order #{order.id}</div>
                                        <div className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</div>
                                        <div className="text-sm text-gray-500">User: {order.user}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-xl text-primary">Total: ฿{order.total.toLocaleString()}</div>
                                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{order.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-10 h-10 relative border rounded-sm overflow-hidden flex-shrink-0">
                                                <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 text-sm">{item.title}</div>
                                            <div className="text-sm">x{item.quantity}</div>
                                            <div className="text-sm font-medium">฿{(item.price * item.quantity).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <div className="text-center py-10 text-gray-500">No orders yet.</div>}
                    </div>
                )}

                {activeTab === "banners" && (
                    <div className="space-y-8">
                        {/* Add Banner Form */}
                        <div className="bg-white p-6 rounded-sm shadow-sm">
                            <h2 className="font-bold text-lg mb-4">Add New Banner</h2>
                            <form onSubmit={handleSaveBanner} className="flex gap-4 items-end flex-wrap">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Position</label>
                                    <select className="border p-2 rounded-sm" value={bannerForm.position} onChange={e => setBannerForm({ ...bannerForm, position: e.target.value })}>
                                        <option value="carousel">Main Carousel (800x300)</option>
                                        <option value="side_1">Side Top (Free Shipping)</option>
                                        <option value="side_2">Side Bottom (Crazy Deals)</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-bold mb-1">Title (Optional)</label>
                                    <input type="text" className="w-full border p-2 rounded-sm" placeholder="e.g. Big Sale"
                                        value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Image</label>
                                    <div className="flex gap-2">
                                        {bannerForm.image_url && <img src={bannerForm.image_url} className="h-10 w-10 object-cover border" />}
                                        <input type="file" onChange={handleBannerUpload} className="text-sm" />
                                    </div>
                                    {isUploading && <span className="text-xs text-blue-500">Uploading...</span>}
                                </div>
                                <button disabled={isUploading} className="bg-primary text-white px-6 py-2 rounded-sm font-bold hover:opacity-90">Save</button>
                            </form>
                        </div>

                        {/* Banners List */}
                        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 border-b">
                                    <tr>
                                        <th className="p-4">Image</th>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Position</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {banners.map((b: any) => (
                                        <tr key={b.id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <img src={b.image_url} className="h-16 object-cover border rounded-sm" />
                                            </td>
                                            <td className="p-4 font-bold">{b.title || '-'}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase">{b.position}</span></td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteBanner(b.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {banners.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No banners found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-lg mb-2">Activity Log (Recent 50)</h2>
                        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                            <div className="divide-y">
                                {activityLogs.map((log: any) => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                                    ${log.action === 'Sign In' ? 'bg-blue-100 text-blue-800' :
                                                        log.action === 'Order Placed' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-sm font-bold text-gray-800">{log.user_name} <span className="text-gray-400 font-normal">({log.user_role})</span></span>
                                            </div>
                                            <p className="text-sm text-gray-600">{log.details}</p>
                                        </div>
                                        <div className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                {activityLogs.length === 0 && <div className="p-8 text-center text-gray-500">No activity recorded yet.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div className="max-w-2xl">
                        <h2 className="font-bold text-lg mb-4">Manage Announcements</h2>
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Announcement Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full border p-3 rounded text-sm focus:outline-none focus:border-brand-navy"
                                        placeholder="Enter announcement text..."
                                        value={announcementMsg}
                                        onChange={(e) => setAnnouncementMsg(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={announcementActive}
                                            onChange={(e) => setAnnouncementActive(e.target.checked)}
                                            className="rounded text-brand-navy focus:ring-brand-navy"
                                        />
                                        <span className="text-sm font-medium">Active (Visible to users)</span>
                                    </label>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="bg-brand-navy text-white px-6 py-2 rounded font-bold hover:bg-brand-dark transition-colors"
                                    >
                                        Save Announcement
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

