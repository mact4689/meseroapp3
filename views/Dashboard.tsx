
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppView } from '../types';
import { Button } from '../components/Button';
import { createOrder } from '../services/db';
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
    Copy,
    Check,
    Clock,
    ChevronDown,
    ChevronUp,
    Zap,
    Eye,
    ExternalLink
} from 'lucide-react';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { state, logout, completeOrder } = useAppStore();
    const { business, menu, tables, user, printers, orders } = state;
    const [copiedUid, setCopiedUid] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const connectedPrintersCount = printers.filter(p => p.isConnected).length;
    const mainPrinter = printers[0];

    // Filter orders
    // Filter orders
    const pendingOrders = orders.filter(o => o.status === 'pending');

    // Daily Stats Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedOrdersToday = orders.filter(o => {
        if (o.status !== 'completed') return false;
        const orderDate = new Date(o.created_at);
        return orderDate >= today;
    });

    const todayTotal = completedOrdersToday.reduce((acc, o) => acc + (o.total || 0), 0);

    const handleLogout = () => {
        logout();
        onNavigate(AppView.LANDING);
    };

    const copyUidToClipboard = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopiedUid(true);
            setTimeout(() => setCopiedUid(false), 2000);
        }
    };

    const toggleOrder = (id: string) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const handleCompleteOrder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await completeOrder(id);
    };

    const handleTestNotification = async () => {
        if (!user) return;
        setIsTesting(true);
        try {
            await createOrder({
                user_id: user.id,
                table_number: 'TEST',
                status: 'pending',
                total: 0.00,
                items: [{
                    id: 'test-item',
                    name: 'Hamburguesa de Prueba',
                    price: '0',
                    category: 'Test',
                    quantity: 1,
                    ingredients: 'Carne, Queso, Pan, Test'
                }]
            });
        } catch (e) {
            console.error("Test order failed", e);
        } finally {
            setIsTesting(false);
        }
    };

    const scrollToOrders = () => {
        const element = document.getElementById('active-orders');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Obtener URL base para el menú público
    const baseUrl = localStorage.getItem('mesero_base_url') || window.location.origin;
    const publicMenuUrl = `${baseUrl.replace(/\/$/, '')}/?table=1&uid=${user?.id}`;

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
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 text-green-600 mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Ventas</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">${todayTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Hoy</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 text-purple-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Órdenes</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-900">{completedOrdersToday.length}</p>
                        <p className="text-xs text-gray-500">Completadas</p>
                    </div>
                </div>

                {/* ACTIVE ORDERS SECTION */}
                <div id="active-orders" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-brand-900 text-lg">Órdenes Activas</h3>
                            {pendingOrders.length > 0 && (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingOrders.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-block text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded-full animate-pulse">
                                ● En tiempo real
                            </span>
                            <button
                                onClick={handleTestNotification}
                                disabled={isTesting}
                                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                                title="Crear orden de prueba para verificar notificaciones"
                            >
                                <Zap className={`w-3 h-3 ${isTesting ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                                {isTesting ? 'Enviando...' : 'Probar Notificación'}
                            </button>
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
                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => toggleOrder(order.id)}
                                    className={`
                                border rounded-xl overflow-hidden transition-all cursor-pointer
                                ${expandedOrder === order.id ? 'border-brand-900 ring-1 ring-brand-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}
                            `}
                                >
                                    {/* Order Header */}
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-brand-900 text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center leading-none">
                                                <span className="text-[10px] font-medium opacity-80">Mesa</span>
                                                <span className="text-xl font-bold">{order.table_number}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-brand-900">Orden #{order.id.slice(0, 4)}</span>
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {order.items.length} items • <span className="font-bold">${(order.total || 0).toFixed(2)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={(e) => handleCompleteOrder(order.id, e)}
                                                className="h-9 px-4 text-xs bg-green-600 hover:bg-green-700 border-transparent"
                                                icon={<Check className="w-4 h-4" />}
                                            >
                                                Listo
                                            </Button>
                                            <div className="text-gray-400">
                                                {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedOrder === order.id && (
                                        <div className="px-4 pb-4 pt-0 border-t border-gray-200 mt-2 bg-white">
                                            <ul className="divide-y divide-gray-100">
                                                {order.items.map((item, idx) => (
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
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Configuration Sections */}
                <div className="space-y-4">
                    <h2 className="text-lg font-serif font-bold text-brand-900">Configuración</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* PREVIEW MENU CARD (NUEVA) */}
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

                {/* UID Footer */}
                <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-50 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">ID del Restaurante (UID)</p>
                    <button
                        onClick={copyUidToClipboard}
                        className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-600 transition-colors"
                        title="Copiar ID"
                    >
                        {user?.id}
                        {copiedUid ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>

            </main>
        </div>
    );
};
