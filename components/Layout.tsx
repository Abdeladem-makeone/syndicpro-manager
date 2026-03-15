
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: string;
  role: 'admin' | 'owner';
  language?: 'fr' | 'ar';
  onLanguageToggle?: (lang: 'fr' | 'ar') => void;
  badges?: {
    owners?: number;
    followup?: number;
  };
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  currentUser, 
  role, 
  language = 'fr', 
  onLanguageToggle,
  badges 
}) => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isAdmin = role === 'admin';
  const isAr = language === 'ar';

  const translations = {
    fr: {
      dashboard: 'Tableau de Bord',
      apartments: 'Appartements',
      payments: 'Cotisations',
      expenses: 'Dépenses',
      followup: 'Suivi & Projets',
      owners: 'Propriétaires',
      reminders: 'Relances WhatsApp',
      assets: 'Revenus Biens',
      reports: 'Bilans & Rapports',
      documents: 'Documents',
      setup: 'Configuration',
      logout: 'Déconnexion',
      welcome: 'Bienvenue',
      ownerDash: 'Ma Caisse',
      ownerProfile: 'Mon Profil',
      langLabel: 'العربية'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      apartments: 'الشقق',
      payments: 'المساهمات',
      expenses: 'المصاريف',
      followup: 'المتابعة والمشاريع',
      owners: 'الملاك',
      reminders: 'مركز التذكير',
      assets: 'تسيير الممتلكات',
      reports: 'التقارير والبيانات',
      documents: 'المستندات',
      setup: 'الإعدادات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً',
      ownerDash: 'صندوقي',
      ownerProfile: 'ملفي الشخصي',
      langLabel: 'Français'
    }
  };

  const t = translations[language];

  const handleLogoutClick = () => setShowLogoutModal(true);
  const confirmLogout = () => { setShowLogoutModal(false); onLogout(); };

  // --- RENDU ADMIN ---
  if (isAdmin) {
    const navGroups = [
      {
        title: 'Vue d\'ensemble',
        items: [
          { path: '/', label: t.dashboard, icon: 'fa-chart-pie' },
        ]
      },
      {
        title: 'Parc & Résidents',
        items: [
          { path: '/apartments', label: t.apartments, icon: 'fa-building-user' },
          { path: '/owners', label: t.owners, icon: 'fa-users-gear', badge: badges?.owners },
        ]
      },
      {
        title: 'Finances & Patrimoine',
        items: [
          { path: '/payments', label: t.payments, icon: 'fa-money-check-dollar' },
          { path: '/expenses', label: t.expenses, icon: 'fa-file-invoice-dollar' },
          { path: '/assets', label: t.assets, icon: 'fa-tower-broadcast' },
          { path: '/reports', label: t.reports, icon: 'fa-file-contract' },
        ]
      },
      {
        title: 'Ressources',
        items: [
          { path: '/documents', label: t.documents, icon: 'fa-folder-tree' },
          { path: '/followup', label: t.followup, icon: 'fa-list-check' },
          { path: '/reminders', label: t.reminders, icon: 'fa-whatsapp' },
        ]
      },
      {
        title: 'Système',
        items: [
          { path: '/setup', label: t.setup, icon: 'fa-gears' },
        ]
      }
    ];

    return (
      <div className="flex min-h-screen bg-slate-50 relative">
        <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden xl:flex flex-col sticky top-0 h-screen z-[100] border-r border-slate-800">
           <div className="p-6 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-lg shadow-lg">
                <i className="fas fa-city text-white"></i>
              </div>
              <h1 className="text-lg font-black text-white leading-none tracking-tight">SyndicPro</h1>
           </div>
           
           <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7 no-scrollbar">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {group.title}
                  </h3>
                  {group.items.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        location.pathname === item.path ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fas ${item.icon} w-4 text-center text-xs ${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}></i>
                        <span className="font-bold text-[11px] tracking-wide">{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
           </nav>

           <div className="p-4 border-t border-slate-800 bg-slate-950">
              <button 
                onClick={handleLogoutClick}
                className="w-full py-2.5 bg-red-900/10 border border-red-900/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
              >
                {t.logout}
              </button>
           </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
           <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <i className="fas fa-bars-staggered text-slate-400 xl:hidden"></i>
                <span className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Dashboard Admin</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => onLanguageToggle?.(language === 'fr' ? 'ar' : 'fr')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  {language === 'fr' ? 'AR' : 'FR'}
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-800">{currentUser}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Syndic Certifié</p>
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs">
                    {currentUser.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
           </header>
           <div className="p-8">{children}</div>
        </main>

        {showLogoutModal && renderLogoutModal(confirmLogout, () => setShowLogoutModal(false), t.logout, isAr)}
      </div>
    );
  }

  // --- RENDU PROPRIÉTAIRE ---
  const OWNER_NAV = [
    { path: '/', label: t.ownerDash, icon: 'fa-magnifying-glass-chart' },
    { path: '/followup', label: t.followup, icon: 'fa-house-chimney-window' },
    { path: '/profile', label: t.ownerProfile, icon: 'fa-user-gear' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-800 text-white rounded-xl flex items-center justify-center text-xl shadow-md">
              <i className="fas fa-house-user"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">SyndicPro</h1>
              <p className={`font-black text-teal-600 uppercase tracking-widest mt-1 opacity-70 ${isAr ? 'text-sm' : 'text-[10px]'}`}>
                {t.welcome}, {currentUser}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => onLanguageToggle?.(isAr ? 'fr' : 'ar')}
              className={`px-5 py-2.5 bg-slate-100 hover:bg-teal-50 text-teal-700 rounded-xl font-black uppercase tracking-widest transition-all border border-slate-200 ${isAr ? 'text-base' : 'text-xs'}`}
             >
               {t.langLabel}
             </button>
             <button 
               onClick={handleLogoutClick}
               className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
             >
               <i className="fas fa-power-off text-base"></i>
             </button>
          </div>
        </div>

        <nav className="bg-white border-t border-slate-100">
           <div className="max-w-7xl mx-auto px-6 flex py-3 gap-4">
              {OWNER_NAV.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex-1 flex items-center justify-center gap-4 px-8 py-4 rounded-xl transition-all duration-200 ${
                    location.pathname === item.path 
                    ? 'bg-teal-800 text-white shadow-lg' 
                    : 'text-slate-500 hover:bg-teal-50 hover:text-teal-800 font-bold'
                  }`}
                >
                  <i className={`fas ${item.icon} text-lg ${location.pathname === item.path ? 'text-white' : 'text-teal-600 opacity-60'}`}></i>
                  <span className={`font-black uppercase tracking-widest ${isAr ? 'text-lg' : 'text-sm'}`}>{item.label}</span>
                </Link>
              ))}
           </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto w-full p-8 sm:p-12 flex-1">
         <div className="animate-in fade-in duration-700 slide-in-from-bottom-2">
            {children}
         </div>
      </main>

      {showLogoutModal && renderLogoutModal(confirmLogout, () => setShowLogoutModal(false), t.logout, isAr)}
    </div>
  );
};

const renderLogoutModal = (onConfirm: () => void, onCancel: () => void, label: string, isAr: boolean) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}></div>
    <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative z-10 animate-in zoom-in duration-200 text-center border border-slate-100">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-5">
        <i className="fas fa-power-off"></i>
      </div>
      <h3 className={`font-black text-slate-800 mb-1 uppercase tracking-tight ${isAr ? 'text-2xl' : 'text-xl'}`}>{label} ?</h3>
      <div className="flex flex-col gap-3 mt-8">
        <button 
          onClick={onConfirm}
          className={`w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all ${isAr ? 'text-sm' : 'text-xs'}`}
        >
          {isAr ? 'تأكيد' : 'Confirmer'}
        </button>
        <button 
          onClick={onCancel}
          className={`w-full py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-all ${isAr ? 'text-sm' : 'text-xs'}`}
        >
          {isAr ? 'إلغاء' : 'Annuler'}
        </button>
      </div>
    </div>
  </div>
);

export default Layout;
