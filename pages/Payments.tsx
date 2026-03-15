
import React, { useState, useMemo } from 'react';
import { Apartment, Payment, BuildingInfo, BuildingAsset, AssetPayment } from '../types';
import { MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';

interface PaymentsProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onTogglePayment: (aptId: string, month: number, year: number) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  assets: BuildingAsset[];
  assetPayments: AssetPayment[];
  onAddAssetPayment: (pay: AssetPayment) => void;
  onDeleteAssetPayment: (id: string) => void;
}

const Payments: React.FC<PaymentsProps> = ({ 
  apartments, payments, buildingInfo, onTogglePayment, onNotify,
  assets, assetPayments, onAddAssetPayment, onDeleteAssetPayment
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<'apartments' | 'assets'>('apartments');
  const [viewMode, setViewMode] = useState<'apartment' | 'monthly'>('apartment');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAssetPayModal, setShowAssetPayModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<BuildingAsset | null>(null);
  const [assetPayForm, setAssetPayForm] = useState({
    amount: 0, date: new Date().toISOString().split('T')[0], month: new Date().getMonth(), year: new Date().getFullYear()
  });

  const years = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
  }, [currentYear]);

  const isPaid = (aptId: string, month: number) => {
    return payments.some(p => p.apartmentId === aptId && p.month === month && p.year === selectedYear);
  };

  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apartments, searchTerm]);

  const stats = useMemo(() => {
    if (activeTab === 'apartments') {
      if (viewMode === 'monthly') {
        const expected = apartments.reduce((sum, a) => sum + a.monthlyFee, 0);
        const collected = payments
          .filter(p => p.month === selectedMonth && p.year === selectedYear)
          .reduce((sum, p) => sum + p.amount, 0);
        return { expected, collected, remaining: expected - collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
      } else {
        const expected = apartments.reduce((sum, a) => sum + a.monthlyFee, 0) * 12;
        const collected = payments
          .filter(p => p.year === selectedYear)
          .reduce((sum, p) => sum + p.amount, 0);
        return { expected, collected, remaining: expected - collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
      }
    } else {
      const expected = assets.reduce((sum, a) => sum + (a.frequency === 'monthly' ? a.incomeAmount * 12 : a.incomeAmount), 0);
      const collected = assetPayments
        .filter(p => p.year === selectedYear)
        .reduce((sum, p) => sum + p.amount, 0);
      return { expected, collected, remaining: expected - collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
    }
  }, [apartments, payments, selectedMonth, selectedYear, viewMode, activeTab, assets, assetPayments]);

  const handleMarkAllPaid = () => {
    if (confirm(`Marquer tous les appartements (${filteredApartments.length}) comme payés pour ${MONTHS[selectedMonth]} ?`)) {
      filteredApartments.forEach(apt => {
        if (!isPaid(apt.id, selectedMonth)) {
          onTogglePayment(apt.id, selectedMonth, selectedYear);
        }
      });
      onNotify?.(`${filteredApartments.length} paiements validés pour ${MONTHS[selectedMonth]}`);
    }
  };

  const handleSaveAssetPayment = () => {
    if (!selectedAsset) return;

    // --- CONTRÔLES LOGIQUES ---
    const isMonthly = selectedAsset.frequency === 'monthly';
    const periodLabel = isMonthly ? `${MONTHS[assetPayForm.month]} ${assetPayForm.year}` : `Année ${assetPayForm.year}`;

    // Vérifier si cette période est déjà payée
    const alreadyPaid = assetPayments.some(p => {
      const sameAsset = p.assetId === selectedAsset.id;
      if (!sameAsset) return false;
      
      if (isMonthly) {
        // Pour le mensuel : vérifier le mois ET l'année exacts via le libellé de période
        return p.period === periodLabel;
      } else {
        // Pour l'annuel : vérifier simplement l'année
        return p.year === assetPayForm.year;
      }
    });

    if (alreadyPaid) {
      onNotify?.(`Erreur : Un encaissement a déjà été enregistré pour ${periodLabel}.`, "error");
      return;
    }

    if (assetPayForm.amount <= 0) {
      onNotify?.("Veuillez saisir un montant valide.", "error");
      return;
    }

    onAddAssetPayment({
      id: Date.now().toString(),
      assetId: selectedAsset.id,
      amount: assetPayForm.amount,
      date: assetPayForm.date,
      period: periodLabel,
      year: assetPayForm.year
    });
    
    setShowAssetPayModal(false);
    onNotify?.("Encaissement validé avec succès.");
  };

  const handleExportPDF = () => {
    onNotify?.("Génération du PDF...", "info");
    if (activeTab === 'apartments') {
      if (viewMode === 'apartment') {
        const headers = ['Appartement', 'Propriétaire', ...MONTHS.map(m => m.substring(0, 3))];
        const rows = filteredApartments.map(apt => [
          apt.number,
          apt.owner,
          ...MONTHS.map((_, idx) => isPaid(apt.id, idx) ? 'OK' : '-')
        ]);
        exportToPDF(`Suivi Cotisations ${selectedYear}`, headers, rows, `cotisations_${selectedYear}`);
      } else {
        const headers = ['Appartement', 'Propriétaire', 'Statut', 'Montant'];
        const rows = filteredApartments.map(apt => [
          apt.number,
          apt.owner,
          isPaid(apt.id, selectedMonth) ? 'PAYÉ' : 'ATTENTE',
          `${apt.monthlyFee} DH`
        ]);
        exportToPDF(`Cotisations ${MONTHS[selectedMonth]} ${selectedYear}`, headers, rows, `cotis_${MONTHS[selectedMonth]}_${selectedYear}`);
      }
    } else {
      const headers = ['Date', 'Bien', 'Période', 'Montant'];
      const rows = assetPayments.filter(p => p.year === selectedYear).map(p => {
        const asset = assets.find(a => a.id === p.assetId);
        return [new Date(p.date).toLocaleDateString(), asset?.name || '?', p.period, `${p.amount} DH`];
      });
      exportToPDF(`Revenus des Biens ${selectedYear}`, headers, rows, `revenus_biens_${selectedYear}`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm w-fit">
         <button 
           onClick={() => setActiveTab('apartments')} 
           className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'apartments' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <i className="fas fa-users-gear"></i> Cotisations Résidents
         </button>
         <button 
           onClick={() => setActiveTab('assets')} 
           className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'assets' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <i className="fas fa-tower-broadcast"></i> Revenus des Biens
         </button>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="space-y-4 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === 'apartments' ? 'Encaissements Cotisations' : 'Encaissements Divers'}
            </h2>
            <div className="flex bg-slate-200 p-1.5 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto no-scrollbar">
              {years.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedYear === y ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          
          {activeTab === 'apartments' && (
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative w-full sm:w-80">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="text" placeholder="Rechercher appartement ou propriétaire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all" />
               </div>
               <div className="bg-slate-200/50 p-1.5 rounded-2xl flex self-start border border-slate-200 shadow-inner">
                  <button onClick={() => setViewMode('apartment')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'apartment' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>
                    <i className="fas fa-table-cells"></i> Annuel
                  </button>
                  <button onClick={() => setViewMode('monthly')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'monthly' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>
                    <i className="fas fa-calendar-day"></i> Mensuel
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full xl:w-auto">
          {activeTab === 'apartments' && viewMode === 'monthly' && (
            <button 
              onClick={handleMarkAllPaid}
              className="flex-1 xl:flex-none bg-green-50 text-green-700 border border-green-200 px-6 py-3.5 rounded-2xl hover:bg-green-100 transition-all text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              <i className="fas fa-check-double"></i> Tout Payer
            </button>
          )}
          <button onClick={handleExportPDF} className="flex-1 xl:flex-none bg-slate-800 text-white px-6 py-3.5 rounded-2xl hover:bg-slate-900 transition-all text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl">
            <i className="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendu ({selectedYear})</p>
           <p className="text-xl font-black text-slate-800">{stats.expected.toLocaleString()} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encaissé</p>
           <p className={`text-xl font-black ${activeTab === 'apartments' ? 'text-indigo-600' : 'text-emerald-600'}`}>{stats.collected.toLocaleString()} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à percevoir</p>
           <p className="text-xl font-black text-rose-500">{stats.remaining > 0 ? stats.remaining.toLocaleString() : 0} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
           <div className="flex justify-between items-center mb-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux Recouvrement</p>
             <span className={`text-xs font-black ${activeTab === 'apartments' ? 'text-indigo-600' : 'text-emerald-600'}`}>{stats.rate.toFixed(0)}%</span>
           </div>
           <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
             <div className={`h-full transition-all duration-1000 ${activeTab === 'apartments' ? 'bg-indigo-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(stats.rate, 100)}%` }}></div>
           </div>
        </div>
      </div>

      {activeTab === 'apartments' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           {viewMode === 'monthly' && (
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-1.5 overflow-x-auto no-scrollbar">
              {MONTHS.map((m, idx) => (
                <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${selectedMonth === idx ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              {viewMode === 'apartment' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-20 shadow-sm min-w-[160px]">Appartement</th>
                      {MONTHS.map((m) => (
                        <th key={m} className="px-3 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center min-w-[70px]">{m.substring(0, 3)}</th>
                      ))}
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center bg-slate-50 sticky right-0 z-20">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredApartments.map((apt) => {
                      const paidInYear = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear).length;
                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r shadow-sm transition-colors">
                            <div className="flex flex-col">
                              <span className="font-black text-indigo-600 text-sm leading-tight">{apt.number}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{apt.owner}</span>
                            </div>
                          </td>
                          {MONTHS.map((_, idx) => (
                            <td key={idx} className="px-1 py-5 text-center">
                              <button onClick={() => onTogglePayment(apt.id, idx, selectedYear)} className={`w-10 h-10 rounded-2xl transition-all flex items-center justify-center mx-auto border-2 ${isPaid(apt.id, idx) ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-200 hover:border-indigo-300 hover:text-indigo-400'}`}>
                                <i className={`fas ${isPaid(apt.id, idx) ? 'fa-check text-xs' : 'fa-minus text-[10px]'}`}></i>
                              </button>
                            </td>
                          ))}
                          <td className="px-8 py-5 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l shadow-sm transition-colors">
                            <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl ${paidInYear === 12 ? 'bg-green-100 text-green-700' : paidInYear > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                              {paidInYear}/12
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Appartement</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Propriétaire</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Statut</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Cotisation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredApartments.map((apt) => {
                      const paid = isPaid(apt.id, selectedMonth);
                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-8 py-5 font-black text-indigo-600">{apt.number}</td>
                          <td className="px-8 py-5 font-bold text-slate-700">{apt.owner}</td>
                          <td className="px-8 py-5 text-center">
                            <button onClick={() => onTogglePayment(apt.id, selectedMonth, selectedYear)} className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black transition-all border-2 ${paid ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}>
                              <i className={`fas ${paid ? 'fa-check-circle' : 'fa-clock'}`}></i>
                              {paid ? 'PAYÉ' : 'EN ATTENTE'}
                            </button>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-800">{apt.monthlyFee.toLocaleString()} DH</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => {
                const isPaidThisPeriod = assetPayments.some(p => p.assetId === asset.id && p.year === selectedYear && (asset.frequency === 'yearly' || p.period.includes(MONTHS[new Date().getMonth()])));
                
                return (
                  <div key={asset.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                     <div className="space-y-4">
                        <div className="flex justify-between items-start">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${asset.category === 'telecom' ? 'bg-blue-50 text-blue-600' : asset.category === 'rent' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                              <i className={`fas ${asset.category === 'telecom' ? 'fa-tower-broadcast' : asset.category === 'rent' ? 'fa-house-chimney-user' : 'fa-box'}`}></i>
                           </div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{asset.frequency}</span>
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{asset.name}</h4>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-1">{asset.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                           <p className="font-black text-slate-800 text-sm">{asset.incomeAmount.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">DH</span></p>
                           {isPaidThisPeriod ? (
                             <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2"><i className="fas fa-check-circle"></i> À jour</span>
                           ) : (
                             <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2 animate-pulse"><i className="fas fa-clock"></i> En attente</span>
                           )}
                        </div>
                     </div>
                     <button 
                       onClick={() => { setSelectedAsset(asset); setAssetPayForm({...assetPayForm, amount: asset.incomeAmount, year: selectedYear, month: new Date().getMonth()}); setShowAssetPayModal(true); }}
                       className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                     >
                       <i className="fas fa-sack-dollar"></i> Encaisser Revenu
                     </button>
                  </div>
                );
              })}
              {assets.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucun bien configuré.</p>
                </div>
              )}
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Journal des Revenus Divers ({selectedYear})</h3>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/30 border-b">
                         <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                         <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Bien</th>
                         <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Période</th>
                         <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                         <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {assetPayments.filter(p => p.year === selectedYear).slice().reverse().map(pay => {
                        const asset = assets.find(a => a.id === pay.assetId);
                        return (
                          <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 text-xs font-bold text-slate-500">{new Date(pay.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-8 py-4 font-black text-slate-800 text-sm">{asset?.name || 'Inconnu'}</td>
                            <td className="px-8 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{pay.period}</span></td>
                            <td className="px-8 py-4 font-black text-emerald-600 text-sm">+{pay.amount.toLocaleString()} DH</td>
                            <td className="px-8 py-4 text-right">
                               <button onClick={() => { if(confirm("Supprimer cet encaissement ?")) onDeleteAssetPayment(pay.id); }} className="text-slate-300 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                            </td>
                          </tr>
                        );
                      })}
                      {assetPayments.filter(p => p.year === selectedYear).length === 0 && (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-300 font-bold italic text-xs">Aucun encaissement pour {selectedYear}.</td></tr>
                      )}
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {showAssetPayModal && selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
             <div className="p-10 space-y-8">
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner"><i className="fas fa-wallet"></i></div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">Nouvel Encaissement</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedAsset.name}</p>
                </div>
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      {selectedAsset.frequency === 'monthly' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mois Concerné</label>
                          <select className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={assetPayForm.month} onChange={e => setAssetPayForm({...assetPayForm, month: parseInt(e.target.value)})}>
                             {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année</label>
                        <input type="number" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none" value={assetPayForm.year} onChange={e => setAssetPayForm({...assetPayForm, year: parseInt(e.target.value)})} />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant Encaissé (DH)</label>
                      <input type="number" className="w-full px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-700 text-xl outline-none" value={assetPayForm.amount} onChange={e => setAssetPayForm({...assetPayForm, amount: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'encaissement</label>
                      <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={assetPayForm.date} onChange={e => setAssetPayForm({...assetPayForm, date: e.target.value})} />
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                   <button onClick={handleSaveAssetPayment} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Confirmer l'encaissement</button>
                   <button onClick={() => setShowAssetPayModal(false)} className="w-full py-2 text-slate-400 font-black hover:text-slate-600 uppercase tracking-widest text-[9px]">Annuler</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
