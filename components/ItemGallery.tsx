import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-center animate-in fade-in duration-200"
            onClick={handleClose} // Clicking backdrop closes
            style={{ touchAction: 'none' }} // Prevent scrolling on mobile
        >
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-3 text-white/70 hover:text-white bg-white/10 rounded-full z-[10000] backdrop-blur-md active:scale-95 transition-all"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center px-2 py-10" onClick={(e) => e.stopPropagation()}>
                <img
                    src={validImages[currentIndex]}
                    alt={`${name} ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg bg-black"
                    style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                />

                {validImages.length > 1 && (
                    <>
                        <button onClick={prev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors active:scale-90">
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button onClick={next} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors active:scale-90">
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <h3 className="text-white font-bold text-lg drop-shadow-md mb-4 px-4">{name}</h3>
                {validImages.length > 1 && (
                    <div className="flex justify-center gap-2 pointer-events-auto">
                        {validImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`h-2 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/30 w-2 hover:bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div onClick={openGallery} className="w-full h-full relative cursor-pointer group">
                <img src={validImages[0]} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {validImages.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <ImageIcon className="w-3 h-3" />
                        <span>+{validImages.length - 1}</span>
                    </div>
                )}
            </div>

            {isOpen && createPortal(modalContent, document.body)}
        </>
    );
};
