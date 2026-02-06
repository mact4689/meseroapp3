
import { supabase } from './client';
import { MenuItem, Order } from '../types';

// Helper para reintentar operaciones en caso de fallo de red
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isNetworkError = error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch');
    if (retries > 0 && isNetworkError) {
      console.warn(`Red inestable, reintentando operación... intentos restantes: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// --- STORAGE (Imágenes) ---

export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  const attemptUpload = async () => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  try {
    return await withRetry(attemptUpload);
  } catch (error) {
    console.error('Error uploading image after retries:', error);
    return null;
  }
};

// --- DATABASE (Datos) ---

export const getProfile = async (userId: string) => {
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  };

  try {
    return await withRetry(fetchProfile);
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
};

export const upsertProfile = async (userId: string, updates: any) => {
  const doUpsert = async () => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates });
    if (error) throw error;
    return null;
  };

  try {
    await withRetry(doUpsert);
    return null;
  } catch (error: any) {
    console.error('Error updating profile:', JSON.stringify(error, null, 2));
    return error;
  }
};

export const getMenuItems = async (userId: string) => {
  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  };

  try {
    return await withRetry(fetchMenu);
  } catch (err: any) {
    if (err.code !== '42P01') {
      console.error('Error fetching menu items:', err);
    }
    return [];
  }
};

export const insertMenuItem = async (userId: string, item: MenuItem) => {
  const numericPrice = parseFloat(item.price) || 0;

  const payload = {
    id: item.id,
    user_id: userId,
    name: item.name,
    price: numericPrice,
    category: item.category,
    description: item.description,
    ingredients: item.ingredients,
    image_url: item.image,
    available: item.available ?? true,
    printer_id: item.printerId || null,
    station_id: item.stationId || null,
    options: item.options || null,
    additional_images: item.additional_images || null,
    is_promoted: item.isPromoted ?? false
  };

  const attemptInsert = async () => {
    const { error } = await supabase
      .from('menu_items')
      .insert(payload);

    if (error) throw error;
    return null;
  };

  try {
    await withRetry(attemptInsert);
    return null;
  } catch (error: any) {
    console.error('Error inserting item:', JSON.stringify(error, null, 2));
    return error;
  }
};

export const updateMenuItemDb = async (itemId: string, item: MenuItem) => {
  const numericPrice = parseFloat(item.price) || 0;

  const payload = {
    name: item.name,
    price: numericPrice,
    category: item.category,
    description: item.description,
    ingredients: item.ingredients,
    image_url: item.image,
    available: item.available,
    printer_id: item.printerId,
    station_id: item.stationId,
    options: item.options || null,
    additional_images: item.additional_images || null,
    is_promoted: item.isPromoted
  };

  const attemptUpdate = async () => {
    const { error } = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', itemId);

    if (error) throw error;
    return null;
  };

  try {
    await withRetry(attemptUpdate);
    return null;
  } catch (error: any) {
    console.error('Error updating item:', error);
    return error;
  }
};

export const promoteMenuItem = async (userId: string, itemId: string) => {
  const attemptPromote = async () => {
    // 1. Unset all promoted items for this user
    await supabase
      .from('menu_items')
      .update({ is_promoted: false })
      .eq('user_id', userId);

    // 2. Set the new promoted item
    const { error } = await supabase
      .from('menu_items')
      .update({ is_promoted: true })
      .eq('id', itemId);

    if (error) throw error;
    return null;
  };

  try {
    await withRetry(attemptPromote);
    return null;
  } catch (error: any) {
    console.error('Error promoting item:', error);
    return error;
  }
};

export const deleteMenuItemDb = async (itemId: string) => {
  const attemptDelete = async () => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
    return null;
  };

  try {
    await withRetry(attemptDelete);
    return null;
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return error;
  }
};

// --- ORDERS ---

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>) => {
  const attemptCreateOrder = async () => {
    console.log('📤 Attempting to create order:', {
      user_id: order.user_id,
      table_number: order.table_number,
      total: order.total,
      itemsCount: order.items?.length
    });

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: order.user_id,
        table_number: order.table_number,
        status: 'pending',
        total: order.total,
        items: order.items
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }

    console.log('✅ Order created successfully:', data);
    return data;
  };

  try {
    return await withRetry(attemptCreateOrder);
  } catch (error: any) {
    console.error('Error creating order:', JSON.stringify(error, null, 2));
    if (error.code === '42P01') {
      alert("Error: La tabla 'orders' no existe en Supabase.");
    }
    throw error;
  }
};

export const getOrders = async (userId: string) => {
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  try {
    return await withRetry(fetchOrders);
  } catch (error: any) {
    if (error.code !== '42P01') {
      console.error('Error fetching orders:', JSON.stringify(error, null, 2));
    }
    return [];
  }
};

export const updateOrderStatusDb = async (orderId: string, status: 'completed' | 'cancelled') => {
  const attemptUpdateStatus = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
    return null;
  };

  try {
    return await withRetry(attemptUpdateStatus);
  } catch (error) {
    console.error('Error updating order:', JSON.stringify(error, null, 2));
    return error;
  }
};

export const updateOrderPreparedItemsDb = async (orderId: string, preparedItems: any[]) => {
  const attemptUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ prepared_items: preparedItems })
      .eq('id', orderId);
    if (error) throw error;
    return null;
  };

  try {
    return await withRetry(attemptUpdate);
  } catch (error) {
    console.error('Error updating prepared items:', error);
    return error;
  }
};


// --- KITCHEN STATIONS ---

export const getStations = async (userId: string) => {
  const fetchStations = async () => {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  try {
    return await withRetry(fetchStations);
  } catch (error: any) {
    if (error.code !== '42P01') {
      console.error('Error fetching stations:', error);
    }
    return [];
  }
};

export const insertStation = async (userId: string, station: { name: string, color: string }) => {
  const attemptInsert = async () => {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .insert({
        user_id: userId,
        name: station.name,
        color: station.color
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  try {
    return await withRetry(attemptInsert);
  } catch (error) {
    console.error('Error creating station:', error);
    throw error;
  }
};

export const deleteStationDb = async (stationId: string) => {
  const attemptDelete = async () => {
    console.log('[deleteStationDb] Attempting to delete station:', stationId);

    // First, unassign all menu items from this station
    const { error: unassignError } = await supabase
      .from('menu_items')
      .update({ station_id: null })
      .eq('station_id', stationId);

    if (unassignError) {
      console.error('[deleteStationDb] Error unassigning items:', unassignError);
      // Continue anyway, might be no items
    }

    // Now delete the station
    const { error } = await supabase
      .from('kitchen_stations')
      .delete()
      .eq('id', stationId);

    if (error) {
      console.error('[deleteStationDb] Error deleting:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[deleteStationDb] Success');
  };

  try {
    await withRetry(attemptDelete);
    return null; // Success
  } catch (error: any) {
    console.error('[deleteStationDb] Final error:', error?.message || error);
    return error;
  }
};

// Update prepared items for an order (public access for KDS tablets)
export const updateOrderPreparedItems = async (orderId: string, preparedItems: any[]) => {
  const attemptUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ prepared_items: preparedItems })
      .eq('id', orderId);

    if (error) throw error;
  };

  try {
    await withRetry(attemptUpdate);
    return null;
  } catch (error) {
    console.error('Error updating prepared items:', error);
    return error;
  }
};

// Helper to get the last takeout order number
export const getLastTakeoutOrderNumber = async (userId: string) => {
  const fetchLastRequest = async () => {
    // Like "LLEVAR-%"
    const { data, error } = await supabase
      .from('orders')
      .select('table_number')
      .eq('user_id', userId)
      .like('table_number', 'LLEVAR-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid 406 if no rows

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows" which is fine

    if (!data) return 0;

    // Extract number from "LLEVAR-42"
    const parts = data.table_number.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1]);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  try {
    return await withRetry(fetchLastRequest);
  } catch (e) {
    console.error("Error fetching last takeout number:", e);
    return 0; // Fallback to start at 1
  }
};
