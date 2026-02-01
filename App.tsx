
import React, { useState, useEffect } from 'react';
import { Landing } from './views/Landing';
import { Website } from './views/Website'; // Import Website
import { OfflineStatus } from './components/OfflineStatus';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Welcome } from './views/Welcome';
import { BusinessSetup } from './views/BusinessSetup';
import { MenuSetup } from './views/MenuSetup';
import { TableSetup } from './views/TableSetup';
import { TicketConfigView } from './views/TicketConfig';
import { Dashboard } from './views/Dashboard';
import { Splash } from './views/Splash';
import { CustomerMenu } from './views/CustomerMenu';
import { Terms } from './views/Terms';
import { Privacy } from './views/Privacy';
import { KDSSetup } from './views/KDSSetup';
import { KDSView } from './views/KDSView';
import { AppView } from './types';

const App: React.FC = () => {
  // Use lazy initialization to check URL params immediately and avoid Splash flash on QR scan
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    // Prioritize table parameter detection for QR codes
    if (params.get('table')) {
      return AppView.CUSTOMER_MENU;
    }
    // Check for KDS view parameter
    if (params.get('view') === 'KDS' && params.get('station')) {
      return AppView.KDS_VIEW;
    }
    return AppView.SPLASH;
  });

  return (
    <div className="w-full h-screen bg-white">
      <OfflineStatus />
      {currentView === AppView.SPLASH && (
        <Splash onNavigate={setCurrentView} />
      )}
      {currentView === AppView.WEBSITE && (
        <Website onNavigate={setCurrentView} />
      )}
      {currentView === AppView.LANDING && (
        <Landing onNavigate={setCurrentView} />
      )}
      {currentView === AppView.LOGIN && (
        <Login onNavigate={setCurrentView} />
      )}
      {currentView === AppView.REGISTER && (
        <Register onNavigate={setCurrentView} />
      )}
      {currentView === AppView.WELCOME && (
        <Welcome onNavigate={setCurrentView} />
      )}
      {currentView === AppView.BUSINESS_SETUP && (
        <BusinessSetup onNavigate={setCurrentView} />
      )}
      {currentView === AppView.MENU_SETUP && (
        <MenuSetup onNavigate={setCurrentView} />
      )}
      {currentView === AppView.TABLE_SETUP && (
        <TableSetup onNavigate={setCurrentView} />
      )}

      {currentView === AppView.TICKET_CONFIG && (
        <TicketConfigView onNavigate={setCurrentView} />
      )}
      {currentView === AppView.DASHBOARD && (
        <Dashboard onNavigate={setCurrentView} />
      )}
      {currentView === AppView.CUSTOMER_MENU && (
        <CustomerMenu onNavigate={setCurrentView} />
      )}
      {currentView === AppView.TERMS && (
        <Terms onNavigate={setCurrentView} />
      )}
      {currentView === AppView.PRIVACY && (
        <Privacy onNavigate={setCurrentView} />
      )}
      {currentView === AppView.KDS_SETUP && (
        <KDSSetup onNavigate={setCurrentView} />
      )}
      {currentView === AppView.KDS_VIEW && (
        <KDSView onNavigate={setCurrentView} />
      )}
    </div>
  );
};

export default App;
