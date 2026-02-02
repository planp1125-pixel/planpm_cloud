'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, RefreshCw, Mail, UserPlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddUserDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type PermissionLevel = 'hidden' | 'view' | 'edit';
type CreateMode = 'create' | 'invite';

interface Permissions {
    dashboard: PermissionLevel;
    maintenance_history: PermissionLevel;
    update_maintenance: PermissionLevel;
    instruments: PermissionLevel;
    design_templates: PermissionLevel;
    settings: PermissionLevel;
    user_management: PermissionLevel;
}

const defaultPermissions: Permissions = {
    dashboard: 'view',
    maintenance_history: 'view',
    update_maintenance: 'hidden',
    instruments: 'hidden',
    design_templates: 'hidden',
    settings: 'hidden',
    user_management: 'hidden',
};

const adminPermissions: Permissions = {
    dashboard: 'edit',
    maintenance_history: 'edit',
    update_maintenance: 'edit',
    instruments: 'edit',
    design_templates: 'edit',
    settings: 'edit',
    user_management: 'edit',
};

export function AddUserDialog({ isOpen, onOpenChange, onSuccess }: AddUserDialogProps) {
    const { session } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<CreateMode>('invite');

    // Form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'supervisor' | 'user'>('user');
    const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
    const [errors, setErrors] = useState<string[]>([]);

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        // Ensure at least one of each required type
        pwd += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        pwd += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        pwd += '0123456789'[Math.floor(Math.random() * 10)];
        pwd += '!@#$%^&*'[Math.floor(Math.random() * 8)];
        // Fill the rest
        for (let i = 0; i < 8; i++) {
            pwd += chars[Math.floor(Math.random() * chars.length)];
        }
        // Shuffle
        pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
        setPassword(pwd);
    };

    const validatePassword = (pwd: string): string[] => {
        const errs: string[] = [];
        if (pwd.length < 8) errs.push('Min 8 characters');
        if (!/[A-Z]/.test(pwd)) errs.push('Uppercase letter required');
        if (!/[a-z]/.test(pwd)) errs.push('Lowercase letter required');
        if (!/[0-9]/.test(pwd)) errs.push('Number required');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errs.push('Special character required');
        return errs;
    };

    const validateEmail = (emailStr: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailStr);
    };

    const handleRoleChange = (newRole: 'admin' | 'supervisor' | 'user') => {
        setRole(newRole);
        if (newRole === 'admin') {
            setPermissions(adminPermissions);
        } else {
            setPermissions(defaultPermissions);
        }
    };

    const handlePermissionChange = (feature: keyof Permissions, level: PermissionLevel) => {
        setPermissions(prev => ({ ...prev, [feature]: level }));
    };

    const handleSubmit = async () => {
        const validationErrors: string[] = [];

        if (mode === 'invite') {
            // Invite mode validation
            if (!email.trim()) validationErrors.push('Email is required');
            if (email.trim() && !validateEmail(email.trim())) validationErrors.push('Invalid email format');
        } else {
            // Create mode validation
            if (!username.trim()) validationErrors.push('Username is required');
            if (username.includes('@')) validationErrors.push('Username should not contain @');
            if (!password) validationErrors.push('Password is required');
            const pwdErrors = validatePassword(password);
            validationErrors.push(...pwdErrors);
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setErrors([]);

        try {
            const payload = mode === 'invite'
                ? {
                    mode: 'invite',
                    email: email.trim(),
                    displayName: displayName.trim() || email.split('@')[0],
                    role,
                    permissions,
                }
                : {
                    mode: 'create',
                    username: username.trim(),
                    displayName: displayName.trim() || username.trim(),
                    password,
                    role,
                    permissions,
                };

            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                if (mode === 'invite') {
                    toast({
                        title: 'Invite Sent!',
                        description: `An invitation email has been sent to ${email}`,
                    });
                } else {
                    toast({
                        title: 'User Created',
                        description: `User "${username}" created successfully. Share the password with them.`,
                    });
                }
                onSuccess();
                resetForm();
                onOpenChange(false);
            } else {
                setErrors([data.error || 'Failed to create user']);
            }
        } catch (err) {
            setErrors(['Failed to create user']);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setDisplayName('');
        setPassword('');
        setRole('user');
        setPermissions(defaultPermissions);
        setErrors([]);
    };

    const permissionLabels: Record<keyof Permissions, string> = {
        dashboard: 'Dashboard',
        maintenance_history: 'Maintenance History',
        update_maintenance: 'Update Maintenance',
        instruments: 'Instruments',
        design_templates: 'Design Templates',
        settings: 'Settings',
        user_management: 'User Management',
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Add a new user to your organization</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Mode Selection Tabs */}
                    <Tabs value={mode} onValueChange={(v) => setMode(v as CreateMode)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="invite" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Invite by Email
                            </TabsTrigger>
                            <TabsTrigger value="create" className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Create with Password
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="invite" className="space-y-4 mt-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    User will receive an email invitation to set their own password.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="displayNameInvite">Display Name</Label>
                                    <Input
                                        id="displayNameInvite"
                                        placeholder="John Doe"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="create" className="space-y-4 mt-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Create a username and password. You'll need to share the password with the user.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        placeholder="john"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
                                    />
                                    <p className="text-xs text-muted-foreground">No spaces or @ symbol</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="displayNameCreate">Display Name</Label>
                                    <Input
                                        id="displayNameCreate"
                                        placeholder="John Doe"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password *</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min 8 chars, upper, lower, number, special"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <Button type="button" variant="outline" onClick={generatePassword}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Generate
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(v) => handleRoleChange(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Permissions</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(Object.keys(permissionLabels) as Array<keyof Permissions>).map((feature) => (
                                <div key={feature} className="flex items-center justify-between border rounded-lg p-3">
                                    <span className="text-sm">{permissionLabels[feature]}</span>
                                    <Select
                                        value={permissions[feature]}
                                        onValueChange={(v) => handlePermissionChange(feature, v as PermissionLevel)}
                                    >
                                        <SelectTrigger className="w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hidden">Hidden</SelectItem>
                                            <SelectItem value="view">View</SelectItem>
                                            <SelectItem value="edit">Edit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                                {errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {mode === 'invite' ? 'Send Invite' : 'Create User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
