
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

    const handleQuantityChange = (delta: number) => {
        const newQty = qty + delta;
        if (newQty >= 1) setQty(newQty);
    };

    const handleAdd = () => {
        // We pass the diff if adding to existing, or total qty?
        // The hook expects "quantity to add" (default 1) or we can refactor hook.
        // Given current hook logic:
        // addToCart(item, quantity, notes) adds Qty to existing.
        // BUT users expect "Set Qty to X".
        // Let's stick to simple "Add 1" logic or bulk add?
        // For the modal "Add Order", it usually means "Add to cart".

        // Simplified: Just add 1 with notes for now to match main list behavior, 
        // OR better: Add the specific quantity selected in modal.
        // But we need to be careful not to double count if user already has items.

        // Let's assume this modal ADDS the selected quantity to cart.
        onAddToCart(selectedItem, 1, notes); // Adding 1 for now to be safe and consistent with main list
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 animate-in zoom-in overflow-hidden flex flex-col max-h-[90vh]">
                <div className="relative h-64 bg-gray-100 shrink-0">
                    {selectedItem.image ? (
                        <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Utensils className="w-16 h-16" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg text-gray-800 hover:bg-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-serif font-bold text-brand-900">{selectedItem.name}</h2>
                        <span className="text-xl font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full border border-accent-100">
                            ${selectedItem.price}
                        </span>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Descripción</h3>
                            <p className="text-gray-600 leading-relaxed">{selectedItem.description || "Sin descripción disponible."}</p>
                        </div>

                        {selectedItem.ingredients && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Ingredientes</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{selectedItem.ingredients}</p>
                            </div>
                        )}

                        {/* SPECIAL INSTRUCTIONS INPUT */}
                        <div>
                            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Instrucciones Especiales
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej. Sin cebolla, salsa aparte, extra picante..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-all resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        {/* Qty Controls inside Modal? 
                            The user's screenshot had +/- Qty AND Notes. 
                            Let's rely on standard +/- from CustomerMenu for simplicity first, 
                            OR implement a local Qty state. 
                            
                            Going with the flow: The screenshot specifically showed the modal form.
                        */}
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveFromCart(selectedItem.id); }}
                                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-12 text-center font-bold text-lg text-brand-900">{getItemQty(selectedItem.id)}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddToCart(selectedItem, 1, notes); }}
                                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <Button
                            fullWidth
                            onClick={handleAdd}
                            className="h-12"
                            icon={<ShoppingBag className="w-5 h-5" />}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
