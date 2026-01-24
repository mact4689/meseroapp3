
import { supabase } from './client';
import { MenuItem, Order } from '../types';

// Helper para reintentar operaciones en caso de fallo de red
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isNetworkError = error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('fetch');
    if (retries > 0 && isNetworkError) {
      console.warn(`Retrying operation... attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// --- STORAGE (Imágenes) ---

export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  // Función interna para realizar la subida
  const attemptUpload = async () => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
            upsert: true, // Forzar sobreescritura para evitar errores de duplicado en reintentos
            cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
  };

  try {
    // Envolvemos en lógica de retry
    return await withRetry(attemptUpload);
  } catch (error) {
    console.error('Error uploading image after retries:', error);
    return null;
  }
};

// --- DATABASE (Datos) ---

export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      if (error.code !== 'PGRST116') {
         console.warn('Error fetching profile:', JSON.stringify(error, null, 2));
      }
      return null;
    }
    return data;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
};

export const upsertProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates });

  if (error) console.error('Error updating profile:', JSON.stringify(error, null, 2));
  return error;
};

export const getMenuItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.code !== '42P01') {
        console.warn('Error fetching menu:', JSON.stringify(error, null, 2));
      }
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching menu:', err);
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

  // Función interna para realizar la inserción
  const attemptInsert = async () => {
      let { error } = await supabase
        .from('menu_items')
        .insert(payload);

      // FALLBACK: Manejo robusto de errores de esquema (Columnas faltantes)
      // Este error NO es de red, así que lo manejamos dentro del intento, no disparará retry de red
      if (error && error.code === '42703') {
          console.warn("Columna faltante en DB. Guardando en modo compatibilidad...");
          // Try removing printer_id first
          const { printer_id, ...payloadNoPrinter } = payload;
          let retry = await supabase.from('menu_items').insert(payloadNoPrinter);
          
          if (retry.error && retry.error.code === '42703') {
             const { available, ...payloadNoAvailable } = payloadNoPrinter;
             retry = await supabase.from('menu_items').insert(payloadNoAvailable);
          }
          error = retry.error;
      }
      
      // Si hay un error real (no de esquema manejado), lanzamos para que el retry catch lo vea o lo devuelva
      if (error) throw error;
      
      return null; // Success
  };

  try {
      await withRetry(attemptInsert);
      return null; // Success
  } catch (error: any) {
      console.error('Error inserting item:', JSON.stringify(error, null, 2));
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
          console.error("CRITICAL: Table 'menu_items' does not exist.");
      }
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

  let { error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', itemId);

  if (error) {
       if (error.code === '42703') {
           const { printer_id, ...fallbackPayload } = payload;
           const retry = await supabase.from('menu_items').update(fallbackPayload).eq('id', itemId);
           error = retry.error;
       }
       if (error) console.error('Error updating item:', JSON.stringify(error, null, 2));
  }
  return error;
};

export const deleteMenuItemDb = async (itemId: string) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId);

  if (error) console.error('Error deleting item:', JSON.stringify(error, null, 2));
  return error;
};

// --- ORDERS ---

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>) => {
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
    console.error('Error creating order:', JSON.stringify(error, null, 2));
    if (error.code === '42P01') {
      alert("Error: La tabla 'orders' no existe en Supabase.");
    } 
    else if (error.code === '42703') {
        alert("Error de Base de Datos: Columna faltante en 'orders'.");
    }
    throw error;
  }
  return data;
};

export const getOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
     if (error.code !== '42P01') {
         console.error('Error fetching orders:', JSON.stringify(error, null, 2));
     }
     return [];
  }
  return data || [];
};

export const updateOrderStatusDb = async (orderId: string, status: 'completed' | 'cancelled') => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  
  if (error) console.error('Error updating order:', JSON.stringify(error, null, 2));
  return error;
};