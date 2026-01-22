import React from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeProps {
  onNavigate: (view: AppView) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-brand-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-accent-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-brand-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <div className="w-full max-w-sm mx-auto text-center space-y-8">
          
          {/* Success Icon */}
          <div className="relative inline-block fade-in">
             <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-ping opacity-20"></div>
             <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto relative border-2 border-green-100 shadow-lg shadow-green-900/5">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
             </div>
             <div className="absolute -top-2 -right-2 text-accent-500 animate-bounce" style={{ animationDuration: '3s' }}>
               <Sparkles className="w-6 h-6" />
             </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 slide-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="font-serif text-3xl text-brand-900 leading-tight">
              ¡Cuenta creada! <br/>
              <span className="text-accent-600">Comencemos</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              Configura tu restaurante en 3 simples pasos para empezar a recibir pedidos.
            </p>
          </div>
          
          {/* Divider */}
          <div className="w-16 h-1 bg-brand-900/10 mx-auto rounded-full slide-up" style={{ animationDelay: '0.3s' }}></div>

        </div>
      </div>

      {/* Footer / Action Button */}
      <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] relative z-20 slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="max-w-sm mx-auto">
          <Button 
            fullWidth 
            onClick={() => onNavigate(AppView.BUSINESS_SETUP)}
            className="text-lg py-4 shadow-xl shadow-brand-900/20"
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Configurar mi Negocio
          </Button>
        </div>
      </div>
    </div>
  );
};