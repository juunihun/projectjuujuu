"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, User, Bell, HelpCircle, Globe, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useState, useEffect } from "react";

export default function Navbar() {
    const { cart, user, logout, notifications, markRead, deleteNotification } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Close menu on navigation or resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
            {/* Top Bar - Hidden on Mobile */}
            <div className="relative z-20 bg-brand-navy text-white text-xs py-2 hidden md:block">
                <div className="container-custom flex justify-between items-center">
                    <div className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        <span>Follow us on</span>
                    </div>
                    <div className="flex gap-6 items-center font-medium">
                        <div className="relative group">
                            <a href="#" className="flex items-center gap-1.5 hover:text-brand-light transition-colors">
                                <Bell size={14} />
                                Notifications
                                {notifications && notifications.some(n => !n.is_read) && (
                                    <span className="absolute top-0 left-0 -mt-1 -ml-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                )}
                                {notifications && notifications.some(n => !n.is_read) && (
                                    <span className="absolute top-0 left-0 -mt-1 -ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </a>
                            {/* Notification Dropdown */}
                            <div className="absolute right-0 top-full pt-2 hidden group-hover:block w-80 z-50">
                                <div className="bg-white text-gray-800 shadow-xl rounded-md overflow-hidden border border-gray-100">
                                    <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                                        <span className="font-bold text-sm">Notifications</span>
                                        <button onClick={() => markRead()} className="text-xs text-primary hover:underline">Mark all read</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications && notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div key={n.id} className="relative group/item">
                                                    <Link
                                                        href={n.link || '#'}
                                                        onClick={() => markRead(n.id)}
                                                        className={`block p-3 border-b hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <div className="text-xs font-bold mb-1 mr-4">{n.title}</div>
                                                        <div className="text-xs text-gray-600 line-clamp-2">{n.message}</div>
                                                        <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            deleteNotification(n.id);
                                                        }}
                                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                        title="Remove notification"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-gray-500">No notifications</div>
                                        )}
                                    </div>
                                    <Link href="/profile" className="block text-center py-2 text-xs font-bold text-primary hover:bg-gray-50">View All</Link>
                                </div>
                            </div>
                        </div>
                        <a href="#" className="flex items-center gap-1.5 hover:text-brand-light transition-colors"><HelpCircle size={14} /> Help</a>
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-brand-light transition-colors"><Globe size={14} /> English <span className="ml-0.5 text-[10px]">▼</span></div>

                        {user ? (
                            <div className="flex items-center gap-2 cursor-pointer relative group ml-2 font-bold hover:bg-white/10 px-3 py-1 rounded-full transition-colors">
                                <User size={14} />
                                <span>{user.username}</span>
                                <div className="absolute right-0 top-full pt-2 hidden group-hover:block w-48">
                                    <div className="bg-white text-brand-navy shadow-xl rounded-xl overflow-hidden flex flex-col border border-brand-light/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <Link href="/profile" className="px-5 py-3 hover:bg-brand-light/20 text-left text-sm font-medium transition-colors">My Profile</Link>
                                        <button onClick={logout} className="px-5 py-3 hover:bg-red-50 text-red-600 text-left w-full text-sm font-medium transition-colors">Logout</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 ml-2">
                                <Link href="/signup" className="font-bold hover:text-brand-light transition-colors">Sign Up</Link>
                                <div className="w-[1px] h-3 bg-white/30"></div>
                                <Link href="/login" className="font-bold hover:text-brand-light transition-colors">Login</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="relative z-10 glass py-2 md:py-3">
                <div className="container-custom flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-1 text-brand-dark hover:bg-brand-light/20 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
                        <div className="relative w-10 h-10 md:w-14 md:h-14 group-hover:scale-105 transition-transform drop-shadow-md">
                            <Image src="/logo-new.png" alt="JuuJuu Logo" fill className="object-contain" />
                        </div>
                        <span className="text-xl md:text-2xl font-bold text-brand-dark tracking-tight hidden sm:block group-hover:text-brand-primary transition-colors font-['var(--font-quicksand)']">JuuJuu</span>
                    </Link>

                    {/* Search - Expanded on desktop, flex-1 on mobile */}
                    <div className="flex-1 relative">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                                if (query.trim()) {
                                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                                }
                            }}
                            className="flex w-full bg-slate-100/50 border-2 border-transparent focus-within:border-brand-medium focus-within:bg-white focus-within:shadow-lg focus-within:shadow-brand-medium/20 rounded-full p-1 md:p-1.5 transition-all duration-300"
                        >
                            <input
                                name="search"
                                type="text"
                                placeholder="Search products..."
                                className="flex-1 px-3 md:px-5 bg-transparent outline-none text-brand-navy placeholder:text-brand-dark/50 font-bold text-sm md:text-lg w-full"
                            />
                            <button type="submit" className="bg-brand-dark text-white p-2 md:px-6 md:py-2 rounded-full hover:bg-brand-navy hover:shadow-md active:scale-95 transition-all duration-200">
                                <Search size={18} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>

                    {/* Cart */}
                    <div className="shrink-0 flex items-center gap-2">
                        <Link href="/cart" className="relative p-2 hover:bg-brand-light/20 rounded-full transition-colors group">
                            <ShoppingCart size={24} className="text-brand-dark group-hover:text-brand-navy transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] md:text-[10px] font-bold min-w-[16px] md:min-w-[20px] h-4 md:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transform scale-100 group-hover:scale-110 transition-transform">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer Content */}
            <div className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 md:hidden transition-transform duration-300 ease-out transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl overflow-y-auto`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-2xl font-bold text-brand-navy font-['var(--font-quicksand)']">Menu</span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {user ? (
                            <div className="pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center text-brand-navy">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-brand-navy">{user.username}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest">{user.role}</div>
                                    </div>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-between w-full p-3 hover:bg-brand-light/20 rounded-xl transition-colors font-bold text-brand-dark"
                                >
                                    My Profile <ChevronRight size={18} />
                                </Link>
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="flex items-center justify-between w-full p-3 mt-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
                                >
                                    Logout <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="pb-6 border-b border-gray-100 space-y-3">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-brand-navy text-white rounded-xl font-bold"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-brand-light text-brand-navy rounded-xl font-bold"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Content</div>
                            <Link href="/" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors font-medium">Home</Link>
                            <Link href="/cart" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors font-medium">Cart</Link>
                            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors font-medium cursor-pointer">
                                <span>Language</span>
                                <span className="text-xs text-brand-navy font-bold">English</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
