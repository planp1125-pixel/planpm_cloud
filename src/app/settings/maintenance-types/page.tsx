import { MaintenanceTypesManager } from '@/components/maintenance/maintenance-types-manager';

export default function MaintenanceTypesSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6 w-full">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Maintenance Types</h2>
        <p className="text-muted-foreground">Create, rename, or delete custom maintenance types. Defaults cannot be removed.</p>
      </div>
      <MaintenanceTypesManager />
    </div>
  );
}
