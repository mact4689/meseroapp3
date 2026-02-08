
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

    // ========================================
    // 🚨 DIAGNOSTIC MODE OVERRIDE 🚨
    // This runs BEFORE any logic to diagnose why KDS shows blank
    // ========================================
    return (
        <div style={{
            backgroundColor: '#004400',
            height: '100vh',
            width: '100vw',
            padding: '40px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '16px',
            overflow: 'auto'
        }}>
            <h1 style={{ fontSize: '32px', color: '#00ff00', fontWeight: 'bold', marginBottom: '20px' }}>
                🔍 KDS DIAGNOSTIC MODE
            </h1>

            <div style={{ border: '2px solid #00aa00', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#003300' }}>
                <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>URL PARAMETERS</h2>
                <p><strong>Station ID:</strong> {stationId || '❌ MISSING'}</p>
                <p><strong>User ID:</strong> {userId || '❌ MISSING'}</p>
            </div>

            <div style={{ border: '2px solid #00aa00', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#003300' }}>
                <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>STATE</h2>
                <p><strong>Auth:</strong> {isAuthorized ? '✅ YES' : '❌ NO'}</p>
                <p><strong>Loading:</strong> {isLoading ? '⏳ YES' : '✅ NO'}</p>
                <p><strong>Error:</strong> {error ? `❌ ${error}` : '✅ None'}</p>
                <p><strong>Saved PIN:</strong> {savedPin ? '✅ EXISTS' : '❌ MISSING'}</p>
            </div>

            <div style={{ border: '2px solid #00aa00', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#003300' }}>
                <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>DATA LOADED</h2>
                <p><strong>Stations:</strong> {stations?.length || 0}</p>
                <p><strong>Orders:</strong> {orders?.length || 0}</p>
            </div>

            <button
                onClick={() => window.location.reload()}
                style={{
                    padding: '20px',
                    fontSize: '20px',
                    backgroundColor: '#00ff00',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                🔄 FORCE RELOAD PAGE
            </button>
        </div>
    );
};
