
import React, { useState } from 'react';
import { BuildingAsset, AssetPayment } from '../types';
import { MONTHS } from '../constants';

interface AssetsManagerProps {
  assets: BuildingAsset[];
  assetPayments: AssetPayment[];
  onAddAsset: (asset: BuildingAsset) => void;
  onUpdateAsset: (asset: BuildingAsset) => void;
  onDeleteAsset: (id: string) => void;
  onAddPayment: (pay: AssetPayment) => void;
  onDeletePayment: (id: string) => void;
}

const AssetsManager: React.FC<AssetsManagerProps> = ({ 
  assets, assetPayments, onAddAsset, onUpdateAsset, onDeleteAsset, onAddPayment, onDeletePayment 
}) => {
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BuildingAsset | null>(null);
  const [selectedAssetForPay, setSelectedAssetForPay] = useState<BuildingAsset | null>(null);

  const [assetForm, setAssetForm] = useState<Partial<BuildingAsset>>({
    name: '', description: '', incomeAmount: 0, frequency: 'monthly', category: 'other'
  });

  const [payForm, setPayForm] = useState({
    amount: 0, date: new Date().toISOString().split('T')[0], month: new Date().getMonth(), year: new Date().getFullYear()
  });

  const handleSaveAsset = () => {
    if (editingAsset) {
      onUpdateAsset({ ...editingAsset, ...assetForm } as BuildingAsset);
    } else {
      onAddAsset({ ...assetForm, id: Date.now().toString() } as BuildingAsset);
    }
    setShowAssetModal(false);
    setEditingAsset(null);
  };

  const handleSavePayment = () => {
    if (!selectedAssetForPay) return;
    const period = selectedAssetForPay.frequency === 'monthly' ? `${MONTHS[payForm.month]} ${payForm.year}` : `Année ${payForm.year}`;
    onAddPayment({
      id: Date.now().toString(),
      assetId: selectedAssetForPay.id,
      amount: payForm.amount,
      date: payForm.date,
      period,
      year: payForm.year
    });
    setShowPayModal(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Biens de la Copropriété</h2>
          <p className="text-sm text-slate-500">Gérez les sources de revenus complémentaires (locations, antennes, etc.)</p>
        </div>
        <button onClick={() => { setEditingAsset(null); setAssetForm({ name: '', description: '', incomeAmount: 0, frequency: 'monthly', category: 'other' }); setShowAssetModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
          <i className="fas fa-plus"></i> Nouveau Bien
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => {
          const totalIncome = assetPayments.filter(p => p.assetId === asset.id).reduce((sum, p) => sum + p.amount, 0);
          return (
            <div key={asset.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    asset.category === 'telecom' ? 'bg-blue-50 text-blue-600' :
                    asset.category === 'rent' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <i className={`fas ${asset.category === 'telecom' ? 'fa-tower-broadcast' : asset.category === 'rent' ? 'fa-house-chimney-user' : 'fa-box'}`}></i>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => { setEditingAsset(asset); setAssetForm(asset); setShowAssetModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><i className="fas fa-edit"></i></button>
                     <button onClick={() => onDeleteAsset(asset.id)} className="p-2 text-slate-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{asset.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{asset.description}</p>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">{asset.frequency === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tarif Contractuel</p>
                    <p className="font-black text-slate-800">{asset.incomeAmount.toLocaleString()} DH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Perçu</p>
                    <p className="font-black text-green-600">{totalIncome.toLocaleString()} DH</p>
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedAssetForPay(asset); setPayForm({...payForm, amount: asset.incomeAmount}); setShowPayModal(true); }} className="w-full py-4 bg-slate-800 text-white font-black text-xs hover:bg-slate-900 transition-colors uppercase tracking-widest">Encaisser un paiement</button>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
           <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Historique des Revenus des Biens</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50">
                <tr className="text-[10px] font-bold text-slate-400 uppercase">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Bien</th>
                  <th className="px-8 py-4">Période</th>
                  <th className="px-8 py-4">Montant</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {assetPayments.slice().reverse().map(pay => {
                  const asset = assets.find(a => a.id === pay.assetId);
                  return (
                    <tr key={pay.id} className="text-sm hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-slate-500 font-medium">{new Date(pay.date).toLocaleDateString()}</td>
                      <td className="px-8 py-4 font-black text-slate-800">{asset?.name || 'Bien supprimé'}</td>
                      <td className="px-8 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{pay.period}</span></td>
                      <td className="px-8 py-4 font-black text-green-600">+{pay.amount.toLocaleString()} DH</td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => onDeletePayment(pay.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash-can"></i></button>
                      </td>
                    </tr>
                  );
                })}
                {assetPayments.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Aucun paiement enregistré pour le moment.</td></tr>
                )}
             </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BIEN */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-800">{editingAsset ? 'Modifier le Bien' : 'Nouveau Bien Productif'}</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nom du bien (ex: Antenne 5G)" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <textarea placeholder="Description" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={assetForm.description} onChange={e => setAssetForm({...assetForm, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fréquence</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={assetForm.frequency} onChange={e => setAssetForm({...assetForm, frequency: e.target.value as any})}>
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Catégorie</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value as any})}>
                      <option value="telecom">Télécom</option>
                      <option value="rent">Location</option>
                      <option value="advertising">Publicité</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Montant Contractuel (DH)</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black" value={assetForm.incomeAmount} onChange={e => setAssetForm({...assetForm, incomeAmount: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAssetModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Annuler</button>
                <button onClick={handleSaveAsset} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {showPayModal && selectedAssetForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                   <h3 className="text-xl font-black text-slate-800">Encaissement Revenu</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedAssetForPay.name}</p>
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      {selectedAssetForPay.frequency === 'monthly' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Mois</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={payForm.month} onChange={e => setPayForm({...payForm, month: parseInt(e.target.value)})}>
                             {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="space-y-1 col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Année</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={payForm.year} onChange={e => setPayForm({...payForm, year: parseInt(e.target.value)})} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Montant Reçu (DH)</label>
                      <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black text-green-600 text-lg" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Date d'encaissement</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} />
                   </div>
                </div>
                <button onClick={handleSavePayment} className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all uppercase tracking-widest text-sm">Valider l'encaissement</button>
                <button onClick={() => setShowPayModal(false)} className="w-full py-2 text-slate-400 font-bold hover:underline text-xs">Annuler</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsManager;
