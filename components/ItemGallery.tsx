import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Utensils, Image as ImageIcon } from 'lucide-react';

interface ItemGalleryProps {
    images: (string | null | undefined)[]; // Main image is [0], others follow.
    name: string;
}

export const ItemGallery: React.FC<ItemGalleryProps> = ({ images, name }) => {
    // Filter out valid image URLs
    const validImages = images.filter((img): img is string => typeof img === 'string' && img.length > 0);
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // If no images at all, show placeholder
    if (validImages.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Utensils className="w-8 h-8" />
            </div>
        );
    }

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    }

    const openGallery = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (validImages.length > 0) setIsOpen(true);
    }

    return (
        <>
            <div onClick={openGallery} className="w-full h-full relative cursor-pointer group">
                <img src={validImages[0]} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />

                {/* Overlay gradient for better text visibility if we had text, but here just style */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {validImages.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <ImageIcon className="w-3 h-3" />
                        <span>+{validImages.length - 1}</span>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-center animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-20 backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative w-full max-h-[80vh] flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={validImages[currentIndex]}
                            alt={`${name} ${currentIndex + 1}`}
                            className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg bg-black"
                            style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                        />

                        {validImages.length > 1 && (
                            <>
                                <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <h3 className="text-white font-bold text-lg">{name}</h3>
                        {validImages.length > 1 && (
                            <div className="flex justify-center gap-2 mt-3">
                                {validImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
