
import React, { useState, useMemo } from 'react';
import { Apartment, Expense, Payment, AssetPayment, BuildingInfo } from '../types';
import { exportAnnualReportPDF, exportCashStatePDF } from '../utils/pdfUtils';
import { MONTHS } from '../constants';

interface ReportsProps {
  apartments: Apartment[];
  expenses: Expense[];
  payments: Payment[];
  assetPayments: AssetPayment[];
  buildingInfo: BuildingInfo;
}

const Reports: React.FC<ReportsProps> = ({ apartments, expenses, payments, assetPayments, buildingInfo }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const calculateAnnualMetrics = (year: number) => {
    // Recettes résidents
    const yearPayments = payments.filter(p => p.year === year);
    const totalAptRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recettes biens (Revenus divers)
    const yearAssetPayments = assetPayments.filter(p => p.year === year);
    const totalAssetRevenue = yearAssetPayments.reduce((sum, p) => sum + p.amount, 0);

    // Dépenses
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year && !e.excludedFromReports);
    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const totalRevenue = totalAptRevenue + totalAssetRevenue;
    
    // Calcul taux (uniquement sur cotisations car revenus biens sont souvent contractuels variables)
    const expectedAptRevenue = apartments.reduce((sum, a) => sum + a.monthlyFee, 0) * 12;
    const collectionRate = expectedAptRevenue > 0 ? (totalAptRevenue / expectedAptRevenue) * 100 : 0;

    return { totalAptRevenue, totalAssetRevenue, totalRevenue, totalExpenses, balance: totalRevenue - totalExpenses, collectionRate };
  };

  const handleExportAnnualReport = () => {
    const metrics = calculateAnnualMetrics(selectedYear);
    const unpaidList = apartments.map(apt => {
      const aptPayments = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear);
      const paidCount = aptPayments.length;
      const unpaidCount = 12 - paidCount;
      return {
        number: apt.number,
        owner: apt.owner,
        unpaidCount,
        totalOwed: unpaidCount * apt.monthlyFee
      };
    }).filter(item => item.unpaidCount > 0);

    const categories = expenses
      .filter(e => new Date(e.date).getFullYear() === selectedYear && !e.excludedFromReports)
      .reduce((acc: Record<string, number>, e: Expense) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalExp = (Object.values(categories) as number[]).reduce((a: number, b: number) => a + b, 0);
    const expenseBreakdown = (Object.entries(categories) as [string, number][]).map(([name, value]) => ({
      name,
      value,
      percentage: totalExp > 0 ? (value / totalExp) * 100 : 0
    }));

    // On prépare un résumé des revenus pour le PDF
    const revenueSummary = [
      { name: 'Cotisations Résidents', value: metrics.totalAptRevenue },
      { name: 'Revenus des Biens', value: metrics.totalAssetRevenue }
    ];

    exportAnnualReportPDF(buildingInfo.name, selectedYear, metrics, unpaidList, expenseBreakdown, revenueSummary);
  };

  const handleExportCashState = () => {
    const metrics = calculateAnnualMetrics(selectedYear);
    const totalAptRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAssetRevenue = assetPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.filter(e => !e.excludedFromReports).reduce((sum, e) => sum + e.amount, 0);
    
    const summary = { totalRevenue: totalAptRevenue + totalAssetRevenue, totalExpenses, balance: (totalAptRevenue + totalAssetRevenue) - totalExpenses };

    const allTransactions = [
      ...payments.map(p => {
        const apt = apartments.find(a => a.id === p.apartmentId);
        return {
          date: new Date(p.paidDate).toLocaleDateString('fr-FR'),
          rawDate: new Date(p.paidDate),
          type: 'COTISATION',
          description: `${MONTHS[p.month]} ${p.year} - Appt ${apt?.number || '?'}`,
          amount: `+${p.amount} DH`,
          isExpense: false
        };
      }),
      ...assetPayments.map(ap => ({
          date: new Date(ap.date).toLocaleDateString('fr-FR'),
          rawDate: new Date(ap.date),
          type: 'REVENU BIEN',
          description: `Revenu: ${ap.period}`,
          amount: `+${ap.amount} DH`,
          isExpense: false
      })),
      ...expenses.map(e => ({
        date: new Date(e.date).toLocaleDateString('fr-FR'),
        rawDate: new Date(e.date),
        type: 'DÉPENSE',
        description: e.excludedFromReports ? `(EXCLU) ${e.description}` : e.description,
        amount: `-${e.amount} DH`,
        isExpense: true
      }))
    ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 50);

    exportCashStatePDF(buildingInfo.name, summary, allTransactions);
  };

  const metrics = calculateAnnualMetrics(selectedYear);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bilans & Rapports</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Consolidation annuelle des flux de trésorerie</p>
          <div className="flex gap-2 mt-4">
            {[2024, 2025, 2026].map(y => (
              <button 
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${selectedYear === y ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={handleExportCashState}
            className="flex-1 lg:flex-none bg-slate-800 text-white px-8 py-4 rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl font-black text-[10px] uppercase tracking-widest"
          >
            <i className="fas fa-money-bill-transfer"></i> État de Caisse
          </button>
          
          <button 
            onClick={handleExportAnnualReport}
            className="flex-1 lg:flex-none bg-rose-600 text-white px-8 py-4 rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl font-black text-[10px] uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i> Générer Bilan Annuel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
               <h3 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm"><i className="fas fa-chart-line"></i></div>
                  Performance Financière {selectedYear}
               </h3>
               <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Consolidé</span>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détail des Recettes</p>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                             <span className="text-xs font-bold text-slate-600">Cotisations Résidents</span>
                          </div>
                          <span className="font-black text-slate-800">+{metrics.totalAptRevenue.toLocaleString()} DH</span>
                       </div>
                       <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-xs font-bold text-slate-600">Revenus des Biens</span>
                          </div>
                          <span className="font-black text-slate-800">+{metrics.totalAssetRevenue.toLocaleString()} DH</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détail des Sorties</p>
                    <div className="flex justify-between items-center bg-rose-50/50 p-4 rounded-2xl border border-rose-100 h-full">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><i className="fas fa-receipt"></i></div>
                          <div>
                             <span className="text-xs font-bold text-slate-600 block">Dépenses Cumulées</span>
                             <span className="text-[9px] text-rose-400 font-bold uppercase">Factures incluses</span>
                          </div>
                       </div>
                       <span className="font-black text-rose-600">-{metrics.totalExpenses.toLocaleString()} DH</span>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Résultat Net {selectedYear}</p>
                   <p className={`text-4xl font-black ${metrics.balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                     {metrics.balance.toLocaleString()} <span className="text-sm">DH</span>
                   </p>
                </div>
                <div className="w-full sm:w-64 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Recouvrement Cotis.</span>
                      <span className="text-indigo-600">{metrics.collectionRate.toFixed(1)}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-1000" 
                        style={{ width: `${Math.min(metrics.collectionRate, 100)}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between h-full relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl"><i className="fas fa-file-contract"></i></div>
             <div className="relative z-10">
                <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                   <i className="fas fa-circle-info text-indigo-400"></i>
                   Info Gestion
                </h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Ce rapport consolide l'ensemble des entrées (Cotisations + Revenus patrimoniaux) et soustrait les dépenses validées.
                </p>
                <div className="mt-8 space-y-4">
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      <i className="fas fa-check-circle"></i> Optimisé pour AG
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      <i className="fas fa-check-circle"></i> Conforme comptabilité locale
                   </div>
                </div>
             </div>
             <div className="relative z-10 pt-8 mt-8 border-t border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
