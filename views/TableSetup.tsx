
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Download, Grid2X2, QrCode, Globe, Info, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useAppStore } from '../store/AppContext';

interface TableSetupProps {
  onNavigate: (view: AppView) => void;
}

interface TableData {
  id: number;
  qrDataUrl: string;
}

export const TableSetup: React.FC<TableSetupProps> = ({ onNavigate }) => {
  const { state, updateTables } = useAppStore();
  const [tableCount, setTableCount] = useState<string>(state.tables.count || '');
  const [generatedTables, setGeneratedTables] = useState<TableData[]>(state.tables.generated || []);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for the base URL - Initialize from localStorage if available, otherwise use window.location.origin
  const [baseUrl, setBaseUrl] = useState(() => {
    return localStorage.getItem('mesero_base_url') || window.location.origin;
  });
  
  const { isOnboarding } = state;

  // Sync state on load (in case user navigates back)
  useEffect(() => {
    setTableCount(state.tables.count);
    setGeneratedTables(state.tables.generated);
  }, [state.tables]);

  // Persist base URL whenever it changes
  useEffect(() => {
    localStorage.setItem('mesero_base_url', baseUrl);
  }, [baseUrl]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(tableCount);
    const userId = state.user?.id;
    
    if (!count || count <= 0 || !userId) return;
    
    setIsGenerating(true);
    
    // Slight delay for UX
    await new Promise(r => setTimeout(r, 500));

    const newTables: TableData[] = [];
    
    try {
      // Remove trailing slash if user added one
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      for (let i = 1; i <= count; i++) {
        // Incluimos UID para identificar al restaurante en la app externa
        const url = `${cleanBaseUrl}/?table=${i}&uid=${userId}`;
        
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        });
        
        newTables.push({
          id: i,
          qrDataUrl
        });
      }
      setGeneratedTables(newTables);
      
      // Save to global store
      updateTables(tableCount, newTables);

    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    generatedTables.forEach((table, index) => {
      if (index > 0) doc.addPage();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(`Mesa ${table.id}`, pageWidth / 2, 40, { align: 'center' });
      
      doc.addImage(table.qrDataUrl, 'PNG', (pageWidth - 100) / 2, 60, 100, 100);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Escanea para ver el menú y ordenar", pageWidth / 2, 170, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Powered by MeseroApp", pageWidth / 2, 280, { align: 'center' });
    });

    doc.save('codigos-qr-mesas.pdf');
  };

  const handleBack = () => {
    // Guardar configuración y salir al Dashboard
    updateTables(tableCount, generatedTables);
    onNavigate(AppView.DASHBOARD);
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
            <h2 className="font-serif text-3xl text-brand-900">Configuración de Mesas</h2>
            <p className="text-gray-500">Genera los códigos QR para tus clientes.</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          
          {/* Base URL Input for connection issues */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-snug">
                   Ingresa la URL de tu proyecto de Menú (ej. https://mi-menu.app). El código QR agregará automáticamente tu ID de restaurante.
                </p>
             </div>
             <Input 
                label="URL del Menú / App Clientes"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                icon={<Globe className="w-4 h-4" />}
                placeholder="https://mi-menu-app.vercel.app"
                className="bg-white text-sm"
             />
          </div>

          <form onSubmit={handleGenerate} className="flex items-end gap-3">
            <div className="flex-1">
              <Input 
                label="¿Cuántas mesas tienes?" 
                name="tableCount"
                type="number"
                min="1"
                max="100"
                placeholder="Ej. 10"
                icon={<Grid2X2 className="w-5 h-5" />}
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                required
              />
            </div>
            <div className="pb-1.5">
               <Button 
                type="submit" 
                variant="secondary" 
                isLoading={isGenerating}
                disabled={!tableCount || !baseUrl}
                className="h-[52px]"
               >
                 Generar
               </Button>
            </div>
          </form>

          {/* Results Grid */}
          {generatedTables.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-brand-900 flex items-center">
                   <QrCode className="w-4 h-4 mr-2" />
                   Vista Previa
                 </h3>
                 <span className="text-xs text-gray-500">{generatedTables.length} mesas generadas</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {generatedTables.map((table) => (
                  <div key={table.id} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col items-center text-center shadow-sm">
                    <img src={table.qrDataUrl} alt={`QR Mesa ${table.id}`} className="w-24 h-24 mb-2 mix-blend-multiply" />
                    <span className="text-sm font-bold text-brand-900">Mesa {table.id}</span>
                    
                    <a 
                      href={`${baseUrl.replace(/\/$/, '')}/?table=${table.id}&uid=${state.user?.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 px-2.5 py-1.5 rounded-full flex items-center transition-colors border border-accent-100"
                    >
                      Abrir Menú <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleDownloadPDF} 
                  fullWidth 
                  variant="outline"
                  icon={<Download className="w-4 h-4" />}
                >
                  Descargar PDF para imprimir
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Solo en Onboarding */}
        {isOnboarding && (
           <div className="mt-auto pt-6">
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <div className="w-6 h-2 rounded-full bg-brand-900"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};