import { mockInstruments } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO, isBefore, addDays } from 'date-fns';

export function UpcomingMaintenanceList() {
  const upcoming = mockInstruments
    .filter(inst => {
      const nextDate = parseISO(inst.nextMaintenanceDate);
      return isBefore(nextDate, addDays(new Date(), 30)) && isBefore(new Date(), nextDate);
    })
    .sort((a, b) => new Date(a.nextMaintenanceDate).getTime() - new Date(b.nextMaintenanceDate).getTime());

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Upcoming Maintenance</CardTitle>
        <CardDescription>Instruments requiring maintenance in the next 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrument</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Days Left</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.length > 0 ? (
              upcoming.map(inst => {
                const daysLeft = differenceInDays(parseISO(inst.nextMaintenanceDate), new Date());
                return (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div className="font-medium">{inst.name}</div>
                      <div className="text-sm text-muted-foreground">{inst.serialNumber}</div>
                    </TableCell>
                    <TableCell>{inst.location}</TableCell>
                    <TableCell>{inst.nextMaintenanceDate}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={daysLeft <= 7 ? 'destructive' : 'secondary'}>{daysLeft} days</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No upcoming maintenance in the next 30 days.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
