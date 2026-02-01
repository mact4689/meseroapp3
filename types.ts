
export enum AppView {
  SPLASH = 'SPLASH',
  WEBSITE = 'WEBSITE',
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  WELCOME = 'WELCOME',
  BUSINESS_SETUP = 'BUSINESS_SETUP',
  MENU_SETUP = 'MENU_SETUP',
  TABLE_SETUP = 'TABLE_SETUP',
  // PRINTER_SETUP Removed
  TICKET_CONFIG = 'TICKET_CONFIG',
  DASHBOARD = 'DASHBOARD',
  CUSTOMER_MENU = 'CUSTOMER_MENU',
  KDS_SETUP = 'KDS_SETUP',
  KDS_VIEW = 'KDS_VIEW',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface KitchenStation {
  id: string;
  name: string;
  color: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description?: string;
  ingredients?: string;
  image?: string | null; // URL string for preview
  imageFile?: File | null;
  available?: boolean; // New field for stock status
  printerId?: string; // ID of the printer where this item should be printed
  stationId?: string; // ID of the kitchen station (KDS)
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface PreparedItem {
  itemId: string;
  stationId: string;
  completedAt: number;
  completedBy?: string; // Device ID or user name
}

export interface Order {
  id: string;
  user_id: string; // Restaurant ID
  table_number: string;
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  items: OrderItem[];
  created_at: string;
  prepared_items?: PreparedItem[]; // Array of finished items
}

export interface TicketConfig {
  title: string;
  footerMessage: string;
  showDate: boolean;
  showTable: boolean;
  showOrderNumber: boolean;
  showNotes: boolean;
  showLogo?: boolean;
  showAddress?: boolean;
  customHeader?: string;
  textSize: 'normal' | 'large';
  paperWidth: '58mm' | '80mm';
}

export interface Printer {
  id: string;
  name: string; // User friendly name e.g. "Cocina"
  location: string;
  isConnected: boolean;
  hardwareName: string | null; // e.g. "Epson T20"
  type: 'BLUETOOTH' | 'USB' | 'NETWORK' | null;
  paperWidth: '58mm' | '80mm';
  ticketConfig: TicketConfig;
  isBillPrinter?: boolean; // Determines if this printer handles bill requests
}