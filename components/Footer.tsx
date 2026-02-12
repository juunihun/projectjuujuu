import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-brand-navy text-white pt-16 pb-8 mt-20">
            <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div>
                    <div className="mb-6 relative w-40 h-16 drop-shadow-md">
                        <Image src="/logo-new.png" alt="JuuJuu Logo" fill className="object-contain object-left" />
                    </div>
                    <p className="text-brand-light/80 text-sm leading-relaxed">
                        The premium destination for all your shopping needs. Quality products, fast delivery, and exceptional service.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6 text-brand-light">Customer Service</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li><a href="#" className="hover:text-white transition-colors">Help Centre</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Payment Methods</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">JuuJuu Coins</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Order Tracking</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6 text-brand-light">About Us</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li><a href="#" className="hover:text-white transition-colors">About JuuJuu</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">JuuJuu Policies</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6 text-brand-light">Follow Us</h4>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-dark cursor-pointer transition-colors">
                            <Facebook size={20} />
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-dark cursor-pointer transition-colors">
                            <Instagram size={20} />
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-dark cursor-pointer transition-colors">
                            <Twitter size={20} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
                &copy; 2024 JuuJuu. All Rights Reserved.
            </div>
        </footer>
    );
}
