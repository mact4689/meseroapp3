import { useAppStore } from '../store/AppContext';
import { UserRole, RolePermissions } from '../types';

/**
 * Hook to check user permissions based on their role.
 * 
 * When a user has `customPermissions` (set via QR code custom role),
 * those granular permissions take priority over the hardcoded role logic.
 * 
 * The 'owner' role always gets full access regardless of customPermissions.
 */
export const usePermissions = () => {
    const { state } = useAppStore();
    const role: UserRole = state.user?.role || 'owner';
    const cp: RolePermissions | null | undefined = state.user?.customPermissions;

    // Debugging Role Visibility
    // console.log('🔐 Debug Permissions:', { role, customPermissions: cp });

    // If owner and no custom permissions override, grant everything
    const isOwner = role === 'owner' && !cp;

    // Helper: check a specific custom permission key, fallback to role-based default
    const has = (key: keyof RolePermissions, fallback: boolean): boolean => {
        if (cp) return cp[key] ?? false;
        return fallback;
    };

    return {
        // Current role
        role,
        isOwner: role === 'owner',
        isWaiter: role === 'waiter',
        isCook: role === 'cook',
        hasCustomRole: !!cp,

        // ─── VISUAL GROUP FLAGS (mapped to implementation_plan.md) ───

        // Dashboard top-level visibility
        canViewDashboard: has('dashboard', role === 'owner' || role === 'waiter'),

        // Negocio: Config Card "Negocio (Perfil y Logo)"
        canEditBusinessProfile: has('business', isOwner),

        // Menú: Dashboard Card + Config Card "Menú"
        canEditMenu: has('menu', isOwner),
        canViewMenu: true, // All roles can view the public menu

        // Mesas: Dashboard Card + Config Card "Mesas y QRs"
        canManageTables: has('tables', isOwner),

        // Tickets: Config Card "Ajuste de impresión de Tickets"
        canConfigureTickets: has('tickets', isOwner),

        // KDS: Config Card "Pantallas de Cocina (KDS)" + KDS view access
        canViewKDS: has('kds', role === 'owner' || role === 'cook'),
        canManageStations: has('kds', isOwner),
        canMarkItemsPrepared: has('kds', role === 'owner' || role === 'cook'),

        // Reportes: Dashboard Cards "Ventas Hoy" + Section "Rendimiento del Menú"
        canViewReports: has('reports', isOwner),
        canViewAnalytics: has('reports', isOwner),
        canExportData: has('reports', isOwner),

        // Órdenes: Dashboard Card "Órdenes" + Section "Órdenes Activas"
        canViewOrders: has('orders', role === 'owner' || role === 'waiter'),
        canCompleteOrders: has('orders', role === 'owner' || role === 'waiter'),
        canCancelOrders: has('orders', isOwner),

        // Personal: Dashboard Card "Personal (Equipo)"
        canManageStaff: has('staff', isOwner),
        canInviteStaff: has('staff', isOwner),

        // Settings (shows Configuration section header if ANY config perm is true)
        canAccessSettings: has('business', isOwner) || has('menu', isOwner) || has('tables', isOwner) || has('tickets', isOwner) || has('kds', isOwner),

        // Billing & Payments
        canViewBilling: has('reports', isOwner),
        canProcessPayments: has('orders', role === 'owner' || role === 'waiter'),
    };
};

export default usePermissions;
