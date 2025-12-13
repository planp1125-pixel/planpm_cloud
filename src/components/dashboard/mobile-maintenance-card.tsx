import { format } from 'date-fns';
import { MaintenanceEvent, Instrument } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Activity } from 'lucide-react';

interface MobileMaintenanceCardProps {
    schedule: MaintenanceEvent & { maintenanceStatus: string; completedSections?: number; totalSections?: number };
    instrument?: Instrument;
    onUpdateClick: (event: MaintenanceEvent) => void;
    onViewClick: (event: MaintenanceEvent) => void;
    daysLeft: number;
}

export function MobileMaintenanceCard({
    schedule,
    instrument,
    onUpdateClick,
    onViewClick,
    daysLeft
}: MobileMaintenanceCardProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Partially Completed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    const getDaysLeftBadgeVariant = (days: number) => {
        if (days < 0) return 'destructive';
        if (days <= 7) return 'destructive';
        return 'secondary';
    };

    return (
        <Card className="mb-4 shadow-sm border-l-4 border-l-primary">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">
                            {instrument?.eqpId || 'Unknown Instrument'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {instrument?.make} {instrument?.model}
                            </span>
                        </CardDescription>
                    </div>
                    <Badge variant={getDaysLeftBadgeVariant(daysLeft)} className="ml-2 whitespace-nowrap">
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary/70" />
                        <span>{schedule.type}</span>
                        <span className="text-xs text-muted-foreground/50">•</span>
                        <span>{schedule.frequency || 'N/A'}</span>
                    </div>

                    {schedule.maintenanceBy === 'vendor' && (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Vendor</Badge>
                            <span>{schedule.vendorName || 'N/A'}</span>
                            {schedule.vendorContact && (
                                <>
                                    <span className="text-xs text-muted-foreground/50">•</span>
                                    <span className="text-xs text-muted-foreground">{schedule.vendorContact}</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500/70" />
                        {format(new Date(schedule.dueDate), 'MMM d, yyyy')}
                    </div>

                    {instrument?.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500/70" />
                            {instrument.location}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                {schedule.maintenanceStatus !== 'Completed' ? (
                    <Button
                        className="w-full"
                        variant={schedule.maintenanceStatus === 'Partially Completed' ? 'default' : 'outline'}
                        onClick={() => onUpdateClick(schedule)}
                    >
                        {schedule.maintenanceStatus === 'Partially Completed' ? 'Continue Maintenance' : 'Update Maintenance'}
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        variant="ghost"
                        onClick={() => onViewClick(schedule)}
                    >
                        View Results
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
