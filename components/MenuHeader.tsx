
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
                <div className="bg-amber-500 text-brand-900 px-6 py-2.5 flex items-center justify-between sticky top-0 z-[100] shadow-md">
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
                <div className="relative h-48 bg-brand-900 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>
                <div className="px-6 pb-6 -mt-16 relative">
                    <div className="flex justify-between items-end">
                        <div className="bg-white p-1.5 rounded-2xl shadow-xl">
                            {business.logo ? (
                                <img src={business.logo} alt="Logo" className="w-24 h-24 rounded-xl object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-brand-900 border border-gray-100">
                                    <Store className="w-10 h-10 opacity-20" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2 flex flex-col items-end">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/90 backdrop-blur text-brand-900 text-sm font-bold border border-gray-200 shadow-sm mb-1">
                                Mesa {tableId || '1'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h1 className="font-serif text-3xl font-bold text-brand-900 leading-tight tracking-tight">{business.name || 'Restaurante'}</h1>
                        <p className="text-gray-500 text-base font-medium mt-1">{business.cuisine || 'Menú Digital'}</p>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};
