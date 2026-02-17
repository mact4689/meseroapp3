import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import {
  UtensilsCrossed,
  ChefHat,
  Smartphone,
  Zap,
  LayoutDashboard,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  TrendingUp,
  Users,
  Shield,
  Sparkles,
  Monitor,
  Printer,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  ShoppingBag,
  Play,
  Menu,
  X
} from 'lucide-react';
import { AppView } from '../types';

interface LandingProps {
  onNavigate: (view: AppView) => void;
}

// --- Intersection Observer Hook for scroll animations ---
const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

// --- Animated Counter Component ---
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// --- FAQ Accordion Item ---
const FAQItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => (
  <div
    className="border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent-500/30"
    style={{ background: isOpen ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.03)' }}
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 text-left group"
    >
      <span className="font-semibold text-lg text-white group-hover:text-accent-500 transition-colors pr-4">{question}</span>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-accent-500 text-brand-900 rotate-180' : 'bg-white/10 text-white'}`}>
        <ChevronDown className="w-4 h-4" />
      </div>
    </button>
    <div
      className="overflow-hidden transition-all duration-300"
      style={{ maxHeight: isOpen ? '300px' : '0', opacity: isOpen ? 1 : 0 }}
    >
      <p className="px-6 pb-6 text-gray-400 leading-relaxed">{answer}</p>
    </div>
  </div>
);


export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse parallax for hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll to section
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const pos = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
  };

  // Intersection observer sections
  const hero = useInView();
  const stats = useInView();
  const features = useInView();
  const howItWorks = useInView();
  const testimonials = useInView();
  const faq = useInView();
  const cta = useInView();

  const faqs = [
    { q: '¿Necesito descargar alguna aplicación?', a: 'No. MeseroApp es 100% web. Funciona directamente en el navegador de cualquier dispositivo. Tus clientes solo necesitan escanear el QR para ver el menú y ordenar.' },
    { q: '¿Cuánto tiempo toma configurar todo?', a: 'En promedio, los restaurantes configuran su menú digital, mesas y cocina en menos de 15 minutos. Nuestro asistente guiado te lleva paso a paso.' },
    { q: '¿Funciona sin internet?', a: 'MeseroApp necesita conexión a internet para sincronizar pedidos en tiempo real. Sin embargo, el menú del cliente puede cargarse parcialmente offline una vez visitado.' },
    { q: '¿Puedo personalizar el diseño del menú?', a: 'Sí. Puedes añadir fotos HD, categorías personalizadas, descripciones, precios, ingredientes y hasta opciones/variaciones por platillo.' },
    { q: '¿Es gratis?', a: 'MeseroApp ofrece un plan gratuito con todas las funcionalidades esenciales. Planes premium con características avanzadas están disponibles para negocios en crecimiento.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden selection:bg-accent-500 selection:text-brand-900">

      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 bg-[#0a0a0f] ${scrolled ? 'shadow-2xl shadow-black/50 py-3' : 'py-5'} border-b border-white/5`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/25">
              <UtensilsCrossed className="w-5 h-5 text-brand-900" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">MeseroApp</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Funcionalidades</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">Cómo Funciona</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Testimonios</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => onNavigate(AppView.LOGIN)}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </button>
            <Button
              onClick={() => onNavigate(AppView.REGISTER)}
              className="!bg-gradient-to-r !from-accent-500 !to-amber-500 hover:!from-accent-400 hover:!to-amber-400 !text-brand-900 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:scale-105"
            >
              Empezar Gratis
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4 animate-[slideUp_0.3s_ease-out]">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left py-3 text-gray-300 hover:text-white font-medium">Funcionalidades</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-3 text-gray-300 hover:text-white font-medium">Cómo Funciona</button>
            <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left py-3 text-gray-300 hover:text-white font-medium">Testimonios</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-3 text-gray-300 hover:text-white font-medium">FAQ</button>
            <hr className="border-white/10" />
            <button onClick={() => { setMobileMenuOpen(false); onNavigate(AppView.LOGIN); }} className="block w-full text-left py-3 text-gray-300 font-medium">Iniciar Sesión</button>
            <Button
              onClick={() => { setMobileMenuOpen(false); onNavigate(AppView.REGISTER); }}
              fullWidth
              className="!bg-gradient-to-r !from-accent-500 !to-amber-500 !text-brand-900 font-bold"
            >
              Empezar Gratis
            </Button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Orbs */}
          <div
            className="absolute top-0 right-1/4 w-[700px] h-[700px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
              transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
              transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
              transform: `translate(-50%, -50%) translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          />

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent-500/40 rounded-full"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 16}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>

        <div ref={hero.ref} className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text Content */}
            <div className={`space-y-8 transition-all duration-1000 ${hero.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}


              <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-bold leading-snug tracking-tight">
                Transforma tu restaurante en una{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 via-amber-400 to-orange-400 italic pr-2">
                  experiencia fluida y moderna
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
                MeseroApp es tu aliado para modernizar tu restaurante con menús QR inteligentes y pantallas de cocina sincronizadas, eliminando el caos operativo para que tus órdenes fluyan sin errores y tus ventas crezcan exponencialmente.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Button
                  onClick={() => onNavigate(AppView.REGISTER)}
                  className="w-full sm:w-auto text-lg px-8 py-4 !bg-gradient-to-r !from-accent-500 !to-amber-500 hover:!from-accent-400 hover:!to-amber-400 !text-brand-900 font-bold shadow-[0_0_40px_-8px_rgba(212,175,55,0.5)] hover:shadow-[0_0_60px_-8px_rgba(212,175,55,0.7)] hover:scale-[1.03] transition-all duration-300"
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  Crear Cuenta Gratis
                </Button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 text-lg px-8 py-4 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                  Ver cómo funciona
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                  <span>Listo en 5 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                  <span>Soporte incluido</span>
                </div>
              </div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className={`relative transition-all duration-1000 delay-300 ${hero.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/30 to-purple-500/20 blur-3xl rounded-full scale-110" />

              {/* Main Dashboard - REAL INTERFACE RECREATION */}
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl transform lg:rotate-1 hover:rotate-0 transition-all duration-700 max-h-[500px] border border-gray-200">
                {/* Header Profile Section */}
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10 text-gray-900">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-50 border-2 border-pink-100 flex items-center justify-center">
                      <ChefHat className="w-7 h-7 text-pink-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-bold text-gray-900">Tu Restaurante</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">Nombre del Propietario</span>
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100">PROPIETARIO</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Star className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                      <ArrowRight className="w-4 h-4 text-gray-400 rotate-180" />
                    </div>
                  </div>
                </div>

                {/* Dashboard Inner Content */}
                <div className="p-6 space-y-8 bg-gray-50/50">
                  {/* Real Stats Cards Row */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { icon: <UtensilsCrossed className="w-4 h-4" />, label: 'MENÚ', val: '16', sub: 'Editar platillos', color: 'bg-amber-50 text-amber-600' },
                      { icon: <Grid2X2 className="w-4 h-4" />, label: 'MESAS', val: '12', sub: 'Administrar QR', color: 'bg-blue-50 text-blue-600' },
                      { icon: <TrendingUp className="w-4 h-4" />, label: 'VENTAS', val: '$8.4k', sub: 'Ver historial', color: 'bg-emerald-50 text-emerald-600' },
                      { icon: <ShoppingBag className="w-4 h-4" />, label: 'ÓRDENES', val: '61', sub: 'Completadas', color: 'bg-purple-50 text-purple-600' },
                      { icon: <Users className="w-4 h-4" />, label: 'EQUIPO', val: 'Activo', sub: 'Roles', color: 'bg-indigo-50 text-indigo-600' },
                    ].map((card, i) => (
                      <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center mb-2`}>
                          {card.icon}
                        </div>
                        <div className="text-[15px] font-bold text-gray-900">{card.val}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rendimiento Section */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-bold text-gray-800">Rendimiento del Menú</h4>
                      </div>
                      <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        {['7d', '30d', 'Todo'].map((t) => (
                          <span key={t} className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${t === 'Todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: 'Agua de Jamaica', price: '$520', qty: '26 u.', p: 'w-[75%]', color: 'bg-amber-400' },
                        { name: 'Hamburguesa Clásica', price: '$2,400', qty: '16 u.', p: 'w-[50%]', color: 'bg-orange-500' },
                        { name: 'Enchiladas Verdes', price: '$1,680', qty: '14 u.', p: 'w-[40%]', color: 'bg-emerald-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-gray-200 animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-gray-700">{item.name}</span>
                              <span className="text-xs font-bold text-gray-900">{item.price}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex items-center">
                              <div className={`${item.p} h-full ${item.color} rounded-full`} />
                              <span className="ml-auto text-[10px] text-gray-400 font-bold px-1">{item.qty}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating QR Badge - Integrated Style */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xl animate-[float_3s_ease-in-out_infinite]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20">
                    <QrCode className="w-5 h-5 text-brand-900" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-900">Escaneado Real</div>
                    <div className="text-[11px] text-gray-500 italic">Ordena en segundos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SOCIAL PROOF / STATS ═══════════════════════ */}
      <section className="relative py-20 px-6 border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]" />
        <div ref={stats.ref} className="max-w-7xl mx-auto relative z-10">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 transition-all duration-1000 ${stats.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { value: 500, suffix: '+', label: 'Restaurantes activos', icon: <UtensilsCrossed className="w-5 h-5" /> },
              { value: 50000, suffix: '+', label: 'Pedidos procesados', icon: <Smartphone className="w-5 h-5" /> },
              { value: 99, suffix: '%', label: 'Uptime garantizado', icon: <Shield className="w-5 h-5" /> },
              { value: 15, suffix: 'min', label: 'Configuración promedio', icon: <Clock className="w-5 h-5" /> },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-500 group-hover:bg-accent-500/10 group-hover:border-accent-500/20 transition-all duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
      <section id="features" className="py-24 md:py-32 px-6 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div ref={features.ref} className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-20 max-w-3xl mx-auto transition-all duration-1000 ${features.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-xs font-bold text-accent-500 uppercase tracking-wider">Todo en Uno</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Herramientas <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-amber-400">poderosas</span> para tu negocio
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Cada función diseñada para simplificar tu operación y mejorar la experiencia de tus clientes.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <QrCode className="w-7 h-7" />,
                title: 'Menú Digital QR',
                desc: 'Tus clientes escanean y ordenan al instante desde su celular. Fotos HD, categorías y opciones personalizables.',
                gradient: 'from-accent-500 to-amber-600',
                tags: ['Sin App', 'Multi-idioma', 'Tiempo Real']
              },
              {
                icon: <LayoutDashboard className="w-7 h-7" />,
                title: 'Panel de Control',
                desc: 'Visualiza pedidos, mesas y estadísticas en tiempo real. Tu centro de comando para toda la operación.',
                gradient: 'from-violet-500 to-purple-600',
                tags: ['En Vivo', 'Multi-dispositivo', 'Analíticas']
              },
              {
                icon: <ChefHat className="w-7 h-7" />,
                title: 'KDS Inteligente',
                desc: 'Pantalla de cocina digital. Las comandas llegan organizadas con tiempos, prioridad y estados claros.',
                gradient: 'from-emerald-500 to-teal-600',
                tags: ['Alertas Sonoras', 'Multi-estación', 'Auto-prioridad']
              },
              {
                icon: <Menu className="w-7 h-7" />,
                title: 'Editor de Menú Avanzado',
                desc: 'Gestiona platillos, categorías, ingredientes, variaciones, precios y disponibilidad con facilidad.',
                gradient: 'from-orange-500 to-red-600',
                tags: ['Opciones', 'Stock', 'Fotos HD']
              },
              {
                icon: <Printer className="w-7 h-7" />,
                title: 'Impresión de Tickets',
                desc: 'Configura tickets personalizados para cocina y barra. Soporte para impresoras térmicas y convencionales.',
                gradient: 'from-pink-500 to-rose-600',
                tags: ['58mm / 80mm', 'Bluetooth', 'Personalizable']
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Roles de Equipo',
                desc: 'Cuentas para meseros, cocineros y propietarios con permisos diferenciados. Tu operación segura y organizada.',
                gradient: 'from-blue-500 to-cyan-600',
                tags: ['Multi-rol', 'Seguro', 'Escalable']
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group relative p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-500 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20 ${features.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 font-serif text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-5">{feature.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag, j) => (
                    <span key={j} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0e0e1a] to-[#0a0a0f]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }} />

        <div ref={howItWorks.ref} className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className={`text-center mb-20 max-w-3xl mx-auto transition-all duration-1000 ${howItWorks.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <Zap className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">3 Pasos Simples</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Simple para el cliente,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-amber-400">poderoso</span> para ti.
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (desktop) */}
            <div className="hidden md:block absolute top-[100px] left-[17%] right-[17%] h-px bg-gradient-to-r from-accent-500/30 via-purple-500/30 to-emerald-500/30" />

            {[
              {
                step: 1,
                icon: <QrCode className="w-6 h-6" />,
                title: 'Escanea',
                desc: 'El cliente escanea el código QR de su mesa con la cámara de su celular. No necesita app.',
                color: 'accent',
                gradient: 'from-accent-500 to-amber-600'
              },
              {
                step: 2,
                icon: <Smartphone className="w-6 h-6" />,
                title: 'Ordena',
                desc: 'Navega el menú, elige opciones, añade notas especiales y envía el pedido directo a la cocina.',
                color: 'purple',
                gradient: 'from-purple-500 to-violet-600'
              },
              {
                step: 3,
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: 'Gestiona',
                desc: 'Recibe la comanda, prepara y actualiza el estado. El cliente ve su progreso en tiempo real.',
                color: 'emerald',
                gradient: 'from-emerald-500 to-teal-600'
              }
            ].map((s, i) => (
              <div
                key={i}
                className={`relative text-center transition-all duration-700 ${howItWorks.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                {/* Step Number Circle */}
                <div className="relative inline-block mb-8">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {s.icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0a0a0f] border-2 border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {s.step}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 font-serif">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section id="testimonials" className="py-24 md:py-32 px-6 relative">
        <div ref={testimonials.ref} className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-16 max-w-3xl mx-auto transition-all duration-1000 ${testimonials.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
              <Star className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-xs font-bold text-accent-500 uppercase tracking-wider">Testimonios</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Lo que dicen nuestros <span className="text-accent-500">clientes</span>
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Carlos Mendoza',
                role: 'Dueño, Tacos El Patrón',
                text: 'MeseroApp transformó nuestro servicio. Los clientes ordenan desde su celular y la cocina recibe todo al instante. Redujimos errores en un 90%.',
                rating: 5
              },
              {
                name: 'Ana Lucía Ramírez',
                role: 'Gerente, Café Botánico',
                text: 'La pantalla de cocina (KDS) es increíble. Ya no hay gritos ni papeles perdidos. Todo fluye perfectamente y nuestro tiempo de servicio mejoró mucho.',
                rating: 5
              },
              {
                name: 'Roberto Garza',
                role: 'Chef, Mariscos del Puerto',
                text: 'En 10 minutos tenía todo configurado. El menú con fotos se ve espectacular y mis clientes están encantados. Muy intuitivo y profesional.',
                rating: 5
              }
            ].map((t, i) => (
              <div
                key={i}
                className={`p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-500 ${testimonials.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent-500 text-accent-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 leading-relaxed mb-6 italic">"{t.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section id="faq" className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" />
        <div ref={faq.ref} className="max-w-3xl mx-auto relative z-10">
          {/* Section Header */}
          <div className={`text-center mb-16 transition-all duration-1000 ${faq.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Preguntas <span className="text-accent-500">frecuentes</span>
            </h2>
            <p className="text-gray-400 text-lg">Todo lo que necesitas saber antes de comenzar.</p>
          </div>

          {/* FAQ Items */}
          <div className={`space-y-3 transition-all duration-1000 delay-200 ${faq.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {faqs.map((item, i) => (
              <FAQItem
                key={i}
                question={item.q}
                answer={item.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d15]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)' }} />

        <div ref={cta.ref} className="max-w-5xl mx-auto relative z-10">
          <div className={`bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-[3rem] border border-white/10 p-12 md:p-20 text-center backdrop-blur-sm transition-all duration-1000 ${cta.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-accent-500 to-amber-600 flex items-center justify-center shadow-xl shadow-accent-500/25">
              <UtensilsCrossed className="w-10 h-10 text-brand-900" />
            </div>

            <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
              ¿Listo para modernizar tu restaurante?
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Únete a cientos de restaurantes que ya están usando MeseroApp para optimizar su servicio y encantar a sus clientes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => onNavigate(AppView.REGISTER)}
                className="w-full sm:w-auto text-lg px-10 py-5 !bg-gradient-to-r !from-accent-500 !to-amber-500 hover:!from-accent-400 hover:!to-amber-400 !text-brand-900 font-bold shadow-[0_0_50px_-10px_rgba(212,175,55,0.5)] hover:shadow-[0_0_70px_-10px_rgba(212,175,55,0.7)] hover:scale-[1.03] transition-all duration-300"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Crear Cuenta Gratis
              </Button>
              <Button
                variant="secondary"
                onClick={() => onNavigate(AppView.LOGIN)}
                className="w-full sm:w-auto text-lg px-10 py-5 !bg-white/5 hover:!bg-white/10 !text-white !border-white/10 backdrop-blur-sm"
              >
                Ya tengo cuenta
              </Button>
            </div>

            <p className="mt-8 text-sm text-gray-600">Sin tarjeta de crédito • Cancelación en cualquier momento</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-amber-600 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-brand-900" />
              </div>
              <span className="font-serif font-bold text-lg">MeseroApp</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <button onClick={() => onNavigate(AppView.TERMS)} className="text-sm text-gray-500 hover:text-white transition-colors">Términos</button>
              <button onClick={() => onNavigate(AppView.PRIVACY)} className="text-sm text-gray-500 hover:text-white transition-colors">Privacidad</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-gray-500 hover:text-white transition-colors">FAQ</button>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} MeseroApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════ GLOBAL KEYFRAMES ═══════════════════════ */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};