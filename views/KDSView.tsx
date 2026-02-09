
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppView, Order, OrderItem, KitchenStation, PreparedItem } from '../types';
import { ChefHat, Clock, Check, Volume2, VolumeX, RefreshCw, X, Loader2, AlertCircle, Sun } from 'lucide-react';
import { playNotificationSound } from '../services/notification';
import { getStations, getOrders, updateOrderPreparedItemsSecure } from '../services/db';
import { supabase } from '../services/client';
import { useWakeLock } from '../hooks/useWakeLock';

interface KDSViewProps {
    onNavigate: (view: AppView) => void;
}


export const KDSView: React.FC<KDSViewProps> = ({ onNavigate }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastOrderCount, setLastOrderCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(!!localStorage.getItem('kds_pin'));
    const [enteringPin, setEnteringPin] = useState('');
    const [savedPin, setSavedPin] = useState<string | null>(localStorage.getItem('kds_pin'));

    // Keep screen awake for kitchen tablets
    const { isActive: wakeLockActive, isSupported: wakeLockSupported } = useWakeLock(true);

    const [stations, setStations] = useState<KitchenStation[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const ordersRef = useRef<Order[]>([]);

    // Sync ref with state
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

    // Get station ID and user ID from URL
    const stationId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('station');
    }, []);

    const userId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('uid');
    }, []);

    // Find this station's info
    const station = useMemo(() => {
        return stations.find(s => s.id === stationId);
    }, [stations, stationId]);

    // Debug logging
    useEffect(() => {
        console.log('[KDS Debug] State:', { stationId, userId, isLoading, isAuthorized, savedPin, stations: stations.length, orders: orders.length, error });
    }, [stationId, userId, isLoading, isAuthorized, savedPin, stations, orders, error]);

    // Load initial data
    const loadData = useCallback(async (isSilent = false) => {
        if (!userId) {
            if (!isSilent) {
                setError('Falta el ID del restaurante en la URL');
                setIsLoading(false);
            }
            return;
        }

        try {
            if (!isSilent) setIsLoading(true);
            const [stationsData, ordersData] = await Promise.all([
                getStations(userId),
                getOrders(userId)
            ]);

            // Map stations
            const mappedStations: KitchenStation[] = stationsData.map((s: any) => ({
                id: s.id,
                name: s.name,
                color: s.color
            }));
            setStations(mappedStations);

            // Map orders - Respect pending optimistic updates
            const mappedOrders: Order[] = ordersData.map((o: any) => {
                if (pendingUpdates.has(o.id)) {
                    // Find our local version to preserve its prepared_items
                    const localOrder = ordersRef.current.find(lo => lo.id === o.id);
                    if (localOrder) {
                        return {
                            ...o,
                            items: o.items || [],
                            prepared_items: localOrder.prepared_items // Keep local version
                        };
                    }
                }
                return {
                    id: o.id,
                    user_id: o.user_id,
                    table_number: o.table_number,
                    status: o.status,
                    total: o.total,
                    items: o.items || [],
                    created_at: o.created_at,
                    prepared_items: o.prepared_items || []
                };
            });
            setOrders(mappedOrders);

            setError(null);
        } catch (err: any) {
            console.error('Error loading KDS data:', err);
            setError(err.message || 'Error al cargar datos');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePinSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (enteringPin.length === 4) {
            localStorage.setItem('kds_pin', enteringPin);
            setSavedPin(enteringPin);
            setIsAuthorized(true);
            setEnteringPin('');
        }
    };

    const handleLogoutPin = () => {
        localStorage.removeItem('kds_pin');
        setSavedPin(null);
        setIsAuthorized(false);
    };

    // Subscribe to realtime updates
    useEffect(() => {
        if (!userId) return;

        console.log('[KDS Realtime] Setting up subscription for user:', userId);

        const channel = supabase
            .channel('kds-orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('[KDS Realtime] Order change detected:', payload.eventType, payload);

                    // If we have full payload data, we could update state locally
                    // but for now, we just reload silently to avoid the loading screen flicker
                    loadData(true);
                }
            )
            .subscribe((status) => {
                console.log('[KDS Realtime] Subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('[KDS Realtime] ✅ Successfully connected to Realtime');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[KDS Realtime] ❌ Connection error');
                } else if (status === 'TIMED_OUT') {
                    console.error('[KDS Realtime] ⏱️ Connection timed out');
                }
            });

        return () => {
            console.log('[KDS Realtime] Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    }, [userId, loadData]);

    // Filter orders that have items for this station
    const relevantOrders = useMemo(() => {
        if (!stationId) return [];

        return orders
            .filter(order => order.status === 'pending')
            .map(order => {
                // Get only items that belong to this station
                const stationItems = order.items.filter(item => item.stationId === stationId);
                if (stationItems.length === 0) return null;

                return {
                    ...order,
                    stationItems
                };
            })
            .filter(Boolean) as (Order & { stationItems: OrderItem[] })[];
    }, [orders, stationId]);

    // Play sound on new orders
    useEffect(() => {
        if (relevantOrders.length > lastOrderCount && soundEnabled && !isLoading) {
            playNotificationSound();
        }
        setLastOrderCount(relevantOrders.length);
    }, [relevantOrders.length, soundEnabled, isLoading]);

    // Calculate time elapsed for each order
    const getTimeElapsed = (createdAt: string) => {
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const minutes = Math.floor((now - created) / 60000);
        return minutes;
    };

    // Get color based on time elapsed
    const getTimeColor = (minutes: number) => {
        if (minutes < 5) return 'text-green-600 bg-green-50';
        if (minutes < 10) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50 animate-pulse';
    };

    // Check if an item is prepared
    const isItemPrepared = (order: Order, itemId: string) => {
        if (!order.prepared_items) return false;
        return order.prepared_items.some(pi => pi.itemId === itemId && pi.stationId === stationId);
    };

    // State for visual feedback when cancelling order
    const [cancellingOrderIds, setCancellingOrderIds] = useState<Set<string>>(new Set());

    // Auto-refresh timer display - faster tick for smooth disappearance (every 5s)
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 5000);
        return () => clearInterval(interval);
    }, []);

    // Helper: Calculate time since completion
    const getMinutesSinceCompletion = (completedAt: number) => {
        return (Date.now() - completedAt) / 60000;
    };

    // Handle Item Click:
    // 1. If not prepared -> Mark prepared (Green)
    // 2. If prepared -> Trigger ORDER VOID sequence (Red visual -> Void in DB)
    const handleItemClick = async (orderId: string, itemId: string) => {
        if (!stationId) return;

        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Check if this item is already prepared
        const currentPreparedItems: PreparedItem[] = order.prepared_items || [];
        const existingItem = currentPreparedItems.find(
            pi => pi.itemId === itemId && pi.stationId === stationId
        );

        if (existingItem) {
            // ITEM IS ALREADY PREPARED -> USER TAPPED AGAIN -> VOID ORDER
            // As per instructions: "si se le vuelve a dar 'tap' se debe anular esa orden"

            // 1. Trigger visual feedback
            setCancellingOrderIds(prev => new Set(prev).add(orderId));

            // 2. Wait 3 seconds then void
            setTimeout(async () => {
                try {
                    // Optimistic remove from local view to prevent double taps
                    setOrders(prev => prev.filter(o => o.id !== orderId));

                    // Update DB status to cancelled
                    const { error } = await supabase
                        .from('orders')
                        .update({ status: 'cancelled' })
                        .eq('id', orderId);

                    if (error) throw error;

                    // Cleanup visual state
                    setCancellingOrderIds(prev => {
                        const next = new Set(prev);
                        next.delete(orderId);
                        return next;
                    });

                } catch (err) {
                    console.error('Error cancelling order:', err);
                    // Revert optimistic update by reloading data
                    loadData();
                }
            }, 3000);
        } else {
            // ITEM NOT PREPARED -> MARK AS PREPARED
            const newPreparedItems = [
                ...currentPreparedItems,
                { itemId, stationId, completedAt: Date.now() }
            ];

            // Mark as pending update
            setPendingUpdates(prev => new Set(prev).add(orderId));

            // Optimistic update
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, prepared_items: newPreparedItems } : o
            ));

            // Save to database
            try {
                await updateOrderPreparedItemsSecure(orderId, newPreparedItems, savedPin || '');
                // Success! The next loadData will eventually pick it up
            } catch (err: any) {
                console.error('Failed to update KDS', err);
                alert(`Error al actualizar: ${err.message || 'Verifica el PIN'}`);
                // Revert
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, prepared_items: currentPreparedItems } : o
                ));
            } finally {
                // Remove from pending after a small delay to allow DB & Realtime to settle
                setTimeout(() => {
                    setPendingUpdates(prev => {
                        const next = new Set(prev);
                        next.delete(orderId);
                        return next;
                    });
                }, 2000);
            }
        }
    };

    // Helper: Mark ALL items for this station as prepared
    const handleMarkStationReady = async (orderId: string) => {
        if (!stationId) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const stationItems = order.items.filter(item => item.stationId === stationId);
        const currentPrepared = order.prepared_items || [];

        // Add all station items that aren't already prepared
        const newItems: PreparedItem[] = [...currentPrepared];
        let hasChanges = false;

        stationItems.forEach(item => {
            if (!newItems.find(pi => pi.itemId === item.id && pi.stationId === stationId)) {
                newItems.push({ itemId: item.id, stationId, completedAt: Date.now() });
                hasChanges = true;
            }
        });

        if (!hasChanges) return;

        // Mark as pending update
        setPendingUpdates(prev => new Set(prev).add(orderId));

        // Optimistic update
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, prepared_items: newItems } : o
        ));

        // Save to database
        try {
            await updateOrderPreparedItemsSecure(orderId, newItems, savedPin || '');
        } catch (err: any) {
            console.error('Failed to update KDS', err);
            alert(`Error al actualizar: ${err.message || 'Verifica el PIN'}`);
            // Revert
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, prepared_items: currentPrepared } : o
            ));
        } finally {
            // Remove from pending after delay
            setTimeout(() => {
                setPendingUpdates(prev => {
                    const next = new Set(prev);
                    next.delete(orderId);
                    return next;
                });
            }, 2000);
        }
    };

    // Error state - no station ID
    if (!stationId) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Sin Estación</h1>
                    <p className="text-gray-400">No se especificó una estación en la URL.</p>
                    <p className="text-gray-500 text-sm mt-4">
                        Formato correcto: ?view=KDS&station=ID_ESTACION&uid=ID_RESTAURANTE
                    </p>
                </div>
            </div>
        );
    }

    // Error state - no user ID
    if (!userId) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">URL Incompleta</h1>
                    <p className="text-gray-400">Falta el ID del restaurante en la URL.</p>
                    <p className="text-gray-500 text-sm mt-4">
                        Regenera el código QR desde el panel de administración.
                    </p>
                </div>
            </div>
        );
    }

    // PIN AUTHORIZATION SCREEN
    // Simplified version with NO animations to ensure visibility
    if (!savedPin || !isAuthorized) {
        return (
            <div style={{
                backgroundColor: '#111827',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: '#1f2937',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '1px solid #374151',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#3b82f620',
                            borderRadius: '16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{ fontSize: '32px' }}>🔐</span>
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                            Acceso a Cocina
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                            Ingresa el PIN de 4 números
                        </p>
                    </div>

                    {/* PIN Display */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: '48px',
                                    height: '64px',
                                    borderRadius: '12px',
                                    border: `2px solid ${enteringPin.length > i ? '#3b82f6' : '#374151'}`,
                                    backgroundColor: enteringPin.length > i ? '#3b82f610' : '#111827',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: enteringPin.length > i ? 'white' : '#4b5563'
                                }}
                            >
                                {enteringPin[i] ? '•' : ''}
                            </div>
                        ))}
                    </div>

                    {/* Hidden input for mobile keyboards */}
                    <input
                        type="tel"
                        maxLength={4}
                        autoFocus
                        value={enteringPin}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 4) {
                                setEnteringPin(val);
                                if (val.length === 4) {
                                    // Auto submit when 4 digits entered
                                    localStorage.setItem('kds_pin', val);
                                    setSavedPin(val);
                                    setIsAuthorized(true);
                                    setEnteringPin('');
                                }
                            }
                        }}
                        style={{
                            position: 'fixed',
                            opacity: 0,
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Number Pad */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => {
                                    if (enteringPin.length < 4) {
                                        const newPin = enteringPin + n;
                                        setEnteringPin(newPin);
                                        if (newPin.length === 4) {
                                            // Auto submit
                                            setTimeout(() => {
                                                localStorage.setItem('kds_pin', newPin);
                                                setSavedPin(newPin);
                                                setIsAuthorized(true);
                                                setEnteringPin('');
                                            }, 200);
                                        }
                                    }
                                }}
                                style={{
                                    height: '64px',
                                    borderRadius: '12px',
                                    backgroundColor: '#374151',
                                    color: 'white',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setEnteringPin('')}
                            style={{
                                height: '64px',
                                borderRadius: '12px',
                                backgroundColor: '#7f1d1d20',
                                color: '#ef4444',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Borrar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (enteringPin.length < 4) {
                                    const newPin = enteringPin + '0';
                                    setEnteringPin(newPin);
                                    if (newPin.length === 4) {
                                        // Auto submit
                                        setTimeout(() => {
                                            localStorage.setItem('kds_pin', newPin);
                                            setSavedPin(newPin);
                                            setIsAuthorized(true);
                                            setEnteringPin('');
                                        }, 200);
                                    }
                                }
                            }}
                            style={{
                                height: '64px',
                                borderRadius: '12px',
                                backgroundColor: '#374151',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnteringPin(prev => prev.slice(0, -1))}
                            style={{
                                height: '64px',
                                borderRadius: '12px',
                                backgroundColor: '#374151',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '24px'
                            }}
                        >
                            ←
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // LOADING STATE
    if (isLoading) {
        return (
            <div style={{
                backgroundColor: '#111827',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #1f2937',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#9ca3af' }}>Cargando pantalla de cocina...</p>
                </div>
            </div>
        );
    }

    // ERROR STATE
    if (error) {
        return (
            <div style={{
                backgroundColor: '#111827',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                        Error de Carga
                    </h1>
                    <p style={{ color: '#9ca3af', marginBottom: '16px' }}>{error}</p>
                    <button
                        onClick={() => loadData()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            marginRight: '8px'
                        }}
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'transparent',
                            color: '#9ca3af',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Recargar Página
                    </button>
                </div>
            </div>
        );
    }

    // MAIN KDS INTERFACE
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: station?.color || '#374151' }}
                        >
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {station?.name || `Estación ${stationId?.slice(0, 8)}`}
                            </h1>
                            {!station && (
                                <p className="text-xs text-red-400">
                                    No encontrada en base de datos
                                </p>
                            )}
                            <p className="text-xs text-gray-400">
                                {relevantOrders.length} órdenes pendientes
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Wake Lock Indicator */}
                        {wakeLockSupported && (
                            <div
                                className={`p-2 rounded-lg transition-colors ${wakeLockActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-500'}`}
                                title={wakeLockActive ? 'Pantalla siempre activa' : 'Pantalla puede apagarse'}
                            >
                                <Sun className="w-5 h-5" />
                            </div>
                        )}

                        {/* Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={() => loadData()}
                            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        {/* Logout PIN */}
                        <button
                            onClick={handleLogoutPin}
                            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                            title="Bloquear KDS"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Orders Grid */}
            <main className="flex-1 p-4 overflow-auto">
                {relevantOrders.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <ChefHat className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-500">Sin órdenes pendientes</h2>
                            <p className="text-gray-600 text-sm mt-2">
                                Las nuevas órdenes aparecerán aquí automáticamente
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {relevantOrders.map(order => {
                            const minutes = getTimeElapsed(order.created_at);
                            const allItemsPrepared = order.stationItems.every(item =>
                                isItemPrepared(order, item.id)
                            );
                            const isCancelling = cancellingOrderIds.has(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={`bg-gray-800 rounded-xl border-2 overflow-hidden transition-all relative
                                        ${allItemsPrepared ? 'border-green-500 opacity-90' : 'border-gray-700 hover:border-gray-600'}
                                        ${isCancelling ? 'border-red-500' : ''}
                                    `}
                                >
                                    {/* Cancellation Overlay */}
                                    {isCancelling && (
                                        <div className="absolute inset-0 bg-red-900/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <X className="w-16 h-16 text-white mb-2" />
                                            <span className="text-white font-bold text-xl">CANCELANDO...</span>
                                        </div>
                                    )}

                                    {/* Order Header */}
                                    <div className={`flex items-center justify-between px-4 py-3 ${allItemsPrepared ? 'bg-green-600/20' : 'bg-gray-700/50'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-white">
                                                Mesa {order.table_number}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${getTimeColor(minutes)}`}>
                                            <Clock className="w-4 h-4" />
                                            {minutes}m
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="p-3 space-y-2">
                                        {order.stationItems.map((item, idx) => {
                                            const isPrepared = isItemPrepared(order, item.id);

                                            return (
                                                <button
                                                    key={`${item.id}-${idx}`}
                                                    onClick={() => handleItemClick(order.id, item.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all 
                                                        ${isPrepared
                                                            ? 'bg-green-600 border border-green-500'
                                                            : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isPrepared ? 'bg-white text-green-600' : 'bg-gray-600 text-white'}`}>
                                                            {isPrepared ? <Check className="w-5 h-5 stroke-[3]" /> : item.quantity}
                                                        </span>
                                                        <div>
                                                            <span className={`font-bold ${isPrepared ? 'text-white' : 'text-white'}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                                <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-gray-600">
                                                                    {item.selectedOptions.map((opt, optIdx) => (
                                                                        <p key={optIdx} className="text-xs text-blue-300">
                                                                            <span className="opacity-70">{opt.groupName}:</span> {opt.optionName}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {item.notes && (
                                                                <p className="text-xs text-yellow-400 mt-1 font-bold bg-yellow-400/10 px-1 py-0.5 rounded inline-block">
                                                                    📝 {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Order Footer - "All Ready" Button */}
                                    <div className="p-3 pt-0">
                                        {!allItemsPrepared && (
                                            <button
                                                onClick={() => handleMarkStationReady(order.id)}
                                                className="w-full py-3 bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-5 h-5" />
                                                TODO LISTO
                                            </button>
                                        )}
                                        {allItemsPrepared && (
                                            <div className="w-full py-2 text-center text-green-400 text-sm font-bold flex items-center justify-center gap-2 bg-green-900/20 rounded-lg">
                                                <Check className="w-4 h-4" />
                                                Esperando recolección...
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="px-4 py-2 bg-gray-700/30 text-xs text-gray-500 flex justify-between">
                                        <span>Orden #{order.id.slice(0, 6)}</span>
                                        <span>{new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};
