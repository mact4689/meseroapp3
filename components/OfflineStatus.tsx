
import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCcw } from 'lucide-react';

export const OfflineStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            setTimeout(() => setShowRestored(false), 3000);
        };

        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Helper to reload if stuck
    const handleReload = () => {
        window.location.reload();
    };

    if (isOnline && !showRestored) return null;

    return (
        <div className={`
            fixed top-0 left-0 w-full z-[9999] px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold shadow-md transition-all duration-500
            ${isOnline
                ? 'bg-green-500 text-white translate-y-0'
                : 'bg-red-500 text-white translate-y-0'}
            ${isOnline && !showRestored ? '-translate-y-full' : ''}
        `}>
            {isOnline ? (
                <>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>¡Conexión restaurada! Sincronizando...</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4 animate-pulse" />
                    <span>Sin conexión a Internet.</span>
                    <span className="hidden sm:inline font-normal opacity-90">- Revisa tu WiFi.</span>
                    <button
                        onClick={handleReload}
                        className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-colors"
                    >
                        <RefreshCcw className="w-3 h-3" /> Recargar
                    </button>
                </>
            )}
        </div>
    );
};
