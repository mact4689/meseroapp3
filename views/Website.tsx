
import React from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { UtensilsCrossed, QrCode, Smartphone, ChefHat, ArrowRight, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

interface WebsiteProps {
  onNavigate: (view: AppView) => void;
}

export const Website: React.FC<WebsiteProps> = ({ onNavigate }) => {
  
  const handleEnterApp = () => {
    onNavigate(AppView.LANDING);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Height of nav + breathing room
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-brand-900 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-brand-900 text-white p-1.5 rounded-lg">
               <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">MeseroApp</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-brand-900 transition-colors">Características</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-brand-900 transition-colors">Cómo funciona</a>
            <a href="#pricing" onClick={(e) => e.preventDefault()} className="text-gray-300 cursor-not-allowed" title="Próximamente">Precios</a>
          </div>
          <Button 
            onClick={handleEnterApp}
            className="!py-2 !px-4 text-sm bg-brand-900 hover:bg-black"
          >
            Acceder
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-brand-50">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
         
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sistema de Restaurante v1.0</span>
            </div>
            
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-brand-900 mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0.1s' }}>
              Tu restaurante,<br />
              <span className="text-accent-600">más inteligente.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0.2s' }}>
              Digitaliza tu menú, recibe pedidos por código QR y gestiona las comandas de cocina en tiempo real. Todo en una sola plataforma elegante.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0.3s' }}>
              <Button 
                onClick={handleEnterApp}
                className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-brand-900/20 hover:scale-105 transition-transform"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Comenzar Gratis
              </Button>
              <button onClick={() => {
                  const el = document.getElementById('features');
                  if(el) el.scrollIntoView({behavior: 'smooth'});
                }} 
                className="h-14 px-8 rounded-xl font-semibold text-brand-900 hover:bg-white transition-colors border border-transparent hover:border-gray-200 w-full sm:w-auto"
              >
                Ver Demo
              </button>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas</h2>
              <p className="text-gray-500">Herramientas diseñadas para modernizar tu servicio.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-accent-600 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Menú Digital QR</h3>
                 <p className="text-gray-500 leading-relaxed">
                   Olvídate de los menús de papel. Tus clientes escanean, ven fotos deliciosas y ordenan desde su celular.
                 </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Pedidos al Instante</h3>
                 <p className="text-gray-500 leading-relaxed">
                   Las órdenes llegan directamente a tu panel de control. Sin intermediarios, sin errores de comunicación.
                 </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-brand-900 group-hover:scale-110 transition-transform">
                    <ChefHat className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Gestión de Cocina</h3>
                 <p className="text-gray-500 leading-relaxed">
                   Organiza las comandas, imprime tickets automáticamente y mejora los tiempos de entrega.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-brand-900 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-800 via-brand-900 to-black opacity-40"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
                <span className="text-accent-500 font-bold tracking-wider uppercase text-sm mb-2 block">El Proceso</span>
                <h2 className="font-serif text-3xl md:text-5xl font-bold">Del menú a la mesa</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
                 {/* Dotted Line Connector (Desktop) */}
                 <div className="hidden md:block absolute top-16 left-[20%] right-[20%] border-t-2 border-dashed border-white/10 z-0"></div>

                 {/* Step 1 */}
                 <div className="relative z-10 flex flex-col items-center text-center group">
                     <div className="w-32 h-32 bg-brand-800 rounded-full flex items-center justify-center border-4 border-brand-900 shadow-2xl mb-8 relative transition-transform group-hover:scale-105">
                         <QrCode className="w-12 h-12 text-white" />
                         <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-brand-900 font-bold shadow-lg">1</div>
                     </div>
                     <h3 className="text-2xl font-bold mb-3">Escanea</h3>
                     <p className="text-gray-400 leading-relaxed max-w-xs">El comensal escanea el código QR situado en su mesa usando su smartphone.</p>
                 </div>

                 {/* Step 2 */}
                 <div className="relative z-10 flex flex-col items-center text-center group">
                     <div className="w-32 h-32 bg-brand-800 rounded-full flex items-center justify-center border-4 border-brand-900 shadow-2xl mb-8 relative transition-transform group-hover:scale-105">
                         <Smartphone className="w-12 h-12 text-white" />
                         <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-brand-900 font-bold shadow-lg">2</div>
                     </div>
                     <h3 className="text-2xl font-bold mb-3">Ordena</h3>
                     <p className="text-gray-400 leading-relaxed max-w-xs">Explora el menú visual, personaliza ingredientes y envía la orden a cocina al instante.</p>
                 </div>

                 {/* Step 3 */}
                 <div className="relative z-10 flex flex-col items-center text-center group">
                     <div className="w-32 h-32 bg-brand-800 rounded-full flex items-center justify-center border-4 border-brand-900 shadow-2xl mb-8 relative transition-transform group-hover:scale-105">
                         <CheckCircle2 className="w-12 h-12 text-white" />
                         <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-brand-900 font-bold shadow-lg">3</div>
                     </div>
                     <h3 className="text-2xl font-bold mb-3">Disfruta</h3>
                     <p className="text-gray-400 leading-relaxed max-w-xs">La cocina recibe el ticket, prepara los platillos y el mesero los entrega. ¡Listo!</p>
                 </div>
            </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20 px-6 bg-white overflow-hidden relative">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex-1 space-y-8">
               <h2 className="font-serif text-3xl md:text-5xl font-bold leading-tight text-brand-900">
                 Diseñado para la velocidad y la elegancia.
               </h2>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-brand-900">Carga ultrarrápida</h4>
                      <p className="text-gray-500 text-sm">Tus clientes no esperarán para ver el menú.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-brand-900">Estable y Seguro</h4>
                      <p className="text-gray-500 text-sm">Funciona incluso con conexiones inestables.</p>
                    </div>
                  </div>
               </div>
               <Button onClick={handleEnterApp} className="mt-4">
                 Probar Ahora
               </Button>
            </div>
            
            {/* Abstract UI Representation */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 bg-accent-500 blur-[80px] opacity-20 rounded-full"></div>
                <div className="relative bg-brand-900 p-4 rounded-3xl border border-gray-200 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                   {/* Fake UI Header */}
                   <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-accent-500 rounded-full"></div>
                         <div className="space-y-1">
                            <div className="w-24 h-2 bg-white/20 rounded"></div>
                            <div className="w-16 h-2 bg-white/10 rounded"></div>
                         </div>
                      </div>
                      <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                   </div>
                   {/* Fake UI Items */}
                   <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 bg-brand-800 p-3 rounded-xl border border-white/5">
                           <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                           <div className="flex-1 space-y-2">
                              <div className="w-32 h-2 bg-white/20 rounded"></div>
                              <div className="w-20 h-2 bg-white/10 rounded"></div>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-brand-900 font-bold text-xs">+</div>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-gray-100">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-brand-900" />
              <span className="font-serif font-bold text-xl">MeseroApp</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 MeseroApp. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
               <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors">Términos</a>
               <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors">Privacidad</a>
               <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors">Contacto</a>
            </div>
         </div>
      </footer>
    </div>
  );
};
