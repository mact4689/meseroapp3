
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MenuItem, User, Printer, Order } from '../types';
import { getProfile, getMenuItems, upsertProfile, insertMenuItem, updateMenuItemDb, deleteMenuItemDb, getOrders, updateOrderStatusDb } from '../services/db';
import { supabase } from '../services/client';

interface AppState {
  user: User | null;
  business: {
    name: string;
    cuisine: string;
    logo: string | null;
  };
  menu: MenuItem[];
  tables: {
    count: string;
    generated: any[];
  };
  printers: Printer[];
  orders: Order[];
  isOnboarding: boolean;
  isLoading: boolean; // Nuevo flag de carga
}

interface AppContextType {
  state: AppState;
  register: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  updateBusiness: (data: Partial<AppState['business']>) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (id: string, item: MenuItem) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  toggleItemAvailability: (id: string) => Promise<void>;
  updateTables: (count: string, generated: any[]) => void;
  updatePrinter: (id: string, data: Partial<Printer>) => void;
  completeOrder: (id: string) => Promise<void>;
  startOnboarding: () => void;
  endOnboarding: () => void;
}

const defaultTicketConfig = {
  title: 'ORDEN DE COCINA',
  footerMessage: '',
  showDate: true,
  showTable: true,
  showOrderNumber: true,
  showNotes: true,
  textSize: 'normal' as const
};

