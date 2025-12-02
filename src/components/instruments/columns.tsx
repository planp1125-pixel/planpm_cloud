'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Instrument } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { parseISO, isAfter } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Operational: 'default',
  'Needs Maintenance': 'secondary',
  'Out of Service': 'destructive',
  Archived: 'outline',
};

export const columns: ColumnDef<Instrument>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Instrument
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const instrument = row.original;
      const image = PlaceHolderImages.find(img => img.id === instrument.imageId);
      return (
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 rounded-md overflow-hidden bg-muted">
            {image && (
              <Image
                src={image.imageUrl}
                alt={instrument.name}
                width={64}
                height={48}
                className="object-cover w-full h-full"
                data-ai-hint={image.imageHint}
              />
            )}
          </div>
          <div>
            <div className="font-medium">{instrument.name}</div>
            <div className="text-sm text-muted-foreground">{instrument.serialNumber}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return <Badge variant={statusVariant[status] || 'default'}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
  },
  {
    accessorKey: 'nextMaintenanceDate',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Next Maintenance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateStr = row.getValue('nextMaintenanceDate') as string;
      const isOverdue = isAfter(new Date(), parseISO(dateStr));
      return (
        <div className={`flex items-center ${isOverdue ? 'text-destructive' : ''}`}>
          {dateStr}
          {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const instrument = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(instrument.id)}>
                Copy Instrument ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Update Maintenance</DropdownMenuItem>
              <Link href={`/advisor?instrumentId=${instrument.id}`} passHref>
                <DropdownMenuItem>Predict Failure</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
