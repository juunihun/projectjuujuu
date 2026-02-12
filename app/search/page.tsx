"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let url = `/api/products?`;
        if (query) url += `search=${encodeURIComponent(query)}&`;
        if (category) url += `category=${encodeURIComponent(category)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    console.error("Search API Error:", data);
                    setProducts([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setProducts([]);
                setLoading(false);
            });
    }, [query, category]);

    return (
        <div className="min-h-screen pt-[130px] pb-10 flex justify-center">
            <div className="container-custom">
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                    <Link href="/" className="hover:text-primary">Home</Link> <span>&gt;</span> <span>Search</span>
                </div>

                <h1 className="text-xl font-bold mb-6">
                    {category ? `Category: ${category}` : `Search result for "${query}"`}
                </h1>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading...</div>
                ) : (
                    <>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {products.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-10 text-center rounded-sm shadow-sm">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-lg font-bold mb-2">No results found</h2>
                                <p className="text-gray-500">Try hitting "Enter" or checking your spelling.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-[130px] text-center">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
