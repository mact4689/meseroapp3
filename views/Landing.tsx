import React from 'react';
import { Button } from '../components/Button';
import { UtensilsCrossed, ChefHat } from 'lucide-react';
import { AppView } from '../types';

interface LandingProps {
  onNavigate: (view: AppView) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-brand-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-900/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm mx-auto space-y-12">

          {/* Logo Section */}
          <div className="text-center space-y-6 fade-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent-500 blur-2xl opacity-20 rounded-full"></div>
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-brand-900/5 flex items-center justify-center mx-auto relative transform rotate-3">
                <UtensilsCrossed className="w-12 h-12 text-brand-900" />
              </div>
              {/* Floating accent icon */}
              <div className="absolute -bottom-2 -right-2 bg-accent-500 text-white p-2 rounded-lg shadow-lg transform -rotate-6">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-4xl text-brand-900 tracking-tight">
                MeseroApp
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Gestión de meseros digitales para tu negocio.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 w-full slide-up" style={{ animationDelay: '0.2s' }}>
            <Button
              fullWidth
              onClick={() => onNavigate(AppView.LOGIN)}
              className="text-lg py-4"
            >
              Iniciar Sesión
            </Button>

            <Button
              fullWidth
              variant="secondary"
              onClick={() => onNavigate(AppView.REGISTER)}
              className="text-lg py-4 border-2 border-transparent bg-white shadow-xl shadow-brand-900/5 hover:border-gray-200"
            >
              Crear Cuenta
            </Button>
          </div>

        </div>
      </div>

      {/* Footer / Legal Links */}
      <div className="py-8 text-center text-sm text-gray-400 relative z-10 fade-in" style={{ animationDelay: '0.4s' }}>
        <p>Al continuar, aceptas nuestros <button onClick={() => onNavigate(AppView.TERMS)} className="underline hover:text-brand-900 transition-colors">Términos</button></p>
      </div>
    </div>
  );
};