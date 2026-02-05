
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppView } from '../types';
import { Button } from '../components/Button';
import { printOrder, printMultipleOrders } from '../services/printer';
import {
    Store,
    UtensilsCrossed,
    Grid2X2,
    Edit2,
    LogOut,
    TrendingUp,
    Users,
    Bell,
    ChefHat,
    Printer,
    CheckCircle2,
    FileText,
    Check,
    Clock,
    ChevronDown,
    ChevronUp,
    Eye,
    ExternalLink,
    BarChart3,
    AlertCircle,
    X,
    Calendar,
    Filter,
    Download,
    Trophy,
    ArrowRight,
    Settings,
    ShieldCheck,
    Copy,
    Terminal,
    Receipt,
    Hand,
    ShoppingBag,
    Star
} from 'lucide-react';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

type TimeRange = 'today' | '7days' | '30days' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { state, logout, completeOrder, promoteItem } = useAppStore();
    const { business, menu, tables, user, orders } = state;
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [showSalesModal, setShowSalesModal] = useState(false);
    // Eliminated unused showSqlModal state
    const [statsTimeRange, setStatsTimeRange] = useState<TimeRange>('all');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [activeOrdersView, setActiveOrdersView] = useState<'pending' | 'completed'>('pending');
    const [printingAll, setPrintingAll] = useState(false);
    const [promotingItemId, setPromotingItemId] = useState<string | null>(null);

    // Filter orders by status
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');

    // Helper: Detectar si una orden es solicitud de cuenta cerrada
    const isBillRequest = (order: typeof orders[0]) => {
        return order.items.some(item => item.id === 'bill-req' || item.name?.includes('SOLICITUD DE CUENTA'));
    };

    // Helper: Detectar si una orden es solicitud de ayuda
    const isHelpRequest = (order: typeof orders[0]) => {
        return order.items.some(item => item.id === 'help-req' || item.name?.includes('SOLICITUD DE AYUDA'));
    };

    // Calculate total stats
    const todayTotal = completedOrders.reduce((acc, o) => {
        const orderDate = new Date(o.created_at);
        const today = new Date();
        const isToday = orderDate.getDate() === today.getDate() &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();

        return isToday ? acc + (o.total || 0) : acc;
    }, 0);

    // --- FILTRADO DE ÓRDENES PARA ESTADÍSTICAS ---
    const filteredOrdersForStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        // Use calendar days relative to todayStart for consistency (00:00:00 of N days ago)
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();

        return completedOrders.filter(o => {
            if (!o.created_at) return false;
            const orderTime = new Date(o.created_at).getTime();

            switch (statsTimeRange) {
                case 'today': return orderTime >= todayStart;
                case '7days': return orderTime >= sevenDaysAgo;
                case '30days': return orderTime >= thirtyDaysAgo;
                default: return true;
            }
        });
    }, [completedOrders, statsTimeRange]);

    // --- LOGICA DE ESTADÍSTICAS DE PRODUCTOS ---
    const itemStats = useMemo(() => {
        const stats: Record<string, { count: number, revenue: number }> = {};

        // 1. Inicializar todos los items del menú en 0
        menu.forEach(item => {
            stats[item.id] = { count: 0, revenue: 0 };
        });

        // 2. Sumar cantidades e ingresos de órdenes FILTRADAS
        filteredOrdersForStats.forEach(order => {
            order.items.forEach(item => {
                const key = menu.find(m => m.id === item.id)?.id || item.id;
                if (stats[key]) {
                    stats[key].count += item.quantity;
                    stats[key].revenue += (parseFloat(item.price) || 0) * item.quantity;
                }
            });
        });

        // 3. Convertir a array y ordenar
        const sortedStats = menu.map(item => ({
            ...item,
            soldCount: stats[item.id]?.count || 0,
            revenue: stats[item.id]?.revenue || 0
        })).sort((a, b) => b.soldCount - a.soldCount);

        const topItems = sortedStats.slice(0, 5).filter(i => i.soldCount > 0);
        const bottomItems = sortedStats.filter(i => i.soldCount < opportunitiesThreshold).slice(0, 5);
        const maxSales = topItems.length > 0 ? topItems[0].soldCount : 1;

        return { topItems, bottomItems, maxSales };
    }, [filteredOrdersForStats, menu]);

    // --- LÓGICA DE VENTAS POR DÍA (HISTORIAL MODAL) ---

    // --- ANALÍTICA DE VENTAS (MODAL MEJORADO) ---
    const [salesHistoryDate, setSalesHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);

    const dailyStats = useMemo(() => {
        // 1. Filtrar órdenes por fecha seleccionada
        const filteredOrders = completedOrders.filter(order => {
            if (!order.created_at) return false;
            return new Date(order.created_at).toLocaleDateString('en-CA') === salesHistoryDate;
        });

        // 2. Calcular Totales Básicos
        const total = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const count = filteredOrders.length;
        const avgTicket = count > 0 ? total / count : 0;

        // 3. Top Platillos
        const productMap = new Map<string, { name: string, count: number, total: number }>();
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const existing = productMap.get(item.name) || { name: item.name, count: 0, total: 0 };
                existing.count += item.quantity;
                existing.total += item.quantity * parseFloat(item.price);
                productMap.set(item.name, existing);
            });
        });
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 4. Horas Pico
        const hoursMap = new Array(24).fill(0);
        filteredOrders.forEach(order => {
            if (order.created_at) {
                const hour = new Date(order.created_at).getHours();
                hoursMap[hour]++;
            }
        });
        // Simplificar para mostrar solo horas relevantes (ej. 12pm a 11pm o las que tengan ventas)
        // Por ahora tomamos un rango fijo o dinámico. Haremos dinámico simple:
        const activeHours = hoursMap.map((count, hour) => ({
            hour: `${hour}:00`,
            count
        })).filter((_, idx) => {
            // Mostrar rango razonable si hay datos, si no todo el día
            return true;
        }).slice(8, 24); // Mostrar de 8am a 12pm por defecto para limpieza visual

        return { total, count, avgTicket, topProducts, peakHours: activeHours };
    }, [completedOrders, salesHistoryDate]);

    const handleExportReport = () => {
        // Generar CSV
        const headers = ['Orden ID', 'Hora', 'Mesa', 'Total', 'Items'];
        const rows = completedOrders
            .filter(o => new Date(o.created_at).toLocaleDateString('en-CA') === salesHistoryDate)
            .map(o => [
                o.id.slice(0, 6),
                new Date(o.created_at).toLocaleTimeString(),
                o.table_number,
                o.total.toFixed(2),
                o.items.map(i => `${i.quantity}x ${i.name}`).join(' | ')
            ]);

        const csvContent = [
            `Reporte de Ventas - ${salesHistoryDate}`,
            `Total: $${dailyStats.total.toFixed(2)} | Pedidos: ${dailyStats.count} | Ticket Prom: $${dailyStats.avgTicket.toFixed(2)}`,
            '',
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_ventas_${salesHistoryDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // --- HISTORIAL DE ÓRDENES CON FECHA ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);

    const ordersHistory = useMemo(() => {
        return completedOrders
            .filter(order => {
                if (!order.created_at) return false;
                const orderDate = new Date(order.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
                return orderDate === historyDate;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [completedOrders, historyDate]);

    const handleReprintOrder = async (order: typeof completedOrders[0]) => {
        setPrintingOrderId(order.id);
        try {
            await printOrder(order, state.ticketConfig, business.name);
        } catch (error) {
            console.error('Error reprinting:', error);
        } finally {
            setPrintingOrderId(null);
        }
    };



    const handleLogout = () => {
        logout();
        onNavigate(AppView.LANDING);
    };

    const toggleOrder = (id: string) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const handleCompleteOrder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await completeOrder(id);
    };

    const handlePrintOrder = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        setPrintingOrderId(orderId);
        try {
            // Si es una solicitud de cuenta, combinar todas las órdenes de la mesa
            if (isBillRequest(order)) {
                // Obtener todas las órdenes de esta mesa (excepto la solicitud de cuenta)
                const tableOrders = pendingOrders.filter(
                    o => o.table_number === order.table_number && !isBillRequest(o)
                );

                // Combinar todos los items
                const allItems = tableOrders.flatMap(o =>
                    o.items.filter(item => item.id !== 'bill-req' && !item.name?.includes('SOLICITUD DE CUENTA'))
                );

                // Calcular el total
                const totalAmount = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                // Crear una orden virtual para imprimir
                const billOrder = {
                    ...order,
                    items: allItems,
                    total: totalAmount
                };

                await printOrder(billOrder, state.ticketConfig, business.name || 'Mi Restaurante');
            } else {
                await printOrder(order, state.ticketConfig, business.name || 'Mi Restaurante');
            }
        } catch (error) {
            console.error('Error al imprimir:', error);
        } finally {
            setPrintingOrderId(null);
        }
    };

    const handlePrintAllOrders = async () => {
        if (pendingOrders.length === 0) return;

        setPrintingAll(true);
        try {
            await printMultipleOrders(pendingOrders, state.ticketConfig, business.name || 'Mi Restaurante');
        } catch (error) {
            console.error('Error al imprimir órdenes:', error);
        } finally {
            setPrintingAll(false);
        }
    };

    const scrollToOrders = () => {
        const element = document.getElementById('active-orders');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Eliminated unused handleCopySql function

    // Safe Base URL Calculation - strictly use origin
    const baseUrl = window.location.origin;
    const publicMenuUrl = `${baseUrl}/?table=1&uid=${user?.id}`;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                    <button
                        onClick={() => onNavigate(AppView.BUSINESS_SETUP)}
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity text-left cursor-pointer"
                        title="Editar perfil del restaurante"
                    >
                        {business.logo ? (
                            <img src={business.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-white">
                                <Store className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold text-brand-900 leading-none">
                                {business.name || 'Mi Restaurante'}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {user?.name ? `Hola, ${user.name}` : (business.cuisine || 'Panel de Control')}
                            </p>
                        </div>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={scrollToOrders}
                            className="p-2 text-gray-400 hover:text-brand-900 hover:bg-gray-100 rounded-full transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            {pendingOrders.length > 0 && (
                                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* MENÚ CARD */}
                    <div
                        onClick={() => onNavigate(AppView.MENU_SETUP)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-900/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center space-x-2 text-accent-600 mb-2">
                            <UtensilsCrossed className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Menú</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{menu.length}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Editar platillos</p>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* MESAS CARD */}
                    <div
                        onClick={() => onNavigate(AppView.TABLE_SETUP)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-900/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center space-x-2 text-blue-600 mb-2">
                            <Grid2X2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Mesas</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{tables.count || 0}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Administrar QR</p>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* VENTAS CARD - CLICKABLE */}
                    <div
                        onClick={() => setShowSalesModal(true)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-900/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center space-x-2 text-green-600 mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Ventas Hoy</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">${todayTotal.toFixed(2)}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Ver historial</p>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    <div
                        onClick={() => setShowHistoryModal(true)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-900/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center space-x-2 text-purple-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Órdenes</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{completedOrders.length}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Completadas Total</p>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>

                {/* MODAL: ORDER HISTORY */}
                {showHistoryModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-900 leading-none">Historial</h3>
                                        <p className="text-[10px] text-gray-400 font-medium">Selecciona una fecha</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={historyDate}
                                        onChange={(e) => setHistoryDate(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    />
                                    <button
                                        onClick={() => setShowHistoryModal(false)}
                                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto p-0 bg-gray-50/50 min-h-[300px]">
                                {ordersHistory.length === 0 ? (
                                    <div className="text-center py-12 px-4 flex flex-col items-center justify-center h-full">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-200 shadow-sm">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">Sin órdenes</h4>
                                        <p className="text-gray-400 text-sm">No hay órdenes completadas para esta fecha.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {ordersHistory.map(order => (
                                            <div key={order.id} className="p-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between group border-b border-gray-100 last:border-0">
                                                <div className="flex items-start gap-4">
                                                    <div className={`
                                                            w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 shadow-sm
                                                            ${order.table_number.startsWith('LLEVAR') ? 'bg-orange-100 text-orange-600' : 'bg-brand-50 text-brand-900'}
                                                        `}>
                                                        {order.table_number.startsWith('LLEVAR') ? '🛍️' : order.table_number}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-brand-900 text-base">
                                                                {order.table_number.startsWith('LLEVAR')
                                                                    ? `Para Llevar #${order.table_number.split('-')[1] || '?'}`
                                                                    : `Mesa ${order.table_number}`}
                                                            </p>
                                                            <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                                                                Completada
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                                            <span className="flex items-center bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                                #{order.id.slice(0, 4)}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="block font-bold text-brand-900 text-lg">${(order.total || 0).toFixed(2)}</span>

                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleReprintOrder(order)}
                                                        disabled={printingOrderId === order.id}
                                                        className="h-8 text-xs !px-3 bg-gray-100 hover:bg-gray-200 text-brand-900 border-none flex items-center gap-1.5"
                                                    >
                                                        {printingOrderId === order.id ? (
                                                            <div className="animate-spin w-3 h-3 border-2 border-brand-900 border-t-transparent rounded-full" />
                                                        ) : (
                                                            <Printer className="w-3.5 h-3.5" />
                                                        )}
                                                        Reimprimir
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: SALES HISTORY */}
                {
                    showSalesModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setShowSalesModal(false)}></div>
                            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-900 leading-none">Reporte de Ventas</h3>
                                            <p className="text-[10px] text-gray-400 font-medium">Resumen diario</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={salesHistoryDate}
                                            onChange={(e) => setSalesHistoryDate(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        />
                                        <button
                                            onClick={() => setShowSalesModal(false)}
                                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-y-auto p-4 bg-gray-50/50 min-h-[400px]">
                                    {dailyStats.count === 0 ? (
                                        <div className="text-center py-12 px-4 flex flex-col items-center justify-center h-full">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-200 shadow-sm">
                                                <Calendar className="w-8 h-8" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">Sin ventas</h4>
                                            <p className="text-gray-400 text-sm">No hay ventas registradas para esta fecha.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* KPI Cards */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ventas</p>
                                                    <p className="text-lg font-bold text-brand-900">${dailyStats.total.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Pedidos</p>
                                                    <p className="text-lg font-bold text-brand-900">{dailyStats.count}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ticket Prom.</p>
                                                    <p className="text-lg font-bold text-brand-900">${dailyStats.avgTicket.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {/* Top Dishes */}
                                            <div>
                                                <h4 className="font-bold text-brand-900 text-sm mb-3 flex items-center gap-2">
                                                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                                                    Lo más vendido
                                                </h4>
                                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                    {dailyStats.topProducts.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{item.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="block text-xs font-bold text-brand-900">{item.count} un.</span>
                                                                <span className="text-[10px] text-gray-400">${item.total.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Peak Hours */}
                                            <div>
                                                <h4 className="font-bold text-brand-900 text-sm mb-3 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    Horas Pico
                                                </h4>
                                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                                    <div className="flex items-end justify-between h-24 gap-2">
                                                        {dailyStats.peakHours.map((hour, idx) => {
                                                            const maxCount = Math.max(...dailyStats.peakHours.map(h => h.count));
                                                            const heightPercent = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
                                                            return (
                                                                <div key={idx} className="flex flex-col items-center gap-1 flex-1 group">
                                                                    <div className="w-full bg-blue-50 rounded-t-sm relative group-hover:bg-blue-100 transition-colors" style={{ height: `${Math.max(heightPercent, 10)}%` }}>
                                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                            {hour.count} pedidos
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-mono">{hour.hour}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Export Button */}
                                            <button
                                                onClick={handleExportReport}
                                                className="w-full py-3 bg-brand-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-900/20 hover:bg-brand-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Exportar Reporte Excel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                                    Mostrando ventas totales (incluye propinas si aplica)
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* REMOVED SQL MODAL */}

                {/* ANALYTICS SECTION */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-brand-900 text-lg">Rendimiento del Menú</h3>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                            <button onClick={() => setStatsTimeRange('today')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statsTimeRange === 'today' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
                            <button onClick={() => setStatsTimeRange('7days')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statsTimeRange === '7days' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>7 Días</button>
                            <button onClick={() => setStatsTimeRange('30days')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statsTimeRange === '30days' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>30 Días</button>
                            <button onClick={() => setStatsTimeRange('all')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statsTimeRange === 'all' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todo</button>
                        </div>
                    </div>

                    {completedOrders.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <TrendingUp className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-900 font-medium">Aún no hay datos suficientes</p>
                            <p className="text-sm text-gray-500 mt-1">Completa órdenes para ver las estadísticas.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            <div className="pr-0 md:pr-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-5 flex items-center">
                                    <Trophy className="w-4 h-4 mr-2" /> Los más populares
                                </h4>
                                {itemStats.topItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {itemStats.topItems.map((item, idx) => (
                                            <div key={item.id} className="flex items-center gap-3 group">
                                                <div className="font-bold text-gray-300 w-4 text-center text-lg group-hover:text-brand-900 transition-colors">{idx + 1}</div>
                                                <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                                    {item.image ? (<img src={item.image} alt={item.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-300"><UtensilsCrossed className="w-5 h-5" /></div>)}
                                                    {idx === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-[8px] px-1 font-bold text-yellow-900 rounded-bl">#1</div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="font-bold text-brand-900 truncate pr-2">{item.name}</span>
                                                        <span className="font-bold text-green-600 text-sm whitespace-nowrap">${item.revenue.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-400' : 'bg-brand-900'}`} style={{ width: `${(item.soldCount / itemStats.maxSales) * 100}%` }} />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{item.soldCount} u.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm italic">No hay ventas en este periodo.</div>
                                )}
                            </div>
                            <div className="pt-8 md:pt-0 pl-0 md:pl-8">
                                <div className="flex justify-between items-center mb-5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Oportunidades</h4>
                                    <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 rounded-lg">
                                        <span className="text-[10px] font-medium text-orange-700">Menos de</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={opportunitiesThreshold}
                                            onChange={(e) => setOpportunitiesThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-8 text-center text xs font-bold text-orange-700 bg-white border border-orange-200 rounded focus:outline-none focus:border-orange-500 px-0.5"
                                        />
                                        <span className="text-[10px] font-medium text-orange-700">ventas</span>
                                    </div>
                                </div>
                                {itemStats.bottomItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {itemStats.bottomItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-gray-300 border border-gray-100 shrink-0">
                                                        {item.image ? (<img src={item.image} alt="" className="w-full h-full object-cover rounded" />) : (<UtensilsCrossed className="w-4 h-4" />)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-brand-900 transition-colors">{item.name}</span>
                                                        <span className="text-[10px] text-gray-400">{item.category}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className={`text-xs font-bold px-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${item.isPromoted
                                                        ? 'text-blue-600 hover:text-blue-700'
                                                        : 'text-accent-600 hover:text-accent-700 hover:underline'
                                                        }`}
                                                    onClick={async () => {
                                                        if (promotingItemId) return;
                                                        setPromotingItemId(item.id);
                                                        try {
                                                            await promoteItem(item.id);
                                                        } catch (error) {
                                                            console.error('Error promoting item:', error);
                                                        } finally {
                                                            setPromotingItemId(null);
                                                        }
                                                    }}
                                                    disabled={promotingItemId === item.id}
                                                >
                                                    {promotingItemId === item.id ? 'Promoviendo...' : (
                                                        <>
                                                            Promover <Star className="w-3 h-3 fill-current" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2"><Check className="w-6 h-6" /></div>
                                        <p className="text-sm font-bold text-gray-900">¡Todo se vende!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ACTIVE ORDERS SECTION */}
                <div id="active-orders" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-brand-900 text-lg">Órdenes Activas</h3>
                            {pendingOrders.length > 0 && (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingOrders.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {pendingOrders.length > 0 && (
                                <Button
                                    onClick={handlePrintAllOrders}
                                    variant="secondary"
                                    className="!px-3 !py-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                    icon={<Printer className="w-4 h-4" />}
                                    isLoading={printingAll}
                                >
                                    Imprimir Todas ({pendingOrders.length})
                                </Button>
                            )}
                            <span className="hidden sm:inline-block text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded-full animate-pulse">
                                ● En tiempo real
                            </span>
                        </div>
                    </div>

                    {pendingOrders.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                <Bell className="w-8 h-8" />
                            </div>
                            <p className="text-gray-900 font-medium">No hay órdenes pendientes</p>
                            <p className="text-sm text-gray-500 mt-1">Comparte tus códigos QR para recibir pedidos.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingOrders.map((order) => {
                                const isBill = isBillRequest(order);
                                const isHelp = isHelpRequest(order);

                                // Si es solicitud de cuenta, obtener todas las órdenes de esa mesa
                                const tableOrders = isBill
                                    ? pendingOrders.filter(o => o.table_number === order.table_number && !isBillRequest(o))
                                    : [];

                                // Combinar todos los items de las órdenes de la mesa (sin los items de sistema)
                                const allTableItems = isBill
                                    ? tableOrders.flatMap(o => o.items.filter(item => item.id !== 'bill-req' && !item.name?.includes('SOLICITUD DE CUENTA')))
                                    : [];

                                // Calcular el total sumando todas las órdenes de la mesa
                                const tableTotal = isBill
                                    ? tableOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                                    : order.total || 0;

                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => toggleOrder(order.id)}
                                        className={`
                                        border rounded-xl overflow-hidden transition-all cursor-pointer
                                        ${isHelp
                                                ? (expandedOrder === order.id
                                                    ? 'border-yellow-500 ring-2 ring-yellow-500 bg-yellow-50'
                                                    : 'border-yellow-300 hover:border-yellow-400 bg-yellow-50')
                                                : isBill
                                                    ? (expandedOrder === order.id
                                                        ? 'border-green-500 ring-2 ring-green-500 bg-green-50'
                                                        : 'border-green-300 hover:border-green-400 bg-green-50')
                                                    : (expandedOrder === order.id
                                                        ? 'border-brand-900 ring-1 ring-brand-900 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white')}
                                    `}
                                    >
                                        {/* Order Header */}
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Table/Takeout Badge */}
                                                {order.table_number.startsWith('LLEVAR') ? (
                                                    <div className="bg-orange-500 text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center leading-none">
                                                        <span className="text-[8px] font-medium opacity-80">🛍️</span>
                                                        <span className="text-lg font-bold">#{order.table_number.split('-')[1] || '?'}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`${isHelp ? 'bg-yellow-600' : isBill ? 'bg-green-600' : 'bg-brand-900'} text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center leading-none`}>
                                                        <span className="text-[10px] font-medium opacity-80">Mesa</span>
                                                        <span className="text-xl font-bold">{order.table_number}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        {order.table_number.startsWith('LLEVAR') ? (
                                                            <span className="font-bold text-orange-600 flex items-center gap-1.5">
                                                                🛍️ Para Llevar #{order.table_number.split('-')[1] || '?'}
                                                            </span>
                                                        ) : isHelp ? (
                                                            <span className="font-bold text-yellow-700 flex items-center gap-1.5">
                                                                <Hand className="w-4 h-4" />
                                                                🆘 AYUDA - Mesa {order.table_number}
                                                            </span>
                                                        ) : isBill ? (
                                                            <span className="font-bold text-green-700 flex items-center gap-1.5">
                                                                <Receipt className="w-4 h-4" />
                                                                Cuenta Cerrada
                                                            </span>
                                                        ) : (
                                                            <span className="font-bold text-brand-900">Orden #{order.id.slice(0, 4)}</span>
                                                        )}
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {order.table_number.startsWith('LLEVAR')
                                                            ? <><span className="text-orange-600 font-medium">{order.items.length} items</span> • <span className="font-bold">${(order.total || 0).toFixed(2)}</span></>
                                                            : isHelp
                                                                ? <span className="text-yellow-700 font-medium">{order.items.find(i => i.id === 'help-req')?.notes || 'El cliente necesita asistencia'}</span>
                                                                : isBill
                                                                    ? <span className="text-green-600 font-medium">El cliente solicita el ticket</span>
                                                                    : <>{order.items.length} items • <span className="font-bold">${(order.total || 0).toFixed(2)}</span></>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handlePrintOrder(order.id, e)}
                                                    className={`p-2 ${isHelp ? 'text-yellow-600 hover:bg-yellow-100' : isBill ? 'text-green-600 hover:bg-green-100' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                                                    title={isHelp ? 'Imprimir solicitud de ayuda' : isBill ? 'Imprimir ticket de cuenta' : 'Imprimir orden'}
                                                    disabled={printingOrderId === order.id}
                                                >
                                                    <Printer className={`w-5 h-5 ${printingOrderId === order.id ? 'animate-pulse' : ''}`} />
                                                </button>
                                                <Button
                                                    onClick={(e) => handleCompleteOrder(order.id, e)}
                                                    className={`h-9 px-4 text-xs ${isHelp ? 'bg-yellow-600 hover:bg-yellow-700' : isBill ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} border-transparent`}
                                                    icon={<Check className="w-4 h-4" />}
                                                >
                                                    {isHelp ? 'Atendido' : isBill ? 'Entregada' : 'Listo'}
                                                </Button>
                                                <div className="text-gray-400">
                                                    {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedOrder === order.id && (
                                            <div className={`px-4 pb-4 pt-0 border-t ${isHelp ? 'border-yellow-200 bg-white' : isBill ? 'border-green-200 bg-white' : 'border-gray-200 bg-white'} mt-2`}>
                                                {isHelp && (
                                                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mb-3 mt-3 flex items-center gap-2">
                                                        <Hand className="w-5 h-5 text-yellow-600" />
                                                        <p className="text-sm text-yellow-700 font-medium">
                                                            {order.items.find(i => i.id === 'help-req')?.notes || 'El cliente necesita asistencia'}
                                                        </p>
                                                    </div>
                                                )}
                                                {isBill && (
                                                    <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3 mt-3 flex items-center gap-2">
                                                        <Receipt className="w-5 h-5 text-green-600" />
                                                        <p className="text-sm text-green-700 font-medium">
                                                            El cliente ha solicitado la cuenta. Puedes imprimir el ticket y entregárselo.
                                                        </p>
                                                    </div>
                                                )}
                                                <ul className="divide-y divide-gray-100">
                                                    {(isHelp ? [] : isBill ? allTableItems : order.items.filter(item => item.id !== 'bill-req' && !item.name?.includes('SOLICITUD DE CUENTA') && item.id !== 'help-req' && !item.name?.includes('SOLICITUD DE AYUDA'))).map((item, idx) => (
                                                        <li key={idx} className="py-3 flex justify-between items-start">
                                                            <div className="flex gap-3">
                                                                <span className="font-bold text-brand-900 w-6 text-center bg-gray-100 rounded text-sm py-0.5">
                                                                    {item.quantity}x
                                                                </span>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                                                    {item.ingredients && <p className="text-xs text-gray-500">{item.ingredients}</p>}
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900">
                                                                ${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {isBill && (
                                                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-300">
                                                        <div className="flex justify-between items-center text-lg font-bold">
                                                            <span>Total a Cobrar:</span>
                                                            <span className="text-green-600">${tableTotal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Configuration Sections */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                            <Settings className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-brand-900">Configuración</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* PREVIEW MENU CARD */}
                        <div className="bg-brand-900 rounded-2xl p-5 shadow-xl border border-brand-900 flex items-center justify-between group hover:scale-[1.02] transition-all md:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center group-hover:bg-accent-500 group-hover:text-brand-900 transition-colors">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Vista Previa Menú Digital</h3>
                                    <p className="text-xs text-gray-400">Mira cómo lo ven tus clientes actualmente</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <a
                                    href={publicMenuUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                    title="Ver URL Pública"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <Button
                                    variant="primary"
                                    onClick={() => onNavigate(AppView.CUSTOMER_MENU)}
                                    className="!px-6 !py-2.5 bg-white !text-brand-900 hover:bg-gray-50 border border-gray-200 font-bold shadow-sm"
                                >
                                    Abrir Preview
                                </Button>
                            </div>
                        </div>

                        {/* DIAGNOSTIC CARD REMOVED */}

                        {/* Business Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Negocio</h3>
                                    <p className="text-xs text-gray-500">Perfil y Logo</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.BUSINESS_SETUP)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* Menu Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Menú</h3>
                                    <p className="text-xs text-gray-500">{menu.length} Platillos</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.MENU_SETUP)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* Tables Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                                    <Grid2X2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Mesas y QRs</h3>
                                    <p className="text-xs text-gray-500">{tables.count || 0} Mesas</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.TABLE_SETUP)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* Ticket Config Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Ajuste de impresión de Tickets</h3>
                                    <p className="text-xs text-gray-500">Diseña los tickets para tus impresoras</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.TICKET_CONFIG)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* KDS Setup Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Pantallas de Cocina (KDS)</h3>
                                    <p className="text-xs text-gray-500">Configura estaciones para tu cocina</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.KDS_SETUP)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                </div>

            </main >
        </div >
    );
};
