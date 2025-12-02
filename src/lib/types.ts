import type { Timestamp } from 'firebase/firestore';

export type InstrumentStatus = 'AMC' | 'PM' | 'Operational' | 'Out of Service';
export type MaintenanceFrequency = 'Weekly' | 'Monthly' | '3 Months' | '6 Months' | '1 Year';
export type InstrumentType = "Lab Balance" | "Scale" | "pH Meter" | "Tap Density Tester" | "UV-Vis Spectrophotometer" | "GC" | "Spectrometer";
export type MaintenanceTaskType = "Calibration" | "Preventative Maintenance" | "Validation";

export type MaintenanceEvent = {
  id: string; // Document ID
  instrumentId: string;
  dueDate: Timestamp;
  type: MaintenanceTaskType;
  description: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  notes?: string;
};

// This represents the data structure in Firestore
export type Instrument = {
  id: string; // Document ID
  eqpId: string;
  instrumentType: InstrumentType;
  model: string;
  serialNumber: string;
  location: string;
  status: InstrumentStatus;
  scheduleDate: Timestamp; // The start date of the first schedule
  frequency: MaintenanceFrequency;
  nextMaintenanceDate: Timestamp;
  imageId: string;
  imageUrl?: string; // Optional user-provided image URL
};

    