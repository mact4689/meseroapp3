import { create } from 'zustand';
import { Order } from '../types';

interface OrdersState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => {
    // Prevent memory leak by limiting to 500 items
    return { orders: [order, ...state.orders].slice(0, 500) };
  }),
  updateOrder: (order) => set((state) => ({
    orders: state.orders.map((o) => (o.id === order.id ? order : o)),
  })),
}));
