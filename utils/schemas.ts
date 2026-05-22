import { z } from 'zod';

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'El nombre no puede estar vacío'),
  price: z.preprocess((val) => Number(val), z.number().min(0, 'El precio no puede ser negativo')),
  category: z.string().min(1, 'La categoría no puede estar vacía'),
  description: z.string().optional().default(''),
  ingredients: z.string().optional().default(''),
  image: z.string().nullable().optional(),
  available: z.boolean().optional().default(true),
  printerId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  options: z.any().nullable().optional(),
  additional_images: z.array(z.string()).nullable().optional(),
  isPromoted: z.boolean().optional().default(false)
});

export const OrderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.preprocess((val) => Number(val), z.number().min(0)),
  quantity: z.number().int().min(1),
  notes: z.string().optional().default(''),
  printerId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  category: z.string().nullable().optional()
});

export const OrderSchema = z.object({
  user_id: z.string().uuid(),
  table_number: z.string().min(1),
  total: z.preprocess((val) => Number(val), z.number().min(0, 'El total no puede ser negativo')),
  items: z.array(OrderItemSchema).min(1, 'La orden debe tener al menos un platillo')
});
