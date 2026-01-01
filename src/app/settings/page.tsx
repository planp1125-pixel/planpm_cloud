import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';

const settingsOptions = [
  {
    title: 'Maintenance Types',
    description: 'Create, rename, or delete custom maintenance types.',
    href: '/settings/maintenance-types',
    icon: Wrench,
  },
];

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6 w-full">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
        <p className="text-muted-foreground">Manage global options for Plan-PM.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsOptions.map((item) => (
          <Card key={item.href} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <item.icon className="w-5 h-5 text-primary" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={item.href}>
                <Button variant="outline">Manage</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
