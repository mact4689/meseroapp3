
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
    Trophy,
    ArrowRight,
    Settings,
    ShieldCheck,
    Copy,
    Terminal,
    Receipt
} from 'lucide-react';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

type TimeRange = 'today' | '7days' | '30days' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { state, logout, completeOrder } = useAppStore();
    const { business, menu, tables, user, printers, orders } = state;
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [showSqlModal, setShowSqlModal] = useState(false);
    const [statsTimeRange, setStatsTimeRange] = useState<TimeRange>('all');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [printingAll, setPrintingAll] = useState(false);

    const connectedPrintersCount = printers.filter(p => p.isConnected).length;
    const mainPrinter = printers[0];

    // Filter orders by status
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');

    // Helper: Detectar si una orden es solicitud de cuenta cerrada
    const isBillRequest = (order: typeof orders[0]) => {
        return order.items.some(item => item.id === 'bill-req' || item.name?.includes('SOLICITUD DE CUENTA'));
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
        const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

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
        const bottomItems = sortedStats.filter(i => i.soldCount === 0).slice(0, 5);
        const maxSales = topItems.length > 0 ? topItems[0].soldCount : 1;

        return { topItems, bottomItems, maxSales };
    }, [filteredOrdersForStats, menu]);

    // --- LÓGICA DE VENTAS POR DÍA (HISTORIAL MODAL) ---
    const salesByDay = useMemo(() => {
        type DayData = { total: number; count: number; rawDate: number };
        const grouped = completedOrders.reduce((acc, order) => {
            if (!order.created_at) return acc;

            const dateObj = new Date(order.created_at);
            if (isNaN(dateObj.getTime())) return acc;

            const dateKey = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

            if (!acc[dateKey]) {
                acc[dateKey] = { total: 0, count: 0, rawDate: dateObj.getTime() };
            }

            acc[dateKey].total += (order.total || 0);
            acc[dateKey].count += 1;
            return acc;
        }, {} as Record<string, DayData>);

        return Object.entries(grouped)
            .map(([date, data]: [string, DayData]) => ({
                date,
                total: data.total,
                count: data.count,
                rawDate: data.rawDate
            }))
            .sort((a, b) => b.rawDate - a.rawDate);
    }, [completedOrders]);


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

                await printOrder(billOrder, printers, business.name || 'Mi Restaurante');
            } else {
                await printOrder(order, printers, business.name || 'Mi Restaurante');
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
            await printMultipleOrders(pendingOrders, printers, business.name || 'Mi Restaurante');
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

    const handleCopySql = () => {
        const sql = `-- CORREGIR PERMISOS (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Permisos Públicos (Lectura de Menú y Creación de Órdenes)
DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Create Orders" ON orders;
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);

-- 2. Permisos de Dueño (Gestión Total de su propia data)
DROP POLICY IF EXISTS "Owner Manage Menu" ON menu_items;
CREATE POLICY "Owner Manage Menu" ON menu_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner Manage Profile" ON profiles;
CREATE POLICY "Owner Manage Profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner Manage Orders" ON orders;
CREATE POLICY "Owner Manage Orders" ON orders FOR ALL USING (auth.uid() = user_id);`;

        navigator.clipboard.writeText(sql);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    // Safe Base URL Calculation - strictly use origin
    const baseUrl = window.location.origin;
    const publicMenuUrl = `${baseUrl}/?table=1&uid=${user?.id}`;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                    <div className="flex items-center space-x-3">
                        {business.logo ? (
                            <img src={business.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-white">
                                <Store className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <h1 className="font-serif text-lg font-bold text-brand-900 leading-none">
                                {business.name || 'Mi Restaurante'}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {user?.name ? `Hola, ${user.name}` : (business.cuisine || 'Panel de Control')}
                            </p>
                        </div>
                    </div>
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
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 text-accent-600 mb-2">
                            <UtensilsCrossed className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Menú</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{menu.length}</p>
                        <p className="text-xs text-gray-500">Items activos</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 text-blue-600 mb-2">
                            <Grid2X2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Mesas</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{tables.count || 0}</p>
                        <p className="text-xs text-gray-500">Códigos QR</p>
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
                            <p className="text-xs text-gray-500">Ver historial completo</p>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 text-purple-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Órdenes</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{completedOrders.length}</p>
                        <p className="text-xs text-gray-500">Completadas Total</p>
                    </div>
                </div>

                {/* MODAL: SALES HISTORY */}
                {showSalesModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setShowSalesModal(false)}></div>
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-brand-900">Historial de Ventas</h3>
                                </div>
                                <button
                                    onClick={() => setShowSalesModal(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-2">
                                {salesByDay.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <p className="text-gray-400 text-sm">No hay registros de ventas anteriores.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {salesByDay.map((day, idx) => (
                                            <div key={day.date} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-gray-500">
                                                        <span className="text-[10px] font-bold uppercase leading-none">{day.date.split(' ')[0]}</span>
                                                        <span className="text-xs font-bold leading-none mt-0.5">{day.date.split(' ')[1]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-brand-900 capitalize">{day.date}</p>
                                                        <p className="text-xs text-gray-500">{day.count} órdenes</p>
                                                    </div>
                                                </div>
                                                <span className="text-base font-bold text-brand-900">
                                                    ${day.total.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                                Mostrando ventas totales (incluye propinas si aplica)
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: SQL DIAGNOSTIC */}
                {showSqlModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" onClick={() => setShowSqlModal(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-900 text-lg">Permisos de Base de Datos</h3>
                                        <p className="text-xs text-gray-500">Solución para errores de carga o "0 items"</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSqlModal(false)}
                                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-4">
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold mb-1">¿Por qué veo esto?</p>
                                        <p>Si tus platillos no aparecen en el celular o ves errores de conexión, es probable que falten los permisos de seguridad (RLS) en Supabase.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-700">Instrucciones:</p>
                                    <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 ml-1">
                                        <li>Copia el código de abajo.</li>
                                        <li>Ve a tu proyecto en <strong>Supabase</strong> {'>'} <strong>SQL Editor</strong>.</li>
                                        <li>Pega el código y haz clic en <strong>Run</strong>.</li>
                                    </ol>
                                </div>

                                <div className="relative group">
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {copyFeedback && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded animate-in fade-in">¡Copiado!</span>
                                        )}
                                        <button
                                            onClick={handleCopySql}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                                            title="Copiar SQL"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <pre className="bg-brand-900 text-gray-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-gray-800">
                                        {`-- CORREGIR PERMISOS (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Permisos Públicos
DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Create Orders" ON orders;
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);

-- 2. Permisos de Dueño
DROP POLICY IF EXISTS "Owner Manage Menu" ON menu_items;
CREATE POLICY "Owner Manage Menu" ON menu_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner Manage Profile" ON profiles;
CREATE POLICY "Owner Manage Profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner Manage Orders" ON orders;
CREATE POLICY "Owner Manage Orders" ON orders FOR ALL USING (auth.uid() = user_id);`}
                                    </pre>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <Button onClick={() => setShowSqlModal(false)}>
                                    Entendido
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANALYTICS SECTION */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="font-serif font-bold text-brand-900 text-lg">Rendimiento del Menú</h3>
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
                                                <div className="font-serif font-bold text-gray-300 w-4 text-center text-lg group-hover:text-brand-900 transition-colors">{idx + 1}</div>
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
                                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">Sin ventas</span>
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
                                                <button className="text-xs font-bold text-accent-600 hover:text-accent-700 hover:underline px-2" onClick={() => onNavigate(AppView.MENU_SETUP)}>Promocionar</button>
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
                            <h3 className="font-serif font-bold text-brand-900 text-lg">Órdenes Activas</h3>
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
                                        ${isBill
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
                                                <div className={`${isBill ? 'bg-green-600' : 'bg-brand-900'} text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center leading-none`}>
                                                    <span className="text-[10px] font-medium opacity-80">Mesa</span>
                                                    <span className="text-xl font-bold">{order.table_number}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        {isBill ? (
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
                                                        {isBill
                                                            ? <span className="text-green-600 font-medium">El cliente solicita el ticket</span>
                                                            : <>{order.items.length} items • <span className="font-bold">${(order.total || 0).toFixed(2)}</span></>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handlePrintOrder(order.id, e)}
                                                    className={`p-2 ${isBill ? 'text-green-600 hover:bg-green-100' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                                                    title={isBill ? 'Imprimir ticket de cuenta' : 'Imprimir orden'}
                                                    disabled={printingOrderId === order.id}
                                                >
                                                    <Printer className={`w-5 h-5 ${printingOrderId === order.id ? 'animate-pulse' : ''}`} />
                                                </button>
                                                <Button
                                                    onClick={(e) => handleCompleteOrder(order.id, e)}
                                                    className={`h-9 px-4 text-xs ${isBill ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} border-transparent`}
                                                    icon={<Check className="w-4 h-4" />}
                                                >
                                                    {isBill ? 'Entregada' : 'Listo'}
                                                </Button>
                                                <div className="text-gray-400">
                                                    {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedOrder === order.id && (
                                            <div className={`px-4 pb-4 pt-0 border-t ${isBill ? 'border-green-200 bg-white' : 'border-gray-200 bg-white'} mt-2`}>
                                                {isBill && (
                                                    <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3 mt-3 flex items-center gap-2">
                                                        <Receipt className="w-5 h-5 text-green-600" />
                                                        <p className="text-sm text-green-700 font-medium">
                                                            El cliente ha solicitado la cuenta. Puedes imprimir el ticket y entregárselo.
                                                        </p>
                                                    </div>
                                                )}
                                                <ul className="divide-y divide-gray-100">
                                                    {(isBill ? allTableItems : order.items.filter(item => item.id !== 'bill-req' && !item.name?.includes('SOLICITUD DE CUENTA'))).map((item, idx) => (
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
                        <h2 className="text-lg font-serif font-bold text-brand-900">Configuración</h2>
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
                                    className="!px-6 !py-2.5 bg-accent-500 !text-brand-900 hover:bg-accent-600 border-none font-bold"
                                >
                                    Abrir Preview
                                </Button>
                            </div>
                        </div>

                        {/* DIAGNOSTIC CARD (NEW) */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-500/30 transition-all md:col-span-2">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Diagnóstico y Permisos</h3>
                                    <p className="text-xs text-gray-500">Arreglar problemas de conexión (0 items)</p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => setShowSqlModal(true)}
                                className="!px-3 !py-2 shadow-none border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <Terminal className="w-4 h-4 mr-2" />
                                Ver SQL
                            </Button>
                        </div>

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

                        {/* Printer Card (Connection) */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                            ${mainPrinter.isConnected
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-gray-50 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900'
                                    }
                        `}>
                                    <Printer className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-brand-900">Conexión</h3>
                                        {connectedPrintersCount > 0 && (
                                            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                                {connectedPrintersCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Hardware y Red</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => onNavigate(AppView.PRINTER_SETUP)} className="!px-3 !py-2 shadow-none">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* Ticket Config Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/20 transition-all md:col-span-2">
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
                    </div>
                </div>

            </main>
        </div>
    );
};
