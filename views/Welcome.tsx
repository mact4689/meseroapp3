import React from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { UtensilsCrossed, CheckCircle2 } from 'lucide-react';

interface WelcomeProps {
  onNavigate: (view: AppView) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-brand-50 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-brand-900/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 w-full max-w-lg mx-auto">

        {/* Main Content Card */}
        <div className="w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-brand-900/5 border border-white relative overflow-hidden text-center space-y-10 fade-in">

          {/* Success Badge */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent-500/20 rounded-full scale-125 animate-ping opacity-10"></div>
            <div className="w-20 h-20 bg-brand-900 rounded-3xl flex items-center justify-center mx-auto relative shadow-xl shadow-brand-900/20">
              <CheckCircle2 className="w-10 h-10 text-accent-500" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6 slide-up">
            <div className="space-y-2">
              <h1 className="font-serif text-3xl md:text-4xl text-brand-900 leading-tight font-bold">
                Bienvenido a MeseroApp
              </h1>
              <div className="h-1 w-12 bg-accent-500 mx-auto rounded-full" />
            </div>

            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              Gracias por confiar en nosotros para <span className="text-brand-900 font-bold italic">automatizar la toma de órdenes por medio de QR</span>.
            </p>

          </div>

          {/* Start Button */}
          <div className="slide-up pt-4" style={{ animationDelay: '0.3s' }}>
            <Button
              fullWidth
              onClick={() => onNavigate(AppView.BUSINESS_SETUP)}
              className="text-xl font-bold py-6 rounded-2xl shadow-2xl shadow-brand-900/20 hover:shadow-brand-900/30 transition-all hover:-translate-y-1 active:scale-95 bg-brand-900 text-white border-none"
            >
              Comenzar
            </Button>
          </div>
        </div>

        {/* MeseroApp Logo Bottom */}
        <div className="mt-12 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-500 fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20">
            <UtensilsCrossed className="w-5 h-5 text-brand-900" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-brand-900">MeseroApp</span>
        </div>
      </div>
    </div>
  );
};