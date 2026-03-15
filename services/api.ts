import { BuildingInfo, Apartment, Expense, Payment, Project, Complaint, ReminderLog, BuildingAsset, AssetPayment, ProfileRequest, AppDocument } from '../types';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur Serveur (${res.status}): ${errorText || res.statusText}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

export const api = {
  // Configuration
  setup: async (building: BuildingInfo, apartments: Apartment[]) => {
    const res = await fetch(`${API_URL}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building, apartments }),
    });
    return handleResponse(res);
  },

  getBuilding: async (): Promise<BuildingInfo | null> => {
    const res = await fetch(`${API_URL}/building`);
    return handleResponse(res);
  },

  // Appartements
  getApartments: async (): Promise<Apartment[]> => {
    const res = await fetch(`${API_URL}/apartments`);
    return handleResponse(res);
  },

  createApartment: async (apt: Apartment) => {
    const res = await fetch(`${API_URL}/apartments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt),
    });
    return handleResponse(res);
  },

  updateApartment: async (apt: Apartment) => {
    const res = await fetch(`${API_URL}/apartments/${apt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt),
    });
    return handleResponse(res);
  },

  deleteApartment: async (id: string) => {
    const res = await fetch(`${API_URL}/apartments/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Finances
  getFinances: async () => {
    const res = await fetch(`${API_URL}/finances`);
    return handleResponse(res);
  },

  createPayment: async (payment: Payment) => {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    return handleResponse(res);
  },

  deletePayment: async (id: string) => {
    const res = await fetch(`${API_URL}/payments/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  createExpense: async (expense: Expense) => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return handleResponse(res);
  },

  updateExpense: async (expense: Expense) => {
    const res = await fetch(`${API_URL}/expenses/${expense.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return handleResponse(res);
  },

  deleteExpense: async (id: string) => {
    const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Opérations
  getOperations: async () => {
    const res = await fetch(`${API_URL}/operations`);
    return handleResponse(res);
  },

  createOperation: async (type: 'project' | 'complaint', data: any) => {
    const res = await fetch(`${API_URL}/operations/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateOperation: async (type: 'project' | 'complaint', data: any) => {
    const res = await fetch(`${API_URL}/operations/${type}/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteOperation: async (type: 'project' | 'complaint', id: string) => {
    const res = await fetch(`${API_URL}/operations/${type}/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Assets
  getAssets: async (): Promise<BuildingAsset[]> => {
    const res = await fetch(`${API_URL}/assets`);
    return handleResponse(res);
  },

  createAsset: async (asset: BuildingAsset) => {
    const res = await fetch(`${API_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
    return handleResponse(res);
  },

  updateAsset: async (asset: BuildingAsset) => {
    const res = await fetch(`${API_URL}/assets/${asset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
    return handleResponse(res);
  },

  deleteAsset: async (id: string) => {
    const res = await fetch(`${API_URL}/assets/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  createAssetPayment: async (payment: AssetPayment) => {
    const res = await fetch(`${API_URL}/asset-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    return handleResponse(res);
  },

  deleteAssetPayment: async (id: string) => {
    const res = await fetch(`${API_URL}/asset-payments/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Profile Requests
  getProfileRequests: async (): Promise<ProfileRequest[]> => {
    const res = await fetch(`${API_URL}/profile-requests`);
    return handleResponse(res);
  },

  createProfileRequest: async (req: ProfileRequest) => {
    const res = await fetch(`${API_URL}/profile-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse(res);
  },

  updateProfileRequest: async (req: ProfileRequest) => {
    const res = await fetch(`${API_URL}/profile-requests/${req.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse(res);
  },

  deleteProfileRequest: async (id: string) => {
    const res = await fetch(`${API_URL}/profile-requests/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Reminders
  getReminders: async (): Promise<ReminderLog[]> => {
    const res = await fetch(`${API_URL}/reminders`);
    return handleResponse(res);
  },

  createReminder: async (log: ReminderLog) => {
    const res = await fetch(`${API_URL}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return handleResponse(res);
  },

  // Documents
  getDocuments: async (): Promise<AppDocument[]> => {
    const res = await fetch(`${API_URL}/documents`);
    return handleResponse(res);
  },

  createDocument: async (doc: AppDocument) => {
    const res = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return handleResponse(res);
  },

  deleteDocument: async (id: string) => {
    const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  }
};
