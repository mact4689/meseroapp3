import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, ChefHat, ArrowRight } from 'lucide-react';
import { AppView } from '../types';
import { useAppStore } from '../store/AppContext';
import { Button } from '../components/Button';

interface SplashProps {
  onNavigate: (view: AppView) => void;
}

export const Splash: React.FC<SplashProps> = ({ onNavigate }) => {
  const { state } = useAppStore();
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    // Intentar navegación automática más rápida
    const timer = setTimeout(() => {
      handleRouting();
    }, 1500);

    const fallbackTimer = setTimeout(() => {
      setShowManualButton(true);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [state.user, state.isOnboarding]); // Dependencias para reaccionar si el usuario carga

  const handleRouting = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('table')) {
      onNavigate(AppView.CUSTOMER_MENU);
      return;
    }

    if (!state.user) {
      onNavigate(AppView.LANDING);
      return;
    }

    // Lógica de Onboarding estricta
    if (state.isOnboarding) {
       if (!state.business.name) {
         onNavigate(AppView.BUSINESS_SETUP);
       } else if (state.menu.length === 0) {
         onNavigate(AppView.MENU_SETUP);
       } else if (state.tables.generated.length === 0) {
         onNavigate(AppView.TABLE_SETUP);
       } else {
         onNavigate(AppView.PRINTER_SETUP);
       }
       return;
    }

    // Verificar si falta configuración esencial aunque no esté en modo onboarding explícito
    if (!state.business.name) {
      onNavigate(AppView.BUSINESS_SETUP);
    } else {
      onNavigate(AppView.DASHBOARD);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-900 items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo Animation */}
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-accent-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto relative z-10">
            <UtensilsCrossed className="w-16 h-16 text-brand-900" />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-accent-500 text-white p-3 rounded-2xl shadow-xl transform rotate-12 z-20">
            <ChefHat className="w-8 h-8" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3 mb-8">
          <h1 className="font-serif text-5xl text-white tracking-tight opacity-0 animate-[fadeIn_0.5s_ease-out_0.3s_forwards]">
            MeseroApp
          </h1>
          <p className="text-gray-400 text-base tracking-widest uppercase opacity-0 animate-[slideUp_0.5s_ease-out_0.6s_forwards]">
            Tu restaurante, inteligente.
          </p>
        </div>

        {/* Loading Indicator */}
        {!showManualButton ? (
          <div className="mt-8 flex space-x-2 opacity-0 animate-[fadeIn_0.5s_ease-out_0.8s_forwards]">
              <div className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
              <div className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
              <div className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-xs">
            <Button 
              onClick={handleRouting} 
              fullWidth
              className="bg-white text-brand-900 hover:bg-gray-100"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Iniciar
            </Button>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-8 text-white/20 text-xs">
        v1.0.0
      </div>
    </div>
  );
};