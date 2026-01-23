
import React from 'react';
import { Store, ArrowLeft, Eye } from 'lucide-react';
import { AppView } from '../types';

interface MenuHeaderProps {
    business: { name: string, cuisine: string, logo: string | null };
    tableId: string | null;
    isAdminPreview: boolean;
    onNavigate: (view: AppView) => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ business, tableId, isAdminPreview, onNavigate }) => {
    return (
        <React.Fragment>
            {/* ADMIN PREVIEW HEADER */}
            {isAdminPreview && (
                <div className="bg-accent-500 text-brand-900 px-6 py-2.5 flex items-center justify-between sticky top-0 z-[100] shadow-md">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Modo Vista Previa</span>
                    </div>
                    <button
                        onClick={() => onNavigate(AppView.DASHBOARD)}
                        className="bg-brand-900 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver al Panel
                    </button>
                </div>
            )}

            <header className="bg-white shadow-sm relative z-30">
                <div className="relative h-32 bg-brand-900 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl" />
                </div>
                <div className="px-6 pb-4 -mt-10 relative">
                    <div className="flex justify-between items-end">
                        <div className="bg-white p-1 rounded-2xl shadow-lg">
                            {business.logo ? (
                                <img src={business.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-brand-50 flex items-center justify-center text-brand-900">
                                    <Store className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="mb-1 flex flex-col items-end">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-bold border border-accent-100 shadow-sm mb-1">
                                Mesa {tableId || '1'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <h1 className="font-serif text-2xl font-bold text-brand-900 leading-tight">{business.name || 'Restaurante'}</h1>
                        <p className="text-gray-500 text-sm">{business.cuisine || 'Menú Digital'}</p>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};
