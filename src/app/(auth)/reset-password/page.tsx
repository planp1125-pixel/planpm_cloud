'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import planpmLogo from '../../../../icons/planpm.png';

export default function ResetPasswordPage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Password validation rules
    const validations = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        passwordsMatch: password === confirmPassword && password.length > 0,
    };

    const allValid = Object.values(validations).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allValid) {
            toast({ title: 'Error', description: 'Please fix all password requirements', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // Update password via Supabase
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) throw updateError;

            // Update profile to remove password_reset_required flag
            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ password_reset_required: false })
                    .eq('id', user.id);

                if (profileError) {
                    console.warn('Could not update profile:', profileError);
                }
            }

            toast({ title: 'Success', description: 'Password updated successfully!' });
            router.push('/');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-muted-foreground'}`}>
            {valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {text}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image src={planpmLogo} alt="Plan PM" width={80} height={80} className="object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
                    <CardDescription>
                        Please create a new password for your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium mb-2">Password Requirements:</p>
                            <ValidationItem valid={validations.minLength} text="At least 8 characters" />
                            <ValidationItem valid={validations.hasUppercase} text="One uppercase letter" />
                            <ValidationItem valid={validations.hasLowercase} text="One lowercase letter" />
                            <ValidationItem valid={validations.hasNumber} text="One number" />
                            <ValidationItem valid={validations.hasSpecial} text="One special character (!@#$%^&*)" />
                            <ValidationItem valid={validations.passwordsMatch} text="Passwords match" />
                        </div>

                        <Button type="submit" className="w-full" disabled={!allValid || isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
