'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
    const router = useRouter();

    // Check if user has permission for a feature at a given level
    const hasPermission = (feature: keyof UserPermissions, level: 'view' | 'edit'): boolean => {
        const userLevel = permissions[feature];
        if (userLevel === 'hidden') return false;
        if (level === 'view') return userLevel === 'view' || userLevel === 'edit';
        if (level === 'edit') return userLevel === 'edit';
        return false;
    };

    // Fetch user profile including role, permissions, display name
    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('role, display_name, permissions, password_reset_required')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setIsAdmin(data.role === 'admin');
            setDisplayName(data.display_name || '');
            setPermissions(data.permissions || defaultPermissions);
            setPasswordResetRequired(data.password_reset_required || false);

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
        // Get initial session with timeout to prevent infinite hangs
        const getSession = async () => {
            console.log('[Auth] Starting session fetch...');
            try {
                // Create a timeout promise that rejects after 30 seconds (increased for safety)
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout after 30s')), 30000)
                );

                console.log('[Auth] Calling supabase.auth.getSession()...');
                // Race between the actual session call and timeout
                const { data: { session } } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]) as { data: { session: any } };

                console.log('[Auth] Session received:', session ? 'User logged in' : 'No session');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('[Auth] Fetching user role...');
                    // Also add timeout to role fetch
                    try {
                        await Promise.race([
                            fetchUserProfile(session.user.id),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Role fetch timeout')), 10000)
                            )
                        ]);
                        console.log('[Auth] Role fetched successfully');
                    } catch (roleErr) {
                        console.warn('[Auth] Could not fetch user role:', roleErr);
                    }
                }
            } catch (err) {
                console.error('[Auth] Error getting session:', err);
            } finally {
                console.log('[Auth] Setting isLoading to false');
                setIsLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await fetchUserProfile(session.user.id);
                    } else {
                        setIsAdmin(false);
                    }

                    if (event === 'SIGNED_IN') {
                        router.push('/');
                    }
                    if (event === 'SIGNED_OUT') {
                        router.push('/login');
                    }
                } catch (err) {
                    console.error('Auth state change error:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
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
