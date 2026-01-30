
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, Order, OrderItem } from '../types';
import { ChefHat, Clock, Check, Volume2, VolumeX, RefreshCw, X } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { playNotificationSound } from '../services/notification';

interface KDSViewProps {
    onNavigate: (view: AppView) => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ onNavigate }) => {
    const { state, toggleItemPrepared } = useAppStore();
    const { orders, stations } = state;

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastOrderCount, setLastOrderCount] = useState(0);

    // Get station ID from URL
    const stationId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('station');
    }, []);

    // Find this station's info
    const station = stations.find(s => s.id === stationId);

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
        if (relevantOrders.length > lastOrderCount && soundEnabled) {
            playNotificationSound();
        }
        setLastOrderCount(relevantOrders.length);
    }, [relevantOrders.length, soundEnabled]);

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
        await toggleItemPrepared(orderId, itemId, stationId);
    };

    // Auto-refresh timer display
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (!stationId) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Sin Estación</h1>
                    <p className="text-gray-400">No se especificó una estación en la URL.</p>
                    <p className="text-gray-500 text-sm mt-4">
                        Formato correcto: ?view=KDS&station=ID_ESTACION
                    </p>
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
                            onClick={() => window.location.reload()}
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
