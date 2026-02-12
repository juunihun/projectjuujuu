"use client";

import { useStore } from "@/context/StoreContext";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Star, Heart, Share2, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";

export default function ProductDetailPage() {
    const { id } = useParams();
    const { products, addToCart, user, addReview, deleteReview, fetchReviews, toggleFavorite, checkFavorite } = useStore();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState<string>("");
    const [imageIndex, setImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Find product safely
    const productId = Array.isArray(id) ? id[0] : id;
    const product = products.find((p) => String(p.id) === productId);

    // Initial state setup
    useEffect(() => {
        if (product && product.images && product.images.length > 0) {
            setActiveImage(product.images[0]);
            checkFavorite(Number(product.id)).then(setIsFavorite);
            fetchReviews(Number(product.id)).then(setReviews);
        }
    }, [product]);

    // Auto-slide Carousel
    useEffect(() => {
        if (!product || !product.images || product.images.length <= 1) return;
        const interval = setInterval(() => {
            setImageIndex((prev) => (prev + 1) % product.images.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [product]);

    // Sync active image with index
    useEffect(() => {
        if (product && product.images) {
            setActiveImage(product.images[imageIndex]);
        }
    }, [imageIndex, product]);

    if (!product) {
        return (
            <div className="min-h-screen pt-[130px] text-center">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <button onClick={() => router.push('/')} className="text-primary mt-4 hover:underline">Back to Home</button>
            </div>
        );
    }

    const nextImage = () => {
        setImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        alert("Added to cart!");
    };

    const handleBuyNow = () => {
        handleAddToCart();
        router.push('/cart');
    };

    const handleToggleFavorite = async () => {
        if (!user) { alert("Please login first"); router.push('/login'); return; }
        const newVal = await toggleFavorite(Number(product.id));
        setIsFavorite(newVal);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { alert("Please login first"); return; }
        setSubmitting(true);
        const success = await addReview(Number(product.id), rating, comment);
        if (success) {
            alert("Review submitted!");
            setComment("");
            fetchReviews(Number(product.id)).then(setReviews);
        } else {
            alert("Failed to submit review");
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen pt-[100px] md:pt-[130px] pb-20 px-4 md:px-0">
            <div className="container-custom">
                <div className="bg-white p-6 rounded-sm shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Image Section */}
                    <div className="col-span-1 md:col-span-5">
                        <div className="relative aspect-square w-full border rounded-sm overflow-hidden mb-4 bg-gray-100 group">
                            {activeImage && <Image src={activeImage} alt={product.title} fill className="object-cover transition-all duration-500 ease-in-out" />}

                            {/* Arrows */}
                            {product.images.length > 1 && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>
                        {/* Image Gallery */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {product.images.map((url, i) => (
                                <div
                                    key={i}
                                    onClick={() => setImageIndex(i)}
                                    className={`w-20 h-20 relative border cursor-pointer hover:border-primary shrink-0 transition-all ${imageIndex === i ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                >
                                    <Image src={url} alt={`thumbnail-${i}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="col-span-1 md:col-span-7 flex flex-col gap-6">
                        <div>
                            <h1 className="text-xl font-medium text-gray-800 line-clamp-2">{product.title}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= 5 ? "currentColor" : "none"} />)}
                                    <span className="text-primary ml-1 border-b border-primary">5.0</span>
                                </div>
                                <div className="border-l pl-4">
                                    <span className="text-black font-bold mr-1">{product.sold}</span> Sold
                                </div>
                                {product.seller_name && (
                                    <div className="border-l pl-4 text-xs">
                                        Sold by: <span className="text-primary font-bold">{product.seller_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4">
                            <div className="text-3xl font-medium text-primary">฿{product.price.toLocaleString()}</div>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] gap-y-6 text-sm items-center text-gray-500">
                            <div>Return</div>
                            <div className="text-black">7 Days Return</div>

                            <div>Shipping</div>
                            <div className="text-black">Free Shipping</div>

                            <div>Quantity</div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 border border-r-0 flex items-center justify-center hover:bg-gray-50"
                                >
                                    -
                                </button>
                                <input
                                    type="text"
                                    value={quantity}
                                    readOnly
                                    className="w-12 h-8 border text-center outline-none"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 border border-l-0 flex items-center justify-center hover:bg-gray-50"
                                >
                                    +
                                </button>
                                <span className="ml-4 text-xs">100 pieces available</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 max-w-[200px] h-12 flex items-center justify-center gap-2 border border-primary bg-primary/10 text-primary rounded-sm font-bold hover:bg-primary/20"
                            >
                                <ShoppingCart size={20} /> Add To Cart
                            </button>
                            <button
                                onClick={handleBuyNow}
                                className="flex-1 max-w-[200px] h-12 flex items-center justify-center gap-2 bg-primary text-white rounded-sm font-bold hover:bg-primary/90"
                            >
                                Buy Now
                            </button>
                        </div>

                        <div className="border-t pt-6 mt-2 flex items-center justify-between text-gray-500 text-sm">
                            <div className="flex items-center gap-6">
                                <button onClick={handleToggleFavorite} className={`flex items-center gap-1 cursor-pointer hover:text-red-500 transition-colors ${isFavorite ? 'text-red-500' : ''}`}>
                                    <Heart size={16} fill={isFavorite ? "currentColor" : "none"} /> Favorite
                                </button>
                                <span className="flex items-center gap-1 cursor-pointer hover:text-primary"><Share2 size={16} /> Share: Twitter, FB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-6 bg-white p-6 rounded-sm shadow-sm">
                    <h2 className="text-lg font-bold mb-6">Product Ratings</h2>

                    {/* Review Form */}
                    {user && user.role === 'customer' && (
                        <div className="mb-8 p-4 bg-gray-50 rounded border">
                            <h3 className="font-bold text-sm mb-2">Write a Review</h3>
                            <form onSubmit={handleSubmitReview}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm">Rating:</span>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setRating(s)}>
                                            <Star size={20} className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Share your thoughts about this product..."
                                    className="w-full border p-2 rounded-sm text-sm mb-2 h-20 resize-none focus:outline-none focus:border-primary"
                                    required
                                />
                                <button disabled={submitting} type="submit" className="bg-primary text-white text-sm px-4 py-2 rounded-sm hover:bg-primary/90 disabled:opacity-50">
                                    Submit Review
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Review List */}
                    <div className="space-y-6">
                        {reviews.length > 0 ? (
                            reviews.map((review, i) => (
                                <div key={i} className="border-b pb-4 last:border-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <UserIcon size={16} className="text-gray-500" />
                                            </div>
                                            <div className="text-sm font-medium">{review.user_name}</div>
                                        </div>
                                        {user && (user.id === review.user_id || user.role === 'admin') && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this comment?")) {
                                                        const success = await deleteReview(review.id);
                                                        if (success) {
                                                            fetchReviews(Number(product.id)).then(setReviews);
                                                        } else {
                                                            alert("Failed to delete");
                                                        }
                                                    }
                                                }}
                                                className="text-gray-400 hover:text-red-500 text-xs"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex text-yellow-400 icon-xs">
                                            {[...Array(5)].map((_, idx) => (
                                                <Star key={idx} size={12} fill={idx < review.rating ? "currentColor" : "none"} className={idx < review.rating ? "" : "text-gray-300"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {/* Format Date */}
                                            {new Date(review.created_at).toLocaleDateString()} {new Date(review.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 mt-2">
                                        {product.title}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">No ratings yet. Be the first to rate!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
