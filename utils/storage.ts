
import { BuildingInfo, Apartment, Expense, Payment, Project, Complaint, ReminderLog, BuildingAsset, AssetPayment, ProfileRequest, AppDocument } from '../types';

const STORAGE_PREFIX = 'syndic_v4_';
const DATA_PATHS = {
  BUILDING: 'syndic_storage/building_info.json',
  ASSETS: 'syndic_storage/building_assets.json',
  OPS: 'syndic_storage/ops_projects_complaints.json',
  REMINDERS: 'syndic_storage/reminder_logs.json',
  PROFILE_REQS: 'syndic_storage/profile_requests.json',
  DOCUMENTS: 'syndic_storage/app_documents.json',
  COTIS_PREFIX: 'syndic_storage/cotis_',
  ASSET_PAY_PREFIX: 'syndic_storage/asset_pay_',
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch (e) {
    if (e instanceof DOMException) {
      alert("⚠️ Stockage plein : Impossible d'enregistrer les fichiers (trop volumineux pour le navigateur).");
    }
  }
};

const safeGetItem = (key: string) => localStorage.getItem(STORAGE_PREFIX + key);

export const storage = {
  exists: () => safeGetItem(DATA_PATHS.BUILDING) !== null,

  initialize: (building: BuildingInfo, apartments: Apartment[]) => {
    safeSetItem(DATA_PATHS.BUILDING, JSON.stringify({ building, apartments, created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.ASSETS, JSON.stringify({ assets: [], created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.OPS, JSON.stringify({ projects: [], complaints: [], created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.REMINDERS, JSON.stringify([]));
    safeSetItem(DATA_PATHS.PROFILE_REQS, JSON.stringify([]));
    safeSetItem(DATA_PATHS.DOCUMENTS, JSON.stringify([]));
  },

  saveBuildingData: (building: BuildingInfo, apartments: Apartment[]) => {
    safeSetItem(DATA_PATHS.BUILDING, JSON.stringify({ building, apartments, lastUpdate: new Date().toISOString() }));
  },

  loadBuildingData: () => {
    const data = safeGetItem(DATA_PATHS.BUILDING);
    return data ? JSON.parse(data) : { building: null, apartments: [] };
  },

  saveAssets: (assets: BuildingAsset[]) => {
    safeSetItem(DATA_PATHS.ASSETS, JSON.stringify({ assets, lastUpdate: new Date().toISOString() }));
  },

  loadAssets: (): BuildingAsset[] => {
    const data = safeGetItem(DATA_PATHS.ASSETS);
    return data ? JSON.parse(data).assets || [] : [];
  },

  saveOperations: (projects: Project[], complaints: Complaint[]) => {
    safeSetItem(DATA_PATHS.OPS, JSON.stringify({ projects, complaints, lastUpdate: new Date().toISOString() }));
  },

  loadOperations: () => {
    const data = safeGetItem(DATA_PATHS.OPS);
    return data ? JSON.parse(data) : { projects: [], complaints: [] };
  },

  saveProfileRequests: (reqs: ProfileRequest[]) => {
    safeSetItem(DATA_PATHS.PROFILE_REQS, JSON.stringify(reqs));
  },

  loadProfileRequests: (): ProfileRequest[] => {
    const data = safeGetItem(DATA_PATHS.PROFILE_REQS);
    return data ? JSON.parse(data) : [];
  },

  saveDocuments: (docs: AppDocument[]) => {
    safeSetItem(DATA_PATHS.DOCUMENTS, JSON.stringify(docs));
  },

  loadDocuments: (): AppDocument[] => {
    const data = safeGetItem(DATA_PATHS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveYearlyFinance: (year: number, payments: Payment[], expenses: Expense[], assetPayments: AssetPayment[]) => {
    const yearPayments = payments.filter(p => p.year === year);
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
    safeSetItem(`${DATA_PATHS.COTIS_PREFIX}${year}.json`, JSON.stringify({ year, payments: yearPayments, expenses: yearExpenses }));

    const yearAssetPay = assetPayments.filter(ap => ap.year === year);
    safeSetItem(`${DATA_PATHS.ASSET_PAY_PREFIX}${year}.json`, JSON.stringify({ year, payments: yearAssetPay }));
  },

  loadAllYearlyData: () => {
    const allPayments: Payment[] = [];
    const allExpenses: Expense[] = [];
    const allAssetPayments: AssetPayment[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX + DATA_PATHS.COTIS_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allPayments.push(...data.payments);
        if (data.expenses) allExpenses.push(...data.expenses);
      }
      if (key?.startsWith(STORAGE_PREFIX + DATA_PATHS.ASSET_PAY_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allAssetPayments.push(...data.payments);
      }
    }
    return { payments: allPayments, expenses: allExpenses, assetPayments: allAssetPayments };
  },

  saveReminders: (logs: ReminderLog[]) => {
    safeSetItem(DATA_PATHS.REMINDERS, JSON.stringify(logs));
  },

  loadReminders: () => {
    const data = safeGetItem(DATA_PATHS.REMINDERS);
    return data ? JSON.parse(data) : [];
  },

  getFullExport: () => {
    const fullData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const cleanKey = key.replace(STORAGE_PREFIX, '');
        fullData[cleanKey] = JSON.parse(localStorage.getItem(key) || 'null');
      }
    }
    return {
      appName: "SyndicPro Manager",
      version: "4.1",
      exportDate: new Date().toISOString(),
      storage: fullData
    };
  },

  importFullData: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.storage) throw new Error("Format invalide.");
      
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) keysToDelete.push(key);
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));

      Object.entries(parsed.storage).forEach(([key, value]) => {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  getVirtualFiles: () => {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const fileName = key.replace(STORAGE_PREFIX, '');
        const size = (localStorage.getItem(key)?.length || 0) / 1024;
        files.push({ name: fileName, size });
      }
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
  },

  formatStorage: () => {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const keyVal = STORAGE_PREFIX + key;
        localStorage.removeItem(keyVal);
      }
    }
    // Corrected to actually iterate properly
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
};
