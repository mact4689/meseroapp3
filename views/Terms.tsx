import React from 'react';
import { ChevronLeft, Scale, ShieldCheck, FileText, MessageCircle, Lock, CreditCard } from 'lucide-react';
import { Button } from '../components/Button';
import { AppView } from '../types';

interface TermsProps {
    onNavigate: (view: AppView) => void;
}

const termsContent = {
    "title": "Términos y Condiciones para MeseroApp",
    "lastUpdate": "27 de Febrero, 2026",
    "intro": "Estos Términos y Condiciones ('TC') regulan el uso de la plataforma MeseroApp, una solución digital para gestión de menús y pedidos de restaurantes. Al acceder o usar MeseroApp, usted acepta estos TC en su totalidad.",
    "sections": [
        {
            "id": 1,
            "title": "Propiedad Intelectual",
            "content": "Todos los derechos de autor, marcas registradas y demás propiedades intelectuales sobre MeseroApp pertenecen a MeseroApp. Usted adquiere solo una licencia limitada para usar la plataforma según estos TC. No se otorga ninguna otra licencia o derecho sobre el servicio.",
            "iconName": "ShieldCheck"
        },
        {
            "id": 2,
            "title": "Suscripciones",
            "content": "Las suscripciones a MeseroApp están sujetas a los plazos y tarifas establecidos. La cancelación de una suscripción debe ser realizada según las instrucciones proporcionadas dentro de la plataforma. El término de la suscripción se renueva automáticamente hasta que sea cancelado por usted, salvo que se decida suspender o terminar su servicio por incumplimiento.",
            "iconName": "CreditCard"
        },
        {
            "id": 3,
            "title": "Privacidad de Datos",
            "content": "Nos comprometemos a proteger sus datos personales. Al utilizar MeseroApp, usted consiente la recopilación, uso y conservación de sus datos en la medida necesaria para proporcionar el servicio. Conoce más detalles sobre cómo tratamos tus datos en nuestra Política de Privacidad.",
            "iconName": "Lock"
        },
        {
            "id": 4,
            "title": "Responsabilidades del Usuario",
            "content": "Usted se compromete a utilizar MeseroApp conforme a estos TC y la ley vigente. Usted será responsable por el contenido subido, los pedidos realizados y cualquier uso indebido de las credenciales de acceso a la plataforma.",
            "iconName": "MessageCircle"
        },
        {
            "id": 5,
            "title": "Limitación de Responsabilidad",
            "content": "MeseroApp no se hace responsable por ninguna pérdida de ingresos, daños directos o indirectos, o interrupciones del negocio que surjan como resultado del uso o la incapacidad de utilizar la plataforma, salvo lo dispuesto por ley.",
            "iconName": "Scale"
        },
        {
            "id": 6,
            "title": "Modificaciones",
            "content": "Nos reservamos el derecho a modificar estos TC en cualquier momento. Al continuar usando MeseroApp después de tales modificaciones, usted acepta los nuevos términos revisados.",
            "iconName": "FileText"
        }
    ]
};

const IconMap: Record<string, React.ElementType> = {
    ShieldCheck,
    FileText,
    MessageCircle,
    Lock,
    Scale,
    CreditCard
};

export const Terms: React.FC<TermsProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden">
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
                            Última actualización: {termsContent.lastUpdate}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 text-balance">{termsContent.title}</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {termsContent.intro}
                        </p>
                    </div>

                    <div className="grid gap-8">
                        {termsContent.sections.map((section) => {
                            const Icon = IconMap[section.iconName] || FileText;
                            return (
                                <section key={section.id} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-brand-600" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg">{section.id}. {section.title}</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {section.content}
                                    </p>
                                </section>
                            );
                        })}
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
