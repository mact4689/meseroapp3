
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ImageUpload } from '../components/ImageUpload';
import { AppView, MenuItem, ItemOptionsConfig, OptionGroup, ItemOption } from '../types';
import { ArrowLeft, Plus, DollarSign, Tag, Coffee, Trash2, Utensils, AlignLeft, Carrot, ImageIcon, Sparkles, Pencil, X, AlertTriangle, Ban, CheckCircle, ChevronRight, Check, ChefHat, Settings2, Layers, Copy } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { uploadImage } from '../services/db';

interface MenuSetupProps {
  onNavigate: (view: AppView) => void;
}

export const MenuSetup: React.FC<MenuSetupProps> = ({ onNavigate }) => {
  const { state, addMenuItem, updateMenuItem, removeMenuItem, toggleItemAvailability } = useAppStore();
  const { isOnboarding, stations } = state;

  // Use global state for items
  const items = state.menu;

  // Form States
  const [category, setCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Options/Variations State
  const [hasOptions, setHasOptions] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Helper seguro para generar UUID v4 compatible con Supabase
  const generateId = () => {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch (e) {
      // Fallback en caso de error en crypto
    }

    // Polyfill robusto para navegadores antiguos o contextos no seguros (HTTP)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
      alert("Error de sesión: No se ha detectado un usuario activo. Por favor recarga la página e inicia sesión nuevamente.");
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
          // No detenemos el proceso, permitimos guardar sin imagen
          // finalImageUrl se queda como estaba (si era local) o null
          if (imagePreview && imagePreview.startsWith('blob:')) {
            finalImageUrl = null;
          }
        }
      } else if (imagePreview && imagePreview.startsWith('blob:')) {
        // Limpieza de blob urls huerfanas si no se subió
        finalImageUrl = null;
      }

      // Build options config if enabled
      const optionsConfig: ItemOptionsConfig | null = hasOptions && optionGroups.length > 0
        ? { hasOptions: true, groups: optionGroups }
        : null;

      const newItem: MenuItem = {
        id: editingId ? editingId : generateId(),
        name: itemName,
        price: price,
        category: category,
        description: description,
        ingredients: ingredients,
        image: finalImageUrl,
        imageFile: null,
        available: true,
        stationId: selectedStationId || undefined,
        options: optionsConfig
      };

      if (editingId) {
        // Mantener disponibilidad previa si se edita
        const existing = items.find(i => i.id === editingId);
        newItem.available = existing?.available ?? true;

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
      // No limpiamos printerId/stationId para facilitar entrada en batch
      setImagePreview(null);
      setImageFile(null);
      setHasOptions(false);
      setOptionGroups([]);

      // Scroll suave al listado para confirmar visualmente
      const listElement = document.getElementById('menu-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (error: any) {
      console.error("Error saving item:", error);
      alert(`No se pudo guardar: ${error.message || 'Error desconocido'}. Si el error persiste, verifica tu conexión.`);
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
    setSelectedStationId(item.stationId || '');
    setImagePreview(item.image || null);
    setImageFile(null);
    // Load options if they exist
    if (item.options && item.options.hasOptions) {
      setHasOptions(true);
      setOptionGroups(item.options.groups || []);
    } else {
      setHasOptions(false);
      setOptionGroups([]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setItemName('');
    setPrice('');
    setDescription('');
    setIngredients('');
    setSelectedStationId('');
    setImagePreview(null);
    setImageFile(null);
    setHasOptions(false);
    setOptionGroups([]);
  };

  const handleLoadSample = () => {
    if (!state.user) return;
    const samples: MenuItem[] = [
      { id: generateId(), name: 'Tacos al Pastor', price: '25', category: 'Platillos', description: 'Tacos de cerdo adobado con piña', ingredients: 'Tortilla, Cerdo, Piña, Cilantro, Cebolla', image: null, available: true },
      { id: generateId(), name: 'Enchiladas Verdes', price: '120', category: 'Platillos', description: 'Rellenas de pollo con salsa verde', ingredients: 'Pollo, Tortilla, Tomate, Crema, Queso', image: null, available: true },
      { id: generateId(), name: 'Hamburguesa Clásica', price: '150', category: 'Platillos', description: 'Carne angus 100%', ingredients: 'Res, Pan, Queso, Lechuga, Tomate', image: null, available: true },
    ];

    // Cargar secuencialmente para evitar condiciones de carrera en conexiones lentas
    const loadAll = async () => {
      setIsSubmittingItem(true);
      try {
        for (const item of samples) {
          await addMenuItem(item);
        }
      } catch (e: any) {
        console.error("Error loading sample:", e);
        alert("Error al cargar ejemplos: " + e.message);
      } finally {
        setIsSubmittingItem(false);
      }
    };
    loadAll();
  };

  const handleBack = () => {
    if (isOnboarding) {
      onNavigate(AppView.KDS_SETUP);
    } else {
      onNavigate(AppView.DASHBOARD);
    }
  };

  const handleNextStep = () => {
    onNavigate(AppView.TABLE_SETUP);
  };

  const handleRemoveItem = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este platillo?")) {
      if (editingId === id) {
        handleCancelEdit();
      }
      removeMenuItem(id).catch(e => alert(e.message));
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleItemAvailability(id);
    } catch (error: any) {
      // If we catch here, it means the DB update failed and the optimistic update was reverted.
      console.error("Failed to toggle availability:", error);
      alert("Error: No se pudo cambiar la disponibilidad. Revisa la consola o recarga la página.");
    }
  };

  // --- OPTIONS MANAGEMENT FUNCTIONS ---
  const addOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: generateId(),
      name: '',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      options: []
    };
    setOptionGroups([...optionGroups, newGroup]);
  };

  const updateOptionGroup = (groupId: string, updates: Partial<OptionGroup>) => {
    setOptionGroups(groups =>
      groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    );
  };

  const removeOptionGroup = (groupId: string) => {
    setOptionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const duplicateOptionGroup = (group: OptionGroup) => {
    const newGroup: OptionGroup = {
      ...group,
      id: generateId(),
      name: `${group.name} (Copia)`,
      options: group.options.map(opt => ({
        ...opt,
        id: generateId()
      }))
    };
    setOptionGroups([...optionGroups, newGroup]);
  };

  const addOptionToGroup = (groupId: string) => {
    const newOption: ItemOption = {
      id: generateId(),
      name: '',
      priceModifier: 0
    };
    setOptionGroups(groups =>
      groups.map(g => g.id === groupId
        ? { ...g, options: [...g.options, newOption] }
        : g
      )
    );
  };

  const updateOptionInGroup = (groupId: string, optionId: string, updates: Partial<ItemOption>) => {
    setOptionGroups(groups =>
      groups.map(g => g.id === groupId
        ? {
          ...g,
          options: g.options.map(o => o.id === optionId ? { ...o, ...updates } : o)
        }
        : g
      )
    );
  };

  const removeOptionFromGroup = (groupId: string, optionId: string) => {
    setOptionGroups(groups =>
      groups.map(g => g.id === groupId
        ? { ...g, options: g.options.filter(o => o.id !== optionId) }
        : g
      )
    );
  };
  // --- END OPTIONS MANAGEMENT ---

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
              title={isOnboarding ? "Volver" : "Volver al Dashboard"}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleLoadSample}
              className="text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-full flex items-center transition-colors disabled:opacity-50"
              type="button"
              disabled={isSubmittingItem}
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Simular Menú
            </button>
          </div>

          {isOnboarding ? (
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center justify-center space-x-2 mb-4 w-full">
                {/* Step 1 - Done */}
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5" /></div>
                </div>
                <div className="w-3 h-0.5 bg-brand-900"></div>

                {/* Step 2 - Done */}
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold"><CheckCircle className="w-5 h-5" /></div>
                </div>
                <div className="w-3 h-0.5 bg-brand-900"></div>

                {/* Step 3 - Active */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/20">3</div>
                  <span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Menú</span>
                </div>
                <div className="w-3 h-0.5 bg-gray-200"></div>

                {/* Step 4 - Inactive */}
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
                </div>
                <div className="w-3 h-0.5 bg-gray-200"></div>

                {/* Step 5 - Inactive */}
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">5</div>
                </div>
              </div>
              <h2 className="text-3xl text-brand-900 text-center">Arma tu Menú</h2>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h2 className="text-3xl text-brand-900">Tu Menú Digital</h2>
              <p className="text-gray-500">Agrega fotos y detalles a tus platillos.</p>
            </div>
          )}
        </div>

        {/* Warning if no user */}
        {!state.user && !isOnboarding && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center animate-pulse">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Error de sesión. <strong>Recarga la página</strong>.</span>
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
                  required
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
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  icon={<DollarSign className="w-4 h-4" />}
                  className="bg-white"
                  required
                />
              </div>
            </div>

            <Input
              placeholder="Nombre del platillo"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              icon={<Utensils className="w-4 h-4" />}
              className="bg-white"
              required
            />



            {/* KDS Station Selection Dropdown */}
            <div className="w-full space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ChefHat className="w-4 h-4" />
                </div>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className={`
                            block w-full rounded-xl border-gray-200 bg-white 
                            focus:border-brand-900 focus:ring-1 focus:ring-brand-900 
                            text-gray-900 py-3.5 pl-10 border appearance-none
                        `}
                >
                  <option value="">¿En que estación saldrá tu platillo?</option>
                  {stations.map(station => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              {stations.length === 0 && (
                <p className="text-[11px] text-gray-400 pl-1">💡 Configura estaciones en Dashboard → KDS</p>
              )}
            </div>

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

            {/* --- OPTIONS/VARIATIONS SECTION --- */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  const newHasOptions = !hasOptions;
                  setHasOptions(newHasOptions);
                  // Auto-add first group when enabling AND no groups exist
                  if (newHasOptions && optionGroups.length === 0) {
                    const firstGroup: OptionGroup = {
                      id: generateId(),
                      name: '',
                      required: true,
                      minSelect: 1,
                      maxSelect: 1,
                      options: []
                    };
                    setOptionGroups([firstGroup]);
                  }
                }}
                className={`
                  w-full flex items-center justify-between p-3 rounded-xl border transition-all
                  ${hasOptions
                    ? 'bg-brand-50 border-brand-200 text-brand-900'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-sm font-medium">¿Tiene opciones o variantes?</span>
                </div>
                <div className={`
                  w-10 h-6 rounded-full p-0.5 transition-colors
                  ${hasOptions ? 'bg-brand-900' : 'bg-gray-300'}
                `}>
                  <div className={`
                    w-5 h-5 rounded-full bg-white shadow transform transition-transform
                    ${hasOptions ? 'translate-x-4' : 'translate-x-0'}
                  `} />
                </div>
              </button>
              <p className="text-[11px] text-gray-400 mt-1 pl-1">
                Ej: Sabores de helado, tamaños, extras con costo adicional
              </p>

              {/* Option Groups Editor */}
              {hasOptions && (
                <div className="mt-4 space-y-4">
                  {optionGroups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <p>Cargando grupo de opciones...</p>
                    </div>
                  ) : (
                    optionGroups.map((group, groupIndex) => (
                      <div
                        key={group.id}
                        className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            Grupo {groupIndex + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateOptionGroup(group)}
                              title="Duplicar grupo"
                              className="p-1 text-gray-400 hover:text-brand-900 hover:bg-brand-50 rounded-full transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOptionGroup(group.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Group Name */}
                        <input
                          type="text"
                          placeholder="Nombre del grupo (ej: Escoge sabor)"
                          value={group.name}
                          onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-brand-900 focus:ring-1 focus:ring-brand-900 outline-none"
                        />

                        {/* Group Settings */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <label className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => updateOptionGroup(group.id, { required: e.target.checked })}
                              className="rounded border-gray-300 text-brand-900 focus:ring-brand-900"
                            />
                            <span className="text-gray-600">Obligatorio</span>
                          </label>

                          <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                            <span className="text-gray-500">Mín:</span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={group.minSelect}
                              onChange={(e) => updateOptionGroup(group.id, { minSelect: parseInt(e.target.value) || 0 })}
                              className="w-10 text-center border-0 p-0 focus:ring-0 text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                            <span className="text-gray-500">Máx:</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={group.maxSelect}
                              onChange={(e) => updateOptionGroup(group.id, { maxSelect: parseInt(e.target.value) || 1 })}
                              className="w-10 text-center border-0 p-0 focus:ring-0 text-sm"
                            />
                          </div>
                        </div>

                        {/* Options List */}
                        <div className="space-y-2">
                          {group.options.map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Opción (ej: Vainilla)"
                                value={option.name}
                                onChange={(e) => updateOptionInGroup(group.id, option.id, { name: e.target.value })}
                                className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-brand-900 focus:ring-1 focus:ring-brand-900 outline-none bg-white"
                              />
                              <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                                <span className="text-gray-400 text-xs">+$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="0"
                                  value={option.priceModifier || ''}
                                  onChange={(e) => updateOptionInGroup(group.id, option.id, { priceModifier: parseFloat(e.target.value) || 0 })}
                                  className="w-12 text-sm border-0 p-0 focus:ring-0 text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOptionFromGroup(group.id, option.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* Add Option Button */}
                          <button
                            type="button"
                            onClick={() => addOptionToGroup(group.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-brand-900 bg-white border border-dashed border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Añadir opción
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Group Button */}
                  <button
                    type="button"
                    onClick={addOptionGroup}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-xl hover:border-brand-900 hover:text-brand-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir otro grupo de opciones
                  </button>
                </div>
              )}
            </div>
            {/* --- END OPTIONS SECTION --- */}

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
                  <h3 className="text-lg font-bold text-brand-900 flex items-center bg-white sticky top-0 py-2 z-10 shadow-sm px-2 -mx-2 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-accent-500 rounded-full mr-2"></span>
                    {cat}
                  </h3>
                  <div className="space-y-3">
                    {catItems.map((item) => {
                      const isAvailable = item.available !== false;
                      const assignedStation = stations.find(s => s.id === item.stationId);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleEditItem(item)}
                          className={`
                          relative flex gap-3 bg-white p-3 rounded-xl border shadow-sm transition-all cursor-pointer group/card
                          ${editingId === item.id ? 'border-accent-500 ring-1 ring-accent-500' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}
                          ${!isAvailable ? 'opacity-80 bg-gray-50' : ''}
                        `}
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-100 relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}

                            {/* Sold Out Overlay Badge */}
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white uppercase bg-black/50 px-1 py-0.5 rounded">Agotado</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-bold truncate group-hover/card:text-brand-900 transition-colors ${!isAvailable ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-900'}`}>{item.name}</h4>
                              <span className={`font-bold text-sm ${!isAvailable ? 'text-gray-400' : 'text-brand-900'}`}>${item.price}</span>
                            </div>

                            {item.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                            )}

                            {/* Station indicator */}
                            {assignedStation && (
                              <div className="flex items-center mt-1.5 gap-3">
                                <div
                                  className="flex items-center text-[10px] gap-1 px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: assignedStation.color + '20', color: assignedStation.color }}
                                >
                                  <ChefHat className="w-3 h-3" />
                                  <span className="font-medium">{assignedStation.name}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div
                              className={`
                              p-1.5 rounded-full transition-colors mb-1
                              ${editingId === item.id
                                  ? 'text-accent-600 bg-accent-50'
                                  : 'text-gray-300 group-hover/card:text-brand-900 group-hover/card:bg-gray-100'}
                            `}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </div>

                            {/* Toggle Availability Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAvailability(item.id);
                              }}
                              className={`
                                flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-all border
                                ${isAvailable
                                  ? 'bg-white border-red-100 text-red-500 hover:bg-red-50'
                                  : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                                }
                            `}
                              title={isAvailable ? "Marcar como Agotado" : "Marcar como Disponible"}
                            >
                              {isAvailable ? (
                                <>
                                  <Ban className="w-3 h-3" />
                                  <span>Agotar</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Activ</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Continuar a Mesas
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
              icon={<Check className="w-5 h-5" />}
            >
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
