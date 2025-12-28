
export enum TabType {
  ITINERARY = 'ITINERARY',
  INFO = 'INFO',
  LEDGER = 'LEDGER',
  PREP = 'PREP',
  MEMBERS = 'MEMBERS'
}

export type PrepCategory = 'TODO' | 'LUGGAGE' | 'WANT' | 'BUY';

export interface ItineraryItem {
  id: string;
  time: string;
  type: 'FLIGHT' | 'TRANSPORT' | 'FOOD' | 'SIGHT' | 'HOTEL';
  title: string;
  subtitle?: string;
  details?: string[];
  location?: string;
  day: number;
  notes?: string;
  photos?: string[];
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  paidBy: string;
  date: string;
}

export interface PackingItem {
  id: string;
  name: string;
  completedBy: string[]; // Store array of member names who completed this task
  category: PrepCategory;
  assignedTo?: string;
}

export interface Member {
  name: string;
  role: string;
  avatar: string;
}
