
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import {
  UtensilsCrossed,
  QrCode,
  Smartphone,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  Printer,
  Menu,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface WebsiteProps {
  onNavigate: (view: AppView) => void;
}

export const Website: React.FC<WebsiteProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterApp = () => {
    onNavigate(AppView.LANDING);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 font-sans text-brand-900 overflow-x-hidden selection:bg-accent-500 selection:text-white">

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-brand-900 text-white p-2 rounded-xl">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">MeseroApp</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-brand-900 transition-colors">Características</a>
            <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="hover:text-brand-900 transition-colors">Demo</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-brand-900 transition-colors">Cómo funciona</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate(AppView.LOGIN)} className="hidden md:block text-sm font-semibold text-brand-900 hover:text-accent-600 transition-colors">
              Iniciar Sesión
            </button>
            <Button
              onClick={handleEnterApp}
              className="!py-2.5 !px-5 text-sm bg-brand-900 hover:bg-black shadow-lg shadow-brand-900/20"
            >
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-200/20 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-900/5 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nueva Versión 2.0 Disponible</span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl font-bold text-brand-900 leading-[1.1]">
              La evolución digital de tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-900 to-brand-700">restaurante</span>.
            </h1>

            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl">
              Optimiza cada aspecto de tu servicio. Desde menús QR interactivos hasta una gestión de cocina impecable. Elegancia y eficiencia en una sola plataforma.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleEnterApp}
                className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-brand-900/20 hover:scale-105 transition-transform"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Prueba Gratuita
              </Button>
              <button onClick={(e) => scrollToSection(e, 'features')}
                className="h-14 px-8 rounded-xl font-semibold text-brand-900 hover:bg-white transition-all border border-transparent hover:border-gray-200 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Ver Funcionalidades
              </button>
            </div>

            <div className="pt-8 flex items-center gap-8 text-sm text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span>Configuración en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/20 to-transparent blur-3xl rounded-full"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <div className="bg-brand-900 p-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-gray-400 text-xs font-mono">dashboard.meseroapp.com</div>
              </div>
              <div className="p-6 grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-accent-100 text-accent-600 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Ventas Hoy</span>
                    </div>
                    <div className="text-2xl font-bold text-brand-900">$12,450</div>
                    <div className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowRight className="w-3 h-3 rotate-[-45deg] mr-1" /> +15% vs ayer
                    </div>
                  </div>
                  <div className="bg-brand-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Tiempo Prom.</span>
                    </div>
                    <div className="text-2xl font-bold text-brand-900">18 min</div>
                    <div className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowRight className="w-3 h-3 rotate-[-45deg] mr-1" /> Óptimo
                    </div>
                  </div>
                </div>

                {/* Fake Orders List */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pedidos Recientes</div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-900 font-bold text-sm">#{100 + i}</div>
                        <div>
                          <div className="font-semibold text-brand-900">Mesa {i + 4}</div>
                          <div className="text-xs text-gray-500">Hace {i * 2} min</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${i === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {i === 1 ? 'Preparando' : 'Entregado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Element */}
            <div className="absolute -bottom-10 -right-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-[swing_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-brand-900">Scan & Order</div>
                  <div className="text-xs text-gray-500">Sin esperas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <span className="text-accent-600 font-bold tracking-wider uppercase text-sm mb-3 block">Todo en Uno</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-brand-900">Potentes herramientas para tu negocio</h2>
            <p className="text-gray-500 text-lg">Descubre cómo MeseroApp transforma la operación diaria de tu restaurante con tecnología de punta.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-accent-200 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-accent-600 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white transition-all duration-300">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Menú Digital QR</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Tus clientes escanean y ordenan desde su móvil. Menús hermosos, fotos de alta calidad y actualizaciones instantáneas sin reimprimir.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Sin descargas de app
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Multi-lenguaje
                </li>
              </ul>
            </div>

            {/* Feature 2: Real-time Dashboard */}
            <div className="group p-8 rounded-[2rem] bg-brand-900 text-white border border-brand-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner mb-6 text-accent-400 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Panel de Control en Vivo</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Visualiza cada orden en tiempo real. Controla el flujo de la cocina, estados de mesas y tiempos de preparación desde una pantalla central.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" /> Actualización instantánea
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" /> Ilimitados dispositivos
                </li>
              </ul>
            </div>

            {/* Feature 3: Kitchen Management */}
            <div className="group p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-accent-200 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-brand-900 group-hover:scale-110 group-hover:bg-brand-900 group-hover:text-white transition-all duration-300">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Gestión de Cocina</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Adiós a los gritos y papeles perdidos. Las comandas llegan ordenadas, claras y se priorizan automáticamente.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Pantalla KDS (Kitchen Display)
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Alertas sonoras
                </li>
              </ul>
            </div>

            {/* Feature 4: Menu Management */}
            <div className="group p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-accent-200 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Menu className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Editor de Menú Avanzado</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Control total sobre tus platillos. Gestiona ingredientes, categorías, precios y disponibilidad con un par de clics.
              </p>
            </div>

            {/* Feature 5: Ticket Config */}
            <div className="group p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-accent-200 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Printer className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Configuración de Tickets</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Personaliza tus comandas impresas. Define qué se imprime en barra y qué en cocina. Soporte para múltiples impresoras.
              </p>
            </div>

            {/* Feature 6: Team */}
            <div className="group p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-accent-200 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Roles de Equipo</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Cuentas específicas para meseros, cocineros y administradores. Mantén tu operación segura y organizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo / Abstract UI Section */}
      <section id="demo" className="py-24 px-6 bg-brand-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-800 via-brand-900 to-black opacity-60"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-16">
            Diseñado para ser <span className="text-accent-500">intuitivo</span>.
          </h2>

          <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-brand-800/50 backdrop-blur">
            {/* Browser Toolbar Mockup */}
            <div className="h-10 bg-brand-950/50 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <div className="ml-4 flex-1 h-6 bg-white/5 rounded-md max-w-sm"></div>
            </div>

            {/* Content Mockup */}
            <div className="p-8 grid md:grid-cols-12 gap-6 text-left">
              <div className="md:col-span-3 space-y-4">
                <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-white/5 rounded"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-10 w-full bg-accent-500/20 border-l-4 border-accent-500 rounded-r flex items-center px-3 text-accent-400 font-medium text-sm">Dashboard</div>
                  <div className="h-10 w-full hover:bg-white/5 rounded flex items-center px-3 text-gray-400 text-sm">Menú</div>
                  <div className="h-10 w-full hover:bg-white/5 rounded flex items-center px-3 text-gray-400 text-sm">Mesas</div>
                </div>
              </div>
              <div className="md:col-span-9 grid gap-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="h-8 w-8 bg-blue-500/20 rounded-lg mb-2"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-24 bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="h-8 w-8 bg-purple-500/20 rounded-lg mb-2"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-24 bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="h-8 w-8 bg-green-500/20 rounded-lg mb-2"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="h-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-500">
                  Gráfica de Ventas Semanal
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-brand-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-16">
            <span className="text-accent-600 font-bold tracking-wider uppercase text-sm mb-2 block">El Proceso</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-900">Simple para el cliente,<br />potente para ti.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-[20%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-start h-full">
              <div className="w-14 h-14 bg-brand-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6 relative">
                1
                <span className="absolute -bottom-2 -right-2 bg-accent-500 rounded-full p-1"><QrCode className="w-3 h-3 text-brand-900" /></span>
              </div>
              <h3 className="text-xl font-bold mb-3">Escanea</h3>
              <p className="text-gray-500 leading-relaxed">El cliente escanea el código QR único de su mesa. Sin apps, funciona con la cámara.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-start h-full mt-8 md:mt-0">
              <div className="w-14 h-14 bg-brand-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6 relative">
                2
                <span className="absolute -bottom-2 -right-2 bg-accent-500 rounded-full p-1"><Smartphone className="w-3 h-3 text-brand-900" /></span>
              </div>
              <h3 className="text-xl font-bold mb-3">Ordena</h3>
              <p className="text-gray-500 leading-relaxed">Navega el menú digital, selecciona opciones y envía la orden directo a la cocina.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-start h-full mt-16 md:mt-0">
              <div className="w-14 h-14 bg-brand-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6 relative">
                3
                <span className="absolute -bottom-2 -right-2 bg-accent-500 rounded-full p-1"><CheckCircle2 className="w-3 h-3 text-brand-900" /></span>
              </div>
              <h3 className="text-xl font-bold mb-3">Gestiona</h3>
              <p className="text-gray-500 leading-relaxed">Recibe la comanda, prepara y sirve. Actualiza el estado para que el cliente sepa que va en camino.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto bg-brand-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-500/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para modernizar tu restaurante?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Únete a los restaurantes que ya están usando MeseroApp para mejorar sus ventas y servicio.
            </p>
            <Button
              onClick={handleEnterApp}
              className="h-16 px-10 text-xl shadow-xl shadow-accent-500/20 hover:scale-105 active:scale-95 transition-all bg-accent-500 hover:bg-accent-400 text-brand-900 font-bold border-none"
              icon={<ArrowRight className="w-6 h-6" />}
            >
              Crear Cuenta Gratis
            </Button>
            <p className="mt-6 text-sm text-gray-500">No se requiere tarjeta de crédito • Cancelación en cualquier momento</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-xl text-brand-900">MeseroApp</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 MeseroApp. Todos los derechos reservados.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors text-sm font-medium">Términos</a>
            <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors text-sm font-medium">Privacidad</a>
            <a href="#" className="text-gray-400 hover:text-brand-900 transition-colors text-sm font-medium">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
