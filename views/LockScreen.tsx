import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { PinPad } from '../components/PinPad';
import { Lock, Shuffle } from 'lucide-react';

export const LockScreen: React.FC = () => {
    const { state, unlockRole } = useAppStore();
    const { pendingRole, business } = state;
    const [error, setError] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);

    if (!pendingRole) return null;

    const handlePinComplete = async (pin: string) => {
        setIsLoading(true);
        setError(undefined);

        // Use setTimeout to simulate a brief "verifying" state for UX
        setTimeout(() => {
            const success = unlockRole(pin);
            if (!success) {
                setError("Código incorrecto");
                setIsLoading(false);
            } else {
                // Success! unlockRole handles state update
            }
        }, 300);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-brand-50 p-6 flex flex-col items-center border-b border-brand-100">
                    {business.logo ? (
                        <img
                            src={business.logo}
                            alt={business.name}
                            className="w-20 h-20 rounded-full object-cover shadow-md mb-4 border-4 border-white"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                            <Lock className="w-8 h-8 text-brand-500" />
                        </div>
                    )}

                    <h1 className="text-xl font-bold text-gray-900 text-center">
                        {business.name || 'Restaurante'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Acceso Restringido</p>
                </div>

                {/* Role Info */}
                <div className="px-6 pt-6 pb-2 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-800 rounded-full text-sm font-semibold mb-2">
                        <Shuffle className="w-4 h-4" />
                        {pendingRole.roleName}
                    </div>
                </div>

                {/* PIN Pad */}
                <PinPad
                    length={4}
                    title=""
                    description="Ingresa el PIN de 4 dígitos para acceder"
                    onComplete={handlePinComplete}
                    error={error}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
