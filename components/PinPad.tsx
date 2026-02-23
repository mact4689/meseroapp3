import React, { useState } from 'react';
import { Delete, Lock } from 'lucide-react';

interface PinPadProps {
    onComplete: (pin: string) => void;
    length?: number;
    title?: string;
    description?: string;
    error?: string;
    isLoading?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
    onComplete,
    length = 4,
    title = "Ingresa tu Código",
    description = "Código de acceso de 4 dígitos",
    error,
    isLoading = false
}) => {
    const [pin, setPin] = useState('');

    const handleNumberClick = (num: number) => {
        if (isLoading) return;
        if (pin.length < length) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === length) {
                onComplete(newPin);
            }
        }
    };

    const handleDelete = () => {
        if (isLoading) return;
        setPin(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        if (isLoading) return;
        setPin('');
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-300">
            {(title || description) && (
                <div className="mb-4 sm:mb-6 text-center">
                    {title && (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-brand-900 border border-brand-100 shadow-sm">
                            <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                    )}
                    {title && <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{title}</h2>}
                    {description && <p className="text-gray-500 text-xs sm:text-sm">{description}</p>}
                </div>
            )}

            {/* PIN Display */}
            <div className="flex gap-4 mb-6 sm:mb-8 justify-center">
                {Array.from({ length }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${i < pin.length
                            ? 'bg-brand-900 scale-110'
                            : 'bg-gray-200'
                            } ${error ? 'bg-red-500' : ''}`}
                    />
                ))}
            </div>

            {error && (
                <div className="text-red-500 text-sm font-medium mb-4 sm:mb-6 animate-pulse text-center">
                    {error}
                </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        disabled={isLoading}
                        className="h-12 sm:h-16 w-full rounded-2xl bg-white border border-gray-100 shadow-sm text-xl sm:text-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-brand-200 hover:text-brand-900 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={handleClear}
                    disabled={isLoading || pin.length === 0}
                    className="h-12 sm:h-16 w-full rounded-2xl bg-gray-50 text-xs sm:text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all outline-none flex items-center justify-center disabled:opacity-50"
                >
                    BORRAR
                </button>

                <button
                    onClick={() => handleNumberClick(0)}
                    disabled={isLoading}
                    className="h-12 sm:h-16 w-full rounded-2xl bg-white border border-gray-100 shadow-sm text-xl sm:text-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-brand-200 hover:text-brand-900 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                >
                    0
                </button>

                <button
                    onClick={handleDelete}
                    disabled={isLoading || pin.length === 0}
                    className="h-12 sm:h-16 w-full rounded-2xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all outline-none flex items-center justify-center disabled:opacity-50"
                >
                    <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
            </div>
        </div>
    );
};
