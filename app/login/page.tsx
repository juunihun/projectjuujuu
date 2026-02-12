"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useStore();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (username && password) {
            const success = await login(username, password);
            if (success) {
                router.push("/");
            } else {
                setError("Invalid username or password. Please try again.");
            }
        } else {
            setError("Please enter both username and password.");
        }
    };

    return (
        <div className="min-h-screen pt-[140px] pb-20 flex justify-center items-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-brand-light/20 flex flex-col items-center">
                <div className="relative w-32 h-16 mb-4 drop-shadow-md">
                    <Image src="/logo-new.png" alt="JuuJuu Logo" fill className="object-contain" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-center text-brand-navy">Welcome Back</h1>
                <p className="text-brand-medium text-center mb-8">Log in to continue shopping</p>

                {error && <p className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded-lg text-sm">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition-all"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-brand-dark text-white p-3 rounded-xl font-bold hover:bg-brand-navy hover:shadow-lg transition-all transform active:scale-95">
                        Log In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? <Link href="/signup" className="text-brand-dark font-bold hover:underline">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
