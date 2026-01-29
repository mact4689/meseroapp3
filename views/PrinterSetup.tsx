
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { ArrowLeft, Printer, CheckCircle, ChevronRight, AlertCircle, ExternalLink, Monitor, Settings } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

interface PrinterSetupProps {
  onNavigate: (view: AppView) => void;
}

export const PrinterSetup: React.FC<PrinterSetupProps> = ({ onNavigate }) => {
  const { state, updatePrinter } = useAppStore();
  const { isOnboarding, printers } = state;
  const [showInstructions, setShowInstructions] = useState(false);

  const handleBack = () => {
    if (isOnboarding) {
      onNavigate(AppView.TABLE_SETUP);
    } else {
      onNavigate(AppView.DASHBOARD);
    }
  };

  const handleNextStep = () => {
    onNavigate(AppView.TICKET_CONFIG);
  };

  const handleMarkAsConfigured = (printerId: string) => {
    updatePrinter(printerId, {
      isConnected: true,
      hardwareName: 'Impresora del Sistema'
    });
  };

  const handleMarkAsNotConfigured = (printerId: string) => {
    updatePrinter(printerId, {
      isConnected: false,
      hardwareName: null
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
              title={isOnboarding ? "Volver" : "Volver al Dashboard"}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          {isOnboarding ? (
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center justify-center space-x-2 mb-4 w-full">
                {/* Step indicators */}
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5" /></div>
                </div>
                <div className="w-3 h-0.5 bg-brand-900"></div>
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5" /></div>
                </div>
                <div className="w-3 h-0.5 bg-brand-900"></div>
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5" /></div>
                </div>
                <div className="w-3 h-0.5 bg-brand-900"></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">4</div>
                  <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Impresoras</span>
                </div>
                <div className="w-3 h-0.5 bg-gray-200"></div>
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">5</div>
                </div>
              </div>
              <h2 className="font-serif text-3xl text-brand-900 text-center">Configura tus Impresoras</h2>
              <p className="text-gray-500 text-center mt-2">Conecta impresoras térmicas para tickets de cocina</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h2 className="font-serif text-3xl text-brand-900">Configuración de Impresoras</h2>
              <p className="text-gray-500">Gestiona tus estaciones de impresión</p>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">📌 Cómo funciona la impresión</h3>
              <p className="text-sm text-blue-700 mb-3">
                MeseroApp usa el <strong>sistema de impresión de tu computadora</strong>.
                Cuando hagas click en "Imprimir", el navegador te preguntará qué impresora usar.
              </p>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showInstructions ? 'Ocultar' : 'Ver'} instrucciones de configuración
                <ChevronRight className={`w-4 h-4 transition-transform ${showInstructions ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        {showInstructions && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-brand-900 text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Pasos para conectar tu impresora
            </h3>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-2">Conecta físicamente tu impresora</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li><strong>USB:</strong> Conecta el cable USB a tu computadora</li>
                  <li><strong>WiFi:</strong> Conecta la impresora a tu red WiFi (ver manual)</li>
                  <li><strong>Bluetooth:</strong> Empareja desde la configuración de tu sistema operativo</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-2">Instala los drivers</h4>
                <p className="text-sm text-gray-600 mb-2">Descarga e instala los drivers oficiales del fabricante:</p>
                <div className="space-y-2">
                  <a href="https://epson.com/Support/Printers/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                    Epson (TM-T20, TM-m30, etc.)
                  </a>
                  <a href="https://www.star-m.jp/eng/dl/index.html" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                    Star Micronics (TSP100, TSP143, etc.)
                  </a>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-2">Verifica en tu sistema operativo</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <strong className="text-brand-900">Windows:</strong> Panel de Control → Dispositivos e Impresoras
                  </div>
                  <div>
                    <strong className="text-brand-900">macOS:</strong> Preferencias del Sistema → Impresoras y Escáneres
                  </div>
                  <div>
                    <strong className="text-brand-900">Linux:</strong> Configuración → Impresoras
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">✓</div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-2">¡Listo para imprimir!</h4>
                <p className="text-sm text-gray-600">
                  Cuando hagas click en "Imprimir" en MeseroApp, el navegador te mostrará un diálogo
                  donde podrás seleccionar tu impresora.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Printer Stations List */}
        <div className="flex-1 space-y-4 mb-6">
          <h3 className="font-bold text-brand-900 text-lg">Tus Estaciones de Impresión</h3>
          <p className="text-sm text-gray-500 -mt-2">
            Configura las estaciones donde se imprimirán los tickets. Marca como "Configurada" cuando hayas conectado la impresora física.
          </p>

          <div className="space-y-3">
            {printers.map((printer) => (
              <div
                key={printer.id}
                className={`p-5 rounded-xl border transition-all ${printer.isConnected
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${printer.isConnected ? 'bg-green-100' : 'bg-gray-200'
                      }`}>
                      <Printer className={`w-6 h-6 ${printer.isConnected ? 'text-green-600' : 'text-gray-400'
                        }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-900">{printer.name}</h4>
                      <p className="text-sm text-gray-500">{printer.location}</p>
                    </div>
                  </div>
                  {printer.isConnected && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Configurada
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamaño de papel:</span>
                    <span className="font-semibold text-brand-900">{printer.paperWidth}</span>
                  </div>
                  {printer.hardwareName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impresora del sistema:</span>
                      <span className="font-semibold text-brand-900">{printer.hardwareName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {!printer.isConnected ? (
                    <button
                      onClick={() => handleMarkAsConfigured(printer.id)}
                      className="flex-1 py-2 px-4 bg-brand-900 text-white rounded-lg font-semibold hover:bg-black transition-colors text-sm"
                    >
                      Marcar como Configurada
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsNotConfigured(printer.id)}
                      className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Marcar como No Configurada
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-600 text-center">
            <strong className="text-brand-900">💡 Consejo:</strong> Puedes usar MeseroApp sin impresoras.
            Los tickets se pueden ver en pantalla y imprimir después cuando tengas el hardware listo.
          </p>
        </div>

        {/* Footer Actions */}
        {isOnboarding ? (
          <div className="mt-auto pt-4 border-t border-gray-100 bg-white space-y-3">
            <Button
              fullWidth
              onClick={handleNextStep}
              className="h-14 text-lg font-bold shadow-xl shadow-brand-900/20"
              icon={<ChevronRight className="w-5 h-5" />}
            >
              Continuar a Configuración de Tickets
            </Button>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-medium py-2 transition-colors"
            >
              Omitir por ahora
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button
              fullWidth
              onClick={handleBack}
              className="h-12 text-base font-bold shadow-lg shadow-brand-900/10"
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};