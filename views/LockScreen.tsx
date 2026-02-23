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

        // Execute synchronously without setTimeout to avoid microtask/unmount clashes
        try {
            const success = unlockRole(pin);
            if (!success) {
                setError("Código incorrecto");
                setIsLoading(false);
            } else {
                console.log('✅ Role unlocked successfully, LockScreen should unmount now.');
                // State updates internally, LockScreen will unmount automatically
            }
        } catch (e) {
            console.error('Error in unlockRole:', e);
            setError("Ocurrió un error");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[96vh] flex flex-col overflow-y-auto animate-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-brand-50 p-4 sm:p-6 flex flex-col items-center border-b border-brand-100">
                    {business.logo ? (
                        <img
                            src={business.logo}
                            alt={business.name}
                            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover shadow-md mb-2 sm:mb-4 border-4 border-white"
                        />
                    ) : (
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-2 sm:mb-4">
                            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500" />
                        </div>
                    )}

                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 text-center">
                        {business.name || 'Restaurante'}
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Acceso Restringido</p>
                </div>

                {/* Role Info */}
                <div className="px-4 py-3 sm:px-6 sm:pt-6 sm:pb-2 text-center">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-100 text-brand-800 rounded-full text-xs sm:text-sm font-semibold">
                        <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {pendingRole.roleName}
                    </div>
                </div>

                {/* PIN Pad */}
                <div className="flex-1 pb-4">
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
        </div>
    );
};
