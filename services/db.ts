
import { supabase } from './client';
import { MenuItem, Order } from '../types';

// --- STORAGE (Imágenes) ---

export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
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
      // Don't warn for PGRST116 (0 rows) as it's expected for new users
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
      // Ignore if table doesn't exist yet (42P01)
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
  // Convert price string to number for DB compatibility
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

  let { error } = await supabase
    .from('menu_items')
    .insert(payload);

  // FALLBACK: Manejo robusto de errores de esquema
  if (error) {
      // Si falta la columna 'available' (Error 42703), reintentamos sin ella
      if (error.code === '42703') {
          console.warn("Columna faltante en DB. Guardando en modo compatibilidad...");
          // Try removing printer_id first as it is newer
          const { printer_id, ...payloadNoPrinter } = payload;
          let retry = await supabase.from('menu_items').insert(payloadNoPrinter);
          
          // If still failing, try removing available
          if (retry.error && retry.error.code === '42703') {
             const { available, ...payloadNoAvailable } = payloadNoPrinter;
             retry = await supabase.from('menu_items').insert(payloadNoAvailable);
          }
          error = retry.error;
      }
      
      if (error) {
          console.error('Error inserting item:', JSON.stringify(error, null, 2));
          // Alert user if table is missing (common setup error)
          if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
              console.error("CRITICAL: Table 'menu_items' does not exist in Supabase. Please run the SQL setup script.");
          }
      }
  }
  return error;
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

  // FALLBACK: Manejo robusto de errores de esquema
  if (error) {
       // Si falta la columna (Error 42703)
       if (error.code === '42703') {
           console.warn("Columna faltante en DB. Actualizando en modo compatibilidad...");
           const { printer_id, ...fallbackPayload } = payload;
           const retry = await supabase.from('menu_items').update(fallbackPayload).eq('id', itemId);
           error = retry.error;
       }

       if (error) {
          console.error('Error updating item:', JSON.stringify(error, null, 2));
       }
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
      items: order.items // Supabase handles JSONB automatically
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', JSON.stringify(error, null, 2));
    
    // Check for missing table
    if (error.code === '42P01') {
      alert("Error: La tabla 'orders' no existe en Supabase. Ejecuta el script SQL de configuración.");
    } 
    // Check for missing column user_id (42703)
    else if (error.code === '42703') {
        alert("Error de Base de Datos: La tabla 'orders' no tiene la columna 'user_id'. Revisa la consola.");
        console.error("%c SQL FIX REQUIRED: ", "background: red; color: white; font-size: 14px; font-weight: bold;");
        console.error("Ejecuta esto en Supabase SQL Editor: ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid references auth.users;");
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
    .order('created_at', { ascending: false }); // Newest first

  if (error) {
     // Ignore table not found error for initial load
     if (error.code !== '42P01') {
         console.error('Error fetching orders:', JSON.stringify(error, null, 2));
     }
     
     if (error.code === '42703') {
        console.error("%c CRITICAL DB ERROR: ", "color: red; font-weight: bold;", "Missing 'user_id' in 'orders' table.");
        console.error("FIX: Run `ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid references auth.users;` in Supabase.");
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