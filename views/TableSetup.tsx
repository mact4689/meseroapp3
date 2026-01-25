
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Download, Grid2X2, QrCode, ExternalLink, CheckCircle, ChevronRight, Check, Loader2 } from 'lucide-react';
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
  
  // Use origin only for root deployments (standard for Vercel)
  // This avoids issues with pathnames like /index.html or /dashboard interfering with the QR link
  const getBaseUrl = () => {
    return window.location.origin;
  };
  
  const { isOnboarding } = state;

  useEffect(() => {
    const initTables = async () => {
        setTableCount(state.tables.count);

        const storedCount = parseInt(state.tables.count || '0');
        const currentGenerated = state.tables.generated;
        const needsRegeneration = storedCount > 0 && (
            currentGenerated.length === 0 || 
            currentGenerated.some(t => !t.qrDataUrl)
        );

        if (needsRegeneration && state.user?.id) {
            setIsGenerating(true);
            const cleanBaseUrl = getBaseUrl();
            const newTables: TableData[] = [];

            try {
                for (let i = 1; i <= storedCount; i++) {
                    // Force the format https://domain.com/?table=1...
                    const url = `${cleanBaseUrl}/?table=${i}&uid=${state.user.id}`;
                    const qrDataUrl = await QRCode.toDataURL(url, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: '#1a1a1a',
                            light: '#ffffff',
                        },
                    });
                    newTables.push({ id: i, qrDataUrl });
                }
                setGeneratedTables(newTables);
                updateTables(storedCount.toString(), newTables);
            } catch (e) {
                console.error("Error auto-generating QRs:", e);
            } finally {
                setIsGenerating(false);
            }
        } else {
            setGeneratedTables(state.tables.generated);
        }
    };

    initTables();
  }, [state.tables.count, state.user?.id]);

  const generateQRs = async (count: number) => {
      const userId = state.user?.id;
      if (!userId) return [];
      
      const cleanBaseUrl = getBaseUrl();
      const newTables: TableData[] = [];

      for (let i = 1; i <= count; i++) {
        const url = `${cleanBaseUrl}/?table=${i}&uid=${userId}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        });
        newTables.push({ id: i, qrDataUrl });
      }
      return newTables;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(tableCount);
    
    if (!count || count <= 0) return;
    
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 500));

    try {
      const newTables = await generateQRs(count);
      setGeneratedTables(newTables);
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
      
      if (table.qrDataUrl) {
          doc.addImage(table.qrDataUrl, 'PNG', (pageWidth - 100) / 2, 60, 100, 100);
      }
      
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
    updateTables(tableCount, generatedTables);
    if (isOnboarding) {
        onNavigate(AppView.MENU_SETUP);
    } else {
        onNavigate(AppView.DASHBOARD);
    }
  };
  
  const handleSave = () => {
    updateTables(tableCount, generatedTables);
    onNavigate(AppView.DASHBOARD);
  };

  const handleNextStep = () => {
      if (tableCount && generatedTables.length === 0) {
           updateTables(tableCount, []);
      }
      onNavigate(AppView.PRINTER_SETUP);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
            title={isOnboarding ? "Volver" : "Volver al Dashboard"}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {isOnboarding ? (
            <div className="mt-4 flex flex-col items-center">
                 <div className="flex items-center justify-center space-x-2 mb-4 w-full">
                    <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="w-3 h-0.5 bg-brand-900"></div>
                     <div className="flex flex-col items-center gap-1 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="w-3 h-0.5 bg-brand-900"></div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">3</div>
                        <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Mesas</span>
                    </div>
                    <div className="w-3 h-0.5 bg-gray-200"></div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                         <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
                    </div>
                    <div className="w-3 h-0.5 bg-gray-200"></div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                         <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">5</div>
                    </div>
                 </div>
                 <h2 className="font-serif text-3xl text-brand-900 text-center">Tus Mesas</h2>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
                <h2 className="font-serif text-3xl text-brand-900">Configuración de Mesas</h2>
                <p className="text-gray-500">Genera los códigos QR para tus clientes.</p>
            </div>
          )}
        </div>

        <div className="space-y-6 flex-1">
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
                disabled={!tableCount}
                className="h-[52px]"
               >
                 Generar
               </Button>
            </div>
          </form>

          {(generatedTables.length > 0 || isGenerating) && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-brand-900 flex items-center">
                   <QrCode className="w-4 h-4 mr-2" />
                   Vista Previa
                 </h3>
                 <span className="text-xs text-gray-500">
                    {isGenerating ? 'Generando...' : `${generatedTables.length} mesas`}
                 </span>
              </div>
              
              {isGenerating && generatedTables.length === 0 ? (
                 <div className="flex items-center justify-center py-8 text-gray-400">
                     <Loader2 className="w-8 h-8 animate-spin" />
                 </div>
              ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                        {generatedTables.map((table) => {
                          const tableUrl = `${getBaseUrl()}/?table=${table.id}&uid=${state.user?.id}`;
                          return (
                          <div key={table.id} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col items-center text-center shadow-sm">
                              {table.qrDataUrl ? (
                                  <img src={table.qrDataUrl} alt={`QR Mesa ${table.id}`} className="w-24 h-24 mb-2 mix-blend-multiply" />
                              ) : (
                                  <div className="w-24 h-24 mb-2 flex items-center justify-center bg-gray-50 rounded-lg">
                                      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                                  </div>
                              )}
                              <span className="text-sm font-bold text-brand-900">Mesa {table.id}</span>
                              
                              <a 
                              href={tableUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 px-2.5 py-1.5 rounded-full flex items-center transition-colors border border-accent-100"
                              >
                              Abrir <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                          </div>
                        )})}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button 
                        onClick={handleDownloadPDF} 
                        fullWidth 
                        variant="outline"
                        icon={<Download className="w-4 h-4" />}
                        >
                        Descargar PDF
                        </Button>
                    </div>
                </>
              )}
            </div>
          )}
        </div>

        {isOnboarding ? (
           <div className="mt-auto pt-6 flex flex-col gap-3">
              <Button 
                 fullWidth 
                 onClick={handleNextStep}
                 className="h-14 text-lg font-bold shadow-xl shadow-brand-900/20"
                 icon={<ChevronRight className="w-5 h-5" />}
               >
                 Continuar
               </Button>
               
               <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-medium py-2 transition-colors"
                >
                  Omitir
                </button>
           </div>
        ) : (
             <div className="mt-6 pt-6 border-t border-gray-100">
                <Button 
                    fullWidth 
                    onClick={handleSave}
                    className="h-12 text-base font-bold shadow-lg shadow-brand-900/10"
                    icon={<Check className="w-5 h-5" />}
                >
                    Guardar
                </Button>
             </div>
        )}
      </div>
    </div>
  );
};
