"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useStore, Product } from "@/context/StoreContext";

export function ProductCard(product: Product) {
    const { addToCart } = useStore();
    const { id, title, price, images, sold, seller_name } = product;

    // Use first image or fallback
    const mainImage = images && images.length > 0 ? images[0] : "https://picsum.photos/300/300";

    return (
        <div className="bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl overflow-hidden flex flex-col group relative">
            <Link href={`/product/${id}`}>
                <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                    <img
                        src={mainImage}
                        alt={title || "Product Image"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                    />
                    {/* sold badge logic could go here if needed later */}
                </div>
            </Link>

            <div className="p-3 flex flex-col flex-1 justify-between">
                <Link href={`/product/${id}`}>
                    <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5em] mb-2 text-slate-700 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                </Link>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <div className="text-primary font-bold text-lg">
                            <span className="text-xs align-top mr-0.5">฿</span>
                            {price ? price.toLocaleString() : '0'}
                        </div>
                        <div className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {sold > 1000 ? `${(sold / 1000).toFixed(1)}k sold` : `${sold || 0} sold`}
                        </div>
                    </div>
                    {seller_name && (
                        <div className="text-[10px] text-gray-400 text-right truncate">
                            Sold by {seller_name}
                        </div>
                    )}
                </div>

                {/* Quick Add Button showing on hover for desktop, always for mobile */}
                <button
                    onClick={() => addToCart(product)}
                    className="mt-3 w-full bg-primary text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-700 active:scale-95"
                >
                    <ShoppingCart size={14} /> Add To Cart
                </button>
            </div>
        </div>
    );
}
