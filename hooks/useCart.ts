
import { useState } from 'react';
import { MenuItem, OrderItem } from '../types';

export interface CartItem extends OrderItem { }

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (item: MenuItem, quantity: number = 1, notes: string = '') => {
        setCart(prev => {
            // Find if item exists with SAME ID
            // NOTE: In a more complex app, we might differentiate by notes too (e.g. 2 Burgers, one w/ cheese, one w/o)
            // For now, we simple update the existing item's quantity and OVERWRITE notes if provided
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id
                    ? { ...i, quantity: i.quantity + quantity, notes: notes || i.notes }
                    : i
                );
            }
            return [...prev, { ...item, quantity: quantity, notes }];
        });
    };

    const updateItemNotes = (itemId: string, notes: string) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.id !== itemId);
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const getItemQty = (itemId: string) => {
        return cart.find(i => i.id === itemId)?.quantity || 0;
    };

    const cartTotal = cart.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return {
        cart,
        addToCart,
        updateItemNotes,
        removeFromCart,
        clearCart,
        getItemQty,
        cartTotal,
        cartCount
    };
};
