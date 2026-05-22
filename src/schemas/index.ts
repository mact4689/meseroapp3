import { z } from 'zod';

export const RolePermissionsSchema = z.object({
  dashboard: z.boolean(),
  orders: z.boolean(),
  menu: z.boolean(),
  tables: z.boolean(),
  kds: z.boolean(),
  tickets: z.boolean(),
  staff: z.boolean(),
  reports: z.boolean(),
  business: z.boolean(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['owner', 'waiter', 'cook']),
  restaurantId: z.string().uuid().optional(),
  customPermissions: RolePermissionsSchema.nullable(),
  customRoleName: z.string().max(50).optional(),
});

export const ItemOptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  priceModifier: z.number().min(0),
});

export const OptionGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  required: z.boolean(),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
  options: z.array(ItemOptionSchema),
});

export const ItemOptionsConfigSchema = z.object({
  hasOptions: z.boolean(),
  groups: z.array(OptionGroupSchema),
});

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  ingredients: z.string().max(500).optional(),
  image: z.string().url().nullable().optional(),
  additional_images: z.array(z.string().url()).optional(),
  available: z.boolean().optional(),
  printerId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  options: ItemOptionsConfigSchema.nullable().optional(),
  isPromoted: z.boolean().optional(),
});

export const SelectedOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  priceModifier: z.number(),
});

export const OrderItemSchema = MenuItemSchema.extend({
  quantity: z.number().int().positive(),
  notes: z.string().max(200).optional(),
  selectedOptions: z.array(SelectedOptionSchema).optional(),
});

export const PreparedItemSchema = z.object({
  itemId: z.string(),
  stationId: z.string(),
  completedAt: z.number(),
  completedBy: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  table_number: z.string().min(1).max(10),
  status: z.enum(['pending', 'completed', 'cancelled', 'delivered']),
  total: z.number().min(0),
  items: z.array(OrderItemSchema),
  created_at: z.string().datetime(),
  prepared_items: z.array(PreparedItemSchema).optional(),
});

export const TicketConfigSchema = z.object({
  title: z.string().max(50).default('Ticket'),
  footerMessage: z.string().max(200).default(''),
  showDate: z.boolean().default(true),
  showTable: z.boolean().default(true),
  showOrderNumber: z.boolean().default(true),
  showNotes: z.boolean().default(true),
  showLogo: z.boolean().optional(),
  showAddress: z.boolean().optional(),
  customHeader: z.string().max(100).optional(),
  textSize: z.enum(['normal', 'large']).default('normal'),
  paperWidth: z.enum(['58mm', '80mm']).default('80mm'),
});

export const KitchenStationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type RolePermissions = z.infer<typeof RolePermissionsSchema>;
export type User = z.infer<typeof UserSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type TicketConfig = z.infer<typeof TicketConfigSchema>;
export type KitchenStation = z.infer<typeof KitchenStationSchema>;

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const validateMenuItem = (data: unknown) => {
  const result = MenuItemSchema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    };
  }
  return { valid: true, data: result.data };
};

export const validateOrder = (data: unknown) => {
  const result = OrderSchema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    };
  }
  return { valid: true, data: result.data };
};

export const validateUser = (data: unknown) => {
  const result = UserSchema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    };
  }
  return { valid: true, data: result.data };
};