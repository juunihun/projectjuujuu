"use client";

import { Banner } from "@/components/Banner";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { useState } from "react";

export default function Home() {
  const { products } = useStore();
  const [displayCount, setDisplayCount] = useState(30); // 5 rows * 6 cols = 30

  const hasMore = products.length > displayCount;

  return (
    <main className="min-h-screen pb-10 pt-[60px] md:pt-[100px]">
      <Banner />

      <div className="container-custom">
        <div className="bg-white p-3 md:p-4 shadow-sm border-b-4 border-primary/10 sticky top-[70px] md:top-[118px] z-30">
          <h2 className="text-primary font-bold text-lg uppercase tracking-wider">Products</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
          {products.slice(0, displayCount).map((p) => (
            <ProductCard
              key={p.id}
              {...p}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setDisplayCount(prev => prev + 30)}
              className="bg-white border border-gray-300 px-10 py-2 hover:bg-gray-50 text-gray-600 rounded-sm font-medium transition-colors"
            >
              See More
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
