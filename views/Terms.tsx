import React from 'react';
import { ChevronLeft, Scale, ShieldCheck, FileText, MessageCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { AppView } from '../types';

interface TermsProps {
    onNavigate: (view: AppView) => void;
}

export const Terms: React.FC<TermsProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-900/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

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
                    <Scale className="w-5 h-5 text-brand-500" />
                    Términos y Condiciones
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10 max-w-3xl mx-auto w-full">
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-brand-900/5 space-y-8 fade-in">

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5" />
                            Última actualización: 28 de Enero, 2026
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Bienvenido a MeseroApp</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Al utilizar nuestra plataforma, usted acepta cumplir con los siguientes términos y condiciones. Por favor, léalos cuidadosamente antes de comenzar a usar nuestros servicios.
                        </p>
                    </div>

                    <div className="grid gap-8">
                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">1. Uso del Servicio</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                MeseroApp es una plataforma SaaS destinada a la gestión de menús digitales y pedidos para restaurantes. Usted se compromete a utilizar la aplicación de manera legal y ética, garantizando que la información proporcionada sobre su negocio es verídica.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-brand-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">2. Cuentas y Seguridad</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Usted es responsable de mantener la confidencialidad de sus credenciales de acceso. MeseroApp no se hace responsable por pérdidas derivadas del uso no autorizado de su cuenta debido a negligencia en la protección de sus datos de acceso.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <Scale className="w-4 h-4 text-brand-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">3. Responsabilidad</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Aunque nos esforzamos por mantener la plataforma operativa las 24 horas del día, no garantizamos que el servicio sea ininterrumpido o libre de errores. MeseroApp no se responsabiliza por pérdidas económicas directas o indirectas derivadas del uso de la aplicación.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-brand-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">4. Contacto</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Si tiene alguna pregunta sobre estos términos, puede contactarnos a través de nuestro soporte técnico en la sección de ayuda del dashboard.
                            </p>
                        </section>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <Button
                            fullWidth
                            onClick={() => onNavigate(AppView.LANDING)}
                            className="py-4"
                        >
                            He leído y acepto los términos
                        </Button>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-400 text-xs pb-12">
                    &copy; 2026 MeseroApp. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
};
