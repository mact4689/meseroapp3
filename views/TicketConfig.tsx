import React, { useState, useEffect } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AppView } from '../types';
import { ArrowLeft, Type, FileText, Calendar, Hash, MessageSquare, Printer, Settings2, CheckCircle, Rocket } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

interface TicketConfigViewProps {
  onNavigate: (view: AppView) => void;
}

export const TicketConfigView: React.FC<TicketConfigViewProps> = ({ onNavigate }) => {
  const { state, updatePrinter, endOnboarding } = useAppStore();
  const { isOnboarding } = state;
  
  // Local state to track which printer is being edited. If null, show list.
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  
  // Find the selected printer object
  const selectedPrinter = state.printers.find(p => p.id === selectedPrinterId);
  const [localConfig, setLocalConfig] = useState(selectedPrinter?.ticketConfig);

  // For onboarding: Auto-select the first printer (usually Main/Kitchen)
  useEffect(() => {
    if (isOnboarding && !selectedPrinterId) {
        setSelectedPrinterId(state.printers[0].id);
    }
  }, [isOnboarding]);

  // Update local config when selection changes
  useEffect(() => {
    if (selectedPrinter) {
      setLocalConfig(selectedPrinter.ticketConfig);
    }
  }, [selectedPrinter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!localConfig) return;
    
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setLocalConfig(prev => prev ? ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }) : undefined);
  };

  const handleSaveAndBack = () => {
    if (selectedPrinterId && localConfig) {
        // Guardar automáticamente al regresar
        updatePrinter(selectedPrinterId, { ticketConfig: localConfig });
    }
    
    if (isOnboarding) {
        // Si estamos en onboarding, NO regresamos a la lista, regresamos a la pantalla anterior (Printer Setup)
        // Pero en este flujo, este es el ultimo paso, asi que deberia ser "finalizar"
        // Como este metodo es llamado por "Back Arrow" (si existe), lo manejamos:
        onNavigate(AppView.PRINTER_SETUP);
    } else {
        setSelectedPrinterId(null);
    }
  };
  
  const handleBackToDashboard = () => {
      onNavigate(AppView.DASHBOARD);
  };

  const handleFinishOnboarding = () => {
     if (selectedPrinterId && localConfig) {
        updatePrinter(selectedPrinterId, { ticketConfig: localConfig });
    }
    endOnboarding();
    onNavigate(AppView.DASHBOARD);
  };

  // Mock data for preview
  const previewItems = [
    { qty: 2, name: 'Tacos al Pastor', notes: 'Sin cebolla' },
    { qty: 1, name: 'Coca Cola', notes: '' },
  ];

  // VIEW 1: PRINTER LIST SELECTION (Skipped in Onboarding)
  if (!isOnboarding && (!selectedPrinterId || !localConfig)) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
          <div className="flex items-center space-x-3 max-w-4xl mx-auto w-full">
              <button 
                  onClick={handleBackToDashboard}
                  className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
                  title="Guardar y volver al Dashboard"
              >
                  <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-serif text-lg font-bold text-brand-900">Seleccionar Impresora</h1>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
           <div className="space-y-4">
              <p className="text-gray-500 mb-4">Elige una impresora para ajustar el diseño de su ticket:</p>
              
              {state.printers.map((printer) => (
                <div 
                  key={printer.id}
                  onClick={() => setSelectedPrinterId(printer.id)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-900/30 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                      <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                          ${printer.isConnected 
                              ? 'bg-brand-900 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }
                      `}>
                          <Printer className="w-6 h-6" />
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-brand-900 text-lg">{printer.name}</h3>
                             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium border border-gray-200">{printer.location}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                             {printer.isConnected 
                                ? <span className="text-green-600 font-medium">● Conectada</span> 
                                : <span className="text-gray-400">● Desconectada</span>}
                             <span className="mx-1.5 text-gray-300">|</span>
                             Ancho: {printer.paperWidth}
                          </p>
                      </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                      <Settings2 className="w-5 h-5" />
                  </div>
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  }

  // Ensure localConfig exists for rendering editor (during onboarding initial render it might be undefined briefly)
  if (!localConfig) return <div className="min-h-screen bg-gray-50"></div>;

  // VIEW 2: EDITOR (Used for Onboarding and Edit Mode)
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className={`bg-white px-6 py-4 shadow-sm sticky top-0 z-50 ${isOnboarding ? 'pt-8' : ''}`}>
         {isOnboarding ? (
            <div className="w-full max-w-sm mx-auto">
                 <div className="flex items-center justify-center space-x-2 mb-4 w-full">
                    {/* Step 1 - Done */}
                    <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="w-3 h-0.5 bg-brand-900"></div>

                     {/* Step 2 - Done */}
                    <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="w-3 h-0.5 bg-brand-900"></div>

                     {/* Step 3 - Done */}
                    <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="w-3 h-0.5 bg-brand-900"></div>

                     {/* Step 4 - Done */}
                    <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                     <div className="w-3 h-0.5 bg-brand-900"></div>

                    {/* Step 5 - Active */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">5</div>
                        <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Ticket</span>
                    </div>
                 </div>
                 <h2 className="font-serif text-3xl text-brand-900 text-center">Diseño de Ticket</h2>
                 <p className="text-gray-500 text-center text-sm mt-1">Personaliza cómo se ven tus pedidos en cocina.</p>
            </div>
         ) : (
            <div className="flex items-center space-x-3 max-w-4xl mx-auto w-full">
                <button 
                    onClick={handleSaveAndBack}
                    className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
                    title="Guardar y Regresar"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                <h1 className="font-serif text-lg font-bold text-brand-900 leading-none">Editando: {selectedPrinter?.name}</h1>
                <p className="text-xs text-gray-500">{selectedPrinter?.location}</p>
                </div>
            </div>
         )}
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full grid md:grid-cols-2 gap-8">
        
        {/* Editor Column */}
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Textos
                </h3>
                <Input 
                    label="Título del Ticket"
                    name="title"
                    value={localConfig.title}
                    onChange={handleChange}
                    placeholder="ORDEN DE COCINA"
                />
                <Input 
                    label="Mensaje al pie (Opcional)"
                    name="footerMessage"
                    value={localConfig.footerMessage}
                    onChange={handleChange}
                    placeholder="Ej. Revisar alergias"
                />
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Detalles
                </h3>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Mostrar Fecha y Hora</span>
                        </div>
                        <input 
                            type="checkbox" 
                            name="showDate"
                            checked={localConfig.showDate}
                            onChange={handleChange}
                            className="w-5 h-5 text-brand-900 rounded focus:ring-brand-900 border-gray-300" 
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-gray-500">
                                <Hash className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Mostrar Núm. Orden y Mesa</span>
                        </div>
                        <input 
                            type="checkbox" 
                            name="showOrderNumber"
                            checked={localConfig.showOrderNumber}
                            onChange={handleChange}
                            className="w-5 h-5 text-brand-900 rounded focus:ring-brand-900 border-gray-300" 
                        />
                    </label>

                     <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-gray-500">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Mostrar Notas de Platillos</span>
                        </div>
                        <input 
                            type="checkbox" 
                            name="showNotes"
                            checked={localConfig.showNotes}
                            onChange={handleChange}
                            className="w-5 h-5 text-brand-900 rounded focus:ring-brand-900 border-gray-300" 
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                 <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Tamaño de Fuente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${localConfig.textSize === 'normal' ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setLocalConfig(prev => prev ? ({ ...prev, textSize: 'normal' }) : undefined)}
                    >
                        Normal (48mm)
                    </button>
                    <button 
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${localConfig.textSize === 'large' ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setLocalConfig(prev => prev ? ({ ...prev, textSize: 'large' }) : undefined)}
                    >
                        Grande (80mm)
                    </button>
                </div>
            </div>
        </div>

        {/* Preview Column */}
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vista Previa</h3>
            
            {/* Thermal Ticket Simulator */}
            <div className={`
                bg-white w-full shadow-xl rounded-sm overflow-hidden border-t-8 border-gray-800 relative transition-all duration-300
                ${selectedPrinter?.paperWidth === '58mm' ? 'max-w-[240px]' : 'max-w-[320px]'}
            `}>
                {/* Paper texture effect */}
                <div className="absolute inset-0 bg-yellow-50/10 pointer-events-none"></div>
                
                {/* Torn edge effect bottom */}
                 <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-50" style={{ 
                    backgroundImage: 'linear-gradient(45deg, transparent 75%, white 75%), linear-gradient(-45deg, transparent 75%, white 75%)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 10px'
                 }}></div>

                <div className={`p-6 pb-12 font-mono text-gray-900 ${localConfig.textSize === 'large' ? 'text-lg' : 'text-xs'}`}>
                    
                    {/* Header */}
                    <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                        <h2 className="font-black text-xl mb-1 uppercase">{localConfig.title || 'ORDEN'}</h2>
                        {localConfig.showDate && (
                             <p className="text-gray-500 text-[10px] mt-1">
                                {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </p>
                        )}
                        {localConfig.showOrderNumber && (
                             <div className="flex justify-between mt-2 font-bold">
                                <span>Mesa: 4</span>
                                <span>Orden: #042</span>
                             </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-6">
                        {previewItems.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-start font-bold">
                                    <span>{item.qty} x {item.name}</span>
                                </div>
                                {localConfig.showNotes && item.notes && (
                                    <p className="text-gray-500 italic ml-4 mt-0.5">Note: {item.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="border-t-2 border-dashed border-gray-300 pt-4 text-center">
                        <p className="font-bold">TOTAL ITEMS: {previewItems.reduce((acc, i) => acc + i.qty, 0)}</p>
                         {localConfig.footerMessage && (
                            <p className="mt-4 text-center uppercase font-bold text-gray-400">{localConfig.footerMessage}</p>
                        )}
                    </div>

                    {/* Cut Line Visualization */}
                    <div className="mt-8 border-b border-gray-200 text-[10px] text-center text-gray-300">
                        --- CORTE AQUÍ ---
                    </div>

                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Simulación ancho: {selectedPrinter?.paperWidth}</p>
        </div>

        {/* Footer Actions - Solo en onboarding */}
        {isOnboarding && (
            <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 max-w-sm mx-auto w-full">
                <Button 
                 fullWidth 
                 onClick={handleFinishOnboarding}
                 className="h-14 text-lg font-bold shadow-xl shadow-brand-900/20 bg-green-600 hover:bg-green-700 focus:ring-green-600"
                 icon={<Rocket className="w-5 h-5" />}
               >
                 Finalizar Configuración
               </Button>
               
               <button 
                  type="button" 
                  onClick={handleFinishOnboarding}
                  className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-medium py-2 transition-colors"
                >
                  Omitir por ahora
                </button>
            </div>
        )}

      </main>
    </div>
  );
};