import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    console.log('[Auth Callback] Processing OAuth callback, code:', code ? 'present' : 'missing');

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[Auth Callback] Missing Supabase env vars');
            return NextResponse.redirect(new URL('/login?error=config', origin));
        }

        // Create a response that we'll add cookies to
        const response = NextResponse.redirect(new URL('/', origin));

        try {
            // Create Supabase client for server-side auth
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    flowType: 'pkce',
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    persistSession: false,
                }
            });

            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('[Auth Callback] Error exchanging code:', error.message);
                return NextResponse.redirect(new URL('/login?error=auth', origin));
            }

            if (data.session) {
                console.log('[Auth Callback] Session obtained for:', data.session.user.email);

                // Set the auth cookies so the client can pick them up
                // Supabase uses these cookie names by default
                const cookieStore = await cookies();

                // Set access token
                cookieStore.set('sb-access-token', data.session.access_token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: data.session.expires_in
                });

                // Set refresh token
                cookieStore.set('sb-refresh-token', data.session.refresh_token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30 // 30 days
                });

                // Also set the combined auth token that Supabase JS client looks for
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'supabase';
                cookieStore.set(`sb-${projectRef}-auth-token`, JSON.stringify({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: Math.floor(Date.now() / 1000) + data.session.expires_in,
                    expires_in: data.session.expires_in,
                    token_type: 'bearer',
                    user: data.session.user
                }), {
                    path: '/',
                    httpOnly: false, // Client needs to read this
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: data.session.expires_in
                });

                console.log('[Auth Callback] Cookies set, redirecting to home');
            }
        } catch (err) {
            console.error('[Auth Callback] Exception:', err);
            return NextResponse.redirect(new URL('/login?error=exception', origin));
        }

        return response;
    }

    console.log('[Auth Callback] No code provided, redirecting to login');
    return NextResponse.redirect(new URL('/login', origin));
}
