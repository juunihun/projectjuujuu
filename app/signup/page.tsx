"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";

export default function SignupPage() {
    const { signup } = useStore();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer"
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.email && formData.password) {
            const success = await signup(formData.email, formData.password, formData.name, formData.role);
            if (success) {
                alert("Account created! Please log in.");
                router.push("/login");
            } else {
                alert("Signup failed. Email might be taken.");
            }
        }
    };

    return (
        <div className="min-h-screen pt-[130px] pb-10 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-brand-light/20 flex flex-col items-center">
                <div className="relative w-32 h-16 mb-4 drop-shadow-md">
                    <Image src="/logo-new.png" alt="JuuJuu Logo" fill className="object-contain" />
                </div>
                <h1 className="text-3xl font-bold mb-6 text-center text-brand-navy">Sign Up</h1>
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 items-center pl-1">
                        <label className="text-sm font-bold text-gray-600">Register as:</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="customer"
                                checked={formData.role === "customer"}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="accent-brand-dark"
                            />
                            <span className="text-sm">Customer</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="seller"
                                checked={formData.role === "seller"}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="accent-brand-dark"
                            />
                            <span className="text-sm">Seller</span>
                        </label>
                    </div>

                    <button className="w-full bg-brand-dark text-white p-3 rounded-xl font-bold hover:bg-brand-navy hover:shadow-lg transition-all transform active:scale-95 uppercase">
                        Sign Up
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    Have an account? <Link href="/login" className="text-brand-dark font-bold hover:underline">Log In</Link>
                </div>
            </div>
        </div>
    );
}
