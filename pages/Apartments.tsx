
import React, { useState } from 'react';
import { Apartment, Payment, BuildingInfo } from '../types';
import { exportToPDF } from '../utils/pdfUtils';

interface ApartmentsProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onUpdate: (apartment: Apartment) => void;
  onAdd: (apartment: Apartment) => void;
  onDelete: (id: string) => void;
}

type SortField = 'number' | 'owner' | 'monthlyFee';
type SortOrder = 'asc' | 'desc';

const Apartments: React.FC<ApartmentsProps> = ({ 
  apartments, payments, buildingInfo, onUpdate, onAdd, onDelete 
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const currentYear = new Date().getFullYear();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedApartments = [...apartments].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'number') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const handleEditClick = (apt: Apartment) => {
    setIsEditing(apt.id);
    setFormData(apt);
  };

  const handleSave = () => {
    if (isEditing) {
      onUpdate(formData as Apartment);
      setIsEditing(null);
    } else {
      const newApt = { ...formData, id: Date.now().toString() } as Apartment;
      onAdd(newApt);
      setShowAddModal(false);
    }
    setFormData({});
  };

  const getPaidMonthsCount = (aptId: string) => {
    return payments.filter(p => p.apartmentId === aptId && p.year === currentYear).length;
  };

  const handleExportPDF = () => {
    const headers = ['Appartement', 'Propriétaire', 'Étage', 'Mois Payés', 'Cotisation'];
    const rows = sortedApartments.map(apt => [
      apt.number,
      apt.owner,
      apt.floor,
      `${getPaidMonthsCount(apt.id)} / 12`,
      `${apt.monthlyFee} DH`
    ]);
    exportToPDF('Liste des Appartements et Propriétaires', headers, rows, 'liste_apartements');
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <i className="fas fa-sort ml-1 text-slate-300"></i>;
    return <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-indigo-600`}></i>;
  };

  return (
    <div className="space-y-10 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-widest">Gestion du Parc</h2>
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Configuration technique des appartements</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-red-100 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button 
            onClick={() => { setShowAddModal(true); setFormData({}); }}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 text-[10px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-plus"></i> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('number')}
                >
                  Appartement <SortIndicator field="number" />
                </th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('owner')}
                >
                  Propriétaire <SortIndicator field="owner" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Paiements {currentYear}</th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('monthlyFee')}
                >
                  Cotisation <SortIndicator field="monthlyFee" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedApartments.map((apt) => {
                const paidCount = getPaidMonthsCount(apt.id);
                
                return (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 font-black text-indigo-600">{apt.number}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{apt.owner}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{apt.floor === 0 ? 'RDC' : `${apt.floor}ème étage`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${
                        paidCount === 12 
                        ? 'bg-green-100 text-green-700' 
                        : paidCount > 0 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {paidCount} / 12
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-800 text-sm whitespace-nowrap">{apt.monthlyFee.toLocaleString()} DH</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(apt)}
                          className="w-9 h-9 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => { if(confirm('Supprimer cet appartement ?')) onDelete(apt.id); }}
                          className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedApartments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <i className="fas fa-building text-3xl"></i>
                    </div>
                    <p className="text-slate-400 font-bold italic">Aucun appartement configuré.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isEditing || showAddModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-6 sm:p-10 space-y-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
              {isEditing ? `Modifier Appartement ${formData.number}` : 'Nouvel Appartement'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de l'Appartement</label>
                <input 
                  type="text" 
                  value={formData.number || ''}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  placeholder="Ex: A1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Étage (0 pour RDC)</label>
                <input 
                  type="number" 
                  value={formData.floor || 0}
                  onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 0})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Propriétaire Actuel</label>
                <input 
                  type="text" 
                  value={formData.owner || ''}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  placeholder="Nom complet"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cotisation Mensuelle (DH)</label>
                <div className="relative">
                  <i className="fas fa-money-bill-wave absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input 
                    type="number" 
                    value={formData.monthlyFee || 0}
                    onChange={(e) => setFormData({...formData, monthlyFee: parseFloat(e.target.value) || 0})}
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => { setIsEditing(null); setShowAddModal(false); }}
                className="flex-1 px-4 py-3 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
