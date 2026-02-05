
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppView, MenuItem, OrderItem, SelectedOption, OptionGroup } from '../types';
import { Store, Bell, ShoppingBag, AlertCircle, Plus, Minus, X, ChevronRight, Utensils, Receipt, Loader2, ArrowLeft, Eye, MessageSquare, CreditCard, CheckCircle, RefreshCw, Hand, Check, Sparkles } from 'lucide-react';
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
    const [lastTakeoutNumber, setLastTakeoutNumber] = useState<number>(0);

    // BILL REQUEST STATE
    const [isRequestingBill, setIsRequestingBill] = useState(false);
    const [billRequested, setBillRequested] = useState(false);

    // HELP REQUEST STATE
    const [isRequestingHelp, setIsRequestingHelp] = useState(false);
    const [helpRequested, setHelpRequested] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpMessage, setHelpMessage] = useState('');

    // GUEST MODE STATE
    const [guestBusiness, setGuestBusiness] = useState<{ name: string, cuisine: string, logo: string | null } | null>(null);
    const [guestMenu, setGuestMenu] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // OPTIONS SELECTION MODAL STATE
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedItemForOptions, setSelectedItemForOptions] = useState<MenuItem | null>(null);
    const [currentSelections, setCurrentSelections] = useState<Record<string, string[]>>({}); // groupId -> optionIds[]
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [hasShownPromotion, setHasShownPromotion] = useState(false);

    // URL Params
    const query = new URLSearchParams(window.location.search);
    const tableId = query.get('table');
    // Allow both 'uid' (standard) and 'user' (fallback/legacy)
    const uid = query.get('uid') || query.get('user');

    // Determine if it's Admin Preview Mode
    // FIX: Si hay un UID en la URL (escaneo de QR), NO es vista previa, es modo cliente (aunque seas el admin).
    // Solo es vista previa si estás logueado y NO hay UID en la URL (navegación desde Dashboard).
    const isAdminPreview = !!state.user && !uid;

    // Determine which data to use (Global Store vs Fetched Guest Data)
    // FIX: If uid matches logged-in user, use state.menu directly (guestMenu will be empty)
    const isOwnMenu = uid && uid === state.user?.id;
    const business = uid
        ? (isOwnMenu ? state.business : (guestBusiness || { name: '', cuisine: '', logo: null }))
        : state.business;
    const menu = uid
        ? (isOwnMenu ? state.menu : guestMenu)
        : state.menu;

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
                            stationId: m.station_id,
                            options: m.options || null,
                            isPromoted: !!m.is_promoted
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
    }, [uid]);

    // Show promotion once data is loaded
    useEffect(() => {
        if (!isLoading && menu.length > 0 && !hasShownPromotion) {
            const promotedItem = menu.find(item => item.isPromoted && item.available);
            if (promotedItem) {
                setShowPromotionModal(true);
                setHasShownPromotion(true);
            }
        }
    }, [isLoading, menu, hasShownPromotion]);

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
    const handleAddToCart = (item: MenuItem) => {
        // Check if available
        if (item.available === false) return;

        // If item has options, open the options modal
        if (item.options && item.options.hasOptions && item.options.groups.length > 0) {
            setSelectedItemForOptions(item);
            setCurrentSelections({});
            setShowOptionsModal(true);
            return;
        }

        // No options - add directly
        addToCartDirect(item);
    };

    const addToCartDirect = (item: MenuItem, selectedOptions?: SelectedOption[]) => {
        // Generate a unique cart key for items with options
        const cartKey = selectedOptions && selectedOptions.length > 0
            ? `${item.id}-${selectedOptions.map(o => o.optionId).sort().join('-')}`
            : item.id;

        setCart(prev => {
            const existing = prev.find(i => i.id === cartKey);
            if (existing) {
                return prev.map(i => i.id === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                ...item,
                id: cartKey, // Use unique key for cart
                quantity: 1,
                selectedOptions: selectedOptions || []
            }];
        });
    };

    const handleConfirmOptionsSelection = () => {
        if (!selectedItemForOptions || !selectedItemForOptions.options) return;

        // Validate required groups
        const groups = selectedItemForOptions.options.groups;
        for (const group of groups) {
            const selected = currentSelections[group.id] || [];
            if (group.required && selected.length < group.minSelect) {
                alert(`Por favor selecciona al menos ${group.minSelect} opción(es) en "${group.name}"`);
                return;
            }
        }

        // Build selected options array
        const selectedOptions: SelectedOption[] = [];
        for (const group of groups) {
            const selectedIds = currentSelections[group.id] || [];
            for (const optId of selectedIds) {
                const option = group.options.find(o => o.id === optId);
                if (option) {
                    selectedOptions.push({
                        groupId: group.id,
                        groupName: group.name,
                        optionId: option.id,
                        optionName: option.name,
                        priceModifier: option.priceModifier
                    });
                }
            }
        }

        addToCartDirect(selectedItemForOptions, selectedOptions);
        setShowOptionsModal(false);
        setSelectedItemForOptions(null);
        setCurrentSelections({});
    };

    const toggleOptionSelection = (groupId: string, optionId: string, maxSelect: number) => {
        setCurrentSelections(prev => {
            const current = prev[groupId] || [];
            const isSelected = current.includes(optionId);

            if (isSelected) {
                // Deselect
                return { ...prev, [groupId]: current.filter(id => id !== optionId) };
            } else {
                // Select (respect maxSelect)
                if (maxSelect === 1) {
                    // Single select - replace
                    return { ...prev, [groupId]: [optionId] };
                } else {
                    // Multi select - add if under limit
                    if (current.length < maxSelect) {
                        return { ...prev, [groupId]: [...current, optionId] };
                    }
                    return prev; // At limit, don't add
                }
            }
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
        // Sum all cart items that match the base item ID (for items with options)
        return cart.filter(i => i.id === itemId || i.id.startsWith(`${itemId}-`)).reduce((sum, i) => sum + i.quantity, 0);
    };

    // Safe calculations with defaults (including option price modifiers)
    const cartTotal = cart.reduce((acc, item) => {
        const basePrice = parseFloat(item.price) || 0;
        const optionsPrice = (item.selectedOptions || []).reduce((sum, opt) => sum + (opt.priceModifier || 0), 0);
        return acc + ((basePrice + optionsPrice) * item.quantity);
    }, 0);
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
            let finalTableNumber = tableId || 'S/N';
            let takeoutNumber = 0;

            // TAKEOUT LOGIC: Sequential 1-99
            if (tableId === 'LLEVAR') {
                // Determine restaurant ID
                const targetId = uid || state.user?.id;

                // Dynamically import to avoid circular dependencies
                const dbService = await import('../services/db') as any;
                const lastNum = await dbService.getLastTakeoutOrderNumber(targetId);

                // Logic: Next number = (Last % 99) + 1
                takeoutNumber = (lastNum % 99) + 1;
                finalTableNumber = `LLEVAR-${takeoutNumber}`;
            }

            await createOrder({
                user_id: restaurantId,
                table_number: finalTableNumber,
                status: 'pending',
                total: cartTotal,
                items: cart
            });

            setOrderSent(true);

            // Store takeout number to display in UI
            if (takeoutNumber > 0) {
                setLastTakeoutNumber(takeoutNumber);
            }

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

    const handleRequestHelp = async () => {
        if (isAdminPreview) {
            alert("Vista Previa: Solicitud de ayuda simulada.");
            setHelpRequested(true);
            setShowHelpModal(false);
            setHelpMessage('');
            setTimeout(() => setHelpRequested(false), 3000);
            return;
        }

        const restaurantId = uid || state.user?.id;
        if (!restaurantId) return;

        setIsRequestingHelp(true);

        try {
            const helpItem: any = {
                id: 'help-req',
                name: '👋 SOLICITUD DE AYUDA',
                price: '0',
                quantity: 1,
                category: 'System',
                notes: helpMessage || 'El cliente necesita asistencia',
                printerId: 'BILL_PRINTER'
            };

            await createOrder({
                user_id: restaurantId,
                table_number: tableId || 'S/N',
                status: 'pending',
                total: 0,
                items: [helpItem]
            });

            setHelpRequested(true);
            setShowHelpModal(false);
            setHelpMessage('');
            setTimeout(() => setHelpRequested(false), 4000);
        } catch (e) {
            alert("Error al solicitar ayuda.");
        } finally {
            setIsRequestingHelp(false);
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
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${tableId === 'LLEVAR' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-accent-50 text-accent-700 border-accent-100'}`}>
                                {tableId === 'LLEVAR' ? (
                                    <>
                                        <ShoppingBag className="w-3 h-3 mr-1.5" />
                                        Para Llevar
                                    </>
                                ) : (
                                    `Mesa ${tableId || '1'}`
                                )}
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
                                                        onClick={() => handleAddToCart(item)}
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
                                                            onClick={() => handleAddToCart(item)}
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

            {/* Floating Actions - Hide for takeout orders */}
            {/* Move up when cart bar is visible */}
            <div className={`fixed right-6 z-40 flex flex-col gap-3 items-end transition-all ${cartCount > 0 ? 'bottom-24' : 'bottom-6'}`}>

                {tableId !== 'LLEVAR' && (
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
                )}

                {tableId !== 'LLEVAR' && (
                    <button
                        onClick={() => setShowHelpModal(true)}
                        disabled={isRequestingHelp || helpRequested}
                        className={`
                shadow-xl transition-all flex items-center gap-2 pr-4 pl-3 py-3 rounded-full font-bold text-sm group
                ${helpRequested
                                ? 'bg-yellow-500 text-white cursor-default'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}
            `}
                    >
                        {isRequestingHelp ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : helpRequested ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <Hand className="w-5 h-5 text-gray-500 group-hover:text-yellow-600" />
                        )}
                        <span>{helpRequested ? 'Ayuda Solicitada' : 'Pedir Ayuda'}</span>
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
                                    {lastTakeoutNumber > 0 ? (
                                        <>
                                            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-4xl font-serif font-bold text-orange-600">#{lastTakeoutNumber}</span>
                                            </div>
                                            <h3 className="text-2xl font-serif font-bold text-brand-900 mb-2">¡Orden Recibida!</h3>
                                            <p className="text-gray-500 mb-4">Tu número de entrega es:</p>
                                            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 font-bold text-xl px-6 py-3 rounded-full border-2 border-orange-200">
                                                <ShoppingBag className="w-5 h-5" />
                                                Orden #{lastTakeoutNumber}
                                            </div>
                                            <p className="text-sm text-gray-400 mt-4">Espera a que te llamen</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_infinite]">
                                                <Receipt className="w-10 h-10 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-serif font-bold text-brand-900 mb-2">¡Orden Enviada!</h3>
                                            <p className="text-gray-500">La cocina ha recibido tu pedido.</p>
                                        </>
                                    )}
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
                                                <span className="font-bold text-gray-900 text-sm">
                                                    ${(((parseFloat(item.price) || 0) + (item.selectedOptions || []).reduce((sum, opt) => sum + (opt.priceModifier || 0), 0)) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Show selected options grouped by category */}
                                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                <div className="text-[10px] leading-relaxed text-gray-500 mb-2 space-y-0.5">
                                                    {Object.entries(
                                                        item.selectedOptions.reduce((acc, opt) => {
                                                            if (!acc[opt.groupName]) acc[opt.groupName] = [];
                                                            acc[opt.groupName].push(opt);
                                                            return acc;
                                                        }, {} as Record<string, typeof item.selectedOptions>)
                                                    ).map(([groupName, opts]) => (
                                                        <div key={groupName} className="flex gap-1.5">
                                                            <span className="font-semibold text-gray-600 shrink-0">{groupName}:</span>
                                                            <span className="break-words">
                                                                {opts.map(o => o.optionName + (o.priceModifier > 0 ? ` (+$${o.priceModifier})` : '')).join(', ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

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
                                                        onClick={() => {
                                                            // For items with options, just increase quantity directly
                                                            if (item.selectedOptions && item.selectedOptions.length > 0) {
                                                                setCart(prev => prev.map(i =>
                                                                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                                                                ));
                                                            } else {
                                                                handleAddToCart(item);
                                                            }
                                                        }}
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

            {/* Help Request Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm"
                        onClick={() => {
                            setShowHelpModal(false);
                            setHelpMessage('');
                        }}
                    />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Hand className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="font-serif text-xl font-bold text-brand-900">¿Qué necesitas?</h3>
                            </div>
                            <p className="text-sm text-gray-500 ml-13">El mesero recibirá tu mensaje de inmediato</p>
                        </div>

                        <div className="p-5">
                            <textarea
                                value={helpMessage}
                                onChange={(e) => setHelpMessage(e.target.value)}
                                placeholder="Ej: Necesito más servilletas, agua, o tengo una pregunta..."
                                className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="p-5 bg-gray-50 flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowHelpModal(false);
                                    setHelpMessage('');
                                }}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRequestHelp}
                                disabled={!helpMessage.trim() || isRequestingHelp}
                                isLoading={isRequestingHelp}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 border-transparent"
                                icon={<Hand className="w-4 h-4" />}
                            >
                                Enviar Solicitud
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* OPTIONS SELECTION MODAL */}
            {showOptionsModal && selectedItemForOptions && selectedItemForOptions.options && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedItemForOptions.image && (
                                    <img
                                        src={selectedItemForOptions.image}
                                        alt={selectedItemForOptions.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                )}
                                <div>
                                    <h3 className="font-bold text-brand-900">{selectedItemForOptions.name}</h3>
                                    <p className="text-sm text-gray-500">Personaliza tu pedido</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowOptionsModal(false);
                                    setSelectedItemForOptions(null);
                                    setCurrentSelections({});
                                }}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Progress Bar for Required Steps */}
                        {selectedItemForOptions.options.groups.some(g => g.required) && (
                            <div className="w-full h-1.5 bg-gray-100 flex">
                                {selectedItemForOptions.options.groups.map((group) => {
                                    if (!group.required) return null;
                                    const isComplete = (currentSelections[group.id] || []).length >= group.minSelect;
                                    return (
                                        <div
                                            key={group.id}
                                            className={`flex-1 h-full transition-all duration-300 border-r border-white last:border-0 ${isComplete ? 'bg-green-500' : 'bg-brand-200'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Options Groups */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {selectedItemForOptions.options.groups.map((group, groupIndex) => {
                                const selectedCount = (currentSelections[group.id] || []).length;
                                const isComplete = group.required
                                    ? selectedCount >= group.minSelect
                                    : true;

                                return (
                                    <div key={group.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-[10px] font-bold text-brand-900">
                                                        {groupIndex + 1}
                                                    </span>
                                                    <h4 className="font-bold text-gray-900">{group.name}</h4>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {group.required ? 'Obligatorio' : 'Opcional'}
                                                    {group.minSelect > 1 && ` • Mín ${group.minSelect}`}
                                                    {group.maxSelect > 1 && ` • Máx ${group.maxSelect}`}
                                                </p>
                                            </div>
                                            {group.required && (
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isComplete
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {isComplete ? (
                                                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Completo</span>
                                                    ) : (
                                                        `Selecciona ${group.minSelect - selectedCount} más`
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {group.options.map((option) => {
                                                const isSelected = (currentSelections[group.id] || []).includes(option.id);

                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => toggleOptionSelection(group.id, option.id, group.maxSelect)}
                                                        className={`
                                                            w-full flex items-center justify-between p-4 rounded-xl border transition-all
                                                            ${isSelected
                                                                ? 'bg-brand-50 border-brand-900 ring-1 ring-brand-900 shadow-sm'
                                                                : 'bg-white border-gray-200 hover:border-gray-300'}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`
                                                                w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                                                ${isSelected ? 'bg-brand-900 border-brand-900' : 'bg-white border-gray-300'}
                                                            `}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className={`font-medium text-sm ${isSelected ? 'text-brand-900' : 'text-gray-700'}`}>
                                                                {option.name}
                                                            </span>
                                                        </div>
                                                        {option.priceModifier > 0 && (
                                                            <span className={`text-sm font-bold ${isSelected ? 'text-brand-900' : 'text-gray-900'}`}>
                                                                +${option.priceModifier.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer with calculated price */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50">
                            {(() => {
                                const basePrice = parseFloat(selectedItemForOptions.price) || 0;
                                let optionsPrice = 0;
                                selectedItemForOptions.options!.groups.forEach(group => {
                                    const selectedIds = currentSelections[group.id] || [];
                                    selectedIds.forEach(id => {
                                        const opt = group.options.find(o => o.id === id);
                                        if (opt) optionsPrice += opt.priceModifier;
                                    });
                                });
                                const totalPrice = basePrice + optionsPrice;

                                // Check if all required groups are satisfied
                                const missingRequired = selectedItemForOptions.options!.groups.filter(group => {
                                    const selectedIds = currentSelections[group.id] || [];
                                    return group.required && selectedIds.length < group.minSelect;
                                });
                                const canAdd = missingRequired.length === 0;

                                return (
                                    <div className="space-y-3">
                                        {!canAdd && (
                                            <p className="text-center text-xs text-amber-600 font-medium">
                                                Faltan selecciones obligatorias ({missingRequired.length})
                                            </p>
                                        )}
                                        <Button
                                            onClick={handleConfirmOptionsSelection}
                                            fullWidth
                                            disabled={!canAdd}
                                            className={`h-14 text-lg font-bold ${!canAdd ? 'opacity-50 grayscale' : ''}`}
                                            icon={<Plus className="w-5 h-5" />}
                                        >
                                            {canAdd ? `Agregar por $${totalPrice.toFixed(2)}` : 'Completa tu pedido'}
                                        </Button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
            {/* FOOTER ACTIONS - Only show when cart has items */}
            {!isAdminPreview && !isLoading && cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
                    <Button
                        fullWidth
                        onClick={() => setIsCartOpen(true)}
                        className="h-14 bg-brand-900 text-white font-bold rounded-2xl shadow-xl shadow-brand-900/20 relative"
                    >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Ver Mi Orden
                        {cart.length > 0 && (
                            <span className="absolute top-3 right-4 bg-accent-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </Button>
                </div>
            )}

            {/* PROMOTIONAL BANNER - Quick dismissible ad */}
            {showPromotionModal && (() => {
                const promotedItem = menu.find(i => i.isPromoted && i.available);
                if (!promotedItem) {
                    // No promoted item found, close modal immediately
                    setTimeout(() => setShowPromotionModal(false), 0);
                    return null;
                }

                // Auto-dismiss after 5 seconds
                setTimeout(() => setShowPromotionModal(false), 5000);

                return (
                    <div
                        className="fixed bottom-20 left-4 right-4 z-[200] animate-in slide-in-from-bottom-4 duration-300"
                        onClick={() => setShowPromotionModal(false)}
                    >
                        <div className="bg-white w-full rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex items-stretch">
                            {/* Image */}
                            {promotedItem.image && (
                                <div className="w-24 h-24 shrink-0">
                                    <img
                                        src={promotedItem.image}
                                        alt={promotedItem.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Recomendado</span>
                                </div>
                                <h4 className="font-bold text-brand-900 text-sm truncate">{promotedItem.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{promotedItem.description || '¡Pruébalo hoy!'}</p>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(promotedItem);
                                    setShowPromotionModal(false);
                                }}
                                className="bg-brand-900 text-white px-4 flex items-center justify-center shrink-0 hover:bg-brand-950 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>

                            {/* Close button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPromotionModal(false);
                                }}
                                className="absolute top-1 right-1 p-1 bg-gray-100/80 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        </div>

                        {/* Auto-dismiss progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
                            <div className="h-full bg-brand-900 animate-[shrink_5s_linear_forwards]" style={{ width: '100%' }} />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
