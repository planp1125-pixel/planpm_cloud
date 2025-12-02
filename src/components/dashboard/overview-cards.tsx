import { mockInstruments } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react';
import { isAfter, parseISO } from 'date-fns';

export function OverviewCards() {
  const totalInstruments = mockInstruments.length;
  const operational = mockInstruments.filter(inst => inst.status === 'Operational').length;
  const needsMaintenance = mockInstruments.filter(inst => inst.status === 'Needs Maintenance').length;
  const overdue = mockInstruments.filter(inst => isAfter(new Date(), parseISO(inst.nextMaintenanceDate)) && inst.status !== 'Archived' && inst.status !== 'Out of Service').length;

  const cardData = [
    { title: 'Total Instruments', value: totalInstruments, icon: FlaskConical },
    { title: 'Operational', value: operational, icon: ShieldCheck },
    { title: 'Needs Maintenance', value: needsMaintenance, icon: Wrench },
    { title: 'Overdue', value: overdue, icon: AlertTriangle, className: 'text-destructive' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, index) => (
        <Card key={index} className="transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.className || ''}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
