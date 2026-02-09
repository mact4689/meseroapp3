// =================================================================
// REALTIME DIAGNOSTIC UTILITY
// =================================================================
// This utility helps diagnose Realtime WebSocket connection issues
// by testing each layer of the connection stack
// 
// HOW TO USE:
// 1. Open browser console (F12)
// 2. Run: window.diagnoseRealtime()
// 3. Review the output for each layer
// 4. Look for ❌ marks indicating failures
// =================================================================

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './client';

export const diagnoseRealtimeConnection = async () => {
    const diagnostics: Record<string, any> = {};

    console.log('🔍 STARTING REALTIME DIAGNOSTICS...\n');

    // ===== LAYER 1: Supabase Client Configuration =====
    console.log('📋 LAYER 1: Client Configuration');
    diagnostics.clientConfig = {
        url: SUPABASE_URL,
        hasAnonKey: !!SUPABASE_ANON_KEY,
        realtimeEndpoint: supabase.realtime?.endPoint || 'wss://xskzykobzlexshjwaulw.supabase.co/realtime/v1'
    };
    console.log('   ✓ Supabase URL:', diagnostics.clientConfig.url);
    console.log('   ✓ Anon Key Present:', diagnostics.clientConfig.hasAnonKey);
    console.log('   ✓ Realtime Endpoint:', diagnostics.clientConfig.realtimeEndpoint);
    console.log('');

    // ===== LAYER 2: Network Connectivity =====
    console.log('🌐 LAYER 2: Network Connectivity');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        diagnostics.restApi = {
            status: response.status,
            success: response.ok
        };
        console.log('   ✓ REST API Status:', response.status);
        console.log('   ✓ REST API Working:', response.ok);
    } catch (error: any) {
        diagnostics.restApi = {
            error: error.message,
            success: false
        };
        console.error('   ❌ REST API Error:', error.message);
    }
    console.log('');

    // ===== LAYER 3: Realtime Publication Check =====
    console.log('📡 LAYER 3: Realtime Publication');
    try {
        const { data, error } = await supabase
            .from('pg_publication_tables')
            .select('*')
            .eq('pubname', 'supabase_realtime')
            .in('tablename', ['orders', 'kitchen_stations']);

        if (error) {
            diagnostics.publication = { error: error.message, success: false };
            console.error('   ❌ Publication Check Error:', error.message);
        } else {
            diagnostics.publication = {
                tables: data?.map(d => d.tablename) || [],
                count: data?.length || 0,
                success: true
            };
            console.log('   ✓ Published Tables:', diagnostics.publication.tables.join(', '));
            console.log('   ✓ Table Count:', diagnostics.publication.count);
        }
    } catch (error: any) {
        diagnostics.publication = { error: error.message, success: false };
        console.error('   ❌ Publication Check Failed:', error.message);
    }
    console.log('');

    // ===== LAYER 4: WebSocket Connection Test =====
    console.log('🔌 LAYER 4: WebSocket Connection');
    const connectionPromise = new Promise((resolve) => {
        const testChannel = supabase
            .channel('diagnostic-test-channel')
            .subscribe((status) => {
                diagnostics.websocket = {
                    status,
                    timestamp: new Date().toISOString()
                };

                console.log('   📊 Connection Status:', status);

                if (status === 'SUBSCRIBED') {
                    console.log('   ✅ WebSocket Connected Successfully!');
                    resolve({ success: true, status });
                    supabase.removeChannel(testChannel);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('   ❌ WebSocket Connection Failed: CHANNEL_ERROR');
                    resolve({ success: false, status, error: 'CHANNEL_ERROR' });
                    supabase.removeChannel(testChannel);
                } else if (status === 'TIMED_OUT') {
                    console.error('   ❌ WebSocket Connection Timed Out');
                    resolve({ success: false, status, error: 'TIMED_OUT' });
                    supabase.removeChannel(testChannel);
                }
            });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!diagnostics.websocket || !diagnostics.websocket.status) {
                console.error('   ⏱️ WebSocket Connection Timeout (10s)');
                resolve({ success: false, error: 'CONNECTION_TIMEOUT' });
                supabase.removeChannel(testChannel);
            }
        }, 10000);
    });

    await connectionPromise;
    console.log('');

    // ===== LAYER 5: RLS Policy Check =====
    console.log('🔒 LAYER 5: Row Level Security');
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('id')
            .limit(1);

        diagnostics.rls = {
            canRead: !error,
            error: error?.message,
            success: !error
        };

        if (error) {
            console.error('   ❌ Cannot SELECT from orders:', error.message);
        } else {
            console.log('   ✓ Can SELECT from orders table');
        }
    } catch (error: any) {
        diagnostics.rls = {
            canRead: false,
            error: error.message,
            success: false
        };
        console.error('   ❌ RLS Check Error:', error.message);
    }
    console.log('');

    // ===== SUMMARY =====
    console.log('═'.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(60));

    const layers = [
        { name: 'Client Config', data: diagnostics.clientConfig },
        { name: 'Network (REST)', data: diagnostics.restApi },
        { name: 'Publication', data: diagnostics.publication },
        { name: 'WebSocket', data: diagnostics.websocket },
        { name: 'RLS Policies', data: diagnostics.rls }
    ];

    layers.forEach(layer => {
        const status = layer.data?.success !== false ? '✅' : '❌';
        console.log(`${status} ${layer.name}`);
    });

    console.log('═'.repeat(60));
    console.log('');
    console.log('💾 Full diagnostic data:', JSON.stringify(diagnostics, null, 2));
    console.log('');

    // Provide next steps
    if (diagnostics.websocket?.status === 'CHANNEL_ERROR') {
        console.log('⚠️  NEXT STEPS:');
        console.log('1. Check Supabase project settings');
        console.log('2. Verify Realtime is enabled for your plan');
        console.log('3. Check for firewall/proxy blocking WebSockets');
        console.log('4. Try from different network/device');
    }

    return diagnostics;
};
