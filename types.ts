
export enum TabType {
  ITINERARY = 'ITINERARY',
  MAP = 'MAP',
  INFO = 'INFO',
  LEDGER = 'LEDGER',
  PREP = 'PREP',
  MEMBERS = 'MEMBERS'
}

export type PrepCategory = 'TODO' | 'LUGGAGE' | 'WANT' | 'BUY';

export interface ItineraryItem {
  id: string;
  time: string; // 離港時間 / 起飛時間
  type: 'FLIGHT' | 'TRANSPORT' | 'FOOD' | 'SIGHT' | 'HOTEL';
  title: string;
  subtitle?: string;
  details?: string[];
  location?: string;
  day: number;
  notes?: string;
  photos?: string[];
  // 航班專用欄位
  arrivalTime?: string;
  terminal?: string;
  gate?: string;
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
  completedBy: string[];
  category: PrepCategory;
  assignedTo?: string;
}

export interface Member {
  name: string;
  role: string;
  avatar: string;
}
