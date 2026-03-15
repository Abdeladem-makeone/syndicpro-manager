
import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: ExpenseCategory.OTHER,
    description: '',
    amount: 0,
    excludedFromReports: false,
  });

  const years = useMemo(() => {
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, [currentYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'all' || d.getMonth() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    Object.values(ExpenseCategory).forEach(cat => {
      dataMap[cat] = 0;
    });

    filteredExpenses.forEach(e => {
      if (!e.excludedFromReports) {
        dataMap[e.category] += e.amount;
      }
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredExpenses]);

  const handleSave = () => {
    if (!formData.description || !formData.amount || formData.amount <= 0) {
      alert("Veuillez remplir correctement la description et le montant.");
      return;
    }

    const newExpense = { 
      ...formData, 
      id: Date.now().toString() 
    } as Expense;
    
    onAdd(newExpense);
    setShowModal(false);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: ExpenseCategory.OTHER,
      description: '',
      amount: 0,
      excludedFromReports: false,
    });
  };

  const handleToggleExclude = (expense: Expense) => {
    onUpdate({ ...expense, excludedFromReports: !expense.excludedFromReports });
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant', 'Statut'];
    const rows = filteredExpenses.map(exp => [
      new Date(exp.date).toLocaleDateString('fr-FR'),
      exp.category,
      exp.description,
      `${exp.amount.toFixed(2)} DH`,
      exp.excludedFromReports ? 'EXCLU' : 'INCLUS'
    ]);
    const periodStr = selectedMonth === 'all' ? `Année ${selectedYear}` : `${MONTHS[selectedMonth as number]} ${selectedYear}`;
    exportToPDF(`Dépenses - ${periodStr}`, headers, rows, `depenses_${periodStr.replace(/\s+/g, '_')}`);
  };

  const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Dépenses</h2>
          <p className="text-slate-500">Suivez et analysez les coûts de la copropriété.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-red-200 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-pdf"></i> Exporter PDF
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fas fa-plus"></i> Nouvelle dépense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-chart-bar text-indigo-500"></i> Répartition par Catégorie
            </h3>
            <div className="flex gap-2">
               <select 
                 className="text-xs border rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium"
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               >
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <select 
                 className="text-xs border rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
               >
                 <option value="all">Toute l'année</option>
                 {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
               </select>
            </div>
          </div>
          
          <div className="h-64 w-full relative min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                <p className="text-sm">Aucune donnée</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-center min-w-0">
           <h4 className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Période</h4>
           <p className="text-3xl font-black mb-4">
             {filteredExpenses.filter(e => !e.excludedFromReports).reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-lg">DH</span>
           </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Bilans</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Catégorie</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-slate-50 transition-colors ${expense.excludedFromReports ? 'bg-slate-50 opacity-75' : ''}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={!expense.excludedFromReports} onChange={() => handleToggleExclude(expense)} className="w-4 h-4 text-indigo-600 rounded" />
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(expense.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${CATEGORY_COLORS[expense.category]}`}>{expense.category}</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{expense.description}</td>
                  <td className="px-6 py-4 font-black text-red-600 text-sm">-{expense.amount.toFixed(2)} DH</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDelete(expense.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREATION DE DEPENSE CORRIGÉ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 sm:p-10 space-y-6 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800">Nouvelle Dépense</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation / Objet</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Ex: Facture électricité communs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (DH)</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(ExpenseCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="exclude"
                  checked={formData.excludedFromReports}
                  onChange={(e) => setFormData({...formData, excludedFromReports: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded-lg"
                />
                <label htmlFor="exclude" className="text-xs font-bold text-slate-600">Exclure cette dépense du bilan financier</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-xs font-black text-slate-400 hover:bg-slate-50 rounded-2xl border transition-all uppercase tracking-widest"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
