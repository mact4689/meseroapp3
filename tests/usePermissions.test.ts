import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../hooks/usePermissions';

// Mock useAppStore
vi.mock('../store/AppContext', () => ({
  useAppStore: vi.fn()
}));

import { useAppStore } from '../store/AppContext';

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role-based permissions', () => {
    it('should return owner permissions for owner role', () => {
      (useAppStore as any).mockReturnValue({ state: { user: { role: 'owner' } } });
      const { result } = renderHook(() => usePermissions());
      const store = result.current;
      expect(store.isOwner).toBe(true);
      expect(store.canViewDashboard).toBe(true);
      expect(store.canEditBusinessProfile).toBe(true);
      expect(store.canEditMenu).toBe(true);
      expect(store.canManageTables).toBe(true);
    });

    it('should return waiter role permissions', () => {
      (useAppStore as any).mockReturnValue({ state: { user: { role: 'waiter' } } });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isWaiter).toBe(true);
      expect(result.current.isOwner).toBe(false);
    });

    it('should return cook role permissions', () => {
      (useAppStore as any).mockReturnValue({ state: { user: { role: 'cook' } } });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isCook).toBe(true);
      expect(result.current.canViewKDS).toBe(true);
    });
  });

  describe('Permission checks', () => {
    it('should check specific permissions correctly', () => {
      (useAppStore as any).mockReturnValue({ state: { user: { role: 'owner' } } });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewMenu).toBe(true);
      expect(result.current.canViewOrders).toBe(true);
      expect(result.current.canCompleteOrders).toBe(true);
    });
  });
});