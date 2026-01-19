'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { MaintenanceTypeCards } from './maintenance-type-cards';
import { differenceInDays, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import type { MaintenanceEvent, Instrument, MaintenanceConfiguration, MaintenanceFrequency, MaintenanceTaskType } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type MaintenanceStatus = 'Completed' | 'Pending' | 'Partially Completed' | 'Overdue';

interface EnhancedEvent extends MaintenanceEvent {
  configId?: string;
  instrumentName?: string;
  instrumentType?: string;
  location?: string;
  daysLeft?: number;
  template?: string | null;
  maintenanceStatus: MaintenanceStatus;
  totalSections?: number;
  completedSections?: number;
  hasResult?: boolean;
}

const getNextDate = (date: Date, frequency: MaintenanceFrequency): Date => {
  switch (frequency) {
    case 'Daily': return addDays(date, 1);
    case 'Weekly': return addWeeks(date, 1);
    case 'Monthly': return addMonths(date, 1);
    case '3 Months': return addMonths(date, 3);
    case '6 Months': return addMonths(date, 6);
    case '1 Year': return addYears(date, 1);
    default: return date;
  }
};

const getMaxOccurrences = (frequency: MaintenanceFrequency): number => {
  switch (frequency) {
    case 'Daily': return 30;
    case 'Weekly': return 26;
    case 'Monthly': return 12;
    case '3 Months': return 8;
    case '6 Months': return 6;
    case '1 Year': return 3;
    default: return 10;
  }
};

export function MaintenanceSummary() {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [configurations, setConfigurations] = useState<MaintenanceConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      const [instrumentsRes, configurationsRes] = await Promise.all([
        supabase.from('instruments').select('*'),
        supabase.from('maintenance_configurations').select('*').eq('user_id', user.id).eq('is_active', true)
      ]);

      setInstruments(instrumentsRes.data || []);
      setConfigurations(configurationsRes.data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const upcomingSchedules = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const events: EnhancedEvent[] = [];

    configurations.forEach(config => {
      const instrument = instruments.find(i => i.id === config.instrument_id);
      if (!instrument) return;

      let currentDate = new Date(config.schedule_date);
      currentDate.setHours(0, 0, 0, 0);

      const maxOccurrences = getMaxOccurrences(config.frequency);
      let occurrenceCount = 0;

      // If start date is in the past or today, start from next occurrence
      if (currentDate <= now) {
        currentDate = getNextDate(now, config.frequency);
      }

      while (occurrenceCount < maxOccurrences) {
        const daysUntil = differenceInDays(currentDate, now);

        let status: MaintenanceStatus = 'Pending';
        if (daysUntil < 0) {
          status = 'Overdue';
        }

        events.push({
          id: `${config.id}-${currentDate.toISOString()}`,
          configId: config.id,
          instrumentId: instrument.id,
          instrumentName: instrument.eqpId,  // Fixed: using eqpId instead of name
          instrumentType: instrument.instrumentType,
          location: instrument.location,
          type: config.maintenance_type as MaintenanceTaskType,
          description: `${config.maintenance_type} - ${config.frequency}`,
          status: daysUntil < 0 ? 'Overdue' : 'Scheduled' as const,
          frequency: config.frequency,
          dueDate: currentDate.toISOString(),
          daysLeft: daysUntil,
          maintenanceStatus: status,
          template: config.template_id,
          notes: ''
        });

        currentDate = getNextDate(currentDate, config.frequency);
        occurrenceCount++;
      }
    });

    return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [instruments, configurations]);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  return (
    <>
      {/* Sticky Type Cards */}
      {upcomingSchedules.length > 0 && (
        <div className="sticky top-0 z-10 bg-background pb-4">
          <MaintenanceTypeCards
            schedules={upcomingSchedules}
            onTypeClick={() => { }}
            selectedType={undefined}
          />
        </div>
      )}
    </>
  );
}
