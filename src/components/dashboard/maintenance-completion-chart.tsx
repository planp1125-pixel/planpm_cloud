'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subMonths, getMonth, getYear } from 'date-fns';

const data = [
  { name: format(subMonths(new Date(), 5), 'MMM'), onTime: 32, overdue: 4 },
  { name: format(subMonths(new Date(), 4), 'MMM'), onTime: 42, overdue: 2 },
  { name: format(subMonths(new Date(), 3), 'MMM'), onTime: 51, overdue: 1 },
  { name: format(subMonths(new Date(), 2), 'MMM'), onTime: 60, overdue: 5 },
  { name: format(subMonths(new Date(), 1), 'MMM'), onTime: 55, overdue: 3 },
  { name: format(new Date(), 'MMM'), onTime: 45, overdue: 1 },
];

export function MaintenanceCompletionChart() {
  return (
    <Card className="col-span-1 lg:col-span-4 transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Maintenance History</CardTitle>
        <CardDescription>On-time vs. Overdue maintenance over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
              contentStyle={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend iconSize={10} />
            <Bar dataKey="onTime" name="On Time" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overdue" name="Overdue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
