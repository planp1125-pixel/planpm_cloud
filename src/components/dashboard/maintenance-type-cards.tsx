'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { MaintenanceEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MaintenanceTypeCardsProps {
  schedules: MaintenanceEvent[];
  onTypeClick?: (type: string) => void;
  selectedType?: string;
}

export function MaintenanceTypeCards({ schedules, onTypeClick, selectedType }: MaintenanceTypeCardsProps) {
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    schedules.forEach(schedule => {
      const type = schedule.type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Sort by count (descending)
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));
  }, [schedules]);

  if (typeCounts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {typeCounts.map(({ type, count }) => {
        const isSelected = selectedType === type;

        return (
          <Card
            key={type}
            className={cn(
              "transition-all cursor-pointer hover:shadow-md hover:scale-105",
              isSelected && "ring-2 ring-primary shadow-md scale-105"
            )}
            onClick={() => onTypeClick?.(type)}
          >
            <CardContent className="p-4 text-center">
              <div className={cn(
                "text-3xl font-bold mb-1",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {count}
              </div>
              <div className={cn(
                "text-xs font-medium truncate",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}>
                {type}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
