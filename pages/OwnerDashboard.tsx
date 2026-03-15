
import React, { useState } from 'react';
import { Apartment, Expense, Payment, AssetPayment, ReminderLog, BuildingInfo } from '../types';
import { MONTHS } from '../constants';

interface OwnerDashboardProps {
   apartment: Apartment;
   expenses: Expense[];
   payments: Payment[];
   assetPayments: AssetPayment[];
   reminderHistory: ReminderLog[];
   buildingInfo: BuildingInfo;
   language?: 'fr' | 'ar';
}

const MONTHS_AR = [
   'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
   'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
];

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
   apartment, expenses, payments, assetPayments, reminderHistory, buildingInfo, language = 'fr'
}) => {
   const [activeSubTab, setActiveSubTab] = useState<'finance' | 'notifications'>('finance');

   const currentYear = new Date().getFullYear();
   const currentMonth = new Date().getMonth();
   const isAr = language === 'ar';

   const translations = {
      fr: {
         balanceTitle: 'Situation de la Trésorerie',
         balanceDesc: 'Visualisez l\'état des fonds collectés pour votre résidence.',
         transparency: 'Garantie de transparence',
         paymentsTitle: 'État des versements',
         paymentsDesc: 'Suivi mensuel de votre appartement',
         totalYear: 'Total versé cette année',
         registerTitle: 'Registre des d\u00e9penses',
         archiveTitle: 'Archives des Communications',
         noNotif: 'Aucune notification archivée.',
         statusPaid: 'Validé',
         statusWaiting: 'À venir',
         statusUnpaid: 'Impayé',
         dateLabel: 'Date d\'opération',
         descLabel: 'Description',
         amountLabel: 'Montant',
         months: MONTHS,
         overdueTitle: 'Mois en retard',
         overdueDesc: 'Vous avez des cotisations non régularisées',
         totalOverdue: 'Total restant dû',
         monthShort: 'Mois'
      },
      ar: {
         balanceTitle: 'حالة الخزينة',
         balanceDesc: 'اطلع على حالة الأموال المجموعة لإقامتكم.',
         transparency: 'ضمان الشفافية',
         paymentsTitle: 'حالة الدفعات',
         paymentsDesc: 'المتابعة الشهرية لشقتكم',
         totalYear: 'إجمالي المدفوعات لهذا العام',
         registerTitle: 'سجل المصاريف',
         archiveTitle: 'أرشيف المراسلات',
         noNotif: 'لا يوجد تنبيهات مؤرشفة.',
         statusPaid: 'مؤدى',
         statusWaiting: 'قادم',
         statusUnpaid: 'غير مؤدى',
         dateLabel: 'تاريخ العملية',
         descLabel: 'الوصف',
         amountLabel: 'المبلغ',
         months: MONTHS_AR,
         overdueTitle: 'أشهر متأخرة',
         overdueDesc: 'لديك مساهمات لم يتم تسويتها بعد',
         totalOverdue: 'إجمالي المتأخرات',
         monthShort: 'شهر'
      }
   };

   const t = translations[language];

   // Filtrage des données personnelles
   const myPayments = payments.filter(p => p.apartmentId === apartment.id && p.year === currentYear);
   const myNotifications = reminderHistory.filter(r => r.apartmentId === apartment.id);

   // Calcul des mois en retard
   const overdueMonths = [];
   for (let m = 0; m <= currentMonth; m++) {
      if (!myPayments.some(p => p.month === m)) {
         overdueMonths.push({
            index: m,
            name: t.months[m]
         });
      }
   }
   const totalOverdueAmount = overdueMonths.length * apartment.monthlyFee;

   // Calculs financiers globaux
   const totalAptRevenue = payments.reduce((s, p) => s + p.amount, 0);
   const totalAssetRevenue = assetPayments.reduce((s, p) => s + p.amount, 0);
   const totalExpenses = expenses.filter(e => !e.excludedFromReports).reduce((s, e) => s + e.amount, 0);
   const currentBalance = (totalAptRevenue + totalAssetRevenue) - totalExpenses;

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         {/* Header Statistique (Bannière Trésorerie) - Affichage Conditionnel */}
         {buildingInfo.ownerShowBalance && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl"><i className="fas fa-vault"></i></div>
               <div className="relative z-10 text-center md:text-left">
                  <p className={`font-black text-teal-400 uppercase tracking-[0.3em] mb-3 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.balanceTitle}</p>
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tighter flex items-baseline justify-center md:justify-start gap-2">
                     {currentBalance.toLocaleString()} <span className="text-xl font-bold text-slate-500">MAD</span>
                  </h2>
                  <p className={`mt-4 text-slate-400 font-medium max-w-xs ${isAr ? 'text-base' : 'text-xs'}`}>{t.balanceDesc}</p>
               </div>

               <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md max-w-sm text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                     <i className="fas fa-shield-check text-teal-400"></i>
                     <p className={`font-black uppercase tracking-widest text-teal-400 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.transparency}</p>
                  </div>
                  <p className={`text-slate-300 font-medium ${isAr ? 'text-base' : 'text-[11px]'}`}>{t.balanceDesc}</p>
               </div>
            </div>
         )}

         {/* Section Mois en Retard (Alerte Visuelle) */}
         {overdueMonths.length > 0 && activeSubTab === 'finance' && (
            <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-6 text-center md:text-left">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-rose-200 animate-pulse">
                     <i className="fas fa-clock-rotate-left"></i>
                  </div>
                  <div>
                     <h3 className={`font-black text-rose-900 ${isAr ? 'text-2xl' : 'text-xl'}`}>{t.overdueTitle}</h3>
                     <p className={`font-bold text-rose-600/70 uppercase tracking-widest mt-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.overdueDesc}</p>
                     <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                        {overdueMonths.map(m => (
                           <span key={m.index} className="px-3 py-1 bg-rose-200/50 text-rose-800 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-200">
                              {m.name}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="bg-white px-8 py-6 rounded-3xl border border-rose-200 text-center shadow-sm min-w-[200px]">
                  <p className={`font-black text-rose-500 uppercase tracking-widest mb-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.totalOverdue}</p>
                  <p className="text-3xl font-black text-rose-800">{totalOverdueAmount.toLocaleString()} <span className="text-sm font-bold uppercase">DH</span></p>
               </div>
            </div>
         )}

         {/* Tabs */}
         <div className="flex gap-2">
            <button onClick={() => setActiveSubTab('finance')} className={`flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${activeSubTab === 'finance' ? 'bg-teal-700 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'} ${isAr ? 'text-sm' : 'text-[11px]'}`}>
               {t.paymentsTitle}
            </button>
            <button onClick={() => setActiveSubTab('notifications')} className={`flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${activeSubTab === 'notifications' ? 'bg-teal-700 text-white shadow-lg' : 'text-slate-500 border border-slate-200'} ${isAr ? 'text-sm' : 'text-[11px]'}`}>
               {t.archiveTitle}
            </button>
         </div>

         {activeSubTab === 'finance' && (
            <div className="space-y-8">
               <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                     <div>
                        <h3 className={`font-black text-slate-800 tracking-tight uppercase ${isAr ? 'text-2xl' : 'text-xl'}`}>{t.paymentsTitle} {currentYear}</h3>
                        <p className={`text-slate-400 font-bold uppercase mt-1 ${isAr ? 'text-sm' : 'text-xs'}`}>{t.paymentsDesc}</p>
                     </div>
                     <div className="bg-teal-50 px-8 py-6 rounded-3xl border border-teal-100 text-center shadow-inner">
                        <p className={`font-black text-teal-600 uppercase tracking-widest mb-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.totalYear}</p>
                        <p className="text-3xl font-black text-teal-800">{myPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()} <span className="text-sm font-bold uppercase">DH</span></p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {t.months.map((month, idx) => {
                        const isPaid = myPayments.some(p => p.month === idx);
                        const isFuture = idx > currentMonth;
                        return (
                           <div key={month} className={`p-5 rounded-3xl border transition-all ${isPaid ? 'bg-teal-50 border-teal-200 shadow-sm' :
                                 isFuture ? 'bg-slate-50 border-slate-100 opacity-40' : 'bg-rose-50 border-rose-200 shadow-inner'
                              }`}>
                              <p className={`font-black text-slate-500 uppercase tracking-widest text-center mb-3 ${isAr ? 'text-base' : 'text-[10px]'}`}>{month}</p>
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm mx-auto ${isPaid ? 'bg-teal-600 text-white' :
                                    isFuture ? 'bg-slate-200 text-slate-400' : 'bg-rose-600 text-white'
                                 }`}>
                                 <i className={`fas ${isPaid ? 'fa-check' : isFuture ? 'fa-clock' : 'fa-triangle-exclamation'}`}></i>
                              </div>
                              <p className={`font-black uppercase text-center mt-3 ${isPaid ? 'text-teal-700' : isFuture ? 'text-slate-400' : 'text-rose-600'} ${isAr ? 'text-sm' : 'text-[10px]'}`}>
                                 {isPaid ? t.statusPaid : isFuture ? t.statusWaiting : t.statusUnpaid}
                              </p>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Registre des Dépenses - Affichage Conditionnel */}
               {buildingInfo.ownerShowExpenseRegister && (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                     <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                        <h3 className={`font-black text-slate-800 uppercase tracking-widest ${isAr ? 'text-base' : 'text-xs'}`}>{t.registerTitle}</h3>
                     </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50/50 border-b">
                                 <th className={`px-8 py-5 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-right text-sm' : 'text-left text-[10px]'}`}>{t.dateLabel}</th>
                                 <th className={`px-8 py-5 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-right text-sm' : 'text-left text-[10px]'}`}>{t.descLabel}</th>
                                 <th className={`px-8 py-5 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-left text-sm' : 'text-right text-[10px]'}`}>{t.amountLabel}</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {expenses.filter(e => !e.excludedFromReports).slice().reverse().slice(0, 10).map(e => (
                                 <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className={`px-8 py-6 text-slate-500 font-medium whitespace-nowrap ${isAr ? 'text-base' : 'text-xs'}`}>{new Date(e.date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')}</td>
                                    <td className="px-8 py-6">
                                       <p className={`font-bold text-slate-800 leading-snug ${isAr ? 'text-base' : 'text-sm'}`}>{e.description}</p>
                                       <p className={`font-black text-teal-600 uppercase mt-1 ${isAr ? 'text-xs' : 'text-[9px]'}`}>{e.category}</p>
                                    </td>
                                    <td className={`px-8 py-6 font-black text-slate-800 whitespace-nowrap ${isAr ? 'text-left text-base' : 'text-right text-sm'}`}>-{e.amount.toLocaleString()} <span className="text-[10px] opacity-40">MAD</span></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         )}

         {activeSubTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               {myNotifications.length > 0 ? myNotifications.slice().reverse().map(note => (
                  <div key={note.id} className="p-6 bg-white rounded-[2rem] border border-slate-200 flex items-center gap-6 shadow-sm">
                     <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl"><i className="fas fa-bell"></i></div>
                     <div className="flex-1">
                        <p className={`font-black text-slate-800 ${isAr ? 'text-lg' : 'text-sm'}`}>{note.type === 'simple' ? 'Rappel standard' : 'Détail impayés'}</p>
                        <p className={`font-bold text-slate-400 uppercase tracking-widest mt-1 ${isAr ? 'text-xs' : 'text-[10px]'}`}>{new Date(note.date).toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-FR')}</p>
                     </div>
                     <span className={`px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-black uppercase tracking-widest ${isAr ? 'text-xs' : 'text-[10px]'}`}>OK</span>
                  </div>
               )) : (
                  <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                     <p className={`font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-base' : 'text-sm'}`}>{t.noNotif}</p>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default OwnerDashboard;
