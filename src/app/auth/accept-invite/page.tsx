'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import planpmLogo from '../../../../icons/planpm.png';
import { useToast } from '@/hooks/use-toast';

function AcceptInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Password validation
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        match: password === confirmPassword && password.length > 0,
    };

    const allChecksPassed = Object.values(passwordChecks).every(Boolean);

    // Verify the invite token on mount
    useEffect(() => {
        const verifyInvite = async () => {
            try {
                // Check if this is a valid invite link
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('[Accept Invite] Session error:', sessionError);
                    setError('Invalid or expired invite link. Please contact your administrator.');
                    setIsVerifying(false);
                    return;
                }

                if (session?.user) {
                    // User already has a session from clicking the invite link
                    setUserEmail(session.user.email || null);
                    setIsVerifying(false);
                } else {
                    // No session - might be an invalid link
                    // Try to exchange the token if present in URL hash
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { data, error: setSessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (setSessionError) {
                            console.error('[Accept Invite] Set session error:', setSessionError);
                            setError('Failed to verify invite. Please try clicking the link again.');
                        } else if (data.user) {
                            setUserEmail(data.user.email || null);
                        }
                    } else {
                        setError('Invalid invite link. Please contact your administrator.');
                    }
                    setIsVerifying(false);
                }
            } catch (err) {
                console.error('[Accept Invite] Error:', err);
                setError('An unexpected error occurred. Please try again.');
                setIsVerifying(false);
            }
        };

        verifyInvite();
    }, [searchParams]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allChecksPassed) {
            toast({
                title: 'Error',
                description: 'Please meet all password requirements',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                toast({
                    title: 'Error',
                    description: updateError.message,
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }

            toast({
                title: 'Success!',
                description: 'Your password has been set. Redirecting to login...',
            });

            // Sign out and redirect to login
            await supabase.auth.signOut();
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to set password',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Verifying your invite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-destructive">Invite Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={() => router.push('/login')}
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <Image
                            src={planpmLogo}
                            alt="Plan-PM Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">Welcome to Plan-PM!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Set your password to complete your account setup
                        </CardDescription>
                        {userEmail && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Email: <span className="font-medium">{userEmail}</span>
                            </p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password requirements */}
                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Password Requirements:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <PasswordCheck passed={passwordChecks.length} label="8+ characters" />
                                <PasswordCheck passed={passwordChecks.uppercase} label="Uppercase letter" />
                                <PasswordCheck passed={passwordChecks.lowercase} label="Lowercase letter" />
                                <PasswordCheck passed={passwordChecks.number} label="Number" />
                                <PasswordCheck passed={passwordChecks.special} label="Special character" />
                                <PasswordCheck passed={passwordChecks.match} label="Passwords match" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12"
                            disabled={isLoading || !allChecksPassed}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting Password...
                                </>
                            ) : (
                                'Set Password & Continue'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-1.5 ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
            <CheckCircle className={`h-3 w-3 ${passed ? 'text-green-600' : 'text-muted-foreground/50'}`} />
            <span>{label}</span>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
