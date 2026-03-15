import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Apartments from './pages/Apartments';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Owners from './pages/Owners';
import FollowUp from './pages/FollowUp';
import BuildingSetup from './pages/BuildingSetup';
import Login from './pages/Login';
import ReminderCenter from './pages/ReminderCenter';
import AssetsManager from './pages/AssetsManager';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProfile from './pages/OwnerProfile';
import Documents from './pages/Documents';
import { api } from './services/api';
import { User, BuildingInfo, Apartment, Expense, Payment, Project, Complaint, ReminderLog, BuildingAsset, AssetPayment, ProfileRequest } from './types';

const Toast: React.FC<{ message: string, type: 'success' | 'error' | 'info', onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-600 shadow-emerald-200',
    error: 'bg-rose-600 shadow-rose-200',
    info: 'bg-indigo-600 shadow-indigo-200'
  };

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 ${styles[type]}`}>
      <i className={`fas ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-lg`}></i>
      <span className="tracking-wide">{message}</span>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('syndic_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>([]);
  const [assets, setAssets] = useState<BuildingAsset[]>([]);
  const [assetPayments, setAssetPayments] = useState<AssetPayment[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileRequest[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const loadAllData = useCallback(async () => {
    try {
      const { api } = await import('./services/api');
      const building = await api.getBuilding();
      setBuildingInfo(building || {
        name: '', address: '', totalUnits: 0, unitsPerFloor: 0, numFloors: 0,
        defaultMonthlyFee: 50, isConfigured: false, autoRemindersEnabled: false,
        notificationsEnabled: false, reminderLanguage: 'fr', ownerInterfaceEnabled: false,
        ownerShowBalance: false, ownerShowExpenseRegister: false, ownerCanCreateOps: false
      });
      const apts = await api.getApartments();
      setApartments(apts || []);
      const finances = await api.getFinances();
      setPayments(finances.payments || []);
      setExpenses(finances.expenses || []);
      setAssetPayments(finances.assetPayments || []);
      const ops = await api.getOperations();
      setProjects(ops.projects || []);
      setComplaints(ops.complaints || []);
      const history = await api.getReminders();
      setReminderHistory(history || []);
      const assetsData = await api.getAssets();
      setAssets(assetsData || []);
      const reqs = await api.getProfileRequests();
      setProfileRequests(reqs || []);
    } catch (err) {
      console.error("Erreur chargement API:", err);
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleLogin = (u: User) => {
    localStorage.setItem('syndic_session', JSON.stringify(u));
    setUser(u);
    notify(`Bienvenue ${u.username} !`);
  };

  const handleLogout = () => {
    localStorage.removeItem('syndic_session');
    setUser(null);
    notify("Déconnexion réussie", "info");
  };

  if (isAppLoading) return null;

  // 1. LOGIN D'ABORD
  if (!user) {
    return <Login apartments={apartments} buildingInfo={buildingInfo!} onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'admin';
  const myApartment = !isAdmin ? apartments.find(a => a.id === user.apartmentId) : null;

  return (
    <Layout
      currentUser={user.username}
      role={user.role}
      onLogout={handleLogout}
      language={user.language || 'fr'}
      onLanguageToggle={(lang) => {
        const next = { ...user, language: lang };
        setUser(next);
        localStorage.setItem('syndic_session', JSON.stringify(next));
      }}
      badges={{ owners: profileRequests.filter(r => r.status === 'pending').length }}
    >
      <Routes>
        {isAdmin ? (
          <>
            {/* Si admin mais non configuré, forcer la page setup avec le menu visible */}
            {!buildingInfo?.isConfigured ? (
              <Route path="*" element={<BuildingSetup
                buildingInfo={buildingInfo!}
                onSave={async (info, apts) => {
                  try {
                    await api.setup(info, apts || apartments);
                    await loadAllData();
                    notify("Configuration système validée !");
                  } catch (e) { notify("Erreur de sauvegarde", "error"); }
                }}
                onImportFullDB={() => { }}
                fullData={{}}
                currentApartmentsCount={apartments.length}
                onNotify={notify}
              />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo!} />} />
                <Route path="/apartments" element={<Apartments apartments={apartments} payments={payments} buildingInfo={buildingInfo!} onUpdate={(apt) => {
                  const next = apartments.map(a => a.id === apt.id ? apt : a);
                  setApartments(next);
                  api.updateApartment(apt);
                }} onAdd={(apt) => {
                  const next = [...apartments, apt];
                  setApartments(next);
                  api.createApartment(apt);
                }} onDelete={(id) => {
                  const next = apartments.filter(a => a.id !== id);
                  setApartments(next);
                  api.deleteApartment(id);
                }} />} />
                <Route path="/payments" element={<Payments
                  apartments={apartments} payments={payments} buildingInfo={buildingInfo!}
                  onTogglePayment={(aptId, month, year) => {
                    setPayments(prev => {
                      const existingIndex = prev.findIndex(p => p.apartmentId === aptId && p.month === month && p.year === year);
                      let next = [...prev];
                      if (existingIndex > -1) {
                        const existing = next.splice(existingIndex, 1)[0];
                        api.deletePayment(existing.id);
                      } else {
                        const apt = apartments.find(a => a.id === aptId);
                        const p: Payment = {
                          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                          apartmentId: aptId,
                          month,
                          year,
                          amount: apt?.monthlyFee || 0,
                          paidDate: new Date().toISOString()
                        };
                        next.push(p);
                        api.createPayment(p);
                      }
                      return next;
                    });
                  }}
                  onNotify={notify} assets={assets} assetPayments={assetPayments}
                  onAddAssetPayment={(p) => {
                    const next = [...assetPayments, p];
                    setAssetPayments(next);
                    api.createAssetPayment(p);
                  }}
                  onDeleteAssetPayment={(id) => {
                    const next = assetPayments.filter(item => item.id !== id);
                    setAssetPayments(next);
                    api.deleteAssetPayment(id);
                  }}
                />} />
                <Route path="/expenses" element={<Expenses
                  expenses={expenses}
                  onAdd={(e) => {
                    const next = [...expenses, e];
                    setExpenses(next);
                    api.createExpense(e);
                  }}
                  onUpdate={(e) => {
                    const next = expenses.map(item => item.id === e.id ? e : item);
                    setExpenses(next);
                    api.updateExpense(e);
                  }}
                  onDelete={(id) => {
                    const next = expenses.filter(item => item.id !== id);
                    setExpenses(next);
                    api.deleteExpense(id);
                  }}
                />} />
                <Route path="/reports" element={<Reports apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo!} />} />
                <Route path="/owners" element={<Owners apartments={apartments} onUpdate={(apt) => {
                  const next = apartments.map(a => a.id === apt.id ? apt : a);
                  setApartments(next);
                  api.updateApartment(apt);
                }} profileRequests={profileRequests} onHandleProfileRequest={(id, app) => {
                  const req = profileRequests.find(r => r.id === id);
                  if (req) {
                    const updatedReq = { ...req, status: (app ? 'approved' : 'rejected') as any };
                    const nextArr = profileRequests.map(r => r.id === id ? updatedReq : r);
                    setProfileRequests(nextArr);
                    api.updateProfileRequest(updatedReq);
                  }
                }} />} />
                <Route path="/reminders" element={<ReminderCenter
                  apartments={apartments} payments={payments} buildingInfo={buildingInfo!}
                  onUpdateBuilding={(info) => { setBuildingInfo(info); api.setup(info, apartments); }}
                  reminderHistory={reminderHistory} onAddReminderLog={(log) => {
                    const next = [...reminderHistory, log];
                    setReminderHistory(next);
                    api.createReminder(log);
                  }}
                />} />
                <Route path="/assets" element={<AssetsManager
                  assets={assets} assetPayments={assetPayments}
                  onAddAsset={(a) => { const next = [...assets, a]; setAssets(next); api.createAsset(a); }}
                  onUpdateAsset={(a) => { const next = assets.map(i => i.id === a.id ? a : i); setAssets(next); api.updateAsset(a); }}
                  onDeleteAsset={(id) => { const next = assets.filter(i => i.id !== id); setAssets(next); api.deleteAsset(id); }}
                  onAddPayment={(p) => { const next = [...assetPayments, p]; setAssetPayments(next); api.createAssetPayment(p); }}
                  onDeletePayment={(id) => { const next = assetPayments.filter(i => i.id !== id); setAssetPayments(next); api.deleteAssetPayment(id); }}
                />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/setup" element={<BuildingSetup buildingInfo={buildingInfo!} onSave={async (info) => { setBuildingInfo(info); await api.setup(info, apartments); }} onImportFullDB={() => { }} fullData={{}} currentApartmentsCount={apartments.length} onNotify={notify} />} />
              </>
            )}
          </>
        ) : (
          <>
            <Route path="/" element={myApartment ? <OwnerDashboard apartment={myApartment} expenses={expenses} payments={payments} assetPayments={assetPayments} reminderHistory={reminderHistory} buildingInfo={buildingInfo!} language={user.language} /> : <Navigate to="/profile" />} />
            <Route path="/profile" element={myApartment ? <OwnerProfile apartment={myApartment} onUpdateApt={(apt) => {
              const next = apartments.map(a => a.id === apt.id ? apt : a);
              setApartments(next);
              api.updateApartment(apt);
            }} onRequestPhoneChange={(req) => {
              const next = [req, ...profileRequests];
              setProfileRequests(next);
              api.createProfileRequest(req);
            }} pendingRequests={profileRequests} onDismissRequest={(id) => {
              const next = profileRequests.filter(r => r.id !== id);
              setProfileRequests(next);
              api.deleteProfileRequest(id);
            }} language={user.language} /> : <Navigate to="/" />} />
          </>
        )}
        <Route path="/followup" element={<FollowUp apartments={apartments} projects={projects} complaints={complaints} currentUser={user} onRefresh={loadAllData} buildingInfo={buildingInfo!} language={user.language} onNotify={notify} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;