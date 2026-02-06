
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Landing } from './views/Landing';
import { Website } from './views/Website';
import { OfflineStatus } from './components/OfflineStatus';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Welcome } from './views/Welcome';
import { BusinessSetup } from './views/BusinessSetup';
import { MenuSetup } from './views/MenuSetup';
import { TableSetup } from './views/TableSetup';
import { TicketConfigView } from './views/TicketConfig';
import { StaffManagement } from './views/StaffManagement';
import { Dashboard } from './views/Dashboard';
import { Splash } from './views/Splash';
import { CustomerMenu } from './views/CustomerMenu';
import { Terms } from './views/Terms';
import { Privacy } from './views/Privacy';
import { KDSSetup } from './views/KDSSetup';
import { KDSView } from './views/KDSView';
import NotFound from './views/NotFound';
import { AppView } from './types';

// --- LEGACY COMPATIBILITY WRAPPER ---
// This hook allows old components (that use onNavigate) to work with React Router
export const useAppNavigation = () => {
  const navigate = useNavigate();

  const handleNavigate = (view: AppView) => {
    const routeMap: Record<AppView, string> = {
      [AppView.SPLASH]: '/',
      [AppView.WEBSITE]: '/website',
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
    navigate(routeMap[view] || '/');
  };

  return handleNavigate;
};

// --- ROUTE WRAPPER COMPONENTS ---
// These wrap each view to inject the onNavigate prop for backward compatibility

const SplashRoute = () => {
  const onNavigate = useAppNavigation();
  return <Splash onNavigate={onNavigate} />;
};

const WebsiteRoute = () => {
  const onNavigate = useAppNavigation();
  return <Website onNavigate={onNavigate} />;
};

const LandingRoute = () => {
  const onNavigate = useAppNavigation();
  return <Landing onNavigate={onNavigate} />;
};

const LoginRoute = () => {
  const onNavigate = useAppNavigation();
  return <Login onNavigate={onNavigate} />;
};

const RegisterRoute = () => {
  const onNavigate = useAppNavigation();
  return <Register onNavigate={onNavigate} />;
};

const WelcomeRoute = () => {
  const onNavigate = useAppNavigation();
  return <Welcome onNavigate={onNavigate} />;
};

const BusinessSetupRoute = () => {
  const onNavigate = useAppNavigation();
  return <BusinessSetup onNavigate={onNavigate} />;
};

const MenuSetupRoute = () => {
  const onNavigate = useAppNavigation();
  return <MenuSetup onNavigate={onNavigate} />;
};

const TableSetupRoute = () => {
  const onNavigate = useAppNavigation();
  return <TableSetup onNavigate={onNavigate} />;
};

const TicketConfigRoute = () => {
  const onNavigate = useAppNavigation();
  return <TicketConfigView onNavigate={onNavigate} />;
};

const StaffManagementRoute = () => {
  const onNavigate = useAppNavigation();
  return <StaffManagement onNavigate={onNavigate} />;
};

const DashboardRoute = () => {
  const onNavigate = useAppNavigation();
  return <Dashboard onNavigate={onNavigate} />;
};

const CustomerMenuRoute = () => {
  const onNavigate = useAppNavigation();
  return <CustomerMenu onNavigate={onNavigate} />;
};

const TermsRoute = () => {
  const onNavigate = useAppNavigation();
  return <Terms onNavigate={onNavigate} />;
};

const PrivacyRoute = () => {
  const onNavigate = useAppNavigation();
  return <Privacy onNavigate={onNavigate} />;
};

const KDSSetupRoute = () => {
  const onNavigate = useAppNavigation();
  return <KDSSetup onNavigate={onNavigate} />;
};

const KDSViewRoute = () => {
  const onNavigate = useAppNavigation();
  return <KDSView onNavigate={onNavigate} />;
};

// --- LEGACY QR CODE REDIRECT ---
// This component handles legacy QR codes with ?table= and ?view=KDS query params
const LegacyRedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run on root path with legacy query params
    if (location.pathname === '/') {
      const table = searchParams.get('table');
      const uid = searchParams.get('uid');
      const view = searchParams.get('view');
      const station = searchParams.get('station');

      if (table && uid) {
        // Redirect legacy QR code URLs to new customer menu route
        navigate(`/menu?table=${table}&uid=${uid}`, { replace: true });
        return;
      }

      if (view === 'KDS' && station) {
        // Redirect legacy KDS URLs to new KDS route
        navigate(`/kds?station=${station}`, { replace: true });
        return;
      }
    }
  }, [searchParams, navigate, location.pathname]);

  // Return null as this is just a redirect handler
  return null;
};


const App: React.FC = () => {
  return (
    <div className="w-full h-screen bg-white">
      <OfflineStatus />
      {/* Handle legacy QR code redirects */}
      <LegacyRedirectHandler />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SplashRoute />} />
        <Route path="/website" element={<WebsiteRoute />} />
        <Route path="/landing" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/terms" element={<TermsRoute />} />
        <Route path="/privacy" element={<PrivacyRoute />} />

        {/* Customer-facing routes (accessed via QR) */}
        <Route path="/menu" element={<CustomerMenuRoute />} />

        {/* Authenticated routes (owner/staff) */}
        <Route path="/welcome" element={<WelcomeRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />

        {/* Setup routes */}
        <Route path="/setup/business" element={<BusinessSetupRoute />} />
        <Route path="/setup/menu" element={<MenuSetupRoute />} />
        <Route path="/setup/tables" element={<TableSetupRoute />} />
        <Route path="/setup/tables" element={<TableSetupRoute />} />
        <Route path="/setup/ticket" element={<TicketConfigRoute />} />
        <Route path="/setup/staff" element={<StaffManagementRoute />} />

        {/* KDS routes */}
        <Route path="/kds/setup" element={<KDSSetupRoute />} />
        <Route path="/kds" element={<KDSViewRoute />} />

        {/* 404 Not Found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
