import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ImageUpload } from '../components/ImageUpload';
import { AppView } from '../types';
import { ArrowLeft, Store, UtensilsCrossed } from 'lucide-react';
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
    businessName: state.business.name,
    cuisine: state.business.cuisine,
    logoUrl: state.business.logo,
    logoFile: null as File | null
  });

  // Sync local state if global state changes (e.g. on fetch)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      businessName: state.business.name || '',
      cuisine: state.business.cuisine || '',
      logoUrl: state.business.logo
    }));
  }, [state.business]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
        // Crear preview local instantáneo
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

  // Lógica centralizada de guardado
  const saveChanges = async () => {
    setLoading(true);

    let finalLogoUrl = formData.logoUrl;

    // Si hay un archivo nuevo, subirlo a Supabase Storage
    if (formData.logoFile && state.user) {
        const publicUrl = await uploadImage(formData.logoFile, `logos/${state.user.id}`);
        if (publicUrl) {
            finalLogoUrl = publicUrl;
        }
    }

    // Save to Global Store (and DB via Context)
    // Await ensures we don't navigate until DB is updated
    await updateBusiness({
      name: formData.businessName,
      cuisine: formData.cuisineType,
      logo: finalLogoUrl
    });

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveChanges();
    setLoading(false);
    
    if (isOnboarding) {
        onNavigate(AppView.MENU_SETUP);
    } else {
        onNavigate(AppView.DASHBOARD);
    }
  };

  const handleBack = async () => {
    // Siempre guardar y volver al dashboard al presionar atrás en esta vista
    await saveChanges();
    onNavigate(AppView.DASHBOARD);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
            title="Guardar y salir al Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="mt-6 space-y-2">
            <h2 className="font-serif text-3xl text-brand-900">Cuéntanos de tu negocio</h2>
            <p className="text-gray-500">Configura el perfil de tu negocio</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 flex-1">
          
          <div className="space-y-6">
            <ImageUpload 
              label="Logo o foto de perfil"
              onChange={handleImageChange}
              previewUrl={formData.logoUrl}
            />

            <div className="space-y-4">
              <Input 
                label="Nombre de tu negocio" 
                name="businessName"
                type="text" 
                placeholder="Ej. Restaurante El Sabor"
                icon={<Store className="w-5 h-5" />}
                value={formData.businessName}
                onChange={handleInputChange}
                required
              />
              
              <Input 
                label="¿Qué tipo de comida vende?" 
                name="cuisineType"
                type="text" 
                placeholder="Ej. Italiana, Mexicana, Mariscos..."
                icon={<UtensilsCrossed className="w-5 h-5" />}
                value={formData.cuisineType}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
           <div className="pt-4">
              <Button 
                type="submit" 
                fullWidth 
                isLoading={loading}
              >
                {isOnboarding ? 'Continuar' : 'Guardar Cambios'}
              </Button>
           </div>
        </form>
        
        {/* Step Indicator (Only in onboarding) */}
        {isOnboarding && (
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-6 h-2 rounded-full bg-brand-900"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
          </div>
        )}
      </div>
    </div>
  );
};