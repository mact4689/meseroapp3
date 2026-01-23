
import React, { useState, useEffect } from 'react';
import { X, Utensils, Minus, Plus, ShoppingBag, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { MenuItem } from '../types';

interface ProductDetailModalProps {
    selectedItem: MenuItem | null;
    onClose: () => void;
    onAddToCart: (item: MenuItem, qty: number, notes: string) => void;
    onRemoveFromCart: (id: string) => void;
    getItemQty: (id: string) => number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    selectedItem,
    onClose,
    onAddToCart,
    onRemoveFromCart,
    getItemQty
}) => {
    const [notes, setNotes] = useState('');
    const [qty, setQty] = useState(1);

    // Reset state when item changes
    useEffect(() => {
        if (selectedItem) {
            setNotes('');
            const currentQty = getItemQty(selectedItem.id);
            setQty(currentQty > 0 ? currentQty : 1);
        }
    }, [selectedItem, getItemQty]);

    if (!selectedItem) return null;

    const handleAdd = () => {
        onAddToCart(selectedItem, 1, notes); // Adding 1 for now to be safe and consistent with main list
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-brand-900/40 backdrop-blur-md transition-opacity duration-300 ease-out"
                onClick={onClose}
            />
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">

                {/* Image Section - More immersive */}
                <div className="relative h-72 sm:h-80 bg-gray-50 shrink-0">
                    {selectedItem.image ? (
                        <div className="absolute inset-0">
                            <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 pattern-grid-lg">
                            <Utensils className="w-20 h-20 opacity-20" />
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white transition-all active:scale-95 border border-white/10 shadow-lg z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Floating Price Tag */}
                    <div className="absolute bottom-6 left-6 z-20">
                        <span className="inline-block px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-white/20">
                            <span className="text-xl font-bold text-brand-900 tracking-tight">${selectedItem.price}</span>
                        </span>
                    </div>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                    <div className="mb-8">
                        <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-3">{selectedItem.name}</h2>
                        <p className="text-gray-600 leading-relaxed text-base font-light">{selectedItem.description || "Una deliciosa elección de nuestro chef."}</p>
                    </div>

                    <div className="space-y-6">
                        {selectedItem.ingredients && (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Utensils className="w-3 h-3" />
                                    Ingredientes
                                </h3>
                                <p className="text-gray-700 text-sm font-medium">{selectedItem.ingredients}</p>
                            </div>
                        )}

                        {/* Premium Input Field */}
                        <div>
                            <label htmlFor="notes" className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                                <MessageSquare className="w-3.5 h-3.5 text-accent-500" />
                                Personalizar Pedido
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="¿Alguna instrucción especial? (ej. Sin cebolla, extra salsa...)"
                                className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-sm focus:border-brand-900 focus:ring-0 transition-colors resize-none shadow-sm placeholder:text-gray-400"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-100 flex items-center gap-4 slide-in-from-bottom-2 fade-in duration-500">
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-200 shadow-inner">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFromCart(selectedItem.id); }}
                            className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:scale-90 transition-all hover:bg-gray-50"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center font-bold text-xl text-brand-900 tabular-nums">{getItemQty(selectedItem.id)}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddToCart(selectedItem, 1, notes); }}
                            className="w-11 h-11 bg-brand-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/20 active:scale-90 transition-all hover:bg-black"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <Button
                        fullWidth
                        onClick={handleAdd}
                        className="h-14 !rounded-2xl !text-base shadow-xl shadow-brand-900/10 hover:shadow-brand-900/20 hover:-translate-y-0.5 transition-all duration-300"
                        icon={<ShoppingBag className="w-5 h-5" />}
                    >
                        Agregar a la Orden
                    </Button>
                </div>
            </div>
        </div>
    );
};
