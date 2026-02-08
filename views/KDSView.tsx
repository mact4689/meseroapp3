
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

    // TODO: Add full KDS interface here (loading, error, main view)
    return <div>KDS Authorized - Building interface...</div>;
};
