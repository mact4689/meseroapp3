import React from 'react';
import { Button } from '../components/Button';
import { UtensilsCrossed, ChefHat, Smartphone, Zap, LayoutDashboard, QrCode, ArrowRight } from 'lucide-react';
import { AppView } from '../types';

interface LandingProps {
  onNavigate: (view: AppView) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-brand-900 text-white overflow-x-hidden selection:bg-accent-500 selection:text-brand-900">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-brand-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20">
              <UtensilsCrossed className="w-6 h-6 text-brand-900" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">MeseroApp</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate(AppView.LOGIN)}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block"
            >
              Iniciar Sesión
            </button>
            <Button
              onClick={() => onNavigate(AppView.REGISTER)}
              className="!bg-accent-500 hover:!bg-accent-600 !text-brand-900 font-bold px-6 py-2 rounded-lg transition-all"
            >
              Empezar
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Abstract Background Effects (Nano Banana Aesthetic) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm fade-in">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide uppercase text-accent-500">Gestión Gastronómica Inteligente</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto slide-up">
            El sistema operativo para tu <span className="text-accent-500 italic">restaurante</span>.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed slide-up" style={{ animationDelay: '0.1s' }}>
            Optimiza pedidos, gestiona tu cocina y encanta a tus clientes con una experiencia digital fluida. Diseñado para la era moderna.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 slide-up" style={{ animationDelay: '0.2s' }}>
            <Button
              onClick={() => onNavigate(AppView.REGISTER)}
              className="w-full sm:w-auto text-lg px-8 py-4 !bg-accent-500 hover:!bg-accent-600 !text-brand-900 font-bold shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)]"
            >
              Crear Cuenta Gratis
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate(AppView.LOGIN)}
              className="w-full sm:w-auto text-lg px-8 py-4 !bg-white/5 hover:!bg-white/10 !text-white !border-white/10 backdrop-blur-sm"
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-brand-900/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-all hover:bg-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-brand-900" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Menú Digital QR</h3>
              <p className="text-gray-400 leading-relaxed">
                Tus clientes escanean y ordenan al instante. Sin esperas, sin errores. Actualiza precios y platos en tiempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-all hover:bg-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">KDS Inteligente</h3>
              <p className="text-gray-400 leading-relaxed">
                Cocina sincronizada. Las comandas llegan directo a la pantalla de cocina con tiempos y estados claros.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-all hover:bg-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Control Total</h3>
              <p className="text-gray-400 leading-relaxed">
                Analíticas en tiempo real, gestión de mesas e inventario básico. Todo lo que necesitas para crecer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Section */}
      <div className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ChefHat className="w-16 h-16 text-accent-500 mx-auto mb-8 opacity-20" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Listo para modernizar tu negocio?</h2>
          <button
            onClick={() => onNavigate(AppView.REGISTER)}
            className="group inline-flex items-center gap-2 text-accent-500 font-bold hover:text-accent-400 transition-colors"
          >
            Comienza ahora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-6 mb-4">
          <button onClick={() => onNavigate(AppView.TERMS)} className="hover:text-white transition-colors">Términos</button>
          <button onClick={() => onNavigate(AppView.PRIVACY)} className="hover:text-white transition-colors">Privacidad</button>
        </div>
        <p>© 2024 MeseroApp. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};