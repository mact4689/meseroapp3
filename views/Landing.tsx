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
  X,
  Tablet,
  Wifi
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
const FAQItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void; id: string }> = ({ question, answer, isOpen, onClick, id }) => (
  <div
    className="border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent-500/30"
    style={{ background: isOpen ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.03)' }}
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 text-left group"
      aria-expanded={isOpen}
      aria-controls={`faq-answer-${id}`}
    >
      <span className="font-semibold text-lg text-white group-hover:text-accent-500 transition-colors pr-4">{question}</span>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-accent-500 text-brand-900 rotate-180' : 'bg-white/10 text-white'}`}>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </div>
    </button>
    <div
      id={`faq-answer-${id}`}
      className="overflow-hidden transition-all duration-300"
      style={{ maxHeight: isOpen ? '300px' : '0', opacity: isOpen ? 1 : 0 }}
      role="region"
      aria-labelledby={`faq-question-${id}`}
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
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const requirements = useInView();

  const faqs = [
    { q: '¿Necesito descargar alguna aplicación?', a: 'No. MeseroApp es 100% web. Funciona directamente en el navegador de cualquier dispositivo. Tus clientes solo necesitan escanear el QR para ver el menú y ordenar.' },
    { q: '¿Cuánto tiempo toma configurar todo?', a: 'En promedio, los restaurantes configuran su menú digital, mesas y cocina en menos de 15 minutos.' },
    { q: '¿Funciona sin internet?', a: 'MeseroApp necesita conexión a internet para sincronizar pedidos en tiempo real. Sin embargo, el menú del cliente puede cargarse parcialmente offline una vez visitado.' },
    { q: '¿Puedo personalizar el diseño del menú?', a: 'Sí. Puedes añadir fotos HD, categorías personalizadas, descripciones, precios, ingredientes y hasta opciones/variaciones por platillo.' },
    { q: '¿Es gratis?', a: 'MeseroApp ofrece una prueba gratuita de 7 días con acceso total a todas las herramientas. Después, podrás seguir impulsando tu negocio por solo $300 pesos al mes.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden selection:bg-accent-500 selection:text-brand-900">

      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 bg-[#0a0a0f] ${scrolled ? 'shadow-2xl shadow-black/50 py-3' : 'py-5'} border-b border-white/5`} role="navigation" aria-label="Navegación principal">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <button 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="MeseroApp - Volver al inicio"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/25">
              <UtensilsCrossed className="w-5 h-5 text-brand-900" aria-hidden="true" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">MeseroApp</span>
          </button>

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
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
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

      <main id="main-content">
        {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
        <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
                    icon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
                  >
                    Prueba Gratis por 7 Días
                  </Button>
                </div>
              </div>

              {/* Right - Dashboard Preview */}
              <div className={`relative transition-all duration-1000 delay-300 ${hero.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/30 to-purple-500/20 blur-3xl rounded-full scale-110" aria-hidden="true" />

                {/* Main Infographic - BLACK & GOLD */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl transform lg:rotate-1 hover:rotate-0 transition-all duration-700 border border-white/10 group">
                  <img
                    src="/infografia.png"
                    alt="Infografía del sistema MeseroApp mostrando el flujo de pedidos y gestión"
                    className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    width="600"
                    height="450"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
        <section id="features" className="py-24 md:py-32 px-6 relative scroll-mt-24">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
          <div ref={features.ref} className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className={`text-center mb-20 max-w-3xl mx-auto transition-all duration-1000 ${features.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-500" aria-hidden="true" />
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
                  tags: ['Tiempo Real']
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
                  tags: ['Alertas Sonoras', 'Multi-estación']
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
                  title: 'Gestión Avanzada de Equipo',
                  desc: 'Crea roles personalizados y define permisos granulares. Controla quién puede ver ventas, editar el menú o gestionar pedidos con acceso seguro por PIN.',
                  gradient: 'from-blue-500 to-cyan-600',
                  tags: ['Roles Custom', 'Permisos Granulares', 'Seguridad PIN']
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`group relative p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-500 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20 ${features.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`} aria-hidden="true">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-3 font-serif text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed mb-5">{feature.desc}</p>

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
        <section id="how-it-works" className="py-24 md:py-32 px-6 relative overflow-hidden scroll-mt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0e0e1a] to-[#0a0a0f]" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }} aria-hidden="true" />

          <div ref={howItWorks.ref} className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <div className={`text-center mb-20 max-w-3xl mx-auto transition-all duration-1000 ${howItWorks.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                <Zap className="w-3.5 h-3.5 text-accent-500" aria-hidden="true" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">3 Pasos Simples</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                Simple para el cliente,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-amber-400">poderoso</span> para ti.
              </h2>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line (desktop) */}
              <div className="hidden md:block absolute top-[100px] left-[17%] right-[17%] h-px bg-gradient-to-r from-accent-500/30 via-purple-500/30 to-emerald-500/30" aria-hidden="true" />

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
                  desc: 'Recibe la comanda, prepara y actualiza el estado.',
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
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-lg`} aria-hidden="true">
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

        {/* ═══════════════════════ REQUIREMENTS ═══════════════════════ */}
        <section id="requirements" className="py-24 md:py-32 px-6 relative">
          <div ref={requirements.ref} className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className={`text-center mb-20 max-w-3xl mx-auto transition-all duration-1000 ${requirements.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <Monitor className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">¿Qué necesitas?</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                Requisitos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">mínimos</span> para empezar
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                No necesitas equipos costosos. MeseroApp está diseñado para funcionar en hardware accesible y fácil de conseguir.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Wifi className="w-7 h-7" />,
                  title: 'Internet Estable',
                  desc: 'Una conexión Wi-Fi o datos móviles para sincronizar tus pedidos en tiempo real.',
                  status: 'Indispensable',
                  color: 'blue'
                },
                {
                  icon: <Tablet className="w-7 h-7" />,
                  title: 'Tablets o Celulares',
                  desc: 'Cualquier dispositivo Android o iOS para ver el KDS en cocina o tomar órdenes.',
                  status: 'Recomendado',
                  color: 'cyan'
                },
                {
                  icon: <Printer className="w-7 h-7" />,
                  title: 'Impresoras Térmicas',
                  desc: 'Modelos de 58mm o 80mm con Bluetooth, USB o Red para tickets físicos.',
                  status: 'Opcional',
                  color: 'amber'
                },
                {
                  icon: <QrCode className="w-7 h-7" />,
                  title: 'Códigos QR',
                  desc: 'Nosotros generamos los QR, tú solo los imprimes en papel, acrílico o madera para tus mesas.',
                  status: 'Incluido',
                  color: 'emerald'
                }
              ].map((req, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-500 ${requirements.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white`} aria-hidden="true">
                    {req.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-white font-serif">{req.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{req.desc}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${req.status === 'Indispensable' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    req.status === 'Opcional' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section id="testimonials" className="py-24 md:py-32 px-6 relative scroll-mt-24">
          <div ref={testimonials.ref} className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className={`text-center mb-16 max-w-3xl mx-auto transition-all duration-1000 ${testimonials.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
                <Star className="w-3.5 h-3.5 text-accent-500" aria-hidden="true" />
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
                <figure
                  key={i}
                  className={`p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-500 ${testimonials.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent-500 text-accent-500" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-gray-300 leading-relaxed mb-6 italic">"{t.text}"</blockquote>

                  {/* Author */}
                  <figcaption className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FAQ ═══════════════════════ */}
        <section id="faq" className="py-24 md:py-32 px-6 relative scroll-mt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" aria-hidden="true" />
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
                  id={i.toString()}
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d15]" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)' }} aria-hidden="true" />

          <div ref={cta.ref} className="max-w-5xl mx-auto relative z-10">
            <div className={`bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-[3rem] border border-white/10 p-12 md:p-20 text-center backdrop-blur-sm transition-all duration-1000 ${cta.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-accent-500 to-amber-600 flex items-center justify-center shadow-xl shadow-accent-500/25" aria-hidden="true">
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
                  icon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
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
      </main>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-amber-600 rounded-xl flex items-center justify-center" aria-hidden="true">
                <UtensilsCrossed className="w-4 h-4 text-brand-900" />
              </div>
              <span className="font-serif font-bold text-lg">MeseroApp</span>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-8" aria-label="Enlaces legales">
              <button onClick={() => onNavigate(AppView.TERMS)} className="text-sm text-gray-500 hover:text-white transition-colors">Términos</button>
              <button onClick={() => onNavigate(AppView.PRIVACY)} className="text-sm text-gray-500 hover:text-white transition-colors">Privacidad</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-gray-500 hover:text-white transition-colors">FAQ</button>
            </nav>

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