import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingInfo, Apartment } from '../types';
import { api } from '../services/api';

interface BuildingSetupProps {
   buildingInfo: BuildingInfo;
   onSave: (info: BuildingInfo, apartments?: Apartment[]) => void;
   onImportFullDB: (data: any) => void;
   fullData: any;
   currentApartmentsCount: number;
   onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BuildingSetup: React.FC<BuildingSetupProps> = ({
   buildingInfo,
   onSave,
   onNotify
}) => {
   const [formData, setFormData] = useState<BuildingInfo>({
      ...buildingInfo,
      name: buildingInfo.name || '',
      address: buildingInfo.address || '',
      defaultMonthlyFee: buildingInfo.defaultMonthlyFee || 50
   });
   const [activeTab, setActiveTab] = useState<'building' | 'syndic' | 'owners'>('building');
   const [loading, setLoading] = useState(false);
   const [virtualFiles, setVirtualFiles] = useState<{ name: string, size: number }[]>([]);
   const navigate = useNavigate();

   useEffect(() => {
      setVirtualFiles([]);
   }, []);

   const totalToGenerate = useMemo(() => {
      return (formData.numFloors || 0) * (formData.unitsPerFloor || 0);
   }, [formData.numFloors, formData.unitsPerFloor]);

   const generateApartments = (): Apartment[] => {
      const newApartments: Apartment[] = [];
      let counter = 1;
      for (let f = 0; f < formData.numFloors; f++) {
         for (let u = 1; u <= formData.unitsPerFloor; u++) {
            newApartments.push({
               id: `apt-${counter}-${Date.now()}`,
               number: counter.toString(),
               owner: 'À renseigner',
               shares: 100,
               monthlyFee: formData.defaultMonthlyFee,
               floor: f,
               phone: '',
               email: ''
            });
            counter++;
         }
      }
      return newApartments;
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (activeTab === 'building') {
         if (totalToGenerate <= 0) return onNotify?.("Structure invalide", "error");
         setLoading(true);
         setTimeout(() => {
            const apartmentsToSave = generateApartments();
            onSave({ ...formData, totalUnits: totalToGenerate, isConfigured: true }, apartmentsToSave);
            setLoading(false);
            navigate('/');
         }, 1000);
      } else {
         onSave(formData);
         onNotify?.("Modifications enregistrées");
      }
   };

   const handleExportJSON = () => {
      onNotify?.("Maintenant que la base est SQL, sauvegardez simplement le fichier database.sqlite.", "info");
   };

   const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      onNotify?.("Importation désactivée. Remplacez le fichier SQLite pour restorer.", "info");
   };

   const handleClearCache = () => {
      alert("Impossible de vider le cache, les données sont persistées sur le serveur SQL.");
   };

   const toggleField = (field: keyof BuildingInfo) => {
      setFormData({ ...formData, [field]: !formData[field] });
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-16">
         {loading && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
               <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
               <p className="font-black uppercase tracking-widest text-[10px]">Initialisation de l'immeuble...</p>
            </div>
         )}

         {/* HEADER PRINCIPAL */}
         <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuration Système</h1>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestion de l'infrastructure et des sauvegardes</p>
            </div>
            <div className="flex gap-3">
               <button onClick={handleExportJSON} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2">
                  <i className="fas fa-file-export"></i> Exporter
               </button>
               <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer">
                  <i className="fas fa-file-import"></i> Importer
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
               </label>
            </div>
         </div>

