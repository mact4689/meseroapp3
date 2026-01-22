
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { ArrowLeft, Printer, Bluetooth, Wifi, CheckCircle2, FileText, Search, Signal, Router } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

interface PrinterSetupProps {
  onNavigate: (view: AppView) => void;
}

interface DiscoveredDevice {
  id: string;
  name: string;
  detail: string; // RSSI for BT, IP for Wifi
  type: 'BLUETOOTH' | 'NETWORK';
}

type SetupMethod = 'BLUETOOTH' | 'WIFI' | null;

export const PrinterSetup: React.FC<PrinterSetupProps> = ({ onNavigate }) => {
  const { state, updatePrinter } = useAppStore();
  const [setupMethod, setSetupMethod] = useState<SetupMethod>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [testPrintStatus, setTestPrintStatus] = useState<'idle' | 'printing' | 'success'>('idle');
  const { isOnboarding } = state;

  // Use the first printer (Main/Kitchen) for the setup flow
  const printerToSetup = state.printers[0]; 
  const isConnected = printerToSetup.isConnected;

  const handleScan = () => {
    setIsSearching(true);
    setDiscoveredDevices([]);

    setTimeout(() => {
      if (setupMethod === 'BLUETOOTH') {
        setDiscoveredDevices([
          { id: 'bt_1', name: 'Epson TM-T20II', detail: '-65 dBm', type: 'BLUETOOTH' },
          { id: 'bt_2', name: 'Star Micronics TSP100', detail: '-72 dBm', type: 'BLUETOOTH' },
          { id: 'bt_3', name: 'Generic POS-58', detail: '-80 dBm', type: 'BLUETOOTH' },
        ]);
      } else {
        setDiscoveredDevices([
          { id: 'net_1', name: 'Epson TM-m30 (Cocina)', detail: '192.168.1.50', type: 'NETWORK' },
          { id: 'net_2', name: 'Star TSP143LAN', detail: '192.168.1.102', type: 'NETWORK' },
        ]);
      }
      setIsSearching(false);
    }, 2500);
  };

  const handleConnectToDevice = (device: DiscoveredDevice) => {
    updatePrinter(printerToSetup.id, {
        isConnected: true,
        hardwareName: device.name,
        type: device.type === 'NETWORK' ? 'NETWORK' : 'BLUETOOTH'
    });
    setDiscoveredDevices([]);
    setSetupMethod(null);
  };

  const handleDisconnect = () => {
    updatePrinter(printerToSetup.id, {
      isConnected: false,
      hardwareName: null,
      type: null
    });
    setTestPrintStatus('idle');
    setDiscoveredDevices([]);
    setSetupMethod(null);
  };

  const handleTestPrint = () => {
    if (!isConnected) return;
    setTestPrintStatus('printing');
    setTimeout(() => {
      setTestPrintStatus('success');
      setTimeout(() => setTestPrintStatus('idle'), 3000);
    }, 1500);
  };

  const handleBack = () => {
    if (setupMethod !== null && !isConnected) {
      setSetupMethod(null);
      setDiscoveredDevices([]);
      setIsSearching(false);
    } else {
      // Guardar configuración (implícito en updatePrinter) y salir al Dashboard
      onNavigate(AppView.DASHBOARD);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
            title="Guardar y volver al Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="mt-4 space-y-2">
            <h2 className="font-serif text-3xl text-brand-900">Configurar Impresora</h2>
            <p className="text-gray-500">
                {isConnected 
                    ? `Configurando ${printerToSetup.name}`
                    : setupMethod 
                      ? `Buscando por ${setupMethod === 'BLUETOOTH' ? 'Bluetooth' : 'WiFi'}...`
                      : 'Elige cómo conectar tu impresora'
                }
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* STATE 1: Connected */}
          {isConnected ? (
             <div className="bg-green-50 border-2 border-green-200 p-6 rounded-2xl relative overflow-hidden animate-in fade-in zoom-in">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-green-100">
                        <Printer className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-900 text-lg">{printerToSetup.hardwareName}</h3>
                    <p className="text-green-700 text-sm mb-4 flex items-center">
                      {printerToSetup.type === 'NETWORK' ? <Wifi className="w-3 h-3 mr-1"/> : <Bluetooth className="w-3 h-3 mr-1"/>}
                      Conectado y listo
                    </p>
                    <div className="flex gap-2 w-full">
                        <Button 
                            variant="secondary" 
                            fullWidth 
                            className="bg-white border-green-200 text-green-800 hover:bg-green-100 h-10 text-sm"
                            onClick={handleTestPrint}
                            disabled={testPrintStatus !== 'idle'}
                            icon={testPrintStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4"/>}
                        >
                            {testPrintStatus === 'printing' ? 'Imprimiendo...' : testPrintStatus === 'success' ? '¡Impreso!' : 'Prueba'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 h-10 text-sm px-3"
                            onClick={handleDisconnect}
                        >
                            Desconectar
                        </Button>
                    </div>
                 </div>
             </div>
          ) : (
            <>
              {/* STATE 2: Select Method */}
              {!setupMethod && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <button
                    onClick={() => { setSetupMethod('BLUETOOTH'); setIsSearching(false); setDiscoveredDevices([]); }}
                    className="w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-brand-900 hover:shadow-md transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                      <Bluetooth className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-brand-900 text-lg">Bluetooth</h3>
                    <p className="text-sm text-gray-500 mt-1">Para impresoras portátiles o cercanas.</p>
                  </button>

                  <button
                    onClick={() => { setSetupMethod('WIFI'); setIsSearching(false); setDiscoveredDevices([]); }}
                    className="w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-brand-900 hover:shadow-md transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-brand-900 text-lg">WiFi / Red</h3>
                    <p className="text-sm text-gray-500 mt-1">Para impresoras fijas en la misma red WiFi.</p>
                  </button>
                </div>
              )}

              {/* STATE 3: Scanning (Bluetooth or WiFi) */}
              {setupMethod && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col min-h-[300px] animate-in fade-in">
                    
                    {/* Initial State or Searching */}
                    {!isSearching && discoveredDevices.length === 0 && (
                        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
                                {setupMethod === 'BLUETOOTH' ? <Bluetooth className="w-8 h-8" /> : <Router className="w-8 h-8" />}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">
                              {setupMethod === 'BLUETOOTH' ? 'Buscar dispositivos Bluetooth' : 'Escanear red local'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                              {setupMethod === 'BLUETOOTH' 
                                ? 'Asegúrate que la impresora esté en modo visible (Pairing).' 
                                : 'Asegúrate que tu dispositivo y la impresora estén en el mismo WiFi.'}
                            </p>
                            <Button onClick={handleScan} fullWidth icon={<Search className="w-4 h-4" />}>
                                {setupMethod === 'BLUETOOTH' ? 'Escanear Bluetooth' : 'Escanear Red'}
                            </Button>
                        </div>
                    )}

                    {/* Searching State */}
                    {isSearching && (
                        <div className="p-10 flex flex-col items-center justify-center text-center flex-1">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 bg-brand-900/10 rounded-full animate-ping"></div>
                                <div className="relative bg-white w-16 h-16 rounded-full border-2 border-brand-900 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-brand-900 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900">Buscando...</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {setupMethod === 'BLUETOOTH' ? 'Localizando impresoras cercanas' : 'Analizando direcciones IP'}
                            </p>
                        </div>
                    )}

                    {/* List of Found Devices */}
                    {!isSearching && discoveredDevices.length > 0 && (
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultados</span>
                                <button 
                                    onClick={handleScan}
                                    className="text-xs text-brand-900 hover:underline flex items-center"
                                >
                                    <Search className="w-3 h-3 mr-1" />
                                    Reintentar
                                </button>
                            </div>
                            <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[300px]">
                                {discoveredDevices.map((device) => (
                                    <button
                                        key={device.id}
                                        onClick={() => handleConnectToDevice(device)}
                                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 group-hover:border-brand-900 group-hover:text-brand-900 transition-colors">
                                                <Printer className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{device.name}</h4>
                                                <div className="flex items-center text-xs text-gray-400">
                                                    {setupMethod === 'BLUETOOTH' ? <Bluetooth className="w-3 h-3 mr-1" /> : <Wifi className="w-3 h-3 mr-1" />}
                                                    {setupMethod === 'BLUETOOTH' && <Signal className="w-3 h-3 mr-1 ml-1" />}
                                                    <span>{device.detail}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 group-hover:bg-brand-900 group-hover:border-brand-900 group-hover:text-white transition-all">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions - Solo en onboarding */}
        {isOnboarding && (
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="mt-6 flex justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    <div className="w-6 h-2 rounded-full bg-brand-900"></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
