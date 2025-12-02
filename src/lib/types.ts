export type InstrumentStatus = 'Operational' | 'Needs Maintenance' | 'Out of Service' | 'Archived';

export type MaintenanceEvent = {
  id: string;
  date: string;
  type: 'Scheduled' | 'Unscheduled' | 'Emergency';
  description: string;
  notes?: string;
  completed: boolean;
  files?: string[];
};

export type Instrument = {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  location: string;
  status: InstrumentStatus;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceHistory: MaintenanceEvent[];
  usagePatterns?: string;
  imageId: string;
};
