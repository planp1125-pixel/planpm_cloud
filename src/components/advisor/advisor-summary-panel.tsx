'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Instrument, MaintenanceEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download } from 'lucide-react';
import { differenceInDays, addDays } from 'date-fns';
import { formatDate } from '@/lib/date-utils';

type TimeRangeOption = 30 | 90;

type SummaryBuckets = {
  overdue: MaintenanceEvent[];
  upcoming: MaintenanceEvent[];
  partial: MaintenanceEvent[];
  completed: MaintenanceEvent[];
};

export function AdvisorSummaryPanel() {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(30);
  const [schedules, setSchedules] = useState<MaintenanceEvent[]>([]);
  const [instruments, setInstruments] = useState<Record<string, Instrument>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [{ data: schedulesData }, { data: instrumentsData }] = await Promise.all([
          supabase.from('maintenanceSchedules').select('*'),
          supabase.from('instruments').select('*'),
        ]);

        setSchedules((schedulesData as MaintenanceEvent[]) || []);

        const map: Record<string, Instrument> = {};
        instrumentsData?.forEach(i => { map[i.id] = i as Instrument; });
        setInstruments(map);
      } catch (err) {
        console.error('Advisor summary fetch failed', err);
        setError('Could not load summary. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const summary = useMemo<SummaryBuckets>(() => {
    const now = new Date();
    const rangeEnd = addDays(now, timeRange);
    const rangeStart = addDays(now, -timeRange);

    const overdue = schedules.filter(s => new Date(s.dueDate) < now && s.status !== 'Completed');
    const upcoming = schedules.filter(s => {
      const due = new Date(s.dueDate);
      return due >= now && due <= rangeEnd;
    });
    const partial = schedules.filter(s => s.status === 'In Progress');
    const completed = schedules.filter(s => {
      if (s.status !== 'Completed' || !s.completedDate) return false;
      const completedDate = new Date(s.completedDate);
      return completedDate >= rangeStart && completedDate <= now;
    });

    return { overdue, upcoming, partial, completed };
  }, [schedules, timeRange]);

  const handleExport = () => {
    const now = new Date();
    const heading = `Maintenance Summary (Last/Next ${timeRange} Days)`;

    const toLines = (title: string, items: MaintenanceEvent[]) => {
      if (!items.length) return `<h3>${title}</h3><p>None</p>`;
      const rows = items.map(s => {
        const inst = instruments[s.instrumentId];
        const due = formatDate(s.dueDate);
        return `<li><strong>${inst?.eqpId || 'Instrument'}</strong> — ${s.type} • ${due} • ${s.status}</li>`;
      }).join('');
      return `<h3>${title}</h3><ul>${rows}</ul>`;
    };

    const html = `
      <html>
        <head>
          <title>${heading}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 4px; }
            h3 { margin: 16px 0 8px; }
            ul { padding-left: 16px; }
            li { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${heading}</h1>
          <p>Generated: ${now.toLocaleString()}</p>
          ${toLines('Overdue', summary.overdue)}
          ${toLines('Upcoming', summary.upcoming)}
          ${toLines('Partial / In Progress', summary.partial)}
          ${toLines('Recently Completed', summary.completed)}
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  const renderList = (title: string, items: MaintenanceEvent[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None in this window.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map(item => {
            const inst = instruments[item.instrumentId];
            const due = formatDate(item.dueDate);
            const daysOut = differenceInDays(new Date(item.dueDate), new Date());
            const chip = daysOut < 0 ? `${Math.abs(daysOut)}d overdue` : `${daysOut}d`;
            return (
              <li key={item.id} className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{inst?.eqpId || 'Instrument'} • {item.type}</p>
                    <p className="text-xs text-muted-foreground">{inst?.location || 'Location'} • {inst?.instrumentType || ''}</p>
                  </div>
                  <Badge variant={daysOut < 0 ? 'destructive' : 'secondary'}>{chip}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{due} • {item.status}</p>
              </li>
            );
          })}
          {items.length > 5 && <p className="text-xs text-muted-foreground">+{items.length - 5} more</p>}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant={timeRange === 30 ? 'default' : 'outline'} onClick={() => setTimeRange(30)}>30 days</Button>
          <Button size="sm" variant={timeRange === 90 ? 'default' : 'outline'} onClick={() => setTimeRange(90)}>90 days</Button>
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI-ready Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderList('Overdue', summary.overdue)}
          {renderList('Upcoming', summary.upcoming)}
          {renderList('Partial / In Progress', summary.partial)}
          {renderList('Recently Completed', summary.completed)}
        </CardContent>
      </Card>
    </div>
  );
}
