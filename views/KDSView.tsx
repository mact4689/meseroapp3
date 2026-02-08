
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

    // Data loaded from Supabase
    const [stations, setStations] = useState<KitchenStation[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

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
    const loadData = useCallback(async () => {
        if (!userId) {
            setError('Falta el ID del restaurante en la URL');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
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

            // Map orders
            const mappedOrders: Order[] = ordersData.map((o: any) => ({
                id: o.id,
                user_id: o.user_id,
                table_number: o.table_number,
                status: o.status,
                total: o.total,
                items: o.items || [],
                created_at: o.created_at,
                prepared_items: o.prepared_items || []
            }));
            setOrders(mappedOrders);

            setError(null);
        } catch (err: any) {
            console.error('Error loading KDS data:', err);
            setError(err.message || 'Error al cargar datos');
        } finally {
            setIsLoading(false);
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
                    console.log('Realtime update:', payload);
                    // Reload orders on any change
                    loadData();
                }
            )
            .subscribe();

        return () => {
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

    // Handle item click to toggle prepared status
    const handleItemClick = async (orderId: string, itemId: string) => {
        if (!stationId) return;

        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const currentPreparedItems: PreparedItem[] = order.prepared_items || [];
        const existingIndex = currentPreparedItems.findIndex(
            pi => pi.itemId === itemId && pi.stationId === stationId
        );

        let newPreparedItems: PreparedItem[];
        if (existingIndex >= 0) {
            // Remove (undo)
            newPreparedItems = currentPreparedItems.filter((_, i) => i !== existingIndex);
        } else {
            // Add
            newPreparedItems = [
                ...currentPreparedItems,
                { itemId, stationId, completedAt: Date.now() }
            ];
        }

        // Optimistic update
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, prepared_items: newPreparedItems } : o
        ));

        // Save to database
        try {
            await updateOrderPreparedItemsSecure(orderId, newPreparedItems, savedPin || '');
        } catch (err: any) {
            console.error('Failed to update KDS - possibly invalid PIN');
            // Revert optimistic update on error
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, prepared_items: currentPreparedItems } : o
            ));

            // If it was a PIN error, de-authorize
            if (err.message?.includes('PIN')) {
                setIsAuthorized(false);
                setSavedPin(null);
                localStorage.removeItem('kds_pin');
            }
        }
    };

    // Auto-refresh timer display
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(interval);
    }, []);

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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Cargando pantalla de cocina...</p>
                </div>
            </div>
        );
    }

    // Error state - general error from loadData
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Error de Carga</h1>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="block w-full mt-4 text-sm text-gray-500 hover:text-gray-400"
                    >
                        Recargar Página
                    </button>
                </div>
            </div>
        );
    }

    // PIN AUTHORIZATION OVERLAY
    if (!savedPin || !isAuthorized) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-sm animate-in zoom-in-95 duration-200">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ChefHat className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Acceso a Cocina</h1>
                        <p className="text-gray-400 text-sm">Ingresa el PIN de 4 números de tu restaurante</p>
                    </div>

                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <div className="flex justify-center gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${enteringPin.length > i ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-700 bg-gray-900 text-gray-600'
                                        }`}
                                >
                                    {enteringPin[i] ? '•' : ''}
                                </div>
                            ))}
                        </div>

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
                                        // Auto submit
                                        localStorage.setItem('kds_pin', val);
                                        setSavedPin(val);
                                        setIsAuthorized(true);
                                        setEnteringPin('');
                                    }
                                }
                            }}
                            className="fixed opacity-0 pointer-events-none"
                        />

                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => {
                                        if (enteringPin.length < 4) setEnteringPin(prev => prev + n);
                                    }}
                                    className="h-16 rounded-xl bg-gray-700 text-white text-xl font-bold hover:bg-gray-600 active:scale-95 transition-all outline-none"
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setEnteringPin('')}
                                className="h-16 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-all outline-none"
                            >
                                Borrar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (enteringPin.length < 4) setEnteringPin(prev => prev + '0');
                                }}
                                className="h-16 rounded-xl bg-gray-700 text-white text-xl font-bold hover:bg-gray-600 active:scale-95 transition-all outline-none"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={() => setEnteringPin(prev => prev.slice(0, -1))}
                                className="h-16 rounded-xl bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 active:scale-95 transition-all outline-none"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- DIAGNOSTIC MODE: "Nuclear Option" ---
    return (
        <div style={{ backgroundColor: '#004400', height: '100vh', width: '100vw', padding: '40px', color: 'white', fontFamily: 'monospace', fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1 style={{ fontSize: '32px', color: '#00ff00', fontWeight: 'bold' }}>KDS DIAGNOSTIC MODE</h1>
            <div style={{ border: '1px solid #00aa00', padding: '20px', borderRadius: '8px' }}>
                <p><strong>Station ID:</strong> {stationId || 'MISSING'}</p>
                <p><strong>User ID:</strong> {userId || 'MISSING'}</p>
                <p><strong>Auth:</strong> {isAuthorized ? 'YES' : 'NO'}</p>
                <p><strong>Loading:</strong> {isLoading ? 'YES' : 'NO'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
            </div>

            <div style={{ border: '1px solid #00aa00', padding: '20px', borderRadius: '8px' }}>
                <p><strong>Stations Loaded:</strong> {stations?.length || 0}</p>
                <p><strong>Orders Loaded:</strong> {orders?.length || 0}</p>
            </div>

            <button
                onClick={() => window.location.reload()}
                style={{
                    padding: '15px',
                    marginTop: '20px',
                    fontSize: '20px',
                    backgroundColor: '#00ff00',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                FORCE RELOAD PAGE
            </button>
        </div>
    );
};
