import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client lazily to avoid build-time errors
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (supabaseAdminInstance) return supabaseAdminInstance;

    // Use SUPABASE_URL for server-side (Docker internal) or fallback to public URL
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Missing Supabase environment variables');
    }

    supabaseAdminInstance = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    return supabaseAdminInstance;
}

// Password validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Minimum 8 characters required');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter required');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter required');
    if (!/[0-9]/.test(password)) errors.push('One number required');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character required');
    return { valid: errors.length === 0, errors };
}

// Check if requester is admin and get their org_id
async function getAdminAuth(authHeader: string | null): Promise<{ isAdmin: boolean; orgId: string | null; userId: string | null }> {
    if (!authHeader) return { isAdmin: false, orgId: null, userId: null };
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return { isAdmin: false, orgId: null, userId: null };

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, org_id')
        .eq('id', user.id)
        .single();

    return {
        isAdmin: profile?.role === 'admin',
        orgId: profile?.org_id || null,
        userId: user.id
    };
}

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    const authResult = await getAdminAuth(authHeader);
    if (!authResult.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get profiles with permissions
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*');

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enrichedUsers = users.users.map(user => ({
        id: user.id,
        email: user.email,
        displayName: profileMap.get(user.id)?.display_name || user.email?.split('@')[0],
        role: profileMap.get(user.id)?.role || 'user',
        permissions: profileMap.get(user.id)?.permissions || {},
        passwordResetRequired: profileMap.get(user.id)?.password_reset_required || false,
        isSuperAdmin: profileMap.get(user.id)?.is_super_admin || false,
        createdAt: user.created_at,
    }));

    return NextResponse.json({ users: enrichedUsers });
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    const authResult = await getAdminAuth(authHeader);
    if (!authResult.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { username, displayName, password, role, permissions } = body;

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json({ error: passwordValidation.errors.join(', ') }, { status: 400 });
        }

        // Create internal email format
        const email = `${username.toLowerCase().replace(/\s+/g, '_')}@planpm.local`;

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        if (existingUsers?.users.some(u => u.email === email)) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        // Create user with metadata - include org_id so they join admin's organization
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                display_name: displayName || username,
                password_reset_required: true,
                org_id: authResult.orgId,  // Link to admin's organization
                role: role || 'user',
                permissions: permissions || {
                    dashboard: 'view',
                    maintenance_history: 'view',
                    update_maintenance: 'view',
                    instruments: 'view',
                    design_templates: 'hidden',
                    settings: 'hidden',
                    user_management: 'hidden',
                },
            },
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        // Update or insert profile with role and permissions
        // Use upsert in case trigger hasn't created the profile yet
        if (newUser?.user) {
            // Small delay to allow trigger to create profile first
            await new Promise(resolve => setTimeout(resolve, 500));

            const profileData = {
                id: newUser.user.id,
                role: role || 'user',
                display_name: displayName || username,
                password_reset_required: true,
                permissions: permissions || {
                    dashboard: 'view',
                    maintenance_history: 'view',
                    update_maintenance: 'hidden',
                    instruments: 'hidden',
                    design_templates: 'hidden',
                    settings: 'hidden',
                    user_management: 'hidden',
                },
            };

            await supabaseAdmin
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUser?.user?.id,
                username,
                displayName: displayName || username,
                role: role || 'user',
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE - Remove user (admin only)
export async function DELETE(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    const authResult = await getAdminAuth(authHeader);
    if (!authResult.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent deleting super admin
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();

    if (profile?.is_super_admin) {
        return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// PATCH - Update user (admin only) - for password reset and profile updates
export async function PATCH(request: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    const authResult = await getAdminAuth(authHeader);
    if (!authResult.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { userId, password, role, permissions, displayName } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Update password if provided
        if (password) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return NextResponse.json({ error: passwordValidation.errors.join(', ') }, { status: 400 });
            }

            await supabaseAdmin.auth.admin.updateUserById(userId, { password });

            // Mark password reset required
            await supabaseAdmin
                .from('profiles')
                .update({ password_reset_required: true })
                .eq('id', userId);
        }

        // Update profile
        const updates: any = {};
        if (role) updates.role = role;
        if (permissions) updates.permissions = permissions;
        if (displayName) updates.display_name = displayName;

        if (Object.keys(updates).length > 0) {
            await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', userId);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
