
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { OfflineStatus } from './components/OfflineStatus';
import { AppView } from './types';
import { diagnoseRealtimeConnection } from './services/realtimeDiagnostics';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { LockScreen } from './views/LockScreen';
import { SkipToContent } from './components/SkipToContent';

// --- LAZY LOADED VIEWS ---
const Landing = lazy(() => import('./views/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./views/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./views/Register').then(m => ({ default: m.Register })));
const Welcome = lazy(() => import('./views/Welcome').then(m => ({ default: m.Welcome })));
const BusinessSetup = lazy(() => import('./views/BusinessSetup').then(m => ({ default: m.BusinessSetup })));
const MenuSetup = lazy(() => import('./views/MenuSetup').then(m => ({ default: m.MenuSetup })));
const TableSetup = lazy(() => import('./views/TableSetup').then(m => ({ default: m.TableSetup })));
const TicketConfigView = lazy(() => import('./views/TicketConfig').then(m => ({ default: m.TicketConfigView })));
const StaffManagement = lazy(() => import('./views/StaffManagement').then(m => ({ default: m.StaffManagement })));
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Splash = lazy(() => import('./views/Splash').then(m => ({ default: m.Splash })));
const CustomerMenu = lazy(() => import('./views/CustomerMenu').then(m => ({ default: m.CustomerMenu })));
const Terms = lazy(() => import('./views/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./views/Privacy').then(m => ({ default: m.Privacy })));
const KDSSetup = lazy(() => import('./views/KDSSetup').then(m => ({ default: m.KDSSetup })));
const KDSView = lazy(() => import('./views/KDSView').then(m => ({ default: m.KDSView })));
const NotFound = lazy(() => import('./views/NotFound'));

// --- GLOBAL LOADING SPINNER ---
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-accent-500/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

// --- LEGACY COMPATIBILITY WRAPPER ---
export const useAppNavigation = () => {
  const navigate = useNavigate();

  const handleNavigate = (view: AppView) => {
    const routeMap: Record<AppView, string> = {
      [AppView.SPLASH]: '/',
      [AppView.LANDING]: '/landing',
      [AppView.LOGIN]: '/login',
      [AppView.REGISTER]: '/register',
      [AppView.WELCOME]: '/welcome',
      [AppView.BUSINESS_SETUP]: '/setup/business',
      [AppView.MENU_SETUP]: '/setup/menu',
      [AppView.TABLE_SETUP]: '/setup/tables',
      [AppView.TICKET_CONFIG]: '/setup/ticket',
      [AppView.DASHBOARD]: '/dashboard',
      [AppView.CUSTOMER_MENU]: '/menu',
      [AppView.TERMS]: '/terms',
      [AppView.PRIVACY]: '/privacy',
      [AppView.KDS_SETUP]: '/kds/setup',
      [AppView.KDS_VIEW]: '/kds',
      [AppView.STAFF_MANAGEMENT]: '/setup/staff',
    };

    const path = routeMap[view] || '/';
    const params = new URLSearchParams(window.location.search);
    const hasContext = params.get('uid') && (params.get('role_id') || params.get('table') || params.get('station'));

    navigate(hasContext ? path + window.location.search : path);
  };

  return handleNavigate;
};

// --- ROUTE WRAPPER COMPONENTS ---
const SplashRoute = () => <Splash onNavigate={useAppNavigation()} />;
const LandingRoute = () => <Landing onNavigate={useAppNavigation()} />;
const LoginRoute = () => <Login onNavigate={useAppNavigation()} />;
const RegisterRoute = () => <Register onNavigate={useAppNavigation()} />;
const WelcomeRoute = () => <Welcome onNavigate={useAppNavigation()} />;
const BusinessSetupRoute = () => <BusinessSetup onNavigate={useAppNavigation()} />;
const MenuSetupRoute = () => <MenuSetup onNavigate={useAppNavigation()} />;
const TableSetupRoute = () => <TableSetup onNavigate={useAppNavigation()} />;
const TicketConfigRoute = () => <TicketConfigView onNavigate={useAppNavigation()} />;
const StaffManagementRoute = () => <StaffManagement onNavigate={useAppNavigation()} />;
const DashboardRoute = () => <Dashboard onNavigate={useAppNavigation()} />;
const CustomerMenuRoute = () => <CustomerMenu onNavigate={useAppNavigation()} />;
const TermsRoute = () => <Terms onNavigate={useAppNavigation()} />;
const PrivacyRoute = () => <Privacy onNavigate={useAppNavigation()} />;
const KDSSetupRoute = () => <KDSSetup onNavigate={useAppNavigation()} />;
const KDSViewRoute = () => <KDSView onNavigate={useAppNavigation()} />;

const App: React.FC = () => {
  useEffect(() => {
    (window as any).diagnoseRealtime = diagnoseRealtimeConnection;
    console.log('💡 Realtime diagnostic available: Run window.diagnoseRealtime() in console');
  }, []);

  return (
    <div className="w-full min-h-screen bg-white font-sans selection:bg-accent-500/30 selection:text-brand-900">
      <SkipToContent />
      <PWAInstallPrompt />
      <OfflineStatus />
      <LockScreen />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SplashRoute />} />
          <Route path="/website" element={<LandingRoute />} />
          <Route path="/landing" element={<LandingRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/terms" element={<TermsRoute />} />
          <Route path="/privacy" element={<PrivacyRoute />} />

          {/* Customer-facing routes */}
          <Route path="/menu" element={<CustomerMenuRoute />} />

          {/* Authenticated routes */}
          <Route path="/welcome" element={<WelcomeRoute />} />
          <Route path="/dashboard" element={<DashboardRoute />} />

          {/* Setup routes */}
          <Route path="/setup/business" element={<BusinessSetupRoute />} />
          <Route path="/setup/menu" element={<MenuSetupRoute />} />
          <Route path="/setup/tables" element={<TableSetupRoute />} />
          <Route path="/setup/ticket" element={<TicketConfigRoute />} />
          <Route path="/setup/staff" element={<StaffManagementRoute />} />

          {/* KDS routes */}
          <Route path="/kds/setup" element={<KDSSetupRoute />} />
          <Route path="/kds" element={<KDSViewRoute />} />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;

