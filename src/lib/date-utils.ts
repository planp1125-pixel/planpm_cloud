import { format } from 'date-fns';

/**
 * Standard date format for the entire app: "12 Dec 2025"
 * This avoids confusion between MM/DD/YYYY and DD/MM/YYYY
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd'); // e.g., "2025-12-12"
};

/**
 * Date with time: "12 Dec 2025, 2:30 PM"
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM yyyy, h:mm a'); // e.g., "12 Dec 2025, 2:30 PM"
};

/**
 * Short date format: "12 Dec"
 */
export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM'); // e.g., "12 Dec"
};

/**
 * Full date with day: "Thursday, 12 Dec 2025"
 */
export const formatDateFull = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, d MMM yyyy'); // e.g., "Thursday, 12 Dec 2025"
};
