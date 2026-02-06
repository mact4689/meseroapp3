import { useState, useEffect, useCallback, useRef } from 'react';

interface WakeLockState {
    isSupported: boolean;
    isActive: boolean;
    error: string | null;
}

/**
 * Hook to prevent screen from sleeping using the Screen Wake Lock API.
 * Perfect for KDS (Kitchen Display System) tablets that need to stay on.
 * 
 * Usage:
 * ```tsx
 * const { isActive, isSupported, request, release } = useWakeLock();
 * ```
 * 
 * The hook automatically:
 * - Requests wake lock on mount
 * - Re-requests when tab becomes visible again
 * - Releases on unmount
 */
export const useWakeLock = (autoRequest = true) => {
    const [state, setState] = useState<WakeLockState>({
        isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
        isActive: false,
        error: null,
    });

    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Request wake lock
    const request = useCallback(async () => {
        if (!state.isSupported) {
            setState(prev => ({ ...prev, error: 'Wake Lock API not supported' }));
            return false;
        }

        try {
            const wakeLock = await navigator.wakeLock.request('screen');
            wakeLockRef.current = wakeLock;

            // Listen for release (happens when tab is hidden or user navigates away)
            wakeLock.addEventListener('release', () => {
                console.log('🔓 Wake Lock released');
                setState(prev => ({ ...prev, isActive: false }));
            });

            console.log('🔒 Wake Lock activated - screen will stay on');
            setState(prev => ({ ...prev, isActive: true, error: null }));
            return true;
        } catch (err: any) {
            console.error('Wake Lock error:', err);
            setState(prev => ({
                ...prev,
                isActive: false,
                error: err.message || 'Failed to activate wake lock',
            }));
            return false;
        }
    }, [state.isSupported]);

    // Release wake lock
    const release = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setState(prev => ({ ...prev, isActive: false }));
                console.log('🔓 Wake Lock manually released');
            } catch (err) {
                console.error('Error releasing wake lock:', err);
            }
        }
    }, []);

    // Handle visibility change - re-request when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && autoRequest && !wakeLockRef.current) {
                console.log('👁️ Tab visible again, re-requesting wake lock...');
                await request();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [autoRequest, request]);

    // Auto-request on mount
    useEffect(() => {
        if (autoRequest && state.isSupported) {
            request();
        }

        // Cleanup on unmount
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
            }
        };
    }, [autoRequest, state.isSupported, request]);

    return {
        ...state,
        request,
        release,
    };
};

export default useWakeLock;
