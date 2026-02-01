
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Plus, Trash2, ChefHat, Palette, QrCode, Copy, Check, Monitor } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import QRCode from 'qrcode';

interface KDSSetupProps {
    onNavigate: (view: AppView) => void;
}

const STATION_COLORS = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

export const KDSSetup: React.FC<KDSSetupProps> = ({ onNavigate }) => {
    const { state, addStation, removeStation } = useAppStore();
    const { stations, isOnboarding } = state;

    const [newStationName, setNewStationName] = useState('');
    const [selectedColor, setSelectedColor] = useState(STATION_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

    const getKDSUrl = (stationId: string) => {
        const baseUrl = window.location.origin;
        const userId = state.user?.id;
        return `${baseUrl}/?view=KDS&station=${stationId}&uid=${userId}`;
    };

    // Generate QR codes for all stations
    useEffect(() => {
        const generateQRCodes = async () => {
            const codes: Record<string, string> = {};
            for (const station of stations) {
                const url = getKDSUrl(station.id);
                try {
                    const qrDataUrl = await QRCode.toDataURL(url, {
                        width: 120,
                        margin: 1,
                        color: {
                            dark: '#1f2937',
                            light: '#ffffff'
                        }
                    });
                    codes[station.id] = qrDataUrl;
                } catch (err) {
                    console.error('Error generating QR:', err);
                }
            }
            setQrCodes(codes);
        };

        if (stations.length > 0) {
            generateQRCodes();
        }
    }, [stations]);

    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStationName.trim()) {
            alert('Por favor ingresa un nombre para la estación');
            return;
        }

        setIsSubmitting(true);
        try {
            await addStation(newStationName.trim(), selectedColor);
            setNewStationName('');
            // Cycle to next color
            const currentIndex = STATION_COLORS.indexOf(selectedColor);
            setSelectedColor(STATION_COLORS[(currentIndex + 1) % STATION_COLORS.length]);
        } catch (error: any) {
            alert('Error al crear estación: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveStation = async (id: string) => {
        if (confirm('¿Eliminar esta estación? Los platillos asignados quedarán sin estación.')) {
            try {
                await removeStation(id);
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    const handleCopyUrl = (stationId: string) => {
        const url = getKDSUrl(stationId);
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(stationId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleOpenKDS = (stationId: string) => {
        const url = getKDSUrl(stationId);
        window.open(url, '_blank');
    };

    return (
        <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
                {/* Header */}
                {/* Onboarding Header */}
                {isOnboarding ? (
                    <div className="mb-6">
                        <button
                            onClick={() => onNavigate(AppView.BUSINESS_SETUP)}
                            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors mb-4"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center space-x-2 mb-4 w-full">
                                {/* Step 1 - Done */}
                                <div className="flex flex-col items-center gap-1 opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><Check className="w-5 h-5" /></div>
                                </div>
                                <div className="w-3 h-0.5 bg-brand-900"></div>

                                {/* Step 2 - Active */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">2</div>
                                    <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Cocina</span>
                                </div>
                                <div className="w-3 h-0.5 bg-gray-200"></div>

                                {/* Step 3 - Inactive */}
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
                                </div>
                                <div className="w-3 h-0.5 bg-gray-200"></div>

                                {/* Step 4 - Inactive */}
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
                                </div>
                                <div className="w-3 h-0.5 bg-gray-200"></div>

                                {/* Step 5 - Inactive */}
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">5</div>
                                </div>
                            </div>
                            <h2 className="font-serif text-3xl text-brand-900 text-center">Pantallas de Cocina</h2>
                            <p className="text-gray-500 text-center text-sm mt-1">Configura dónde se preparan los alimentos.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <button
                            onClick={() => onNavigate(AppView.DASHBOARD)}
                            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-brand-900 flex items-center justify-center">
                                    <ChefHat className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-2xl text-brand-900">Pantallas de Cocina</h2>
                                    <p className="text-sm text-gray-500">Configura estaciones KDS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                    <p className="font-bold mb-1">💡 ¿Cómo funciona?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                        <li>Crea estaciones (ej: Cocina, Barra, Postres)</li>
                        <li>Asigna cada platillo a una estación en el menú</li>
                        <li><strong>Escanea el QR</strong> con la tablet de cada estación</li>
                        <li>¡Las órdenes aparecerán automáticamente!</li>
                    </ol>
                </div>

                {/* Add Station Form */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-brand-900 text-sm mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nueva Estación
                    </h3>

                    <form onSubmit={handleAddStation} className="space-y-4">
                        <Input
                            placeholder="Nombre (ej: Cocina Caliente)"
                            value={newStationName}
                            onChange={(e) => setNewStationName(e.target.value)}
                            icon={<ChefHat className="w-4 h-4" />}
                            className="bg-white"
                            required
                        />

                        {/* Color Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <Palette className="w-3 h-3" />
                                Color de identificación
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {STATION_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`
                      w-8 h-8 rounded-full transition-all
                      ${selectedColor === color ? 'ring-2 ring-offset-2 ring-brand-900 scale-110' : 'hover:scale-105'}
                    `}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            icon={<Plus className="w-4 h-4" />}
                            className="py-2.5"
                        >
                            Crear Estación
                        </Button>
                    </form>
                </div>

                {/* Stations List */}
                <div className="flex-1">
                    <h3 className="font-bold text-brand-900 text-sm mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Tus Estaciones ({stations.length})
                    </h3>

                    {stations.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                            <ChefHat className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-400">No hay estaciones configuradas</p>
                            <p className="text-xs text-gray-400 mt-1">Crea tu primera estación arriba</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stations.map(station => (
                                <div
                                    key={station.id}
                                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: station.color + '20' }}
                                            >
                                                <ChefHat className="w-5 h-5" style={{ color: station.color }} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{station.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-mono">ID: {station.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveStation(station.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* QR Code and Actions Row */}
                                    <div className="flex gap-4 items-center">
                                        {/* QR Code */}
                                        <div className="shrink-0">
                                            {qrCodes[station.id] ? (
                                                <div className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                                    <img
                                                        src={qrCodes[station.id]}
                                                        alt={`QR ${station.name}`}
                                                        className="w-24 h-24"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <QrCode className="w-8 h-8 text-gray-300 animate-pulse" />
                                                </div>
                                            )}
                                            <p className="text-[9px] text-center text-gray-400 mt-1">
                                                Escanear con tablet
                                            </p>
                                        </div>

                                        {/* Action Buttons - Vertical */}
                                        <div className="flex-1 flex flex-col gap-2">
                                            <button
                                                onClick={() => handleCopyUrl(station.id)}
                                                className={`
                                                    w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all
                                                    ${copiedId === station.id
                                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                {copiedId === station.id ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        ¡Copiado!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        Copiar Link
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleOpenKDS(station.id)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium bg-brand-900 text-white hover:bg-brand-800 transition-colors"
                                            >
                                                <Monitor className="w-3.5 h-3.5" />
                                                Abrir Pantalla
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <Button
                        fullWidth
                        onClick={() => onNavigate(isOnboarding ? AppView.MENU_SETUP : AppView.DASHBOARD)}
                        className="h-12"
                        icon={<Check className="w-5 h-5" />}
                    >
                        {isOnboarding ? 'Continuar' : 'Listo'}
                    </Button>
                    {isOnboarding && (
                        <button
                            type="button"
                            onClick={() => onNavigate(AppView.MENU_SETUP)}
                            className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-medium py-2 transition-colors mt-2"
                        >
                            Omitir por ahora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
