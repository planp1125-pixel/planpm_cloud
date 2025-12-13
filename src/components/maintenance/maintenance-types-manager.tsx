'use client';

import { useState, useMemo } from 'react';
import { useMaintenanceTypes } from '@/hooks/use-maintenance-types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Trash2, PencilLine, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const defaultTypeLabels = ['General', 'Preventive Maintenance', 'AMC', 'Scheduled', 'Others'];

export function MaintenanceTypesManager() {
  const { maintenanceTypes, dbTypes, addMaintenanceType, updateMaintenanceType, deleteMaintenanceType, isLoading } = useMaintenanceTypes();
  const { toast } = useToast();
  const [newType, setNewType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const defaultTypes = useMemo(() => maintenanceTypes.filter(t => defaultTypeLabels.includes(t.value)), [maintenanceTypes]);
  const customTypes = useMemo(
    () => maintenanceTypes.filter(t => !defaultTypeLabels.includes(t.value)),
    [maintenanceTypes]
  );

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setIsSaving(true);
    const success = await updateMaintenanceType(editingId, editingName.trim());
    setIsSaving(false);
    if (success) {
      toast({ title: 'Updated', description: 'Maintenance type renamed.' });
      setEditingId(null);
      setEditingName('');
    } else {
      toast({ title: 'Error', description: 'Could not rename type.', variant: 'destructive' });
    }
  };

  const removeType = async (id: string, name: string) => {
    setIsSaving(true);
    // Simple usage guard: block delete if name is used in configs/schedules/instruments
    const usageErrors: string[] = [];
    const usageChecks = [
      supabaseCount('maintenance_configurations', 'maintenance_type', name, 'Maintenance configurations'),
      supabaseCount('maintenanceSchedules', 'type', name, 'Maintenance schedules'),
      supabaseCount('instruments', 'maintenanceType', name, 'Instruments'),
    ];
    const results = await Promise.all(usageChecks);
    results.forEach(r => {
      if (!r.ok) usageErrors.push(r.label);
    });
    if (usageErrors.length > 0) {
      toast({
        title: 'Cannot delete',
        description: `${name} is in use by: ${usageErrors.join(', ')}.`,
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    const success = await deleteMaintenanceType(id);
    setIsSaving(false);
    if (success) {
      toast({ title: 'Deleted', description: `${name} removed.` });
    } else {
      toast({ title: 'Error', description: 'Could not delete type.', variant: 'destructive' });
    }
  };

  const handleAdd = async () => {
    if (!newType.trim()) return;
    setIsSaving(true);
    await addMaintenanceType(newType.trim());
    setIsSaving(false);
    setNewType('');
    toast({ title: 'Added', description: 'New maintenance type saved.' });
  };

  // Helper to check usage counts with supabase
  const supabaseCount = async (table: string, column: string, value: string, label: string) => {
    try {
      const { count, error } = await supabase.from(table as any).select('id', { count: 'exact', head: true }).eq(column, value);
      if (error) return { ok: false, label };
      if ((count || 0) > 0) return { ok: false, label };
      return { ok: true, label };
    } catch {
      return { ok: false, label };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Maintenance Types</CardTitle>
        <CardDescription>Manage preset and custom maintenance types.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new maintenance type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={isSaving || isLoading || !newType.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading types...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Default types</h4>
              <div className="flex flex-wrap gap-2">
                {defaultTypes.map(t => (
                  <Badge key={t.value} variant="secondary">{t.label}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">Custom types</h4>
                {customTypes.length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
              </div>
              <div className="space-y-2">
                {customTypes.map(t => {
                  const dbMatch = dbTypes.find(dt => dt.name.toLowerCase() === t.value.toLowerCase());
                  const id = dbMatch?.id;
                  const isEditingRow = editingId === id;
                  return (
                    <div key={t.value} className="flex items-center gap-2 p-2 border rounded-md bg-card/50">
                      {isEditingRow ? (
                        <>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={isSaving || !editingName.trim()}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">{t.label}</span>
                          {id && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => startEdit(id, t.label)}>
                                <PencilLine className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeType(id, t.label)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {!id && <Badge variant="secondary">Session only</Badge>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Alert>
          <AlertTitle>Deletion safety</AlertTitle>
          <AlertDescription className="text-sm">
            Types in use by instruments, schedules, or configurations are blocked from deletion. Rename only affects future entries; existing records keep their old text.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
