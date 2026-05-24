import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MenuItem, User, Order, KitchenStation, TicketConfig, UserRole, RolePermissions } from '../types';
import { getProfile, getMenuItems, upsertProfile, insertMenuItem, updateMenuItemDb, deleteMenuItemDb, getOrders, updateOrderStatusDb, getStations, insertStation, deleteStationDb, updateOrderPreparedItemsDb, promoteMenuItem } from '../services/db';
import { supabase } from '../services/client';
import { playNotificationSound } from '../services/notification';
import { useOrdersStore } from './ordersStore';

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
  isOnboarding: boolean;
  isLoading: boolean;
}

interface AppContextType {
  state: AppState;
  register: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  unlockRole: (pin: string) => Promise<boolean>;
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

const baseState: AppState = {
  user: null,
  pendingRole: null,
  business: { name: '', cuisine: '', logo: null, kds_pin: '0000' },
  menu: [],
  tables: { count: '', generated: [] },
  ticketConfig: defaultTicketConfig,
  stations: [],
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

      // Usar la función RPC segura get_custom_role_public_info en lugar de select directo,
      // protegiendo el pin_code y pin_code_hash de accesos anónimos.
      const { data, error } = await supabase
        .rpc('get_custom_role_public_info', { provided_role_id: roleId });

      if (error || !data || data.length === 0) {
        console.warn('⚠️ Could not fetch custom role:', error?.message);
        return null;
      }

      const role = data[0];
      console.log('🔐 Custom role data loaded:', { permissions: role.permissions, name: role.name, requires_pin: role.requires_pin });
      return {
        permissions: role.permissions as RolePermissions,
        pin_code: role.requires_pin ? '9999' : '', // Flag placeholder de 4 caracteres para indicar PIN requerido sin fugarlo
        role_name: role.name
      };
    } catch (e) {
      console.error('Error fetching custom role:', e);
      return null;
    }
  };

  // Helper to load ONLY business data without touching the user role
  const loadBusinessData = async (restaurantId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const profile = await getProfile(restaurantId);
      if (profile) {
        setState(prev => ({
          ...prev,
          business: {
            ...prev.business,
            name: profile.name,
            cuisine: profile.cuisine,
            logo: profile.logo_url,
          }
        }));
      }

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
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading business data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Creates a virtual user for QR role access
  const createVirtualUser = (uid: string, permissions: RolePermissions, profile: any, roleName: string) => {
    const virtualUser: User = {
      id: 'virtual-staff-' + Math.random().toString(36).substr(2, 9),
      email: 'staff@virtual.com',
      name: 'Personal (QR)',
      role: 'waiter',
      customPermissions: permissions,
      customRoleName: roleName,
      restaurantId: uid
    };

    console.log('✅ Sesión virtual creada:', virtualUser);

    setState(prev => ({
      ...prev,
      user: virtualUser,
      business: {
        ...prev.business,
        name: profile.name,
        cuisine: profile.cuisine,
        logo: profile.logo_url,
      },
      isLoading: false
    }));

    loadBusinessData(uid);
  };

  const unlockRole = async (pin: string): Promise<boolean> => {
    if (!state.pendingRole) return false;

    try {
      // Validar PIN de forma criptográfica y segura en la base de datos a través del RPC
      const { data: verifiedPermissions, error } = await supabase
        .rpc('verify_custom_role', {
          provided_role_id: state.pendingRole.roleId,
          provided_pin: pin
        });

      if (error || !verifiedPermissions) {
        console.warn("❌ Intento de login fallido por PIN incorrecto o error de RPC:", error);
        return false;
      }

      const { uid, roleName } = state.pendingRole;
      const virtualUser: User = {
        id: 'virtual-staff-' + Math.random().toString(36).substr(2, 9),
        email: 'staff@virtual.com',
        name: 'Personal (QR)',
        role: 'waiter',
        customPermissions: verifiedPermissions as RolePermissions,
        customRoleName: roleName,
        restaurantId: uid
      };

      setState(prev => ({
        ...prev,
        user: virtualUser,
        pendingRole: null
      }));

      loadBusinessData(uid);
      return true;
    } catch (e) {
      console.error('Error durante el desbloqueo por PIN:', e);
      return false;
    }
  };

  // ─── Check if this is a QR role access URL ───
  const isQrRoleAccess = (): boolean => {
    const params = new URLSearchParams(window.location.search);
    const hasParams = !!(params.get('role_id') && params.get('uid'));
    if (hasParams) return true;

    // Check if we already have a virtual user in our current state instance
    return !!(state.user?.id.startsWith('virtual-staff-'));
  };

  // ─── MAIN SESSION CHECK ───
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // ─── CHECK FOR QR ROLE ACCESS FIRST (takes priority over cached sessions) ───
      const params = new URLSearchParams(window.location.search);
      const roleId = params.get('role_id');
      const uid = params.get('uid');

      if (roleId && uid) {
        console.log('🕵️ Detectado acceso por QR (role):', { roleId, uid, hasSession: !!session });
        try {
          const roleData = await fetchCustomRolePermissions();

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

          if (roleData && profile) {
            const pin = roleData.pin_code ? String(roleData.pin_code) : '';
            console.log('🔒 Checking PIN requirement:', {
              raw: roleData.pin_code,
              converted: pin,
              length: pin.length,
              hasPin: pin.length === 4
            });

            if (pin.length === 4) {
              // ─── OPTIMIZATION: If already authenticated as this virtual user, don't ask for PIN again ───
              if (state.user?.id.startsWith('virtual-staff-') && state.user.restaurantId === uid) {
                console.log('✅ Already authenticated as virtual user — skipping PIN screen');
                setState(prev => ({ ...prev, isLoading: false }));
                return;
              }

              console.log('🔒 Custom Role requires PIN — showing lock screen');
              setState(prev => ({
                ...prev,
                pendingRole: {
                  roleId,
                  uid,
                  permissions: roleData.permissions,
                  pinCode: pin,
                  roleName: roleData.role_name
                },
                business: {
                  ...prev.business,
                  name: profile.name,
                  logo: profile.logo_url
                },
                isLoading: false
              }));
              return;
            }

            console.log('🔓 No PIN required — creating virtual staff user');
            createVirtualUser(uid, roleData.permissions, profile, roleData.role_name);
            return;
          } else {
            console.warn('⚠️ Could not load role data or profile for QR access');
            // Stop loading even if failed so we don't hang on Splash
            setState(prev => ({ ...prev, isLoading: false }));
            alert("Error: No se pudo cargar la información del rol. Verifica que el enlace sea correcto.");
          }
        } catch (e) {
          console.error('Error en acceso QR:', e);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }

      // ─── NORMAL SESSION HANDLING (no QR role params or QR failed) ───
      if (session?.user) {
        const roleData = await fetchCustomRolePermissions();
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario',
          role: 'owner' as UserRole,
          customPermissions: roleData?.permissions,
        };
        setState(prev => ({ ...prev, user }));
        loadUserData(user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // ─── CRITICAL: Don't let auth changes override QR role access ───
      if (isQrRoleAccess()) {
        console.log('🚫 Ignoring auth state change during QR role access');
        return;
      }

      if (session?.user) {
        const roleData = await fetchCustomRolePermissions();
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 'Usuario',
          role: 'owner' as UserRole,
          customPermissions: roleData?.permissions,
        };
        setState(prev => ({ ...prev, user }));

        if (dataLoadedRef.current !== user.id) {
          loadUserData(user.id);
        }
      } else {
        // ─── CRITICAL: If we have a virtual user, DON'T reset state when session is null ───
        if (state.user?.id.startsWith('virtual-staff-')) {
          console.log('🛡️ Preserving virtual user session (ignoring null Supabase session)');
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        setState({ ...baseState, isLoading: false });
        dataLoadedRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // REALTIME SUBSCRIPTION FOR ORDERS
  useEffect(() => {
    let channel: any;

    if (state.user) {
      const userId = state.user.restaurantId || state.user.id;
      console.log('🔌 Setting up realtime subscription for:', userId);

      getOrders(userId).then(orders => {
        console.log('📋 Initial orders loaded:', orders.length);
        useOrdersStore.getState().setOrders(orders);
      });

      channel = supabase
        .channel('orders-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newOrder = payload.new as Order;
            console.log('🔔 NEW ORDER RECEIVED via Realtime:', newOrder);
            useOrdersStore.getState().addOrder(newOrder);

            // Standard notification sound
            playNotificationSound();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const updatedOrder = payload.new as Order;
            console.log('🔄 Order updated via Realtime:', updatedOrder);
            useOrdersStore.getState().updateOrder(updatedOrder);
          }
        )
        .subscribe((status: string) => {
          console.log('📡 Realtime subscription status:', status);
        });
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]);

  const loadUserData = async (userId: string) => {
    try {
      // eslint-disable-next-line prefer-const
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

      const hasBusinessName = !!profileData.name && profileData.name !== 'Nuevo Restaurante';
      const hasMenu = menuData && menuData.length > 0;
      const hasTables = profileData.tables_count > 0;
      const shouldBeOnboarding = !hasBusinessName || (!hasMenu && !hasTables);

      const userRole: UserRole = (profileData.role as UserRole) || 'owner';

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, role: userRole, customPermissions: prev.user.customPermissions } : prev.user,
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

    const previousMenu = [...state.menu];
    setState(prev => ({
      ...prev,
      menu: [...prev.menu, item]
    }));

    try {
      let error = await insertMenuItem(state.user.id, item);

      if (error && (error.code === '23503' || error.message?.includes('violates foreign key constraint'))) {
        console.log("Fixing missing profile before adding menu item...");
        const profilePayload = {
          name: state.business.name || 'Mi Restaurante',
          cuisine: state.business.cuisine || 'Variada',
          logo_url: state.business.logo || null,
          tables_count: parseInt(state.tables.count) || 0
        };

        const profileError = await upsertProfile(state.user.id, profilePayload);
        if (profileError) {
          console.error("Failed to recover profile:", profileError);
          throw profileError;
        }

        error = await insertMenuItem(state.user.id, item);
      }

      if (error) {
        throw error;
      }

    } catch (err: any) {
      console.error("Error adding item (All attempts failed):", err);
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
    const ordersStore = useOrdersStore.getState();
    const originalOrders = [...ordersStore.orders];

    ordersStore.setOrders(originalOrders.map(o => o.id === orderId ? { ...o, status } : o));

    const error = await updateOrderStatusDb(orderId, status);

    if (error) {
      console.error("Failed to update order status, rolling back:", error);
      ordersStore.setOrders(originalOrders);
      throw error;
    }
  };

  const closeTable = async (tableNumber: string) => {
    const ordersStore = useOrdersStore.getState();
    const tableOrders = ordersStore.orders.filter(
      o => o.table_number === tableNumber && (o.status === 'pending' || o.status === 'delivered')
    );

    ordersStore.setOrders(ordersStore.orders.map(o =>
      (o.table_number === tableNumber && (o.status === 'pending' || o.status === 'delivered'))
        ? { ...o, status: 'completed' }
        : o
    ));

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
    const originalStations = [...state.stations];
    setState(prev => ({
      ...prev,
      stations: prev.stations.filter(s => s.id !== id)
    }));

    const error = await deleteStationDb(id);
    if (error) {
      setState(prev => ({ ...prev, stations: originalStations }));
      throw new Error("No se pudo eliminar la estación");
    }
  };

  const toggleItemPrepared = async (orderId: string, itemId: string, stationId: string) => {
    const ordersStore = useOrdersStore.getState();
    const order = ordersStore.orders.find(o => o.id === orderId);
    if (!order) return;

    const preparedItems = order.prepared_items || [];
    const itemIndex = preparedItems.findIndex(pi => pi.itemId === itemId && pi.stationId === stationId);

    let newPreparedItems;
    if (itemIndex >= 0) {
      newPreparedItems = preparedItems.filter((_, idx) => idx !== itemIndex);
    } else {
      newPreparedItems = [...preparedItems, {
        itemId,
        stationId,
        completedAt: Date.now()
      }];
    }

    ordersStore.setOrders(ordersStore.orders.map(o => o.id === orderId ? { ...o, prepared_items: newPreparedItems } : o));

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
