
import { Apartment, ExpenseCategory, Expense } from './types';

export const INITIAL_APARTMENTS: Apartment[] = [
  { id: '1', number: '1', owner: 'Jean Dupont', shares: 100, monthlyFee: 50, floor: 0, phone: '0612345678', email: 'jean@example.com' },
  { id: '2', number: '2', owner: 'Marie Curie', shares: 100, monthlyFee: 50, floor: 0, phone: '0612345679', email: 'marie@example.com' },
  { id: '3', number: '3', owner: 'Pierre Martin', shares: 150, monthlyFee: 75, floor: 1, phone: '0612345680', email: 'pierre@example.com' },
  { id: '4', number: '4', owner: 'Lucie Bernard', shares: 150, monthlyFee: 75, floor: 1, phone: '0612345681', email: 'lucie@example.com' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', date: '2025-01-15', category: ExpenseCategory.CLEANING, description: 'Nettoyage parties communes Janvier', amount: 200 },
  { id: 'e2', date: '2025-01-20', category: ExpenseCategory.ELECTRICITY, description: 'Facture EDF parties communes', amount: 85.50 },
  { id: 'e3', date: '2025-02-05', category: ExpenseCategory.REPAIRS, description: 'Réparation serrure porte entrée', amount: 120 },
];

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.ELECTRICITY]: 'bg-yellow-100 text-yellow-700',
  [ExpenseCategory.WATER]: 'bg-cyan-100 text-cyan-700',
  [ExpenseCategory.CLEANING]: 'bg-green-100 text-green-700',
  [ExpenseCategory.REPAIRS]: 'bg-red-100 text-red-700',
  [ExpenseCategory.INSURANCE]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-700',
};
