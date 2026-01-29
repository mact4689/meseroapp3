import React from 'react';
import { ChevronLeft, ShieldCheck, Eye, Lock, Server, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';
import { AppView } from '../types';

interface PrivacyProps {
    onNavigate: (view: AppView) => void;
}

export const Privacy: React.FC<PrivacyProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-900/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20 flex items-center shadow-sm">
                <button
                    onClick={() => onNavigate(AppView.LANDING)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2 text-gray-600"
                    aria-label="Volver"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-accent-500" />
                    Política de Privacidad
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10 max-w-3xl mx-auto w-full">
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-brand-900/5 space-y-8 fade-in text-slate-700">

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                            <Lock className="w-3.5 h-3.5" />
                            Última actualización: 28 de Enero, 2026
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Tu privacidad es nuestra prioridad</h2>
                        <p className="leading-relaxed">
                            En MeseroApp, nos tomamos muy en serio la seguridad de tus datos y la de tus clientes. Esta política explica cómo recopilamos, usamos y protegemos la información.
                        </p>
                    </div>

                    <div className="grid gap-8">
                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-accent-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">1. Información Recopilada</h3>
                            </div>
                            <p className="leading-relaxed text-sm">
                                Recopilamos información básica del negocio (nombre, correo, datos de menú) y datos transaccionales necesarios para el funcionamiento del servicio de pedidos. No vendemos tus datos a terceros.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                                    <Server className="w-4 h-4 text-accent-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">2. Almacenamiento de Datos</h3>
                            </div>
                            <p className="leading-relaxed text-sm">
                                Toda la información se almacena de forma segura utilizando proveedores de infraestructura líderes en la industria (como Supabase/AWS) con cifrado de datos en reposo y en tránsito.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-accent-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">3. Tus Derechos</h3>
                            </div>
                            <p className="leading-relaxed text-sm">
                                Como usuario, tienes derecho a acceder, rectificar o eliminar tu información personal en cualquier momento a través de la configuración de tu cuenta o contactando a nuestro soporte.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-accent-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">4. Cookies y Seguimiento</h3>
                            </div>
                            <p className="leading-relaxed text-sm">
                                Utilizamos cookies esenciales para mantener tu sesión activa y mejorar la experiencia de usuario. No utilizamos cookies de seguimiento publicitario de terceros.
                            </p>
                        </section>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <Button
                            fullWidth
                            onClick={() => onNavigate(AppView.LANDING)}
                            className="py-4 bg-accent-600 hover:bg-accent-700"
                        >
                            Cerrar y Volver
                        </Button>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-400 text-xs pb-12">
                    &copy; 2026 MeseroApp. Tu seguridad es nuestro compromiso.
                </div>
            </div>
        </div>
    );
};
