import { useAppStore } from '../store/AppContext';
import { UserRole } from '../types';

/**
 * Hook to check user permissions based on their role.
 * 
 * Roles:
 * - owner: Full access (Dashboard, Menu, Config, Reports, Staff Management)
 * - waiter: Orders access, can mark orders as completed
 * - cook: KDS only (typically accessed via direct link without login)
 * 
 * Usage:
 * ```tsx
 * const { canEditMenu, canViewDashboard } = usePermissions();
 * if (!canEditMenu) return <AccessDenied />;
 * ```
 */
export const usePermissions = () => {
    const { state } = useAppStore();
    const role: UserRole = state.user?.role || 'owner';

    return {
        // Current role
        role,
        isOwner: role === 'owner',
        isWaiter: role === 'waiter',
        isCook: role === 'cook',

        // Dashboard & Orders
        canViewDashboard: role === 'owner' || role === 'waiter',
        canViewOrders: role === 'owner' || role === 'waiter',
        canCompleteOrders: role === 'owner' || role === 'waiter',
        canCancelOrders: role === 'owner',

        // Menu
        canEditMenu: role === 'owner',
        canViewMenu: true, // All roles can view menu

        // KDS (Kitchen Display System)
        canViewKDS: role === 'owner' || role === 'cook',
        canMarkItemsPrepared: role === 'owner' || role === 'cook',

        // Configuration & Settings
        canAccessSettings: role === 'owner',
        canEditBusinessProfile: role === 'owner',
        canManageTables: role === 'owner',
        canManageStations: role === 'owner',
        canConfigureTickets: role === 'owner',

        // Staff Management
        canManageStaff: role === 'owner',
        canInviteStaff: role === 'owner',

        // Reports & Analytics
        canViewReports: role === 'owner',
        canViewAnalytics: role === 'owner',
        canExportData: role === 'owner',

        // Billing & Payments
        canViewBilling: role === 'owner',
        canProcessPayments: role === 'owner' || role === 'waiter',
    };
};

export default usePermissions;
