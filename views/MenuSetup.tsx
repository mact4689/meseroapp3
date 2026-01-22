
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ImageUpload } from '../components/ImageUpload';
import { AppView, MenuItem } from '../types';
import { ArrowLeft, Plus, DollarSign, Tag, Coffee, Trash2, Utensils, AlignLeft, Carrot, ImageIcon, Sparkles, Pencil, X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { uploadImage } from '../services/db';

interface MenuSetupProps {
  onNavigate: (view: AppView) => void;
}

export const MenuSetup: React.FC<MenuSetupProps> = ({ onNavigate }) => {
  const { state, addMenuItem, updateMenuItem, removeMenuItem } = useAppStore();
  const { isOnboarding } = state;
  
  // Use global state for items
  const items = state.menu;
  
  // Form States
  const [category, setCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Helper seguro para generar UUID v4 compatible con Supabase (Postgres)
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
        setImageFile(file);
    } else {
        setImagePreview(null);
        setImageFile(null);
    }
  };

  const validateForm = () => {
    if (!category.trim()) {
        alert("Por favor, ingresa una categoría (ej. Bebidas, Entradas).");
        return false;
    }
    if (!itemName.trim()) {
        alert("Por favor, ingresa el nombre del platillo.");
        return false;
    }
    if (!price.trim()) {
        alert("Por favor, ingresa el precio.");
        return false;
    }
    return true;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!state.user) {
        alert("Error de sesión: No se ha detectado un usuario activo. Intenta recargar la página.");
        return;
    }

    setIsSubmittingItem(true);
    
    try {
        let finalImageUrl = imagePreview;

        // Subir imagen solo si hay un archivo nuevo seleccionado
        if (imageFile) {
            const path = `menu/${state.user.id}/${Date.now()}`;
            const publicUrl = await uploadImage(imageFile, path);
            if (publicUrl) {
                finalImageUrl = publicUrl;
            } else {
                console.warn("No se pudo subir la imagen, guardando sin imagen.");
                finalImageUrl = null;
            }
        } else if (imagePreview && imagePreview.startsWith('blob:')) {
            // Limpieza de blob urls huerfanas
            finalImageUrl = null;
        }

        const newItem: MenuItem = {
          id: editingId ? editingId : generateId(),
          name: itemName,
          price: price,
          category: category,
          description: description,
          ingredients: ingredients,
          image: finalImageUrl,
          imageFile: null 
        };

        if (editingId) {
          await updateMenuItem(editingId, newItem);
          setEditingId(null);
        } else {
          await addMenuItem(newItem);
        }
        
        // Limpiar formulario excepto categoría para facilitar entrada rápida
        setItemName('');
        setPrice('');
        setDescription('');
        setIngredients('');
        setImagePreview(null);
        setImageFile(null);
        
        // Scroll suave al listado para confirmar visualmente
        const listElement = document.getElementById('menu-list');
        if (listElement) {
             listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

    } catch (error: any) {
        console.error("Error saving item:", error);
        alert(`No se pudo guardar: ${error.message || 'Error desconocido en la base de datos'}`);
    } finally {
        setIsSubmittingItem(false);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setItemName(item.name);
    setPrice(item.price);
    setDescription(item.description || '');
    setIngredients(item.ingredients || '');
    setImagePreview(item.image || null);
    setImageFile(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setItemName('');
    setPrice('');
    setDescription('');
    setIngredients('');
    setImagePreview(null);
    setImageFile(null);
  };

  const handleLoadSample = () => {
    if (!state.user) return;
    const samples: MenuItem[] = [
      { id: generateId(), name: 'Tacos al Pastor', price: '25', category: 'Platillos', description: 'Tacos de cerdo adobado con piña', ingredients: 'Tortilla, Cerdo, Piña, Cilantro, Cebolla', image: null },
      { id: generateId(), name: 'Enchiladas Verdes', price: '120', category: 'Platillos', description: 'Rellenas de pollo con salsa verde', ingredients: 'Pollo, Tortilla, Tomate, Crema, Queso', image: null },
      { id: generateId(), name: 'Hamburguesa Clásica', price: '150', category: 'Platillos', description: 'Carne angus 100%', ingredients: 'Res, Pan, Queso, Lechuga, Tomate', image: null },
    ];

    samples.forEach((item) => {
      addMenuItem(item).catch(e => console.error("Error loading sample:", e));
    });
  };

  const handleBack = () => {
    onNavigate(AppView.DASHBOARD);
  };

  const handleRemoveItem = (id: string) => {
    if (editingId === id) {
      handleCancelEdit();
    }
    removeMenuItem(id).catch(e => alert(e.message));
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLoadSample}
              className="text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-full flex items-center transition-colors"
              type="button"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Simular Menú
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <h2 className="font-serif text-3xl text-brand-900">Tu Menú Digital</h2>
            <p className="text-gray-500">Agrega fotos y detalles a tus platillos.</p>
          </div>
        </div>

        {/* Warning if no user */}
        {!state.user && !isOnboarding && (
             <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Error de sesión. Recarga la página.
             </div>
        )}

        {/* Form Section */}
        <div className={`
          p-5 rounded-2xl border transition-all duration-300 mb-6 shadow-sm
          ${editingId ? 'bg-accent-50 border-accent-200' : 'bg-gray-50 border-gray-100'}
        `}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-900 text-sm">
              {editingId ? 'Editando Platillo' : 'Nuevo Platillo'}
            </h3>
            {editingId && (
              <button 
                onClick={handleCancelEdit}
                className="text-xs flex items-center text-gray-500 hover:text-red-500 bg-white px-2 py-1 rounded-md border border-gray-200"
              >
                <X className="w-3 h-3 mr-1" /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
             <div className="flex gap-4">
                <div className="w-24 shrink-0">
                  <ImageUpload 
                    onChange={handleImageChange}
                    previewUrl={imagePreview}
                    className="aspect-square !rounded-xl !border-gray-200"
                  />
                </div>
                <div className="flex-1 space-y-3">
                   <Input 
                      placeholder="Categoría"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      icon={<Tag className="w-4 h-4" />}
                      className="bg-white"
                      list="categories" 
                    />
                    <datalist id="categories">
                        <option value="Entradas" />
                        <option value="Platillos" />
                        <option value="Bebidas" />
                        <option value="Postres" />
                    </datalist>
                     <Input 
                      placeholder="Precio ($)"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      icon={<DollarSign className="w-4 h-4" />}
                      className="bg-white"
                      step="0.01"
                    />
                </div>
             </div>

             <Input 
                placeholder="Nombre del platillo"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                icon={<Utensils className="w-4 h-4" />}
                className="bg-white"
              />

              <Input 
                placeholder="Descripción (¿Qué es?)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                icon={<AlignLeft className="w-4 h-4" />}
                className="bg-white"
              />

              <Input 
                placeholder="Ingredientes (Opcional)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                icon={<Carrot className="w-4 h-4" />}
                className="bg-white"
              />
              
              <Button 
                type="submit" 
                variant={editingId ? 'secondary' : 'primary'}
                fullWidth 
                isLoading={isSubmittingItem}
                icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                className={`py-2.5 text-sm mt-2 ${editingId ? 'border-accent-300 bg-white text-accent-700 hover:bg-accent-50' : ''}`}
              >
                {editingId ? 'Actualizar Platillo' : 'Agregar Platillo'}
              </Button>
          </form>
        </div>

        {/* Menu List */}
        <div id="menu-list" className="flex-1 overflow-y-auto pr-1 scrollbar-thin mb-4">
          {Object.keys(groupedItems).length === 0 ? (
             <div className="text-center py-10 opacity-50 border-2 border-dashed border-gray-200 rounded-xl">
               <Coffee className="w-10 h-10 mx-auto mb-2 text-gray-400" />
               <p className="text-sm text-gray-500">Tu menú está vacío</p>
             </div>
          ) : (
            <div className="space-y-6 pb-4">
              {Object.entries(groupedItems).map(([cat, catItems]: [string, MenuItem[]]) => (
                <div key={cat} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="font-serif text-lg font-bold text-brand-900 flex items-center bg-white sticky top-0 py-2 z-10">
                    <span className="w-1.5 h-1.5 bg-accent-500 rounded-full mr-2"></span>
                    {cat}
                  </h3>
                  <div className="space-y-3">
                    {catItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`
                          relative flex gap-3 bg-white p-3 rounded-xl border shadow-sm transition-all
                          ${editingId === item.id ? 'border-accent-500 ring-1 ring-accent-500' : 'border-gray-100 hover:border-gray-200'}
                        `}
                      >
                        <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-100">
                           {item.image ? (
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300">
                               <ImageIcon className="w-6 h-6" />
                             </div>
                           )}
                        </div>

                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                            <span className="font-bold text-brand-900 text-sm">${item.price}</span>
                          </div>
                          
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => handleEditItem(item)}
                            className={`
                              p-1.5 rounded-full transition-colors
                              ${editingId === item.id 
                                ? 'text-accent-600 bg-accent-50' 
                                : 'text-gray-300 hover:text-brand-900 hover:bg-gray-100'}
                            `}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions - Solo visible en onboarding */}
        {isOnboarding && (
           <div className="mt-auto pt-4 border-t border-gray-100 bg-white">
               <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <div className="w-6 h-2 rounded-full bg-brand-900"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
