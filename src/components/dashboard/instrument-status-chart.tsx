'use client';

import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockInstruments } from '@/lib/data';
import { useMemo } from 'react';

const COLORS = {
  'Operational': 'hsl(var(--chart-1))',
  'Needs Maintenance': 'hsl(var(--chart-2))',
  'Out of Service': 'hsl(var(--destructive))',
  'Archived': 'hsl(var(--muted))',
};

export function InstrumentStatusChart() {
  const data = useMemo(() => {
    const statusCounts = mockInstruments.reduce((acc, instrument) => {
      acc[instrument.status] = (acc[instrument.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-3 transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Instrument Status</CardTitle>
        <CardDescription>Distribution of instrument operational status.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <PieChart width={400} height={300} style={{ margin: 'auto' }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
          </PieChart>
        </div>
      </CardContent>
    </Card>
  );
}
