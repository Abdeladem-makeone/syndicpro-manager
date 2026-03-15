
import React, { useState } from 'react';
import { Apartment, ProfileRequest } from '../types';
import { exportToPDF } from '../utils/pdfUtils';

interface OwnersProps {
  apartments: Apartment[];
  onUpdate: (apartment: Apartment) => void;
  profileRequests?: ProfileRequest[];
  onHandleProfileRequest?: (requestId: string, approved: boolean) => void;
}

const Owners: React.FC<OwnersProps> = ({ apartments, onUpdate, profileRequests = [], onHandleProfileRequest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Apartment>>({});

  // Filtrage simple par nom de propriétaire ou numéro d'appartement
  const filteredApartments = apartments.filter(apt => 
    apt.owner.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (apt: Apartment) => {
    setEditingId(apt.id);
    setFormData(apt);
  };

  const handleSave = () => {
    if (editingId && formData) {
      onUpdate(formData as Apartment);
      setEditingId(null);
    }
  };

  const handleExportPDF = () => {
    const headers = ['N° Appartement', 'Étage', 'Propriétaire', 'Téléphone'];
    const rows = filteredApartments.map(apt => [
      apt.number,
      apt.floor === 0 ? 'RDC' : `${apt.floor}`,
      apt.owner,
      apt.phone || 'Non renseigné'
    ]);
    exportToPDF('Annuaire des Propriétaires', headers, rows, 'annuaire_proprietaires');
  };

  return (
    <div className="space-y-10">
      {/* Zone de Notifications - Demandes de changement */}
      {profileRequests.length > 0 && onHandleProfileRequest && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-amber-100">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-amber-200">
                 <i className="fas fa-bell"></i>
              </div>
              <div>
                 <h3 className="text-xl font-black text-amber-900 tracking-tight">Demandes de modification de profil</h3>
                 <p className="text-xs text-amber-700 font-bold uppercase tracking-widest opacity-80">{profileRequests.length} demande(s) en attente de validation</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Appartement {req.apartmentNumber} - {req.ownerName}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-slate-400 line-through">{req.currentPhone}</span>
                         <i className="fas fa-arrow-right text-amber-500 text-[10px]"></i>
                         <span className="text-sm font-black text-slate-800">{req.newPhone}</span>
                      </div>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => onHandleProfileRequest(req.id, true)}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-md shadow-green-100"
                      >
                         Confirmer
                      </button>
                      <button 
                        onClick={() => onHandleProfileRequest(req.id, false)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                         Refuser
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Annuaire Copropriété</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Coordonnées et contacts des résidents</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Rechercher appartement ou nom..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredApartments.map((apt) => (
          <div key={apt.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full group">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
                APPARTEMENT {apt.number}
              </span>
              <button 
                onClick={() => handleEdit(apt)}
                className="text-slate-400 hover:text-indigo-600 p-2.5 hover:bg-indigo-50 rounded-2xl transition-all"
              >
                <i className="fas fa-user-pen"></i>
              </button>
            </div>

            {editingId === apt.id ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Propriétaire</label>
                  <input 
                    type="text" 
                    value={formData.owner || ''}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Sauvegarder</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                   <h3 className="font-black text-slate-800 text-xl truncate mb-1 group-hover:text-indigo-600 transition-colors">{apt.owner}</h3>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Contact Principal</p>
                </div>
                
                <div className="space-y-4 flex-1 pt-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                      <i className="fab fa-whatsapp text-lg"></i>
                    </div>
                    <span className="font-black text-slate-700">{apt.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                      <i className="fas fa-envelope text-sm"></i>
                    </div>
                    <span className="truncate font-black text-slate-700">{apt.email || 'Non renseigné'}</span>
                  </div>
                </div>

                <div className="pt-6 mt-auto border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  <span className="flex items-center gap-2"><i className="fas fa-layer-group text-indigo-400"></i> ÉTAGE {apt.floor === 0 ? 'RDC' : apt.floor}</span>
                  <span className="flex items-center gap-2"><i className="fas fa-coins text-amber-400"></i> {apt.monthlyFee} DH</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredApartments.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <i className="fas fa-user-slash text-3xl"></i>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun résultat trouvé pour votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Owners;
