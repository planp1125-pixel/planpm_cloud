import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
    // Use SUPABASE_URL for server-side (Docker internal) or fallback to public URL
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

// GET - Get user role by username (for login page role display)
export async function GET(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Try with @planpm.local suffix
    const email = username.includes('@')
        ? username
        : `${username.toLowerCase().replace(/\s+/g, '_')}@planpm.local`;

    // Find user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
        return NextResponse.json({ found: false });
    }

    // Get profile with role
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, display_name')
        .eq('id', user.id)
        .single();

    return NextResponse.json({
        found: true,
        role: profile?.role || 'user',
        displayName: profile?.display_name || username,
    });
}

