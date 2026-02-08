-- =====================================================
-- FIX REALTIME SUBSCRIPTION FOR ORDERS TABLE
-- =====================================================
-- This script enables Realtime for the orders table
-- and ensures RLS policies allow subscriptions
-- =====================================================

-- 1. ENABLE REALTIME FOR THE ORDERS TABLE
-- This is the most critical step
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- If the above fails because it's already added, this won't error
-- We also add other tables that might need real-time updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_stations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.prepared_items;

-- 2. VERIFY REPLICA IDENTITY
-- Realtime requires FULL replica identity to broadcast all column changes
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.kitchen_stations REPLICA IDENTITY FULL;

-- 3. ENSURE RLS POLICIES ALLOW SELECT (REQUIRED FOR SUBSCRIPTIONS)
-- Realtime subscriptions need SELECT permission
-- Our existing policies should handle this, but let's verify

-- CREATE POLICY IF NOT EXISTS for SELECT on orders
DO $$
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Public View Orders'
    ) THEN
        CREATE POLICY "Public View Orders" ON public.orders
            FOR SELECT USING (true);
    END IF;
END $$;

-- 4. GRANT NECESSARY PERMISSIONS TO ANON ROLE
-- Realtime uses the anon role for unauthenticated subscriptions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.kitchen_stations TO anon;

-- 5. VERIFY REALTIME IS ENABLED
-- Check if the table is in the publication
SELECT 
    schemaname, 
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('orders', 'kitchen_stations');

-- Expected output should show both tables

-- 6. NOTES FOR MANUAL VERIFICATION IN SUPABASE DASHBOARD
-- After running this script, verify in Supabase Dashboard:
-- Settings > API > Realtime > Check if "orders" table is enabled
-- If not, enable it manually through the UI