         {/* NAVIGATION ONGLES */}
         <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('building')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'building' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
               <i className="fas fa-building"></i> Immeuble
            </button>
            <button onClick={() => setActiveTab('syndic')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'syndic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
               <i className="fas fa-user-shield"></i> Syndic
            </button>
            <button onClick={() => setActiveTab('owners')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'owners' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
               <i className="fas fa-users-gear"></i> Propriétaires
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                        {activeTab === 'building' ? 'Structure du bâtiment' : activeTab === 'syndic' ? 'Informations du Syndic' : 'Droits & Visibilité'}
                     </h2>
                     <i className={`fas ${activeTab === 'building' ? 'fa-city' : activeTab === 'syndic' ? 'fa-id-card' : 'fa-lock'} text-slate-300`}></i>
                  </div>

                  <form onSubmit={handleSubmit} className="p-10 flex-1 flex flex-col justify-between">
                     {activeTab === 'building' && (
                        <div className="space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la résidence</label>
                              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Ex: Résidence Atlas" />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre d'étages</label>
                                 <input required type="number" value={formData.numFloors} onChange={e => setFormData({ ...formData, numFloors: parseInt(e.target.value) || 0 })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="0" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unités par étage</label>
                                 <input required type="number" value={formData.unitsPerFloor} onChange={e => setFormData({ ...formData, unitsPerFloor: parseInt(e.target.value) || 0 })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="0" />
                              </div>
                           </div>
                           <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 flex items-center justify-between shadow-inner">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fas fa-money-bill-wave"></i></div>
                                 <div>
                                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">Cotisation par défaut</p>
                                    <p className="text-[9px] text-indigo-400 font-bold uppercase mt-1">Appliqué aux nouveaux appartements</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <input type="number" value={formData.defaultMonthlyFee} onChange={e => setFormData({ ...formData, defaultMonthlyFee: parseInt(e.target.value) || 0 })} className="w-24 px-4 py-3 bg-white border border-indigo-200 rounded-xl text-center font-black text-indigo-600 outline-none" />
                                 <span className="text-[10px] font-black text-indigo-400 uppercase">DH</span>
                              </div>
                           </div>

                           <div className="bg-slate-900 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group mt-auto">
                              <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-all"></div>
                              <div className="flex items-center gap-5 relative z-10">
                                 <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-layer-group"></i></div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total à générer</p>
                                    <p className="text-2xl font-black text-white">{totalToGenerate} <span className="text-xs text-slate-400">Appartements</span></p>
                                 </div>
                              </div>
                              <button type="submit" className="relative z-10 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                                 Initialiser la base
                              </button>
                           </div>
                        </div>
                     )}

                     {activeTab === 'syndic' && (
                        <div className="space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de contact syndic</label>
                              <div className="relative">
                                 <i className="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                 <input type="text" value={formData.syndicContactNumber} onChange={e => setFormData({ ...formData, syndicContactNumber: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Ex: 06 00 00 00 00" />
                              </div>
                           </div>
                           <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 space-y-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm"><i className="fas fa-lock"></i></div>
                                 <div>
                                    <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Mot de passe administrateur</p>
                                    <p className="text-[8px] text-rose-400 font-bold uppercase">Sécurise l'accès à cet espace</p>
                                 </div>
                              </div>
                              <input type="password" value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} className="w-full px-6 py-4 bg-white border border-rose-200 rounded-2xl font-bold outline-none" placeholder="Laisser vide pour 'admin'" />
                           </div>
                           <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all mt-auto">
                              Sauvegarder les infos Syndic
                           </button>
                        </div>
                     )}

                     {activeTab === 'owners' && (
                        <div className="space-y-6 flex flex-col flex-1 h-full">
                           <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fas fa-user-lock"></i></div>
                                 <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Accès Propriétaire (Login)</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Permettre aux résidents de se connecter</p>
                                 </div>
                              </div>
                              <button type="button" onClick={() => toggleField('ownerInterfaceEnabled')} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${formData.ownerInterfaceEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}>
                                 <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.ownerInterfaceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                           </div>

                           {formData.ownerInterfaceEnabled ? (
                              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                 {[
                                    { id: 'ownerShowBalance', label: 'Barre de Trésorerie', icon: 'fa-sack-dollar' },
                                    { id: 'ownerShowExpenseRegister', label: 'Registre des Dépenses', icon: 'fa-list-check' },
                                    { id: 'ownerCanCreateOps', label: 'Création Projets / Réclamations', icon: 'fa-circle-plus' }
                                 ].map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-all">
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><i className={`fas ${f.icon}`}></i></div>
                                          <div>
                                             <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{f.label}</p>
                                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Visibilité et droits d'édition</p>
                                          </div>
                                       </div>
                                       <button type="button" onClick={() => toggleField(f.id as any)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${formData[f.id as keyof BuildingInfo] ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData[f.id as keyof BuildingInfo] ? 'translate-x-6' : 'translate-x-1'}`} />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50 py-12">
                                 <i className="fas fa-users-slash text-6xl"></i>
                                 <p className="text-[11px] font-black uppercase tracking-[0.3em]">L'interface est désactivée.</p>
                              </div>
                           )}

                           <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-auto">
                              Sauvegarder les droits
                           </button>
                        </div>
                     )}
                  </form>
               </div>
            </div>

            {/* COLONNE DROITE : FICHIERS ET INFOS */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <i className="fas fa-database text-indigo-600"></i>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Fichiers Locaux</h3>
                     </div>
                     <button onClick={handleClearCache} className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all">
                        Vider le cache
                     </button>
                  </div>

                  <div className="flex-1 p-6 space-y-3 overflow-y-auto no-scrollbar">
                     {virtualFiles.length > 0 ? virtualFiles.map(file => (
                        <div key={file.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">
                           <span className="text-[11px] font-bold text-slate-600 truncate max-w-[200px]">{file.name}</span>
                           <span className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border">{file.size.toFixed(1)} KB</span>
                        </div>
                     )) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4 py-20 opacity-40">
                           <i className="fas fa-box-open text-4xl"></i>
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun fichier</p>
                        </div>
                     )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Intégrité stockage</span>
                        <span className="text-emerald-600 font-bold">LOCAL-ONLY (RGPD)</span>
                     </div>
                     <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
                     </div>
                  </div>
               </div>

               <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                     <i className="fas fa-shield-halved text-amber-600 text-lg"></i>
                     <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Sécurité & Vie Privée</h4>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                     Toutes les données sont conservées uniquement sur cet appareil. Pour éviter toute perte, effectuez régulièrement des exports JSON.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default BuildingSetup;