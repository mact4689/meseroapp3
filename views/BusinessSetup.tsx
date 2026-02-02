import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Store, UtensilsCrossed, ChevronRight, Check, Plus, Camera } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { uploadImage } from '../services/db';

interface BusinessSetupProps {
  onNavigate: (view: AppView) => void;
}

export const BusinessSetup: React.FC<BusinessSetupProps> = ({ onNavigate }) => {
  const { state, updateBusiness } = useAppStore();
  const [loading, setLoading] = useState(false);
  const { isOnboarding } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for immediate input handling
  const [formData, setFormData] = useState({
    businessName: state.business.name || '',
    cuisine: state.business.cuisine || '',
    logoUrl: state.business.logo,
    logoFile: null as File | null
  });

  // Sync local state if global state changes (e.g. on fetch)
  useEffect(() => {
    if (!formData.businessName && state.business.name) {
      setFormData(prev => ({
        ...prev,
        businessName: state.business.name,
        cuisine: state.business.cuisine || '',
        logoUrl: state.business.logo
      }));
    }
  }, [state.business]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        logoUrl: objectUrl,
        logoFile: file
      }));
    }
  };

  const saveChanges = async () => {
    setLoading(true);

    let finalLogoUrl = formData.logoUrl;

    if (formData.logoFile && state.user) {
      const publicUrl = await uploadImage(formData.logoFile, `logos/${state.user.id}`);
      if (publicUrl) {
        finalLogoUrl = publicUrl;
      }
    }

    await updateBusiness({
      name: formData.businessName,
      cuisine: formData.cuisine,
      logo: finalLogoUrl
    });

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName) return;

    await saveChanges();
    setLoading(false);

    if (isOnboarding) {
      onNavigate(AppView.KDS_SETUP);
    } else {
      onNavigate(AppView.DASHBOARD);
    }
  };

  const handleBack = async () => {
    if (isOnboarding) {
      // En onboarding paso 1 no hay "atrás", el usuario debe seguir o cerrar la app
      return;
    }
    await saveChanges();
    onNavigate(AppView.DASHBOARD);
  };

  const handleSkip = () => {
    onNavigate(AppView.KDS_SETUP);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">

        {/* Onboarding Header */}
        {isOnboarding ? (
          <div className="mb-8 flex flex-col items-center animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center space-x-2 mb-8 w-full">
              {/* Step 1 Indicator - Active */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">1</div>
                <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Perfil</span>
              </div>
              <div className="w-3 h-0.5 bg-gray-200"></div>

              {/* Step 2 Indicator - Inactive */}
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <div className="w-3 h-0.5 bg-gray-200"></div>

              {/* Step 3 Indicator - Inactive */}
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <div className="w-3 h-0.5 bg-gray-200"></div>

              {/* Step 4 Indicator - Inactive */}
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
              </div>
              <div className="w-3 h-0.5 bg-gray-200"></div>

              {/* Step 5 Indicator - Inactive */}
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">5</div>
              </div>
            </div>

            <h2 className="text-3xl text-brand-900 text-center mb-2">Tu Identidad</h2>
            <p className="text-gray-500 text-center text-sm">
              Comencemos por lo básico. ¿Cómo se llama tu increíble lugar?
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="mt-6 space-y-2">
              <h2 className="text-3xl text-brand-900">Datos del Negocio</h2>
            </div>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-brand-900/5 border border-gray-100 flex-1 flex flex-col animate-in slide-in-from-bottom-4" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">

            <div className="space-y-8">
              {/* Logo Upload Section */}
              <div className="flex flex-col items-center">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleFileClick}
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-md border-4 border-white ring-1 ring-gray-100 bg-gray-50 relative">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <Store className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-medium uppercase">Sin Logo</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Plus Button Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-brand-900 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFileClick}
                  className="mt-3 text-xs font-medium text-gray-500 hover:text-brand-900 transition-colors"
                >
                  Toca para subir tu logo
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-5">
                <Input
                  label="Nombre del Restaurante"
                  name="businessName"
                  type="text"
                  placeholder="Ej. La Casa del Sabor"
                  icon={<Store className="w-5 h-5" />}
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 border-transparent focus:bg-white focus:border-brand-900 py-4"
                />

                <Input
                  label="Tipo de Cocina"
                  name="cuisine"
                  type="text"
                  placeholder="Ej. Mexicana, Italiana, Café..."
                  icon={<UtensilsCrossed className="w-5 h-5" />}
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 border-transparent focus:bg-white focus:border-brand-900 py-4"
                />
              </div>
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Button
                type="submit"
                fullWidth
                isLoading={loading}
                className="h-14 text-lg font-bold shadow-xl shadow-brand-900/20"
                icon={isOnboarding ? <ChevronRight className="w-5 h-5" /> : <Check className="w-5 h-5" />}
              >
                {isOnboarding ? 'Siguiente Paso' : 'Guardar Cambios'}
              </Button>

              {isOnboarding && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium py-2 transition-colors"
                >
                  Omitir por ahora
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
