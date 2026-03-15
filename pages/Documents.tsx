
import React, { useState, useEffect, useMemo } from 'react';
import { AppDocument } from '../types';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: 'fa-folder-open', color: 'text-slate-600' },
  { id: 'invoice', label: 'Factures', icon: 'fa-file-invoice-dollar', color: 'text-rose-600' },
  { id: 'quote', label: 'Devis', icon: 'fa-file-signature', color: 'text-amber-600' },
  { id: 'contract', label: 'Contrats', icon: 'fa-file-contract', color: 'text-indigo-600' },
  { id: 'other', label: 'Divers', icon: 'fa-file-alt', color: 'text-slate-600' },
];

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<AppDocument[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [newDoc, setNewDoc] = useState<{
    name: string;
    category: AppDocument['category'];
  }>({ name: '', category: 'invoice' });

  useEffect(() => {
    api.getDocuments().then(setDocs).catch(console.error);
  }, []);

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const matchesFilter = filter === 'all' || d.category === filter;
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [docs, filter, searchTerm]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop lourd (Max 5Mo)");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const doc: AppDocument = {
        id: Date.now().toString(),
        name: newDoc.name || file.name,
        category: newDoc.category,
        type: file.type,
        data: event.target?.result as string,
        date: new Date().toISOString(),
        size: file.size / 1024 // KB
      };

      const updated = [doc, ...docs];
      setDocs(updated);
      api.createDocument(doc).catch(console.error);
      setIsUploading(false);
      setShowAddModal(false);
      setNewDoc({ name: '', category: 'invoice' });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce document ?")) {
      const updated = docs.filter(d => d.id !== id);
      setDocs(updated);
      api.deleteDocument(id).catch(console.error);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'fa-file-pdf text-rose-500';
    if (type.includes('image')) return 'fa-file-image text-emerald-500';
    if (type.includes('word')) return 'fa-file-word text-blue-500';
    return 'fa-file text-slate-400';
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestion Documentaire</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Organisation des contrats, factures et devis</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100 font-black text-[10px] uppercase tracking-widest"
        >
          <i className="fas fa-cloud-arrow-up"></i> Ajouter un document
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 space-y-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${filter === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-4">
                <i className={`fas ${cat.icon} ${filter === cat.id ? 'text-white' : cat.color}`}></i>
                <span className="text-[11px] font-black uppercase tracking-widest">{cat.label}</span>
              </div>
              {filter !== cat.id && (
                <span className="text-[10px] font-bold opacity-40">
                  {cat.id === 'all' ? docs.length : docs.filter(d => d.category === cat.id).length}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-6">
          <div className="relative">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Rechercher par nom de fichier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                <div className="p-8 flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner`}>
                      <i className={`fas ${getFileIcon(doc.type)}`}></i>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-trash-can text-sm"></i>
                    </button>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-800 text-sm line-clamp-2 leading-tight mb-2">{doc.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[8px] font-black uppercase">{doc.category}</span>
                      <span className="text-[9px] font-bold text-slate-400">{doc.size.toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex gap-2">
                  <a
                    href={doc.data}
                    download={doc.name}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest text-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    <i className="fas fa-download mr-2"></i> Télécharger
                  </a>
                  <button
                    onClick={() => {
                      const win = window.open();
                      if (win) win.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 text-3xl">
                  <i className="fas fa-file-circle-xmark"></i>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">Aucun document</h3>
                <p className="text-slate-400 text-sm font-medium">Commencez par ajouter votre premier fichier.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200 p-10 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-2xl mx-auto shadow-inner"><i className="fas fa-cloud-arrow-up"></i></div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nouveau Document</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du document</label>
                <input
                  type="text"
                  value={newDoc.name}
                  onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Ex: Facture Ascenseur Mars"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewDoc({ ...newDoc, category: cat.id as any })}
                      className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${newDoc.category === cat.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className={`w-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                  <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-file-circle-plus'} text-3xl text-slate-300 mb-4`}></i>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    {isUploading ? 'Chargement...' : 'Sélectionner le fichier'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">PDF ou Image (Max 5Mo)</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-all text-[10px]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
