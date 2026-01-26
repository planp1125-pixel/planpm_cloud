'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Processing login...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Check if there's an error in the URL (from Supabase)
                const errorParam = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                if (errorParam) {
                    setError(errorDescription || errorParam);
                    return;
                }

                setStatus('Verifying session...');

                // The Supabase client should automatically detect the OAuth callback
                // and exchange the code for a session (PKCE flow)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('[Callback] Session error:', sessionError);
                    setError(sessionError.message);
                    return;
                }

                if (session) {
                    console.log('[Callback] Session found:', session.user.email);
                    setStatus('Login successful! Redirecting...');

                    // Small delay to show success message
                    setTimeout(() => {
                        router.push('/');
                    }, 500);
                } else {
                    console.log('[Callback] No session found, checking URL for code...');

                    // Try to get session from URL (for PKCE flow)
                    const code = searchParams.get('code');
                    if (code) {
                        setStatus('Exchanging authorization code...');
                        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                        if (exchangeError) {
                            console.error('[Callback] Exchange error:', exchangeError);
                            setError(exchangeError.message);
                            return;
                        }

                        if (data.session) {
                            console.log('[Callback] Session obtained:', data.session.user.email);
                            setStatus('Login successful! Redirecting...');
                            setTimeout(() => {
                                router.push('/');
                            }, 500);
                            return;
                        }
                    }

                    setError('No session found. Please try logging in again.');
                }
            } catch (err) {
                console.error('[Callback] Exception:', err);
                setError('An unexpected error occurred');
            }
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                {error ? (
                    <>
                        <div className="text-destructive text-lg font-medium">
                            Login Error
                        </div>
                        <div className="text-muted-foreground">
                            {error}
                        </div>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Return to Login
                        </button>
                    </>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <div className="text-muted-foreground">
                            {status}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
