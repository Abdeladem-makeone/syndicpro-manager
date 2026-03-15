
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'owner';
  apartmentId?: string;
  language?: 'fr' | 'ar';
}

export interface Attachment {
  name: string;
  data: string; // Base64
  type: string; // mimeType
}

export interface AppDocument {
  id: string;
  name: string;
  category: 'invoice' | 'quote' | 'contract' | 'other';
  type: string; // mimeType
  data: string; // base64
  date: string;
  size: number;
}

export interface ProfileRequest {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  ownerName: string;
  currentPhone: string;
  newPhone: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BuildingInfo {
  name: string;
  address: string;
  totalUnits: number;
  unitsPerFloor: number;
  numFloors: number; 
  defaultMonthlyFee: number;
  isConfigured: boolean;
  autoRemindersEnabled: boolean;
  notificationsEnabled: boolean;
  reminderLanguage: 'ar' | 'fr';
  whatsappTemplate?: string;
  whatsappDetailedTemplate?: string;
  lastSyncDate?: string;
  ownerInterfaceEnabled: boolean;
  // Nouveaux réglages Propriétaires
  ownerShowBalance: boolean;
  ownerShowExpenseRegister: boolean;
  ownerCanCreateOps: boolean;
  // Champs Syndic
  syndicContactNumber?: string;
  whatsappApiKey?: string;
  whatsappSenderNumber?: string;
  adminPassword?: string;
}

export interface ReminderLog {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  ownerName: string;
  date: string;
  type: 'simple' | 'detailed';
}

export interface Apartment {
  id: string;
  number: string;
  owner: string;
  shares: number;
  monthlyFee: number;
  floor: number;
  phone: string;
  email: string;
}

export interface BuildingAsset {
  id: string;
  name: string;
  description: string;
  incomeAmount: number;
  frequency: 'monthly' | 'yearly';
  category: 'rent' | 'telecom' | 'advertising' | 'other';
}

export interface AssetPayment {
  id: string;
  assetId: string;
  amount: number;
  date: string;
  period: string; 
  year: number;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  excludedFromReports?: boolean;
}

export enum ExpenseCategory {
  MAINTENANCE = 'Maintenance',
  ELECTRICITY = 'Électricité',
  WATER = 'Eau',
  CLEANING = 'Nettoyage',
  REPAIRS = 'Réparations',
  INSURANCE = 'Assurance',
  OTHER = 'Autre'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  expectedResult?: string; 
  endDate?: string; 
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedBudget?: number;
  authorId: string; 
  authorName: string;
  attachments?: Attachment[]; 
}

export interface Complaint {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  date: string;
  description: string;
  category: ExpenseCategory; 
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  authorName: string;
  authorId?: string;
  attachments?: Attachment[]; 
}

export interface Payment {
  id: string;
  apartmentId: string;
  month: number;
  year: number;
  amount: number;
  paidDate: string;
}
