
import React, { useState, useEffect } from 'react';
import { Landing } from './views/Landing';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Welcome } from './views/Welcome';
import { BusinessSetup } from './views/BusinessSetup';
import { MenuSetup } from './views/MenuSetup';
import { TableSetup } from './views/TableSetup';
import { PrinterSetup } from './views/PrinterSetup';
import { TicketConfigView } from './views/TicketConfig';
import { Dashboard } from './views/Dashboard';
import { Splash } from './views/Splash';
import { CustomerMenu } from './views/CustomerMenu';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SPLASH);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('table') && params.get('uid')) {
      setCurrentView(AppView.CUSTOMER_MENU);
    } else {
      setCurrentView(AppView.SPLASH);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-white">
      {currentView === AppView.SPLASH && (
        <Splash onNavigate={setCurrentView} />
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
      {currentView === AppView.PRINTER_SETUP && (
        <PrinterSetup onNavigate={setCurrentView} />
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
    </div>
  );
};

export default App;
