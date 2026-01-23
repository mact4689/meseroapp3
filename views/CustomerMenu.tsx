
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppView, MenuItem } from '../types';
import { Bell, ChevronRight, Utensils, Loader2, Plus, Minus, Store, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { createOrder } from '../services/db';
import { useCart } from '../hooks/useCart';
import { useGuestData } from '../hooks/useGuestData';
import { CartModal } from '../components/CartModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { MenuHeader } from '../components/MenuHeader';
import { CategoryNav } from '../components/CategoryNav';

interface CustomerMenuProps {
    onNavigate: (view: AppView) => void;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ onNavigate }) => {
    const { state } = useAppStore();

    // Custom Hooks
    const {
        cart,
        addToCart: addToCartBase,
        removeFromCart,
        clearCart,
        getItemQty,
        cartTotal,
        cartCount
    } = useCart();

    // Wrapper to handle optional arguments safely
    const addToCart = (item: MenuItem, quantity: number = 1, notes: string = '') => {
        addToCartBase(item, quantity, notes);
    };

    // URL Params
    const query = new URLSearchParams(window.location.search);
    const tableId = query.get('table');
    const uid = query.get('uid');

    // Guest Data Hook
    const { business, menu, isLoading } = useGuestData(uid, state.user);

    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [orderSent, setOrderSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Determine if it's Admin Preview Mode
    const isAdminPreview = !!state.user && (!uid || uid === state.user.id);

    // Group items by category
    const groupedItems = useMemo(() => {
        return menu.reduce((acc, item) => {
            if (item.sold_out) return acc;
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [menu]);

    const categories = Object.keys(groupedItems);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
    }, [categories, activeCategory]);

    const scrollToCategory = (category: string) => {
        setActiveCategory(category);
        const element = document.getElementById(category);
        if (element) {
            const headerOffset = 160;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const handleSendOrder = async () => {
        if (isAdminPreview) {
            alert("Modo Vista Previa: Las órdenes de prueba no se envían realmente.");
            return;
        }

        const restaurantId = uid || state.user?.id;
        if (!restaurantId) return;

        setIsSending(true);

        try {
            await createOrder({
                user_id: restaurantId,
                table_number: tableId || 'S/N',
                status: 'pending',
                total: cartTotal,
                items: cart
            });

            setOrderSent(true);
            setTimeout(() => {
                clearCart();
                setOrderSent(false);
                setIsCartOpen(false);
            }, 3000);

        } catch (e: any) {
            alert("Hubo un error al enviar la orden. Inténtalo de nuevo. " + (e.message || ''));
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-900 animate-spin" />
            </div>
        );
    }

    if (!business.name && menu.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 text-gray-400 mb-4 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Menú no disponible</h1>
                <p className="text-gray-500">No se encontró el menú para este restaurante.</p>
                {isAdminPreview && (
                    <Button onClick={() => onNavigate(AppView.DASHBOARD)} className="mt-6">Volver al Panel</Button>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">

            <MenuHeader
                business={business}
                tableId={tableId}
                isAdminPreview={isAdminPreview}
                onNavigate={onNavigate}
            />

            <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onCategoryClick={scrollToCategory}
                isAdminPreview={isAdminPreview}
            />

            {/* Menu Content */}
            <main className="flex-1 px-4 py-6 space-y-8 max-w-2xl mx-auto w-full">
                {categories.map((category) => (
                    <div key={category} className="scroll-mt-40" id={category}>
                        <h2 className="font-serif text-xl font-bold text-brand-900 mb-4 flex items-center">
                            <span className="w-1.5 h-6 bg-accent-500 rounded-full mr-3"></span>
                            {category}
                        </h2>
                        <div className="grid gap-4">
                            {groupedItems[category].map((item) => {
                                const qty = getItemQty(item.id);
                                return (
                                    <div key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 transition-all active:scale-[0.99] cursor-pointer"
                                    >
                                        <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Utensils className="w-8 h-8" />
                                                </div>
                                            )}
                                            {qty > 0 && (
                                                <div className="absolute inset-0 bg-brand-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-white font-bold text-xl">{qty}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-bold text-brand-900 line-clamp-2 leading-tight text-sm sm:text-base">{item.name}</h3>
                                                    <span className="font-bold text-accent-600 shrink-0">${item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                            </div>

                                            <div className="flex justify-end mt-2">
                                                {qty === 0 ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                        className="bg-gray-50 hover:bg-brand-900 hover:text-white text-brand-900 p-2 rounded-full transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-brand-900 shadow-sm active:scale-90 transition-transform"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-sm text-brand-900">{qty}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                            className="w-7 h-7 bg-brand-900 rounded-full flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </main>

            {/* Floating Action Button (Call Waiter) - Always visible if cart is empty */}
            {!isCartOpen && cartCount === 0 && (
                <div className="fixed bottom-6 right-6 z-40">
                    <button className="bg-white text-brand-900 p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center group border border-gray-100">
                        <Bell className="w-6 h-6 group-hover:animate-swing" />
                    </button>
                </div>
            )}

            {/* Bottom Cart Bar */}
            {cartCount > 0 && !isCartOpen && (
                <div className="fixed bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom-4">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-brand-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-[0.98] transition-all ring-2 ring-white/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-accent-500 text-brand-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">
                                {cartCount}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-brand-100 font-medium">Ver tu pedido</span>
                                <span className="font-bold text-lg">${(cartTotal || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Ir al carrito</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            )}

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                tableId={tableId}
                orderSent={orderSent}
                isSending={isSending}
                cartTotal={cartTotal}
                onSendOrder={handleSendOrder}
                onRemoveFromCart={removeFromCart}
                onAddToCart={addToCart}
                isAdminPreview={isAdminPreview}
            />

            <ProductDetailModal
                selectedItem={selectedItem}
                onClose={() => setSelectedItem(null)}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
                getItemQty={getItemQty}
            />
        </div>
    );
};
