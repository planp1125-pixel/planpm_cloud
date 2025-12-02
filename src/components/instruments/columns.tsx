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
import { isAfter } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Operational: 'default',
  AMC: 'secondary',
  PM: 'secondary',
  'Out of Service': 'destructive',
};

// Helper to format Timestamp to string
const formatDate = (timestamp: Timestamp | undefined) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'N/A';
  }
  return timestamp.toDate().toLocaleDateString();
};


export const columns = (
  onEdit: (instrument: Instrument) => void,
  onDelete: (instrument: Instrument) => void
): ColumnDef<Instrument>[] => [
  {
    accessorKey: 'eqpId',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Eqp. ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const instrument = row.original;
      const defaultImage = PlaceHolderImages.find(img => img.id === instrument.imageId);
      const imageUrl = instrument.imageUrl || defaultImage?.imageUrl;
      const imageHint = instrument.imageUrl ? '' : defaultImage?.imageHint;
      
      return (
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 rounded-md overflow-hidden bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={instrument.eqpId || 'Instrument image'}
                width={64}
                height={48}
                className="object-cover w-full h-full"
                data-ai-hint={imageHint}
                unoptimized={!!instrument.imageUrl}
              />
            ) : (
               <div className="w-16 h-12 bg-muted flex items-center justify-center text-xs text-muted-foreground">No Image</div>
            )}
          </div>
          <div>
            <div className="font-medium">{instrument.eqpId}</div>
            <div className="text-sm text-muted-foreground">{instrument.instrumentType}</div>
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
      const date = row.getValue('nextMaintenanceDate') as Timestamp;
      const dateStr = formatDate(date);
      const isOverdue = date && isAfter(new Date(), date.toDate());
      return (
        <div className={`flex items-center ${isOverdue ? 'text-destructive' : ''}`}>
          {dateStr}
          {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
        </div>
      );
    },
  },
    {
    accessorKey: 'scheduleDate',
    header: 'Scheduled On',
    cell: ({ row }) => {
      const date = row.getValue('scheduleDate') as Timestamp;
      return formatDate(date);
    }
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
              <DropdownMenuItem onClick={() => onEdit(instrument)}>
                Edit Instrument
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(instrument)} className="text-destructive">
                Delete Instrument
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href={`/instruments/${instrument.id}`} passHref>
                <DropdownMenuItem>View Details</DropdownMenuItem>
              </Link>
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
