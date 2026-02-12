"use client";

import { useEffect, useState } from "react";
import { CategoryBar } from "./CategoryBar";

export function Banner() {
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/banners')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBanners(data);
                } else {
                    console.error("Failed to load banners:", data);
                    setBanners([]);
                }
            })
            .catch(() => setBanners([]));
    }, []);

    const carouselBanners = banners.filter(b => b.position === 'carousel');
    const side1 = banners.find(b => b.position === 'side_1');
    const side2 = banners.find(b => b.position === 'side_2');

    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (carouselBanners.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % carouselBanners.length);
        }
    };

    const prevSlide = () => {
        if (carouselBanners.length > 0) {
            setCurrentSlide((prev) => (prev - 1 + carouselBanners.length) % carouselBanners.length);
        }
    };

    return (
        <div className="container-custom mt-4 md:mt-6 mb-6">
            <div className="grid grid-cols-12 gap-1 rounded-sm overflow-hidden h-[235px]">
                {/* Main Carousel Banner */}
                <div className="col-span-8 bg-gray-200 relative h-full group cursor-pointer">
                    {carouselBanners.length > 0 ? (
                        <div className="w-full h-full relative">
                            <img src={carouselBanners[currentSlide].image_url} alt="Banner" className="w-full h-full object-cover" />
                            {/* Arrows */}
                            <div onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute top-1/2 left-0 -translate-y-1/2 bg-black/20 text-white p-2 hover:bg-black/50 cursor-pointer hidden group-hover:block transition-all">
                                &lt;
                            </div>
                            <div onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/20 text-white p-2 hover:bg-black/50 cursor-pointer hidden group-hover:block transition-all">
                                &gt;
                            </div>
                            {/* Dots */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                {carouselBanners.map((_, idx) => (
                                    <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`w-2 h-2 rounded-full cursor-pointer hover:bg-white/80 ${currentSlide === idx ? "bg-primary border-white border" : "bg-white/40"}`}></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Fallback / Loading State */
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-500 font-bold text-xl">
                            BIG SALE 50% OFF (Loading...)
                        </div>
                    )}
                </div>

                {/* Side Banners */}
                <div className="col-span-4 flex flex-col gap-1 h-full">
                    <div className="flex-1 bg-yellow-100 relative cursor-pointer overflow-hidden">
                        {side1 ? (
                            <img src={side1.image_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-yellow-800 font-bold">FREE SHIPPING</div>
                        )}
                    </div>
                    <div className="flex-1 bg-pink-100 relative cursor-pointer overflow-hidden">
                        {side2 ? (
                            <img src={side2.image_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-pink-700 font-bold">CRAZY DEALS</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Icons Bar */}
            <CategoryBar />
        </div>
    );
}
