
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
  isLoading: boolean;
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
      isBillPrinter: true
    }
  ],
  orders: [],
  isOnboarding: false,
  isLoading: true
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
        setState(prev => ({ ...prev, user }));
        loadUserData(user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario'
        };
        // Update user state immediately
        setState(prev => ({ ...prev, user }));

        // Only reload data if it's a different user
        if (dataLoadedRef.current !== user.id) {
          loadUserData(user.id);
        }
      } else {
        setState({ ...baseState, isLoading: false });
        dataLoadedRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // REALTIME SUBSCRIPTION FOR ORDERS
  useEffect(() => {
    let channel: any;

    if (state.user) {
      console.log('🔌 Setting up realtime subscription for user:', state.user.id);

      getOrders(state.user.id).then(orders => {
        console.log('📋 Initial orders loaded:', orders.length);
        setState(prev => ({ ...prev, orders }));
      });

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
            console.log('🔔 NEW ORDER RECEIVED via Realtime:', newOrder);
            setState(prev => ({
              ...prev,
              orders: [newOrder, ...prev.orders]
            }));

            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(e => console.log('Audio autoplay blocked', e));
            } catch (e) { }
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
            console.log('🔄 Order updated via Realtime:', updatedOrder);
            setState(prev => ({
              ...prev,
              orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
            }));
          }
        )
        .subscribe((status: string) => {
          console.log('📡 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime is ACTIVE - listening for new orders');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime connection error - orders may not update automatically');
          }
        });
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [state.user?.id]);

  const loadUserData = async (userId: string) => {
    try {
      let [profileData, menuData] = await Promise.all([
        getProfile(userId),
        getMenuItems(userId)
      ]);

      if (!profileData) {
        console.log("⚠️ Perfil no encontrado. Creando perfil por defecto automáticamente...");
        const defaultProfile = {
          name: state.user?.name || 'Nuevo Restaurante',
          cuisine: 'General',
          tables_count: 0
        };

        await upsertProfile(userId, defaultProfile);

        profileData = {
          id: userId,
          logo_url: null,
          ...defaultProfile
        };
      }

      dataLoadedRef.current = userId;

      // Determine onboarding state properly
      const hasBusinessName = !!profileData.name && profileData.name !== 'Nuevo Restaurante';
      const hasMenu = menuData && menuData.length > 0;
      const hasTables = profileData.tables_count > 0;

      // If we have data, we assume onboarding is done, unless explicitly in an empty state
      // But to fix the "Redirect loop", let's trust the data.
      const shouldBeOnboarding = !hasBusinessName || (!hasMenu && !hasTables);

      setState(prev => ({
        ...prev,
        // Only force onboarding if we are significantly lacking data, otherwise let the user navigate
        isOnboarding: shouldBeOnboarding,
        business: {
          name: profileData.name || '',
          cuisine: profileData.cuisine || '',
          logo: profileData.logo_url
        },
        menu: menuData ? menuData.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: m.price.toString(),
          category: m.category,
          description: m.description,
          ingredients: m.ingredients,
          image: m.image_url,
          available: m.available !== false,
          printerId: m.printer_id
        })) : [],
        tables: profileData?.tables_count ? {
          count: profileData.tables_count.toString(),
          generated: Array.from({ length: profileData.tables_count }, (_, i) => ({ id: i + 1, qrDataUrl: '' }))
        } : prev.tables,
        isLoading: false
      }));

    } catch (e) {
      console.error("Error loading user data", e);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = (user: User) => {
    setState(prev => ({ ...prev, user, isLoading: true }));
    loadUserData(user.id);
  };

  const register = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isOnboarding: true,
      isLoading: false
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

    // Optimistic update
    const previousMenu = [...state.menu];
    setState(prev => ({
      ...prev,
      menu: [...prev.menu, item]
    }));

    // Ensure profile exists before inserting menu item (Fix for BUG-001)
    try {
      // We first try to perform the insert directly
      let error = await insertMenuItem(state.user.id, item);

      // If it fails with ForeignKey violation, it means Profile is missing
      if (error && (error.code === '23503' || error.message?.includes('violates foreign key constraint'))) {
        console.log("Fixing missing profile before adding menu item...");
        const profilePayload = {
          name: state.business.name || 'Mi Restaurante',
          cuisine: state.business.cuisine || 'Variada',
          logo_url: state.business.logo || null,
          tables_count: parseInt(state.tables.count) || 0
        };

        // Force create profile
        const profileError = await upsertProfile(state.user.id, profilePayload);
        if (profileError) {
          console.error("Failed to recover profile:", profileError);
          throw profileError; // Validate failure
        }

        // Retry insert
        error = await insertMenuItem(state.user.id, item);
      }

      if (error) {
        throw error;
      }

    } catch (err: any) {
      console.error("Error adding item (All attempts failed):", err);
      // Revert optimistic update
      setState(prev => ({ ...prev, menu: previousMenu }));
      throw new Error(err.message || "Error al guardar el platillo en la base de datos.");
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
