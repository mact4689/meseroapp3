
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MenuItem, User, Order, KitchenStation, TicketConfig, UserRole, RolePermissions } from '../types';
import { getProfile, getMenuItems, upsertProfile, insertMenuItem, updateMenuItemDb, deleteMenuItemDb, getOrders, updateOrderStatusDb, getStations, insertStation, deleteStationDb, updateOrderPreparedItemsDb, promoteMenuItem } from '../services/db';
import { supabase } from '../services/client';
import { playNotificationSound } from '../services/notification';

interface PendingRole {
  roleId: string;
  uid: string;
  permissions: RolePermissions;
  pinCode: string;
  roleName: string;
}

interface AppState {
  user: User | null;
  pendingRole: PendingRole | null;
  business: {
    name: string;
    cuisine: string;
    logo: string | null;
    kds_pin?: string;
  };
  menu: MenuItem[];
  tables: {
    count: string;
    generated: any[];
  };
  ticketConfig: TicketConfig;
  stations: KitchenStation[];
  orders: Order[];
  isOnboarding: boolean;
  isLoading: boolean;
}

interface AppContextType {
  state: AppState;
  register: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  unlockRole: (pin: string) => boolean;
  updateBusiness: (data: Partial<AppState['business']>) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (id: string, item: MenuItem) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  toggleItemAvailability: (id: string) => Promise<void>;
  promoteItem: (id: string) => Promise<void>;
  updateTables: (count: string, generated: any[]) => void;
  updateTicketConfig: (data: Partial<TicketConfig>) => void;
  completeOrder: (id: string, status?: 'completed' | 'delivered') => Promise<void>;
  closeTable: (tableNumber: string) => Promise<void>;
  addStation: (name: string, color: string) => Promise<void>;
  removeStation: (id: string) => Promise<void>;
  toggleItemPrepared: (orderId: string, itemId: string, stationId: string) => Promise<void>;
  startOnboarding: () => void;
  endOnboarding: () => void;
}

const defaultTicketConfig: TicketConfig = {
  title: 'TICKET DE ORDEN',
  footerMessage: 'Gracias por su preferencia',
  showDate: true,
  showTable: true,
  showOrderNumber: true,
  showNotes: true,
  textSize: 'normal',
  paperWidth: '80mm'
};

