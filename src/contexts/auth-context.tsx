'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface UserPermissions {
    dashboard: 'hidden' | 'view' | 'edit';
    maintenance_history: 'hidden' | 'view' | 'edit';
    update_maintenance: 'hidden' | 'view' | 'edit';
    instruments: 'hidden' | 'view' | 'edit';
    design_templates: 'hidden' | 'view' | 'edit';
    settings: 'hidden' | 'view' | 'edit';
    user_management: 'hidden' | 'view' | 'edit';
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAdmin: boolean;
    displayName: string;
    permissions: UserPermissions;
    passwordResetRequired: boolean;
    orgId: string | null;
    hasPermission: (feature: keyof UserPermissions, level: 'view' | 'edit') => boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
    signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
    dashboard: 'view',
    maintenance_history: 'view',
    update_maintenance: 'hidden',
    instruments: 'hidden',
    design_templates: 'hidden',
    settings: 'hidden',
    user_management: 'hidden',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
    const [passwordResetRequired, setPasswordResetRequired] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const router = useRouter();

    // Check if user has permission for a feature at a given level (memoized to prevent re-renders)
    const hasPermission = useCallback((feature: keyof UserPermissions, level: 'view' | 'edit'): boolean => {
        const userLevel = permissions[feature];
        if (userLevel === 'hidden') return false;
        if (level === 'view') return userLevel === 'view' || userLevel === 'edit';
        if (level === 'edit') return userLevel === 'edit';
        return false;
    }, [permissions]);

    // Fetch user profile including role, permissions, display name
    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('role, display_name, permissions, password_reset_required, org_id')
            .eq('id', userId)
            .single();

        if (!error && data) {
            console.log('[Auth] Fetched profile:', data);
            setIsAdmin(data.role === 'admin');
            setDisplayName(data.display_name || '');
            setPermissions(data.permissions || defaultPermissions);
            setPasswordResetRequired(data.password_reset_required || false);
            setOrgId(data.org_id || null);

            // Redirect to password reset if required
            if (data.password_reset_required && typeof window !== 'undefined' && !window.location.pathname.includes('/reset-password')) {
                router.push('/reset-password');
            }
        } else {
            setIsAdmin(false);
            setPermissions(defaultPermissions);
            setPasswordResetRequired(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Fallback safety valve: if nothing happens in 4 seconds, stop loading
        const safetyTimeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('[Auth] Safety timeout - forcing loading false');
                setIsLoading(false);
            }
        }, 4000);

        // Listen for auth changes - this fires immediately with current session (INITIAL_SESSION)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;
                console.log(`[Auth] Auth event: ${event}`, session?.user?.email);

                // Always update basic state
                setSession(session);
                setUser(session?.user ?? null);

                // Fetch profile if we have a user and (it's a new login OR initial load)
                // We use a simple check: if we have a user but no profile data/permissions, fetch it.
                if (session?.user) {
                    try {
                        // Only fetch if we haven't already (or it's a new sign in)
                        // But for simplicity/robustness on reload, we just fetch it.
                        // It's fast and ensures fresh data.
                        // Fetch profile with generous timeout for initial connection
                        const fetchPromise = fetchUserProfile(session.user.id);
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Profile fetch timed out')), 8000)
                        );

                        await Promise.race([fetchPromise, timeoutPromise]);
                    } catch (err) {
                        console.warn('[Auth] Profile fetch failed or timed out, using defaults:', err);
                        // Don't block - just use defaults
                        setIsAdmin(false);
                        setPermissions(defaultPermissions);
                    }
                } else if (event === 'SIGNED_OUT') {
                    // Clear profile state
                    setIsAdmin(false);
                    setPermissions(defaultPermissions);
                    setDisplayName('');
                    setSession(null);
                    setUser(null);
                }

                // Handle redirects
                if (event === 'SIGNED_OUT') {
                    router.push('/login');
                } else if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
                    // Redirect to dashboard after successful login
                    if (window.location.pathname === '/login' || window.location.pathname === '/') {
                        router.push('/');
                    }
                }

                // Stop loading once we've processed the event
                // This covers INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, etc.
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, [router]);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                isAdmin,
                displayName,
                permissions,
                passwordResetRequired,
                orgId,
                hasPermission,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
