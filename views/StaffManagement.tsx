
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Shield, Loader2, Save, Edit2, QrCode, X, Check, Copy, ChevronRight, LayoutDashboard, UtensilsCrossed, Grid2X2, ChefHat, Receipt, Users, TrendingUp, Store, ExternalLink } from 'lucide-react';
import { AppView } from '../types';
import { supabase } from '../services/client';
import { useAppStore } from '../store/AppContext';
import QRCode from 'qrcode';

// ─── TYPES ────────────────────────────────────────────────
interface RolePermissions {
    dashboard: boolean;
    orders: boolean;
    menu: boolean;
    tables: boolean;
    kds: boolean;
    tickets: boolean;
    staff: boolean;
    reports: boolean;
    business: boolean;
}

interface CustomRole {
    id: string;
    restaurant_id: string;
    name: string;
    permissions: RolePermissions;
    pin_code?: string;
    created_at: string;
    updated_at: string;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
    dashboard: true,
    orders: true,
    menu: false,
    tables: false,
    kds: false,
    tickets: false,
    staff: false,
    reports: false,
    business: false,
};

// Permission display config mirroring the admin interface
const PERMISSION_CONFIG: { key: keyof RolePermissions; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    { key: 'dashboard', label: 'Panel Principal', description: 'Ver el dashboard con resumen de operaciones', icon: <LayoutDashboard className="w-5 h-5" />, color: 'text-brand-900 bg-brand-50' },
    { key: 'orders', label: 'Órdenes', description: 'Ver y gestionar pedidos activos', icon: <UtensilsCrossed className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' },
    { key: 'menu', label: 'Editar Menú', description: 'Agregar, editar y eliminar platillos', icon: <UtensilsCrossed className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
    { key: 'tables', label: 'Gestión de Mesas', description: 'Configurar mesas y generar códigos QR', icon: <Grid2X2 className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { key: 'kds', label: 'Cocina (KDS)', description: 'Configurar Pantallas de Cocina.', icon: <ChefHat className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'tickets', label: 'Configurar Tickets', description: 'Personalizar formato de impresión', icon: <Receipt className="w-5 h-5" />, color: 'text-pink-600 bg-pink-50' },
    { key: 'staff', label: 'Gestión de Personal', description: 'Administrar roles y equipo', icon: <Users className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'reports', label: 'Reportes y Ventas', description: 'Ver estadísticas e historial de ventas', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
    { key: 'business', label: 'Perfil del Negocio', description: 'Editar nombre, logo y datos del restaurante', icon: <Store className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
];

interface StaffManagementProps {
    onNavigate: (view: AppView) => void;
}

// ─── WIZARD STEPS ─────────────────────────────────────────
type WizardStep = 'name' | 'permissions' | 'security';

export const StaffManagement: React.FC<StaffManagementProps> = ({ onNavigate }) => {
    const { state, logout } = useAppStore();

    // ─── STATE ────────────────────────────────────────────
    const [roles, setRoles] = useState<CustomRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<WizardStep>('name');
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [roleName, setRoleName] = useState('');
    const [permissions, setPermissions] = useState<RolePermissions>({ ...DEFAULT_PERMISSIONS });
    const [pinCode, setPinCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // QR Modal state
    const [qrModalRole, setQrModalRole] = useState<CustomRole | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ─── FETCH ROLES ──────────────────────────────────────
    const fetchRoles = useCallback(async () => {
        if (!state.user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('custom_roles')
                .select('*')
                .eq('restaurant_id', state.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoles((data || []) as CustomRole[]);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setMessage({ type: 'error', text: 'Error al cargar los roles.' });
        } finally {
            setLoading(false);
        }
    }, [state.user?.id]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // ─── WIZARD HANDLERS ──────────────────────────────────
    const openCreateWizard = () => {
        setEditingRole(null);
        setRoleName('');
        setPermissions({ ...DEFAULT_PERMISSIONS });
        setPinCode('');
        setWizardStep('name');
        setWizardOpen(true);
    };

    const openEditWizard = (role: CustomRole) => {
        setEditingRole(role);
        setRoleName(role.name);
        setPermissions({ ...role.permissions });
        setPinCode(role.pin_code || '');
        setWizardStep('name');
        setWizardOpen(true);
    };

    const closeWizard = () => {
        setWizardOpen(false);
        setEditingRole(null);
        setRoleName('');
        setPermissions({ ...DEFAULT_PERMISSIONS });
        setPinCode('');
        setWizardStep('name');
        setLocalError(null);
    };

    const handleSaveRole = async () => {
        if (!state.user?.id || !roleName.trim()) return;
        setSaving(true);
        setLocalError(null);

        // Determinar ID real del restaurante (dueño)
        const currentRestId = state.user.restaurantId || state.user.id;

        try {
            if (editingRole) {
                // UPDATE
                const { error } = await supabase
                    .from('custom_roles')
                    .update({ name: roleName.trim(), permissions, pin_code: pinCode.length === 4 ? pinCode : null, updated_at: new Date().toISOString() })
                    .eq('id', editingRole.id);
                if (error) throw error;
                setMessage({ type: 'success', text: `Rol "${roleName}" actualizado correctamente.` });
            } else {
                // INSERT
                const { error } = await supabase
                    .from('custom_roles')
                    .insert({
                        restaurant_id: currentRestId,
                        name: roleName.trim(),
                        permissions,
                        pin_code: pinCode.length === 4 ? pinCode : null,
                    });
                if (error) throw error;
                setMessage({ type: 'success', text: `Rol "${roleName}" creado exitosamente.` });
            }
            await fetchRoles();
            closeWizard();
        } catch (err: any) {
            console.error('Error saving role:', err);
            setLocalError(err.message || 'Error al guardar el rol. Verifica tu conexión o permisos.');
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE HANDLER ───────────────────────────────────
    const handleDeleteRole = async (id: string) => {
        try {
            const { error } = await supabase
                .from('custom_roles')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setRoles(prev => prev.filter(r => r.id !== id));
            setMessage({ type: 'success', text: 'Rol eliminado correctamente.' });
            setDeletingId(null);
        } catch (err: any) {
            console.error('Error deleting role:', err);
            setMessage({ type: 'error', text: 'No se pudo eliminar el rol.' });
        }
    };

    // ─── QR / LINK GENERATION ─────────────────────────────
    const generateAccessLink = (role: CustomRole): string => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/dashboard?role_id=${role.id}&uid=${state.user?.id}`;
    };

    const openQrModal = async (role: CustomRole) => {
        setQrModalRole(role);
        setCopied(false);
        try {
            const url = generateAccessLink(role);
            const dataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: { dark: '#1a1a2e', light: '#ffffff' },
            });
            setQrDataUrl(dataUrl);
        } catch (err) {
            console.error('Error generating QR:', err);
        }
    };

    const handleCopyLink = async () => {
        if (!qrModalRole) return;
        const url = generateAccessLink(qrModalRole);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Dismiss message after 4s
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Count active permissions
    const countPermissions = (perms: RolePermissions): number => {
        return Object.values(perms).filter(Boolean).length;
    };

    // ─── RENDER ───────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => onNavigate(AppView.DASHBOARD)}
                            className="mr-4 p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Gestión de Roles</h1>
                            <p className="text-xs text-gray-500">Crea y administra roles personalizados</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateWizard}
                        className="bg-brand-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-800 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Rol
                    </button>
                </div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* ═══════ MAIN CONTENT: Roles List ═══════ */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-brand-900 animate-spin mb-4" />
                        <p className="text-gray-500">Cargando roles...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Shield className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay roles creados</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            Crea roles personalizados para tu equipo. Define qué puede ver y hacer cada miembro.
                        </p>
                        <button
                            onClick={openCreateWizard}
                            className="inline-flex items-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-800 transition-all shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Crear primer Rol
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                Roles Creados ({roles.length})
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                >
                                    {/* Role Header */}
                                    <div className="p-5 pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                    {role.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                                                        {role.name}
                                                        {role.pin_code && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100" title="Protegido con PIN">
                                                                🔒 PIN
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                        {countPermissions(role.permissions)} permisos activos
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Permission Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {PERMISSION_CONFIG.filter(p => role.permissions[p.key]).map(p => (
                                                <span key={p.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${p.color}`}>
                                                    {p.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-3 flex items-center gap-2">
                                        <button
                                            onClick={() => openEditWizard(role)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-brand-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => openQrModal(role)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                                        >
                                            <QrCode className="w-3.5 h-3.5" />
                                            Compartir
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(role.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* ═══════════════ CREATE/EDIT WIZARD MODAL ═══════════════ */}
            {wizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeWizard} />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] min-h-[600px] overflow-hidden">

                        {/* Wizard Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {wizardStep === 'name' ? 'Paso 1: Nombre' : 'Paso 2: Permisos'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeWizard} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step Indicators */}
                        <div className="px-5 pt-4 flex gap-2">
                            <div className={`h-1 flex-1 rounded-full transition-colors ${wizardStep === 'name' || wizardStep === 'permissions' || wizardStep === 'security' ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                            <div className={`h-1 flex-1 rounded-full transition-colors ${wizardStep === 'permissions' || wizardStep === 'security' ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                            <div className={`h-1 flex-1 rounded-full transition-colors ${wizardStep === 'security' ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 overflow-y-auto">
                            {wizardStep === 'name' && (
                                <div className="p-5 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nombre del Rol
                                        </label>
                                        <input
                                            type="text"
                                            value={roleName}
                                            onChange={e => setRoleName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium"
                                            placeholder="Ej: Mesero, Cajero, Supervisor..."
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            Elige un nombre descriptivo para identificar este rol fácilmente.
                                        </p>
                                    </div>

                                    {/* Quick Templates */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Plantillas Rápidas</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { name: 'Mesero', perms: { ...DEFAULT_PERMISSIONS, dashboard: true, orders: true } },
                                                { name: 'Cocinero', perms: { ...DEFAULT_PERMISSIONS, dashboard: false, orders: true, kds: true } },
                                                { name: 'Cajero', perms: { ...DEFAULT_PERMISSIONS, dashboard: true, orders: true, reports: true, tickets: true } },
                                                { name: 'Supervisor', perms: { ...DEFAULT_PERMISSIONS, dashboard: true, orders: true, menu: true, reports: true, tables: true } },
                                            ].map(template => (
                                                <button
                                                    key={template.name}
                                                    onClick={() => {
                                                        setRoleName(template.name);
                                                        setPermissions(template.perms);
                                                    }}
                                                    className={`p-3 rounded-xl border text-sm font-bold text-left transition-all ${roleName === template.name
                                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 'permissions' && (
                                <div className="p-5 space-y-3">
                                    <p className="text-sm text-gray-500 mb-3">
                                        Selecciona qué secciones y funciones tendrá disponible el rol <strong className="text-gray-900">{roleName}</strong>.
                                    </p>
                                    {PERMISSION_CONFIG.map(config => (
                                        <label
                                            key={config.key}
                                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${permissions[config.key]
                                                ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${permissions[config.key] ? config.color : 'text-gray-300 bg-gray-100'}`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{config.label}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                                            </div>
                                            <div className="shrink-0">
                                                <div className={`w-12 h-7 rounded-full relative transition-colors ${permissions[config.key] ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${permissions[config.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={permissions[config.key]}
                                                onChange={() => setPermissions(prev => ({ ...prev, [config.key]: !prev[config.key] }))}
                                                className="sr-only"
                                            />
                                        </label>
                                    ))}

                                    <div className="pt-4 text-center pb-2 animate-pulse">
                                        <p className="text-xs text-gray-400 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full">
                                            🔒 El PIN de seguridad se configura en el siguiente paso
                                        </p>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 'security' && (
                                <div className="p-5 space-y-5">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <div className="text-3xl">🔒</div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Seguridad del Rol</h3>
                                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                            Configura un PIN de 4 dígitos para proteger el acceso a este rol. Es opcional pero recomendado.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                            PIN de Acceso (4 dígitos)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={4}
                                            value={pinCode}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setPinCode(val);
                                            }}
                                            className="w-48 px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-3xl font-mono font-bold tracking-[0.5em] focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all bg-white shadow-sm"
                                            placeholder="••••"
                                            autoFocus
                                        />
                                        <div className="h-6 mt-3">
                                            {pinCode.length > 0 && pinCode.length < 4 && (
                                                <p className="text-xs text-red-500 font-bold animate-pulse">Ingresa los 4 dígitos</p>
                                            )}
                                            {pinCode.length === 4 && (
                                                <p className="text-xs text-green-600 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                                                    <Check className="w-3 h-3" /> PIN válido
                                                </p>
                                            )}
                                            {pinCode.length === 0 && (
                                                <p className="text-xs text-gray-400">Sin PIN (acceso libre)</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1.5">
                                            <Shield className="w-3 h-3" />
                                            ¿Cómo funciona?
                                        </h4>
                                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside opacity-80">
                                            <li>Al escanear el QR, se pedirá este PIN.</li>
                                            <li>Si no configuras PIN, el acceso será directo.</li>
                                            <li>Puedes cambiarlo en cualquier momento.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wizard Footer */}
                        <div className="p-5 border-t border-gray-100 bg-white flex flex-col gap-3">
                            {localError && (
                                <div className="p-3 mb-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center justify-between animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <X className="w-4 h-4" />
                                        <span>{localError}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {wizardStep === 'name' && (
                                    <>
                                        <button
                                            onClick={closeWizard}
                                            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => setWizardStep('permissions')}
                                            disabled={!roleName.trim()}
                                            className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            Siguiente
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}

                                {wizardStep === 'permissions' && (
                                    <>
                                        <button
                                            onClick={() => setWizardStep('name')}
                                            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            onClick={() => setWizardStep('security')}
                                            className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Siguiente: Configurar PIN
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}

                                {wizardStep === 'security' && (
                                    <>
                                        <button
                                            onClick={() => setWizardStep('permissions')}
                                            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            onClick={handleSaveRole}
                                            disabled={saving || (pinCode.length > 0 && pinCode.length < 4)}
                                            className="flex-1 py-3 text-sm font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ QR/SHARE MODAL ═══════════════ */}
            {qrModalRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQrModalRole(null)} />
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 overflow-hidden">
                        <button
                            onClick={() => setQrModalRole(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/25">
                                <QrCode className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">Compartir Acceso</h3>
                            <p className="text-sm text-gray-500">
                                Escanea este QR desde otro dispositivo para configurar el rol <strong className="text-gray-700">{qrModalRole.name}</strong>.
                            </p>

                            {/* QR Code */}
                            <div className="my-6 flex justify-center">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="QR de acceso" className="w-48 h-48 rounded-xl border border-gray-100 shadow-sm" />
                                ) : (
                                    <div className="w-48 h-48 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Link display */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Enlace de acceso</p>
                                <p className="text-xs text-gray-600 break-all font-mono leading-relaxed">
                                    {generateAccessLink(qrModalRole)}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <a
                                    href={generateAccessLink(qrModalRole)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2 no-underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Abrir
                                </a>
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copiado
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copiar Enlace
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ DELETE CONFIRMATION MODAL ═══════════════ */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
                    <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl relative z-10 animate-in zoom-in duration-200 p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">¿Eliminar este rol?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Esta acción es permanente y no se puede deshacer. Los dispositivos con este rol perderán acceso.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteRole(deletingId)}
                                className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
