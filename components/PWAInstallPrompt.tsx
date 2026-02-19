import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-800 text-white p-4 rounded-xl shadow-2xl border border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-500/20 rounded-lg">
                        <Download className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                        <h3 className="font-bold">Instalar MeseroApp</h3>
                        <p className="text-sm text-gray-400">Accede más rápido desde tu inicio</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors"
                    >
                        Instalar
                    </button>
                </div>
            </div>
        </div>
    );
};
