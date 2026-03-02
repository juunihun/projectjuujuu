"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function EditProductPage() {
    const { id } = useParams();
    const { products, editProduct } = useStore();
    const router = useRouter();

    const [form, setForm] = useState({
        title: "",
        price: "",
    });

    const productId = Array.isArray(id) ? id[0] : id;
    const product = products.find(p => String(p.id) === productId);

    useEffect(() => {
        if (product) {
            setForm({
                title: product.title,
                price: product.price.toString(),
            });
        }
    }, [product]);

    if (!product) {
        return <div className="pt-[130px] text-center">Product not found</div>;
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.price) return;

        const updatedProduct = {
            ...product,
            title: form.title,
            price: Number(form.price),
        };

        editProduct(updatedProduct);
        alert("Product updated successfully!");
        router.push("/admin");
    };

    return (
        <div className="min-h-screen pt-[130px] pb-20 flex justify-center">
            <div className="w-full max-w-lg bg-white p-8 rounded shadow-sm h-fit">
                <h1 className="text-2xl font-bold mb-6 border-b pb-4">Edit Product</h1>

                <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 relative border rounded-sm overflow-hidden">
                        <img src={product.images && product.images[0] ? product.images[0] : "https://picsum.photos/200"} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Product Name</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded-sm outline-none focus:border-primary"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Price (฿)</label>
                        <input
                            type="number"
                            className="w-full border p-2 rounded-sm outline-none focus:border-primary"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-sm font-bold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-sm font-bold hover:bg-primary/90">
                            Update Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