// Estado base
const baseState: AppState = {
  user: null,
  business: { name: '', cuisine: '', logo: null },
  menu: [],
  tables: { count: '', generated: [] },
  printers: [
    {
      id: '1',
      name: 'Impresora Principal',
      location: 'Cocina',
      isConnected: false,
      hardwareName: null,
      type: null,
      paperWidth: '80mm',
      ticketConfig: { ...defaultTicketConfig, title: 'ORDEN COCINA' },
      isBillPrinter: false
    },
    {
      id: '2',
      name: 'Impresora Secundaria',
      location: 'Barra',
      isConnected: false,
      hardwareName: null,
      type: null,
      paperWidth: '58mm',
      ticketConfig: { ...defaultTicketConfig, title: 'TICKET BARRA', textSize: 'normal' },
      isBillPrinter: true // Default bar printer as bill printer for example
    }
  ],
  orders: [],
  isOnboarding: false,
  isLoading: true // Inicia cargando
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(baseState);
  const dataLoadedRef = useRef<string | null>(null);

  // Verificar sesión al inicio
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario'
        };
        // Inicializar estado con usuario y luego cargar datos
        setState(prev => ({ ...prev, user }));
        loadUserData(user.id);
      } else {
        // Si no hay sesión, terminamos de cargar
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session?.user) {
         // Usuario logueado (o re-logueado)
         const user = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || 'Usuario'
         };
         setState(prev => ({ ...prev, user }));
         
         // Evitar recargas innecesarias si el usuario no ha cambiado
         if (dataLoadedRef.current !== user.id) {
             loadUserData(user.id);
         }
       } else {
         // Logout
         setState({ ...baseState, isLoading: false }); // Reset state and stop loading
         dataLoadedRef.current = null;
       }
    });

    return () => subscription.unsubscribe();
  }, []);

  // REALTIME SUBSCRIPTION FOR ORDERS
  useEffect(() => {
    let channel: any;

    if (state.user) {
        // Cargar órdenes existentes
        getOrders(state.user.id).then(orders => {
            setState(prev => ({ ...prev, orders }));
        });

        // Suscribirse a nuevas órdenes
        channel = supabase
            .channel('orders-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${state.user.id}`
                },
                (payload) => {
                    const newOrder = payload.new as Order;
                    console.log('New Order Received:', newOrder);
                    setState(prev => ({
                        ...prev,
                        orders: [newOrder, ...prev.orders]
                    }));
                    
                    try {
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
                        audio.play().catch(e => console.log('Audio autoplay blocked', e));
                    } catch (e) {}
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${state.user.id}`
                },
                (payload) => {
                    const updatedOrder = payload.new as Order;
                    setState(prev => ({
                        ...prev,
                        orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                    }));
                }
            )
            .subscribe();
    }

    return () => {
        if (channel) supabase.removeChannel(channel);
    };
  }, [state.user?.id]);

  const loadUserData = async (userId: string) => {
    try {
      const [profileData, menuData] = await Promise.all([
        getProfile(userId),
        getMenuItems(userId)
      ]);
      
      dataLoadedRef.current = userId;

      setState(prev => ({
        ...prev,
        isOnboarding: !profileData, 
        business: profileData ? {
          name: profileData.name,
          cuisine: profileData.cuisine,
          logo: profileData.logo_url
        } : prev.business,
        menu: menuData ? menuData.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: m.price.toString(),
            category: m.category,
            description: m.description,
            ingredients: m.ingredients,
            image: m.image_url,
            available: m.available !== false,
            printerId: m.printer_id // Mapeo de la base de datos
        })) : [],
        tables: profileData?.tables_count ? { 
            count: profileData.tables_count.toString(), 
            generated: Array.from({length: profileData.tables_count}, (_, i) => ({ id: i+1, qrDataUrl: '' })) 
        } : prev.tables,
        isLoading: false // Marcamos carga como completa
      }));

    } catch (e) {
      console.error("Error loading user data", e);
      setState(prev => ({ ...prev, isLoading: false })); // En caso de error, también terminamos carga
    }
  };

  const login = (user: User) => {
    setState(prev => ({ ...prev, user }));
    loadUserData(user.id);
  };

  const register = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isOnboarding: true
    }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ ...baseState, isLoading: false });
    dataLoadedRef.current = null;
  };

  const updateBusiness = async (data: Partial<AppState['business']>) => {
    setState(prev => ({
      ...prev,
      business: { ...prev.business, ...data }
    }));
    
    if (state.user) {
      const payload = {
        name: data.name !== undefined ? data.name : state.business.name,
        cuisine: data.cuisine !== undefined ? data.cuisine : state.business.cuisine,
        logo_url: data.logo !== undefined ? data.logo : state.business.logo,
      };

      await upsertProfile(state.user.id, payload);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    if (!state.user) {
        throw new Error("No hay sesión activa. Por favor recarga la página.");
    }

    setState(prev => ({
      ...prev,
      menu: [...prev.menu, item]
    }));

    let error = await insertMenuItem(state.user.id, item);

    if (error && (error.code === '23503' || error.message?.includes('violates foreign key constraint'))) {
       console.log("Perfil no encontrado (Error 23503). Intentando crear perfil por defecto...");
       
       const profilePayload = {
          name: state.business.name || 'Mi Restaurante',
          cuisine: state.business.cuisine || 'Variada',
          logo_url: state.business.logo || null
       };

       const profileError = await upsertProfile(state.user.id, profilePayload);

       if (!profileError) {
          error = await insertMenuItem(state.user.id, item);
       } else {
          console.error("No se pudo crear el perfil de respaldo:", profileError);
       }
    }

    if (error) {
      console.error("Error adding item:", error);
      setState(prev => ({
        ...prev,
        menu: prev.menu.filter(i => i.id !== item.id)
      }));
      throw new Error(error.message || "Error al guardar el platillo");
    }
  };

  const updateMenuItem = async (id: string, updatedItem: MenuItem) => {
    if (!state.user) {
        throw new Error("No hay sesión activa.");
    }

    const originalItem = state.menu.find(i => i.id === id);
    if (!originalItem) return;

    setState(prev => ({
      ...prev,
      menu: prev.menu.map(item => item.id === id ? updatedItem : item)
    }));

    const error = await updateMenuItemDb(id, updatedItem);
    if (error) {
      console.error("Error updating item:", error);
      setState(prev => ({
        ...prev,
        menu: prev.menu.map(item => item.id === id ? originalItem : item)
      }));
      throw new Error(error.message || "Error al actualizar el platillo");
    }
  };

  const toggleItemAvailability = async (id: string) => {
      if (!state.user) return;
      
      const item = state.menu.find(i => i.id === id);
      if (!item) return;

      const isCurrentlyAvailable = item.available !== false;
      const newStatus = !isCurrentlyAvailable;

      const updatedItem = { ...item, available: newStatus };

      await updateMenuItem(id, updatedItem);
  };

  const removeMenuItem = async (id: string) => {
    if (!state.user) return;

    const originalItem = state.menu.find(i => i.id === id);

    setState(prev => ({
      ...prev,
      menu: prev.menu.filter(i => i.id !== id)
    }));

    const error = await deleteMenuItemDb(id);
    if (error && originalItem) {
      setState(prev => ({
        ...prev,
        menu: [...prev.menu, originalItem]
      }));
      console.error("Error deleting item:", error);
      throw new Error("No se pudo eliminar el platillo");
    }
  };

  const updateTables = (count: string, generated: any[]) => {
    setState(prev => ({
      ...prev,
      tables: { count, generated }
    }));
    
    if (state.user) {
        upsertProfile(state.user.id, { tables_count: parseInt(count) });
    }
  };

  const updatePrinter = (id: string, data: Partial<Printer>) => {
    setState(prev => ({
      ...prev,
      printers: prev.printers.map(p => 
        p.id === id ? { ...p, ...data } : p
      )
    }));
  };

  const completeOrder = async (orderId: string) => {
     setState(prev => ({
         ...prev,
         orders: prev.orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o)
     }));
     await updateOrderStatusDb(orderId, 'completed');
  };

  const startOnboarding = () => {
    setState(prev => ({ ...prev, isOnboarding: true }));
  };

  const endOnboarding = () => {
    setState(prev => ({ ...prev, isOnboarding: false }));
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      login, 
      register, 
      logout,
      updateBusiness, 
      addMenuItem, 
      updateMenuItem, 
      removeMenuItem,
      toggleItemAvailability,
      updateTables, 
      updatePrinter, 
      completeOrder,
      startOnboarding, 
      endOnboarding 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};