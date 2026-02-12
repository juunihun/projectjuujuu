"use client";

import { Palette, Shirt, PawPrint, Plug, Smartphone, Utensils, Home, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    { name: "Beauty", icon: Palette, color: "bg-pink-100 text-pink-600" },
    { name: "Clothing", icon: Shirt, color: "bg-blue-100 text-blue-600" },
    { name: "Pets", icon: PawPrint, color: "bg-orange-100 text-orange-600" },
    { name: "Appliances", icon: Plug, color: "bg-green-100 text-green-600" },
    { name: "Electronics", icon: Smartphone, color: "bg-purple-100 text-purple-600" },
    { name: "Food", icon: Utensils, color: "bg-yellow-100 text-yellow-600" },
    { name: "Home", icon: Home, color: "bg-teal-100 text-teal-600" },
    { name: "Others", icon: MoreHorizontal, color: "bg-gray-100 text-gray-600" }
];

export function CategoryBar() {
    return (
        <div className="container-custom mt-8">
            <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-100">
                <h2 className="text-slate-800 text-base font-bold mb-6 tracking-tight flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full"></div>
                    Categories
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
                    {CATEGORIES.map((cat, i) => (
                        <Link href={`/search?category=${encodeURIComponent(cat.name)}`} key={i} className="flex flex-col items-center gap-3 cursor-pointer group">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${cat.color} group-hover:bg-primary group-hover:text-white`}>
                                <cat.icon size={26} strokeWidth={1.5} />
                            </div>
                            <span className="text-xs text-center font-medium text-slate-600 group-hover:text-primary transition-colors">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