// Estado base
const baseState: AppState = {
  user: null,
  pendingRole: null,
  business: { name: '', cuisine: '', logo: null, kds_pin: '0000' },
  menu: [],
  tables: { count: '', generated: [] },
  ticketConfig: defaultTicketConfig,
  stations: [],
  orders: [],
  isOnboarding: false,
  isLoading: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(baseState);
  const dataLoadedRef = useRef<string | null>(null);

  // ─── Helper: fetch custom role permissions from URL params ───
  const fetchCustomRolePermissions = async (): Promise<{ permissions: RolePermissions; pin_code?: string; role_name: string } | null> => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleId = params.get('role_id');
      if (!roleId) return null;

      const { data, error } = await supabase
        .from('custom_roles')
        .select('permissions, pin_code, name')
        .eq('id', roleId)
        .single();

      if (error || !data) {
        console.warn('⚠️ Could not fetch custom role:', error?.message);
        return null;
      }
      console.log('🔐 Custom role permissions loaded:', data.permissions);
      return {
        permissions: data.permissions as RolePermissions,
        pin_code: data.pin_code,
        role_name: data.name
      };
    } catch (e) {
      console.error('Error fetching custom role:', e);
      return null;
    }
  };

  // Helper to load ONLY business data without touching the user role
  const loadBusinessData = async (restaurantId: string) => {
    try {
      // 1. Load Business Profile (again, to ensure state consistency)
      const profile = await getProfile(restaurantId);
      if (profile) {
        setState(prev => ({
          ...prev,
          business: {
            ...prev.business,
            name: profile.name,
            cuisine: profile.cuisine,
            logo: profile.logo_url,
            // AppState.business does not have 'currency', but the original QR block set it.
            // Keeping it here for consistency with the instruction, but it might be a type mismatch.
            currency: 'MXN'
          }
        }));
      }

      // 2. Load Menu & Stations
      const [menuItems, stations] = await Promise.all([
        getMenuItems(restaurantId),
        getStations(restaurantId)
      ]);
      setState(prev => ({
        ...prev,
        menu: menuItems ? menuItems.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: m.price.toString(),
          category: m.category,
          description: m.description,
          ingredients: m.ingredients,
          image: m.image_url,
          available: m.available !== false,
          printerId: m.printer_id,
          stationId: m.station_id,
          options: m.options || null,
          additional_images: m.additional_images || [],
          isPromoted: !!m.is_promoted
        })) : [],
        stations: stations || [],
        isLoading: false // Ensure loading state is cleared
      }));
    } catch (error) {
      console.error('Error loading business data:', error);
      setState(prev => ({ ...prev, isLoading: false })); // Clear loading state on error
    }
  };

  const createVirtualUser = (uid: string, permissions: RolePermissions, profile: any) => {
    const virtualUser: User = {
      id: 'virtual-staff-' + Math.random().toString(36).substr(2, 9),
      email: 'staff@virtual.com',
      name: 'Personal (QR)',
      role: 'waiter', // Default base role
      customPermissions: permissions,
      restaurantId: uid
    };

    console.log('✅ Sesión virtual creada:', virtualUser);

    setState(prev => ({
      ...prev,
      user: virtualUser,
      // Manually set business info since loadUserData might fail without auth
      business: {
        ...prev.business,
        name: profile.name,
        cuisine: profile.cuisine,
        logo: profile.logo_url,
        currency: 'MXN'
      }
    }));

    loadBusinessData(uid);
  };

  const unlockRole = (pin: string): boolean => {
    if (!state.pendingRole) return false;

    if (pin === state.pendingRole.pinCode) {
      const { uid, permissions } = state.pendingRole;

      const virtualUser: User = {
        id: 'virtual-staff-' + Math.random().toString(36).substr(2, 9),
        email: 'staff@virtual.com',
        name: 'Personal (QR)',
        role: 'waiter',
        customPermissions: permissions,
        restaurantId: uid
      };

      setState(prev => ({
        ...prev,
        user: virtualUser,
        pendingRole: null // Hide Lock Screen
      }));

      loadBusinessData(uid);
      return true;
    }

    return false;
  };

  // Verificar sesión al inicio
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const roleData = await fetchCustomRolePermissions();
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario',
          role: 'owner' as UserRole, // Default role, will be updated from profile
          customPermissions: roleData?.permissions,
        };
        setState(prev => ({ ...prev, user }));
        loadUserData(user.id);
      } else {
        // ─── ANONYMOUS ACCESS (QR CODE) ───
        const params = new URLSearchParams(window.location.search);
        const roleId = params.get('role_id');
        const uid = params.get('uid');

        if (roleId && uid) {
          console.log('🕵️ Detectado acceso por QR:', { roleId, uid });
          try {
            // 1. Fetch permissions
            const roleData = await fetchCustomRolePermissions();

            // 2. Fetch restaurant profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', uid)
              .single();

            if (roleData && profile) {
              // CHECK FOR PIN REQUIREMENT
              const pin = roleData.pin_code ? String(roleData.pin_code) : '';
              console.log('🔒 Checking PIN requirement:', {
                raw: roleData.pin_code,
                converted: pin,
                length: pin.length,
                isMatch: pin.length === 4
              });

              if (pin.length === 4) {
                // PIN REQUIRED -> SHOW LOCK SCREEN
                console.log('🔒 Custom Role requires PIN');
                setState(prev => ({
                  ...prev,
                  pendingRole: {
                    roleId,
                    uid,
                    permissions: roleData.permissions,
                    pinCode: pin,
                    roleName: roleData.role_name
                  },
                  // Set minimal business info for LockScreen
                  business: {
                    ...prev.business,
                    name: profile.name,
                    logo: profile.logo_url
                  },
                  isLoading: false
                }));
                return;
              }

              // NO PIN -> LOGIN IMMEDIATELY
              console.log('🔓 No PIN required (or invalid PIN format), logging in...');
              createVirtualUser(uid, roleData.permissions, profile);
              return;
            }
          } catch (e) {
            console.error('Error en acceso QR:', e);
          }
        }

        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const roleData = await fetchCustomRolePermissions();
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario',
          role: 'owner' as UserRole, // Default role, will be updated from profile
          customPermissions: roleData?.permissions,
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

            // Play notification sound
            playNotificationSound();
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
      let [profileData, menuData, stationsData] = await Promise.all([
        getProfile(userId),
        getMenuItems(userId),
        getStations(userId)
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

      // Get role from profile (defaults to 'owner' if not set)
      const userRole: UserRole = (profileData.role as UserRole) || 'owner';

      setState(prev => ({
        ...prev,
        // Update user with role from profile, preserving customPermissions
        user: prev.user ? { ...prev.user, role: userRole, customPermissions: prev.user.customPermissions } : prev.user,
        // Only force onboarding if we are significantly lacking data, otherwise let the user navigate
        isOnboarding: shouldBeOnboarding,
        business: {
          name: profileData.name || '',
          cuisine: profileData.cuisine || '',
          logo: profileData.logo_url,
          kds_pin: profileData.kds_pin || '0000'
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
          printerId: m.printer_id,
          stationId: m.station_id,
          options: m.options || null,
          additional_images: m.additional_images || [],
          isPromoted: !!m.is_promoted
        })) : [],
        tables: profileData?.tables_count ? {
          count: profileData.tables_count.toString(),
          generated: Array.from({ length: profileData.tables_count }, (_, i) => ({ id: i + 1, qrDataUrl: '' }))
        } : prev.tables,
        stations: stationsData || [],
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
        kds_pin: data.kds_pin !== undefined ? data.kds_pin : state.business.kds_pin,
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

  const promoteItem = async (id: string) => {
    if (!state.user) return;

    // Optimistically update state
    setState(prev => ({
      ...prev,
      menu: prev.menu.map(item => ({
        ...item,
        isPromoted: item.id === id ? !item.isPromoted : false
      }))
    }));

    try {
      await promoteMenuItem(state.user.id, id);
    } catch (err: any) {
      console.error("Error promoting item:", err);
      // We could revert here if critical, but typically a reload or next update will fix it.
      throw new Error("No se pudo actualizar la promoción");
    }
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

  const updateTicketConfig = (data: Partial<TicketConfig>) => {
    setState(prev => ({
      ...prev,
      ticketConfig: { ...prev.ticketConfig, ...data }
    }));
  };

  const completeOrder = async (orderId: string, status: 'completed' | 'delivered' = 'completed') => {
    // 1. Snapshot previous state for rollback
    const originalOrders = [...state.orders];

    // 2. Optimistic update
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }));

    // 3. Database update
    const error = await updateOrderStatusDb(orderId, status);

    if (error) {
      // 4. Rollback on error
      console.error("Failed to update order status, rolling back:", error);
      setState(prev => ({ ...prev, orders: originalOrders }));
      throw error;
    }
  };

  const closeTable = async (tableNumber: string) => {
    // 1. Find all orders for this table (pending or delivered)
    const tableOrders = state.orders.filter(
      o => o.table_number === tableNumber && (o.status === 'pending' || o.status === 'delivered')
    );

    // 2. Optimistically update all to completed
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        (o.table_number === tableNumber && (o.status === 'pending' || o.status === 'delivered'))
          ? { ...o, status: 'completed' }
          : o
      )
    }));

    // 3. Update in DB
    const updatePromises = tableOrders.map(o => updateOrderStatusDb(o.id, 'completed'));
    await Promise.all(updatePromises);
  };

  const addStation = async (name: string, color: string) => {
    if (!state.user) return;
    try {
      const newStation = await insertStation(state.user.id, { name, color });
      if (newStation) {
        setState(prev => ({
          ...prev,
          stations: [...prev.stations, newStation]
        }));
      }
    } catch (e) {
      console.error("Error adding station:", e);
      throw e;
    }
  };

  const removeStation = async (id: string) => {
    // Optimistic update
    const originalStations = [...state.stations];
    setState(prev => ({
      ...prev,
      stations: prev.stations.filter(s => s.id !== id)
    }));

    const error = await deleteStationDb(id);
    if (error) {
      // Revert
      setState(prev => ({ ...prev, stations: originalStations }));
      throw new Error("No se pudo eliminar la estación");
    }
  };

  const toggleItemPrepared = async (orderId: string, itemId: string, stationId: string) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const preparedItems = order.prepared_items || [];
    const itemIndex = preparedItems.findIndex(pi => pi.itemId === itemId && pi.stationId === stationId);

    let newPreparedItems;
    if (itemIndex >= 0) {
      // UNDO: Remove if exists
      newPreparedItems = preparedItems.filter((_, idx) => idx !== itemIndex);
    } else {
      // ADD: Mark as prepared
      newPreparedItems = [...preparedItems, {
        itemId,
        stationId,
        completedAt: Date.now()
      }];
    }

    // Optimistic update
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, prepared_items: newPreparedItems } : o)
    }));

    await updateOrderPreparedItemsDb(orderId, newPreparedItems);
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
      promoteItem,
      updateTables,
      updateTicketConfig,
      completeOrder,
      closeTable,
      addStation,
      removeStation,
      toggleItemPrepared,
      startOnboarding,
      endOnboarding,
      unlockRole,
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
