import React, { useState, useMemo } from 'react';
import { Apartment, BuildingInfo, Payment, ReminderLog } from '../types';
import { generateWhatsAppReminderLink, generateDetailedWhatsAppReminder, DEFAULT_TEMPLATES } from '../utils/whatsappUtils';
import { MONTHS } from '../constants';

interface ReminderCenterProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onUpdateBuilding: (info: BuildingInfo) => void;
  reminderHistory: ReminderLog[];
  onAddReminderLog: (log: ReminderLog) => void;
  onClearHistory?: () => void;
}

const ReminderCenter: React.FC<ReminderCenterProps> = ({ 
  apartments, 
  payments, 
  buildingInfo, 
  onUpdateBuilding,
  reminderHistory,
  onAddReminderLog,
  onClearHistory
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<'send' | 'config' | 'history'>('send');
  const [searchTerm, setSearchTerm] = useState('');

  const unpaidApartments = useMemo(() => {
    return apartments.filter(apt => 
      !payments.some(p => p.apartmentId === apt.id && p.month === selectedMonth && p.year === selectedYear)
    );
  }, [apartments, payments, selectedMonth, selectedYear]);

  const filteredUnpaid = useMemo(() => {
    return unpaidApartments.filter(apt => 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unpaidApartments, searchTerm]);

  /**
   * Logique intelligente : décide d'envoyer un rappel simple ou détaillé
   */
  const handleSmartReminder = (apt: Apartment) => {
    const aptPayments = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear);
    
    // Compter les mois impayés jusqu'au mois sélectionné inclus
    let unpaidCount = 0;
    for (let m = 0; m <= selectedMonth; m++) {
      if (!aptPayments.some(p => p.month === m)) {
        unpaidCount++;
      }
    }

    let url: string | null = null;
    let type: 'simple' | 'detailed' = 'simple';

    if (unpaidCount > 1) {
      // Plusieurs mois impayés -> Rappel détaillé
      url = generateDetailedWhatsAppReminder(apt, buildingInfo, selectedMonth, selectedYear, payments);
      type = 'detailed';
    } else {
      // Un seul mois impayé -> Rappel simple
      url = generateWhatsAppReminderLink(apt, buildingInfo, false);
      type = 'simple';
    }

    if (url) {
      onAddReminderLog({
        id: Date.now().toString(),
        apartmentId: apt.id,
        apartmentNumber: apt.number,
        ownerName: apt.owner,
        date: new Date().toISOString(),
        type
      });
      window.open(url, '_blank');
    }
  };

  const getUnpaidCountForApt = (aptId: string) => {
    const aptPayments = payments.filter(p => p.apartmentId === aptId && p.year === selectedYear);
    let count = 0;
    for (let m = 0; m <= selectedMonth; m++) {
      if (!aptPayments.some(p => p.month === m)) count++;
    }
    return count;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impayés {MONTHS[selectedMonth]}</p>
          <p className="text-2xl font-black text-red-500">{unpaidApartments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Relances Journée</p>
          <p className="text-2xl font-black text-indigo-600">
            {reminderHistory.filter(l => l.date.startsWith(new Date().toISOString().split('T')[0])).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Appartements</p>
          <p className="text-2xl font-black text-slate-800">{apartments.length}</p>
        </div>
      </div>

      {/* NAVIGATION INTERNE */}
      <div className="py-2">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200">
          <button onClick={() => setActiveTab('send')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'send' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <i className="fas fa-paper-plane mr-2"></i> Envoyer Rappels
          </button>
          <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <i className="fas fa-cog mr-2"></i> Configuration
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <i className="fas fa-history mr-2"></i> Historique
          </button>
        </div>
      </div>

      {activeTab === 'send' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar gap-1">
              {MONTHS.map((m, idx) => (
                <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-4 py-2.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${selectedMonth === idx ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Rechercher par appartement ou nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filteredUnpaid.length > 0 ? filteredUnpaid.map(apt => {
                const unpaidCount = getUnpaidCountForApt(apt.id);
                return (
                  <div key={apt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                        {apt.number}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{apt.owner}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{apt.phone || 'Pas de téléphone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {unpaidCount > 1 && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {unpaidCount} mois impayés
                        </span>
                      )}
                      {apt.phone ? (
                        <button 
                          onClick={() => handleSmartReminder(apt)} 
                          className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg shadow-emerald-100"
                        >
                          <i className="fab fa-whatsapp text-sm"></i> 
                          Envoyer Rappel {unpaidCount > 1 ? 'Détaillé' : 'Simple'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100">TELEPHONE MANQUANT</span>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fas fa-check-double"></i>
                  </div>
                  <h4 className="font-black text-slate-400 text-sm">Zéro impayé pour {MONTHS[selectedMonth]} !</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-xl font-black text-slate-800">Configuration des Messages</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl border">
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'ar'})} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${buildingInfo.reminderLanguage === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>العربية</button>
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'fr'})} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${buildingInfo.reminderLanguage === 'fr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>FRANÇAIS</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rappel Simple (Mois en cours)</label>
                   <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">Si 1 mois dû</span>
                </div>
                <textarea rows={8} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} value={buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].simple} onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappTemplate: e.target.value})} className="w-full p-6 border rounded-3xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all leading-relaxed shadow-inner" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rappel Détaillé (Impayés cumulés)</label>
                   <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase">Si &gt; 1 mois dû</span>
                </div>
                <textarea rows={8} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} value={buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].detailed} onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappDetailedTemplate: e.target.value})} className="w-full p-6 border rounded-3xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all leading-relaxed shadow-inner" />
              </div>
           </div>
           
           <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <i className="fas fa-info-circle"></i> Variables disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                 {['{propriétaire}', '{immeuble}', '{mois}', '{annee}', '{montant}', '{appartement}', '{details}', '{nb_mois}', '{total_du}'].map(v => (
                   <code key={v} className="bg-white px-2 py-1 rounded border text-[10px] font-bold text-slate-600">{v}</code>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
           <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Journal des envois</h3>
              <button onClick={() => { if(confirm("Vider l'historique ?")) onClearHistory?.(); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">Vider tout</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 border-b">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Appartement</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Propriétaire</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Méthode</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {reminderHistory.length > 0 ? [...reminderHistory].reverse().map(log => (
                    <tr key={log.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 text-slate-500 font-medium">{new Date(log.date).toLocaleString('fr-FR')}</td>
                      <td className="px-8 py-5"><span className="font-black text-indigo-600">{log.apartmentNumber}</span></td>
                      <td className="px-8 py-5 font-bold text-slate-700">{log.ownerName}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.type === 'simple' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{log.type === 'simple' ? 'Rappel standard' : 'Détail impayés'}</span>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">Aucun envoi dans l'historique.</td></tr>)}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCenter;