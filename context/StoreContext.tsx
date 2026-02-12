"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export interface Product {
    id: string | number;
    title: string;
    price: number;
    images: string[]; // Changed to array
    category?: string;
    sold: number;
    seller_id?: number | null;
    seller_name?: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    items: CartItem[];
    total: number;
    date: string;
    status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
    user?: string;
    payment_method?: string;
    payment_status?: string;
    payment_slip?: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'customer' | 'seller'; // Added seller
    fullname?: string;
    address?: string;
    tel?: string;
    birthdate?: string;
    gender?: 'male' | 'female' | 'not_specified';
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

interface StoreContextType {
    products: Product[];
    cart: CartItem[];
    orders: Order[];
    user: User | null;
    notifications: Notification[];
    addProduct: (product: Omit<Product, 'id' | 'sold' | 'seller_name'>) => Promise<void>;
    editProduct: (product: Product) => Promise<void>;
    removeProduct: (productId: string | number) => Promise<void>;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string | number) => void;
    clearCart: () => void;
    createOrder: () => Promise<string[] | null>;
    login: (username: string, password?: string) => Promise<boolean>;
    signup: (email: string, password: string, name: string, role?: string) => Promise<boolean>;
    logout: () => void;
    addReview: (productId: number, rating: number, comment: string) => Promise<boolean>;
    deleteReview: (reviewId: number) => Promise<boolean>;
    toggleFavorite: (productId: number) => Promise<boolean>;
    checkFavorite: (productId: number) => Promise<boolean>;
    fetchReviews: (productId: number) => Promise<any[]>;
    markRead: (id?: number) => Promise<void>;
    updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
    fetchOrders: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    updateProfile: (fullname: string, address: string, tel: string, birthdate: string, gender: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [user, setUser] = useState<User | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchProducts();

        const savedUser = localStorage.getItem("juujuu-user");
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch { }
        }
        const savedCart = localStorage.getItem("juujuu-cart");
        if (savedCart) {
            try { setCart(JSON.parse(savedCart)); } catch { }
        }
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    useEffect(() => {
        localStorage.setItem("juujuu-cart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (user) localStorage.setItem("juujuu-user", JSON.stringify(user));
        else localStorage.removeItem("juujuu-user");
    }, [user]);

    const addProduct = async (product: Omit<Product, 'id' | 'sold' | 'seller_name'>) => {
        try {
            const payload = {
                ...product,
                seller_id: user?.id
            };
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newProduct = await res.json();
                setProducts((prev) => [newProduct, ...prev]);
            }
        } catch (error) {
            console.error("Failed to add product", error);
        }
    };

    const editProduct = async (product: Product) => {
        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                setProducts((prev) => prev.map(p => p.id === product.id ? product : p));
            }
        } catch (error) {
            console.error("Failed to edit product", error);
        }
    };

    const removeProduct = async (productId: string | number) => {
        try {
            await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
            setProducts((prev) => prev.filter((p) => p.id !== productId));
        } catch (error) {
            console.error("Failed to remove product", error);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string | number) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/notifications?user_id=${user.id}`);
            if (res.ok) setNotifications(await res.json());
        } catch (e) { }
    };

    const markRead = async (id?: number) => {
        if (!user) return;
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, markAll: !id, user_id: user.id })
            });
            fetchNotifications();
        } catch (e) { }
    };

    const deleteNotification = async (id: number) => {
        if (!user) return;
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, user_id: user.id })
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (e) { }
    };

    const updateOrderStatus = async (orderId: number, status: string) => {
        try {
            await fetch('/api/orders/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status })
            });
            fetchOrders();
            return true;
        } catch (e) { return false; }
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/orders?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) { console.error("Failed to fetch orders", e); }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchOrders();
            const interval = setInterval(() => {
                fetchNotifications();
                fetchOrders();
            }, 10000);
            return () => clearInterval(interval);
        } else {
            setOrders([]); // Clear orders on logout
        }
    }, [user]);

    const createOrder = async () => {
        if (cart.length === 0 || !user) return;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    items: cart,
                    status: 'Pending'
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCart([]);
                fetchProducts();
                fetchNotifications();
                fetchOrders();
                return data.orderIds;
            }
        } catch (error) {
            console.error("Failed to create order", error);
            return null;
        }
    };

    const addReview = async (productId: number, rating: number, comment: string) => {
        if (!user) return false;
        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, product_id: productId, rating, comment })
            });
            return true;
        } catch (e) { return false; }
    };

    const deleteReview = async (reviewId: number) => {
        if (!user) return false;
        try {
            const res = await fetch('/api/reviews', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_id: reviewId, user_id: user.id })
            });
            return res.ok;
        } catch (e) { return false; }
    };

    const toggleFavorite = async (productId: number) => {
        if (!user) return false;
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, product_id: productId })
            });
            const data = await res.json();
            return data.isFavorite;
        } catch (e) { return false; }
    };

    const checkFavorite = async (productId: number) => {
        if (!user) return false;
        try {
            const res = await fetch(`/api/favorites?user_id=${user.id}&product_id=${productId}`);
            const data = await res.json();
            return data.isFavorite;
        } catch (e) { return false; }
    };

    const fetchReviews = async (productId: number) => {
        try {
            const res = await fetch(`/api/reviews?product_id=${productId}`);
            return await res.json();
        } catch (e) { return []; }
    };

    const login = async (username: string, password?: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                setUser({
                    id: data.user.id,
                    username: data.user.name,
                    email: data.user.email,
                    role: data.user.role
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const signup = async (email: string, password: string, name: string, role: string = 'customer') => {
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role })
            });
            if (res.ok) {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    const updateProfile = async (fullname: string, address: string, tel: string, birthdate: string, gender: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    fullname,
                    address,
                    tel,
                    birthdate,
                    gender
                })
            });

            if (res.ok) {
                const updatedUser = {
                    ...user,
                    fullname,
                    address,
                    tel,
                    birthdate,
                    gender: gender as 'male' | 'female' | 'not_specified'
                };
                setUser(updatedUser);
                localStorage.setItem('juujuu-user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update profile', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("juujuu-user");
    };

    return (
        <StoreContext.Provider
            value={{
                products,
                cart,
                orders,
                user,
                addProduct,
                editProduct,
                removeProduct,
                addToCart,
                removeFromCart,
                clearCart,
                createOrder,
                login,
                signup,
                logout,
                addReview,
                deleteReview,
                toggleFavorite,
                checkFavorite,
                fetchReviews,
                notifications,
                markRead,
                updateOrderStatus,
                fetchOrders,
                deleteNotification,
                updateProfile,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
