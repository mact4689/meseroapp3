
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, User, Shield, Mail, Loader2, Save } from 'lucide-react';
import { AppView, UserRole } from '../types';
import { supabase } from '../services/client';
import { useAppStore } from '../store/AppContext';

interface StaffMember {
    id: string;
    name: string;
    email?: string; // Email might not be directly available in profiles if not joined properly, but let's assume valid profile data
    role: UserRole;
    created_at: string;
}

interface StaffManagementProps {
    onNavigate: (view: AppView) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ onNavigate }) => {
    const { state } = useAppStore();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('waiter');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            if (!state.user?.id) return;

            // Fetch profiles where restaurant_id matches current user id (if owner)
            // Or just fetch all profiles linked to this restaurant
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('restaurant_id', state.user.id);

            if (error) throw error;

            if (data) {
                setStaff(data as unknown as StaffMember[]);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage(null);

        try {
            // In a real app, this would call a Supabase Edge Function to invite a user
            // For now, we'll simulate it or explain strictly that it requires backend logic
            // But we can insert a profile placeholder if we were using a custom auth flow.
            // Since Supabase Auth handles users, we usually use supabase.auth.admin.inviteUserByEmail 
            // but that requires service_role key which is backend only.

            // Alternative: Create a "pending invite" in a separate table, 
            // but for this MVP we might just show a "Not Implemented" or create a dummy profile.

            // Let's trying creating a profile directly? No, profiles trigger from auth.
            // We'll show a realistic message.

            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({
                type: 'success',
                text: 'Para invitar usuarios reales se requiere configurar Supabase Edge Functions. (Simulación exitosa)'
            });
            setInviteEmail('');
            setIsInviting(false);

        } catch (error) {
            setMessage({ type: 'error', text: 'Error al enviar invitación.' });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar a este miembro del equipo?')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStaff(prev => prev.filter(s => s.id !== id));
            setMessage({ type: 'success', text: 'Miembro eliminado correctamente.' });
        } catch (error) {
            console.error('Error deleting member:', error);
            setMessage({ type: 'error', text: 'No se pudo eliminar el miembro.' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => onNavigate(AppView.DASHBOARD)}
                            className="mr-4 p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Gestión de Equipo</h1>
                    </div>
                    <button
                        onClick={() => setIsInviting(true)}
                        className="bg-brand-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Invitar
                    </button>
                </div>
            </div>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' ? <Shield className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-brand-900 animate-spin mb-4" />
                        <p className="text-gray-500">Cargando equipo...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Tu equipo está vacío</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            Invita a meseros y cocineros para que puedan gestionar órdenes y ver la cocina.
                        </p>
                        <button
                            onClick={() => setIsInviting(true)}
                            className="text-brand-900 font-bold hover:underline"
                        >
                            Invitar primer miembro
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {staff.map((member) => (
                                <li key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-900 font-bold text-lg">
                                            {member.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{member.name || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full ${member.role === 'owner' ? 'bg-amber-400' :
                                                    member.role === 'waiter' ? 'bg-blue-400' :
                                                        'bg-purple-400'
                                                    }`} />
                                                {member.role === 'owner' ? 'Dueño' : member.role === 'waiter' ? 'Mesero' : 'Cocinero'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>

            {/* Invite Modal */}
            {isInviting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsInviting(false)} />
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl relative z-10 animate-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Invitar Nuevo Miembro</h3>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                            placeholder="ejemplo@correo.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setInviteRole('waiter')}
                                            className={`p-3 rounded-lg border text-sm font-bold transition-all ${inviteRole === 'waiter'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            Mesero
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            * Para cocina usa las pantallas KDS (no requieren cuenta).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviting(false)}
                                        className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
