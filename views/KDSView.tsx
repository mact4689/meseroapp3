
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppView, Order, OrderItem, KitchenStation, PreparedItem } from '../types';
import { ChefHat, Clock, Check, Volume2, VolumeX, RefreshCw, X, Loader2, AlertCircle } from 'lucide-react';
import { playNotificationSound } from '../services/notification';
import { getStations, getOrders, updateOrderPreparedItems } from '../services/db';
import { supabase } from '../services/client';

interface KDSViewProps {
    onNavigate: (view: AppView) => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ onNavigate }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastOrderCount, setLastOrderCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        await updateOrderPreparedItems(orderId, newPreparedItems);
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

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: station?.color || '#3b82f6' }}
                        >
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {station?.name || 'Estación Desconocida'}
                            </h1>
                            <p className="text-xs text-gray-400">
                                {relevantOrders.length} órdenes pendientes
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`
                p-2 rounded-lg transition-colors
                ${soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}
              `}
                            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={loadData}
                            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        {/* Close */}
                        <button
                            onClick={() => window.close()}
                            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                            title="Cerrar"
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

                            return (
                                <div
                                    key={order.id}
                                    className={`
                    bg-gray-800 rounded-xl border-2 overflow-hidden transition-all
                    ${allItemsPrepared
                                            ? 'border-green-500 opacity-60'
                                            : 'border-gray-700 hover:border-gray-600'
                                        }
                  `}
                                >
                                    {/* Order Header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-white">
                                                Mesa {order.table_number}
                                            </span>
                                            {allItemsPrepared && (
                                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                                                    LISTO
                                                </span>
                                            )}
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
                                                    className={`
                            w-full flex items-center justify-between p-3 rounded-lg text-left transition-all
                            ${isPrepared
                                                            ? 'bg-green-600/20 border border-green-600/50'
                                                            : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                                                        }
                          `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`
                              w-8 h-8 rounded-full flex items-center justify-center font-bold
                              ${isPrepared ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}
                            `}>
                                                            {isPrepared ? <Check className="w-4 h-4" /> : item.quantity}
                                                        </span>
                                                        <div>
                                                            <span className={`font-bold ${isPrepared ? 'text-green-400 line-through' : 'text-white'}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.notes && (
                                                                <p className="text-xs text-yellow-400 mt-0.5">📝 {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {!isPrepared && (
                                                        <span className="text-xs text-gray-400">Tap para marcar</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Order Footer */}
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
