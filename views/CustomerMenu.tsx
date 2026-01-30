
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppView, MenuItem, OrderItem } from '../types';
import { Store, Bell, ShoppingBag, AlertCircle, Plus, Minus, X, ChevronRight, Utensils, Receipt, Loader2, ArrowLeft, Eye, MessageSquare, CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { getProfile, getMenuItems, createOrder } from '../services/db';

interface CustomerMenuProps {
    onNavigate: (view: AppView) => void;
}

// Extends MenuItem but includes cart specific logic
interface CartItem extends OrderItem { }

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ onNavigate }) => {
    const { state } = useAppStore();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [orderSent, setOrderSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // BILL REQUEST STATE
    const [isRequestingBill, setIsRequestingBill] = useState(false);
    const [billRequested, setBillRequested] = useState(false);

    // GUEST MODE STATE
    const [guestBusiness, setGuestBusiness] = useState<{ name: string, cuisine: string, logo: string | null } | null>(null);
    const [guestMenu, setGuestMenu] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // URL Params
    const query = new URLSearchParams(window.location.search);
    const tableId = query.get('table');
    const uid = query.get('uid');

    // Determine if it's Admin Preview Mode
    // FIX: Si hay un UID en la URL (escaneo de QR), NO es vista previa, es modo cliente (aunque seas el admin).
    // Solo es vista previa si estás logueado y NO hay UID en la URL (navegación desde Dashboard).
    const isAdminPreview = !!state.user && !uid;

    // Determine which data to use (Global Store vs Fetched Guest Data)
    const business = uid ? (guestBusiness || { name: '', cuisine: '', logo: null }) : state.business;
    const menu = uid ? guestMenu : state.menu;

    const loadData = async () => {
        if (uid) {
            if (uid === state.user?.id) {
                setIsLoading(false);
                // Ya tenemos los datos en state, no necesitamos fetch
            } else {
                setIsLoading(true);
                setFetchError(null);
                try {
                    const [profileData, menuData] = await Promise.all([
                        getProfile(uid),
                        getMenuItems(uid)
                    ]);

                    if (profileData) {
                        setGuestBusiness({
                            name: profileData.name,
                            cuisine: profileData.cuisine,
                            logo: profileData.logo_url
                        });
                    } else {
                        // Si no llega perfil, es probable que sea error de RLS
                        console.warn("No se pudo cargar el perfil del restaurante (posible error RLS o ID inválido)");
                    }

                    if (menuData) {
                        const mappedItems = menuData.map((m: any) => ({
                            id: m.id,
                            name: m.name,
                            price: m.price,
                            category: m.category,
                            description: m.description,
                            ingredients: m.ingredients,
                            image: m.image_url,
                            available: m.available !== false,
                            printerId: m.printer_id,
                            stationId: m.station_id
                        }));
                        setGuestMenu(mappedItems);
                    }
                } catch (error: any) {
                    console.error("Error fetching guest data:", error);
                    setFetchError(error.message || "Error desconocido");
                } finally {
                    setIsLoading(false);
                }
            }
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [uid, state.user?.id]);

    const groupedItems = useMemo(() => {
        return menu.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [menu]);

    const categories = Object.keys(groupedItems);

    // Set initial active category
    useEffect(() => {
        if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
    }, [categories, activeCategory]);

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        // Check if available
        if (item.available === false) return;

        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
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

    const updateCartItemNote = (itemId: string, note: string) => {
        setCart(prev => prev.map(item =>
            item.id === itemId ? { ...item, notes: note } : item
        ));
    };

    const getItemQty = (itemId: string) => {
        return cart.find(i => i.id === itemId)?.quantity || 0;
    };

    // Safe calculations with defaults
    const cartTotal = cart.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
                setCart([]);
                setOrderSent(false);
                setIsCartOpen(false);
            }, 3000);

        } catch (e: any) {
            alert("Hubo un error al enviar la orden. Inténtalo de nuevo. " + (e.message || ''));
        } finally {
            setIsSending(false);
        }
    };

    const handleRequestBill = async () => {
        if (isAdminPreview) {
            alert("Vista Previa: Solicitud de cuenta simulada.");
            setBillRequested(true);
            setTimeout(() => setBillRequested(false), 3000);
            return;
        }

        const restaurantId = uid || state.user?.id;
        if (!restaurantId) return;

        setIsRequestingBill(true);

        try {
            const billItem: any = {
                id: 'bill-req',
                name: '🧾 SOLICITUD DE CUENTA',
                price: '0',
                quantity: 1,
                category: 'System',
                printerId: 'BILL_PRINTER'
            };

            await createOrder({
                user_id: restaurantId,
                table_number: tableId || 'S/N',
                status: 'pending',
                total: 0,
                items: [billItem]
            });

            setBillRequested(true);
            setTimeout(() => setBillRequested(false), 4000);
        } catch (e) {
            alert("Error al pedir la cuenta.");
        } finally {
            setIsRequestingBill(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-brand-900 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cargando menú...</p>
                </div>
            </div>
        );
    }

    // ERROR SCREEN WITH DIAGNOSTICS
    if (!business.name && menu.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Menú no disponible</h1>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                    No pudimos cargar la información de este restaurante.
                </p>

                <div className="flex gap-3">
                    <Button onClick={loadData} variant="outline" className="h-10 text-sm">
                        <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
                    </Button>
                    {isAdminPreview && (
                        <Button onClick={() => onNavigate(AppView.DASHBOARD)} className="h-10 text-sm">
                            Volver al Panel
                        </Button>
                    )}
                </div>

                {/* DIAGNOSTIC INFORMATION */}
                <div className="mt-12 w-full max-w-sm bg-white p-4 rounded-xl border border-gray-200 text-left shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
                        Diagnóstico Técnico
                    </h3>
                    <div className="space-y-2 text-xs font-mono text-gray-600">
                        <p><span className="font-bold text-gray-400">UID:</span> <span className="break-all">{uid || 'No definido'}</span></p>
                        <p><span className="font-bold text-gray-400">Table:</span> {tableId || 'N/A'}</p>
                        <p><span className="font-bold text-gray-400">Menu Items:</span> {menu.length}</p>
                        <p><span className="font-bold text-gray-400">Business:</span> {business.name ? 'Loaded' : 'Null'}</p>
                        <p><span className="font-bold text-gray-400">Error:</span> <span className="text-red-500">{fetchError || 'None'}</span></p>
                    </div>

                    {uid && !business.name && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-red-600 font-bold mb-1">⚠️ Posible problema de Permisos (RLS)</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Si eres el dueño: Es probable que la base de datos esté bloqueando el acceso público.
                                Ve a tu panel de administrador, abre <strong>Configuración {'>'} Diagnóstico</strong> y ejecuta el comando SQL mostrado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            {/* ADMIN PREVIEW HEADER */}
            {isAdminPreview && (
                <div className="bg-accent-500 text-brand-900 px-6 py-2.5 flex items-center justify-between sticky top-0 z-[100] shadow-md">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Modo Vista Previa</span>
                    </div>
                    <button
                        onClick={() => onNavigate(AppView.DASHBOARD)}
                        className="bg-brand-900 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver al Panel
                    </button>
                </div>
            )}

            {/* Hero / Header */}
            <header className="bg-white shadow-sm relative z-30">
                <div className="relative h-32 bg-brand-900 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl" />
                </div>
                <div className="px-6 pb-4 -mt-10 relative">
                    <div className="flex justify-between items-end">
                        <div className="bg-white p-1 rounded-2xl shadow-lg">
                            {business.logo ? (
                                <img src={business.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-brand-50 flex items-center justify-center text-brand-900">
                                    <Store className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="mb-1 flex flex-col items-end gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-bold border border-accent-100 shadow-sm">
                                Mesa {tableId || '1'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <h1 className="font-serif text-2xl font-bold text-brand-900 leading-tight">{business.name || 'Restaurante'}</h1>
                        <p className="text-gray-500 text-sm">{business.cuisine || 'Menú Digital'}</p>
                    </div>
                </div>

                {/* Category Navigation (Sticky) */}
                <div className={`sticky ${isAdminPreview ? 'top-[44px]' : 'top-0'} bg-white border-t border-gray-100 overflow-x-auto no-scrollbar py-2 px-4 flex gap-2 z-40 shadow-sm transition-all`}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => scrollToCategory(cat)}
                            className={`
                        whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all
                        ${activeCategory === cat
                                    ? 'bg-brand-900 text-white shadow-md transform scale-105'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                    `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

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
                                const isAvailable = item.available !== false;

                                return (
                                    <div key={item.id} className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 transition-all ${!isAvailable ? 'opacity-70 grayscale' : 'active:scale-[0.99]'}`}>
                                        <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Utensils className="w-8 h-8" />
                                                </div>
                                            )}
                                            {qty > 0 && isAvailable && (
                                                <div className="absolute inset-0 bg-brand-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-white font-bold text-xl">{qty}</span>
                                                </div>
                                            )}
                                            {!isAvailable && (
                                                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-[10px] text-white font-bold uppercase border border-white px-1 py-0.5 rounded">Agotado</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className={`font-bold line-clamp-2 leading-tight text-sm sm:text-base ${!isAvailable ? 'text-gray-500 line-through' : 'text-brand-900'}`}>{item.name}</h3>
                                                    <span className="font-bold text-accent-600 shrink-0">${item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                            </div>

                                            <div className="flex justify-end mt-2">
                                                {!isAvailable ? (
                                                    <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded-full">No disponible</span>
                                                ) : qty === 0 ? (
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="bg-gray-50 hover:bg-brand-900 hover:text-white text-brand-900 p-2 rounded-full transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-brand-900 shadow-sm active:scale-90 transition-transform"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-sm text-brand-900">{qty}</span>
                                                        <button
                                                            onClick={() => addToCart(item)}
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

            {/* Floating Actions */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">

                <button
                    onClick={handleRequestBill}
                    disabled={isRequestingBill || billRequested}
                    className={`
                shadow-xl transition-all flex items-center gap-2 pr-4 pl-3 py-3 rounded-full font-bold text-sm group
                ${billRequested
                            ? 'bg-green-500 text-white cursor-default'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}
            `}
                >
                    {isRequestingBill ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : billRequested ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-brand-900" />
                    )}
                    <span>{billRequested ? 'Cuenta Pedida' : 'Pedir Cuenta'}</span>
                </button>

                {!isCartOpen && cartCount === 0 && (
                    <button className="bg-white text-brand-900 p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center group border border-gray-100">
                        <Bell className="w-6 h-6 group-hover:animate-swing" />
                    </button>
                )}
            </div>

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

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                        onClick={() => setIsCartOpen(false)}
                    />

                    <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 flex flex-col max-h-[90vh]">

                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-3xl relative z-10">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-brand-900">Tu Orden</h2>
                                <p className="text-gray-500 text-sm">Mesa {tableId || '1'}</p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {orderSent ? (
                                <div className="py-12 text-center">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_infinite]">
                                        <Receipt className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-brand-900 mb-2">¡Orden Enviada!</h3>
                                    <p className="text-gray-500">La cocina ha recibido tu pedido.</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Utensils className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-brand-900 text-sm">{item.name}</h4>
                                                <span className="font-bold text-gray-900 text-sm">${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-sm text-brand-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateCartItemNote(item.id, e.target.value)}
                                                    placeholder="Instrucciones especiales (ej. Sin cebolla)"
                                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-brand-900 focus:ring-1 focus:ring-brand-900 transition-all outline-none placeholder-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!orderSent && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold text-gray-900">${(cartTotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-6 text-xl">
                                    <span className="font-serif font-bold text-brand-900">Total</span>
                                    <span className="font-serif font-bold text-brand-900">${(cartTotal || 0).toFixed(2)}</span>
                                </div>

                                <Button
                                    fullWidth
                                    onClick={handleSendOrder}
                                    disabled={cart.length === 0 || isSending}
                                    isLoading={isSending}
                                    className="h-14 text-lg"
                                    icon={<ShoppingBag className="w-5 h-5" />}
                                >
                                    {isAdminPreview ? 'Confirmar Preview' : isSending ? 'Enviando...' : 'Enviar a Cocina'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
