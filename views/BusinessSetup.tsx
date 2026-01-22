import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ImageUpload } from '../components/ImageUpload';
import { AppView } from '../types';
import { ArrowLeft, Store, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { uploadImage } from '../services/db';

interface BusinessSetupProps {
  onNavigate: (view: AppView) => void;
}

export const BusinessSetup: React.FC<BusinessSetupProps> = ({ onNavigate }) => {
  const { state, updateBusiness } = useAppStore();
  const [loading, setLoading] = useState(false);
  const { isOnboarding } = state;
  
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

  const handleImageChange = (file: File | null) => {
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            logoUrl: objectUrl,
            logoFile: file
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            logoUrl: null,
            logoFile: null
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
      cuisine: formData.cuisine, // Fix: usage of cuisine property name
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
        onNavigate(AppView.MENU_SETUP);
    } else {
        onNavigate(AppView.DASHBOARD);
    }
  };

  const handleBack = async () => {
    if (isOnboarding) {
        // En onboarding no permitimos volver atrás fácilmente sin guardar
        return;
    }
    await saveChanges();
    onNavigate(AppView.DASHBOARD);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header with Progress (Only Onboarding) */}
        {isOnboarding ? (
             <div className="mb-8 flex flex-col items-center">
                 <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-1 rounded-full bg-brand-900"></div>
                    <div className="w-2 h-1 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-1 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-1 rounded-full bg-gray-300"></div>
                 </div>
                 <h2 className="font-serif text-3xl text-brand-900 text-center">Perfil del Negocio</h2>
                 <p className="text-gray-500 text-center mt-2">Paso 1: Identidad básica</p>
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
                <h2 className="font-serif text-3xl text-brand-900">Datos del Negocio</h2>
              </div>
            </div>
        )}

        {/* Card Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              
              <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="w-32">
                        <ImageUpload 
                          label="Logo"
                          onChange={handleImageChange}
                          previewUrl={formData.logoUrl}
                          className="!rounded-full !aspect-square shadow-md border-gray-200"
                        />
                    </div>
                </div>

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
                    className="bg-white border-gray-200 focus:border-brand-900"
                  />
                  
                  <Input 
                    label="Especialidad / Cocina" 
                    name="cuisine"
                    type="text" 
                    placeholder="Ej. Mexicana, Italiana, Café..."
                    icon={<UtensilsCrossed className="w-5 h-5" />}
                    value={formData.cuisine}
                    onChange={handleInputChange}
                    required
                    className="bg-white border-gray-200 focus:border-brand-900"
                  />
                </div>
              </div>
              
               <div className="mt-auto pt-6">
                  <Button 
                    type="submit" 
                    fullWidth 
                    isLoading={loading}
                    className="h-12 text-lg"
                    icon={isOnboarding ? <ChevronRight className="w-5 h-5" /> : undefined}
                  >
                    {isOnboarding ? 'Continuar al Menú' : 'Guardar Cambios'}
                  </Button>
               </div>
            </form>
        </div>
        
      </div>
    </div>
  );
};