
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
  // Upsert suele ser crítico, aplicamos retry si es error de red
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
    if (err.code !== '42P01') { // 42P01 es "tabla no existe", no vale la pena reintentar
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
      printer_id: item.printerId || null
  };

  const attemptInsert = async () => {
      let { error } = await supabase
        .from('menu_items')
        .insert(payload);

      // FALLBACK: Error de esquema (Columnas faltantes), no reintentar por red
      if (error && error.code === '42703') {
          console.warn("Columna faltante en DB. Guardando en modo compatibilidad...");
          const { printer_id, ...payloadNoPrinter } = payload;
          let retry = await supabase.from('menu_items').insert(payloadNoPrinter);
          
          if (retry.error && retry.error.code === '42703') {
             const { available, ...payloadNoAvailable } = payloadNoPrinter;
             retry = await supabase.from('menu_items').insert(payloadNoAvailable);
          }
          error = retry.error;
      }
      
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
      printer_id: item.printerId
  };

  const attemptUpdate = async () => {
      let { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', itemId);

      if (error && error.code === '42703') {
           const { printer_id, ...fallbackPayload } = payload;
           const retry = await supabase.from('menu_items').update(fallbackPayload).eq('id', itemId);
           error = retry.error;
      }
      if (error) throw error;
      return null;
  };

  try {
      await withRetry(attemptUpdate);
      return null;
  } catch(error: any) {
      console.error('Error updating item:', error);
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

      if (error) throw error;
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
