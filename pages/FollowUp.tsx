
import React, { useState, useMemo } from 'react';
import { Project, Complaint, Apartment, User, Attachment, ExpenseCategory, BuildingInfo } from '../types';
import { api } from '../services/api';

interface FollowUpProps {
  apartments: Apartment[];
  projects: Project[];
  complaints: Complaint[];
  currentUser: User;
  onRefresh: () => void;
  buildingInfo: BuildingInfo;
  language?: 'fr' | 'ar';
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FollowUp: React.FC<FollowUpProps> = ({
  apartments,
  projects,
  complaints,
  currentUser,
  onRefresh,
  buildingInfo,
  language = 'fr',
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'complaints'>('projects');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'project' | 'complaint', data: any } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ type: 'project' | 'complaint', data: any } | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isAr = language === 'ar';
  const canOwnerCreate = buildingInfo.ownerCanCreateOps;

  const translations = {
    fr: {
      title: 'Opérations & Suivi',
      desc: 'Gestion des incidents et projets de la copropriété',
      tabProjects: 'Projets',
      tabComplaints: 'Réclamations',
      newProject: 'Nouveau Projet',
      newComplaint: 'Nouvelle Réclamation',
      editItem: 'Modifier l\'élément',
      deleteConfirm: 'Supprimer définitivement cet élément ?',
      status: 'Statut',
      priority: 'Priorité',
      descLabel: 'Description',
      close: 'Fermer',
      confirm: 'Enregistrer',
      cancel: 'Annuler',
      titleLabel: 'Titre / Sujet',
      priorityLow: 'Basse',
      priorityMed: 'Moyenne',
      priorityHigh: 'Haute',
      send: 'Créer',
      placeholderDesc: 'Détails de l\'intervention ou du projet...',
      assignTo: 'Attribution',
      building: 'Immeuble (Parties Communes)',
      apartment: 'Appartement spécifique',
      files: 'Fichiers joints',
      maxSize: 'Max 10 Mo au total',
      noItems: 'Aucun enregistrement trouvé',
      msgSaved: 'Opération enregistrée avec succès',
      msgDeleted: 'Élément supprimé'
    },
    ar: {
      title: 'العمليات والمتابعة',
      desc: 'تدبير الحوادث ومشاريع الملكية المشتركة',
      tabProjects: 'المشاريع',
      tabComplaints: 'الشكايات',
      newProject: 'مشروع جديد',
      newComplaint: 'شكاية جديدة',
      editItem: 'تعديل',
      deleteConfirm: 'هل أنت متأكد من الحذف؟',
      status: 'الحالة',
      priority: 'الأولوية',
      descLabel: 'الوصف',
      close: 'إغلاق',
      confirm: 'حفظ',
      cancel: 'إلغاء',
      titleLabel: 'العنوان',
      priorityLow: 'منخفضة',
      priorityMed: 'متوسطة',
      priorityHigh: 'عالية',
      send: 'إنشاء',
      placeholderDesc: 'تفاصيل التدخل أو المشروع...',
      assignTo: 'التعيين',
      building: 'العمارة (الأجزاء المشتركة)',
      apartment: 'شقة محددة',
      files: 'الملفات المرفقة',
      maxSize: 'الأقصى 10 ميجا',
      noItems: 'لا توجد سجلات',
      msgSaved: 'تم الحفظ بنجاح',
      msgDeleted: 'تم الحذف'
    }
  };

  const t = translations[language];

  const [formType, setFormType] = useState<'building' | 'apartment'>('building');
  const [selectedAptId, setSelectedAptId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    title: '', description: '', priority: 'medium', status: 'planned', estimatedBudget: 0
  });

  const [complaintForm, setComplaintForm] = useState<Partial<Complaint>>({
    description: '', priority: 'medium', category: ExpenseCategory.OTHER, status: 'open'
  });

  const currentItems = useMemo(() => {
    if (activeTab === 'projects') {
      const statusOrder = { 'in-progress': 1, 'planned': 2, 'completed': 3 };
      return [...projects].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    } else {
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      return [...complaints].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    }
  }, [activeTab, projects, complaints]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      onNotify?.("Taille totale > 10 Mo", "error");
      return;
    }

    setIsUploading(true);
    const promises = files.map(file => {
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve({ name: file.name, data: event.target?.result as string, type: file.type });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(newAttachments => {
      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
      onNotify?.(`${newAttachments.length} fichier(s) ajouté(s)`);
    });
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'projects') {
        if (!projectForm.title || !projectForm.description) return onNotify?.("Champs manquants", "error");
        const itemToSave: Project = {
          ...(editingItem?.data || {}),
          ...projectForm as Project,
          id: editingItem?.data?.id || `p-${Date.now()}`,
          authorId: editingItem?.data?.authorId || currentUser.id,
          authorName: editingItem?.data?.authorName || currentUser.username,
          attachments: [...attachments]
        };
        if (editingItem) {
          await api.updateOperation('project', itemToSave);
        } else {
          await api.createOperation('project', itemToSave);
        }
      } else {
        if (!complaintForm.description) return onNotify?.("Description vide", "error");
        const apt = apartments.find(a => a.id === (editingItem?.data?.apartmentId || selectedAptId));
        const itemToSave: Complaint = {
          ...(editingItem?.data || {}),
          ...complaintForm as Complaint,
          id: editingItem?.data?.id || `c-${Date.now()}`,
          apartmentId: editingItem?.data?.apartmentId || (formType === 'building' ? 'building' : selectedAptId),
          apartmentNumber: editingItem?.data?.apartmentNumber || (formType === 'building' ? 'Parties Communes' : (apt?.number || '?')),
          date: editingItem?.data?.date || new Date().toISOString(),
          authorName: editingItem?.data?.authorName || currentUser.username,
          authorId: editingItem?.data?.authorId || currentUser.id,
          attachments: [...attachments]
        };
        if (editingItem) {
          await api.updateOperation('complaint', itemToSave);
        } else {
          await api.createOperation('complaint', itemToSave);
        }
      }
      onNotify?.(t.msgSaved);
      resetForm();
      onRefresh();
    } catch (err) {
      onNotify?.("Erreur réseau", "error");
    }
  };

  const handleDelete = async (id: string, type: 'projects' | 'complaints') => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const opType = type === 'projects' ? 'project' : 'complaint';
      await api.deleteOperation(opType, id);
      onNotify?.(t.msgDeleted, "info");
      onRefresh();
    } catch (err) {
      onNotify?.("Erreur suppression", "error");
    }
  };

  const resetForm = () => {
    setShowAddModal(false); setEditingItem(null); setAttachments([]);
    setProjectForm({ title: '', description: '', priority: 'medium', status: 'planned', estimatedBudget: 0 });
    setComplaintForm({ description: '', priority: 'medium', category: ExpenseCategory.OTHER, status: 'open' });
    setSelectedAptId(''); setFormType('building');
  };

  const handleEdit = (item: any, type: 'project' | 'complaint') => {
    setEditingItem({ type, data: item });
    setAttachments(item.attachments || []);
    if (type === 'project') setProjectForm(item);
    else {
      setComplaintForm(item);
      setFormType(item.apartmentId === 'building' ? 'building' : 'apartment');
      setSelectedAptId(item.apartmentId !== 'building' ? item.apartmentId : '');
    }
    setShowAddModal(true);
  };

  // --- RENDU ADMINISTRATEUR (INDIGO) ---
  if (isAdmin) {
    return (
      <div className="space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className={`font-black text-slate-800 tracking-tight ${isAr ? 'text-4xl' : 'text-3xl'}`}>{t.title}</h2>
            <p className={`font-black uppercase mt-1 tracking-widest opacity-60 text-slate-500 ${isAr ? 'text-xs' : 'text-[10px]'}`}>{t.desc}</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button onClick={() => setActiveTab('projects')} className={`px-6 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.tabProjects}</button>
              <button onClick={() => setActiveTab('complaints')} className={`px-6 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all ${activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.tabComplaints}</button>
            </div>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <i className="fas fa-plus"></i> {activeTab === 'projects' ? t.newProject : t.newComplaint}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col group relative overflow-hidden min-h-[300px]">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg font-black uppercase tracking-widest ${item.status === 'completed' || item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : item.status === 'in-progress' || item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'} ${isAr ? 'text-xs' : 'text-[9px]'}`}>{item.status}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(item, activeTab === 'projects' ? 'project' : 'complaint'); }} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeTab); }} className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                </div>
              </div>
              <div className="flex-1 space-y-3 cursor-pointer" onClick={() => setViewingItem({ type: activeTab === 'projects' ? 'project' : 'complaint', data: item })}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-indigo-50 text-indigo-500"><i className={`fas ${activeTab === 'complaints' ? 'fa-triangle-exclamation' : 'fa-helmet-safety'}`}></i></div>
                  <h3 className={`font-black text-slate-800 line-clamp-1 ${isAr ? 'text-lg' : 'text-sm'}`}>{activeTab === 'complaints' ? item.category : item.title}</h3>
                </div>
                <p className={`text-slate-500 font-medium leading-relaxed line-clamp-3 ${isAr ? 'text-base' : 'text-xs'}`}>{item.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase text-slate-400">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center"><i className="fas fa-user text-[8px]"></i></div><span>{item.authorName}</span></div>
                <span>{activeTab === 'complaints' ? item.apartmentNumber : item.estimatedBudget ? `${item.estimatedBudget} DH` : ''}</span>
              </div>
            </div>
          ))}
        </div>
        {renderSharedModals()}
      </div>
    );
  }

  // --- RENDU PROPRIÉTAIRE ---
  const isProj = activeTab === 'projects';
  const themeClass = isProj ? 'teal' : 'rose';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] border border-${themeClass}-100 shadow-sm transition-colors duration-500`}>
        <div>
          <h2 className={`font-black text-${themeClass}-900 tracking-tight ${isAr ? 'text-4xl' : 'text-2xl'}`}>{t.title}</h2>
          <p className={`font-bold uppercase mt-1 tracking-widest text-${themeClass}-600/60 ${isAr ? 'text-xs' : 'text-[10px]'}`}>{t.desc}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('projects')} className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${isProj ? 'bg-teal-700 text-white shadow-lg' : 'text-slate-400 hover:text-teal-600'}`}>{t.tabProjects}</button>
            <button onClick={() => setActiveTab('complaints')} className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${!isProj ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-rose-600'}`}>{t.tabComplaints}</button>
          </div>
          {canOwnerCreate && (
            <button onClick={() => setShowAddModal(true)} className={`px-8 py-3 bg-${themeClass}-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-${themeClass}-900 transition-all flex items-center gap-3`}>
              <i className="fas fa-plus-circle text-sm"></i> {isProj ? t.newProject : t.newComplaint}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentItems.map(item => {
          const isAuthor = item.authorId === currentUser.id;
          const itemType = activeTab === 'projects' ? 'project' : 'complaint';
          const cardColor = itemType === 'project' ? 'teal' : 'rose';

          return (
            <div key={item.id} onClick={() => setViewingItem({ type: itemType, data: item })} className={`bg-white rounded-[2rem] border border-${cardColor}-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-8 flex flex-col group min-h-[350px] cursor-pointer`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`px-4 py-1.5 rounded-xl font-black uppercase tracking-widest ${item.status === 'completed' || item.status === 'resolved' ? `bg-${cardColor}-50 text-${cardColor}-600` : item.status === 'in-progress' || item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'} ${isAr ? 'text-[10px]' : 'text-[8px]'}`}>{item.status}</div>
                {isAuthor && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(item, itemType)} className={`w-9 h-9 bg-${cardColor}-50 text-${cardColor}-700 rounded-xl flex items-center justify-center hover:bg-${cardColor}-700 hover:text-white transition-all`}><i className="fas fa-pen-to-square text-xs"></i></button>
                    <button onClick={() => handleDelete(item.id, activeTab)} className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash-can text-xs"></i></button>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-${cardColor}-50 text-${cardColor}-700 shadow-inner`}><i className={`fas ${itemType === 'complaint' ? 'fa-triangle-exclamation' : 'fa-helmet-safety'}`}></i></div>
                  <h3 className={`font-black text-slate-800 line-clamp-2 leading-tight ${isAr ? 'text-xl' : 'text-base'}`}>{itemType === 'complaint' ? item.category : item.title}</h3>
                </div>
                <p className={`text-slate-500 font-medium leading-relaxed line-clamp-4 ${isAr ? 'text-lg' : 'text-sm'}`}>{item.description}</p>
                <div className="flex items-center gap-3 pt-2">
                  <span className={`px-3 py-1 rounded-lg font-black uppercase tracking-widest ${item.priority === 'high' ? 'bg-rose-100 text-rose-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'} ${isAr ? 'text-[10px]' : 'text-[9px]'}`}>{item.priority}</span>
                  {item.attachments?.length > 0 && <span className="text-slate-300 text-[10px] font-black uppercase flex items-center gap-1"><i className="fas fa-paperclip"></i> {item.attachments.length}</span>}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><i className="fas fa-user text-[10px]"></i></div><span className={`font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-xs' : 'text-[9px]'}`}>{item.authorName}</span></div>
                <span className={`font-black text-${cardColor}-700 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{itemType === 'complaint' ? `Appt. ${item.apartmentNumber}` : item.estimatedBudget ? `${item.estimatedBudget} DH` : 'Budget N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>
      {renderSharedModals()}
    </div>
  );

  function renderSharedModals() {
    const themeColor = isAdmin ? 'indigo' : (viewingItem?.type === 'project' ? 'teal' : 'rose');
    return (
      <>
        {viewingItem && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingItem(null)}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm ${viewingItem.type === 'complaint' ? 'bg-rose-50 text-rose-500' : `bg-${themeColor}-50 text-${themeColor}-500`}`}><i className={`fas ${viewingItem.type === 'complaint' ? 'fa-triangle-exclamation' : 'fa-helmet-safety'}`}></i></div>
                <button onClick={() => setViewingItem(null)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                <div>
                  <span className={`bg-${themeColor}-50 text-${themeColor}-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block`}>ID: {viewingItem.data.id}</span>
                  <h3 className={`font-black text-slate-800 leading-tight ${isAr ? 'text-4xl' : 'text-3xl'}`}>{viewingItem.type === 'complaint' ? viewingItem.data.category : viewingItem.data.title}</h3>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100"><p className={`text-slate-600 leading-relaxed font-medium whitespace-pre-wrap ${isAr ? 'text-xl' : 'text-base'}`}>{viewingItem.data.description}</p></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="font-black text-slate-400 uppercase tracking-widest mb-1 text-[9px]">Statut</p><p className="font-black text-slate-800 uppercase text-[11px]">{viewingItem.data.status}</p></div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="font-black text-slate-400 uppercase tracking-widest mb-1 text-[9px]">Priorité</p><p className="font-black text-slate-800 uppercase text-[11px]">{viewingItem.data.priority}</p></div>
                </div>
                {viewingItem.data.attachments?.length > 0 && (
                  <div className="space-y-4 pt-6 border-t">
                    <p className="font-black text-slate-800 uppercase tracking-widest text-xs">{t.files}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {viewingItem.data.attachments.map((file: Attachment, i: number) => (
                        <a key={i} href={file.data} download={file.name} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-4 hover:shadow-lg transition-all group">
                          {file.type.startsWith('image/') ? (
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100"><img src={file.data} className="w-full h-full object-cover" alt="" /></div>
                          ) : (
                            <div className={`w-10 h-10 rounded-xl bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-500 shadow-inner group-hover:bg-${themeColor}-600 group-hover:text-white transition-all`}><i className="fas fa-file-arrow-down"></i></div>
                          )}
                          <span className="font-bold text-slate-600 truncate text-[11px]">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-slate-50 border-t flex justify-end"><button onClick={() => setViewingItem(null)} className="px-12 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all text-xs">{t.close}</button></div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300" onClick={resetForm}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl ${activeTab === 'projects' ? 'bg-teal-600' : 'bg-rose-600'}`}><i className={`fas ${activeTab === 'projects' ? 'fa-helmet-safety' : 'fa-triangle-exclamation'} text-xl`}></i></div>
                  <div><h3 className={`font-black text-slate-800 tracking-tight ${isAr ? 'text-3xl' : 'text-2xl'}`}>{editingItem ? t.editItem : (activeTab === 'projects' ? t.newProject : t.newComplaint)}</h3><p className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t.desc}</p></div>
                </div>
                <button onClick={resetForm} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                {activeTab === 'complaints' && (
                  <div className="space-y-6">
                    <div className="flex gap-4 p-1.5 bg-slate-50 rounded-2xl border">
                      <button onClick={() => setFormType('building')} className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest transition-all ${formType === 'building' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'} ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.building}</button>
                      <button onClick={() => setFormType('apartment')} className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest transition-all ${formType === 'apartment' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'} ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.apartment}</button>
                    </div>
                    {formType === 'apartment' && (
                      <div className="space-y-1.5">
                        <label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Appartement concerné</label>
                        <select value={selectedAptId} onChange={e => setSelectedAptId(e.target.value)} className={`w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none transition-all ${isAr ? 'text-xl' : 'text-base'}`}>
                          <option value="">Sélectionner...</option>
                          {apartments.map(a => <option key={a.id} value={a.id}>Appt {a.number} - {a.owner}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Catégorie</label>
                        <select value={complaintForm.category} onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value as ExpenseCategory })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">{Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">{t.status}</label>
                        <select value={complaintForm.status} onChange={e => setComplaintForm({ ...complaintForm, status: e.target.value as any })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"><option value="open">Ouvert</option><option value="pending">En attente</option><option value="resolved">Résolu</option></select>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <div className="space-y-1.5"><label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">{t.titleLabel}</label><input type="text" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5"><label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">{t.status}</label><select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value as any })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"><option value="planned">Prévu</option><option value="in-progress">En cours</option><option value="completed">Terminé</option></select></div>
                      <div className="space-y-1.5"><label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Budget Estimé (DH)</label><input type="number" value={projectForm.estimatedBudget} onChange={e => setProjectForm({ ...projectForm, estimatedBudget: parseInt(e.target.value) || 0 })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none" /></div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5"><label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">{t.descLabel}</label><textarea rows={5} value={activeTab === 'projects' ? projectForm.description : complaintForm.description} onChange={e => activeTab === 'projects' ? setProjectForm({ ...projectForm, description: e.target.value }) : setComplaintForm({ ...complaintForm, description: e.target.value })} placeholder={t.placeholderDesc} className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:ring-2 focus:ring-slate-300 outline-none transition-all" /></div>
                <div className="space-y-4"><label className="font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">{t.priority}</label><div className="grid grid-cols-3 gap-4">{(['low', 'medium', 'high'] as const).map(p => (<button key={p} onClick={() => activeTab === 'projects' ? setProjectForm({ ...projectForm, priority: p }) : setComplaintForm({ ...complaintForm, priority: p })} className={`py-4 rounded-2xl font-black uppercase tracking-widest border transition-all ${(activeTab === 'projects' ? projectForm.priority : complaintForm.priority) === p ? `bg-slate-800 text-white border-slate-800 shadow-xl` : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'} ${isAr ? 'text-base' : 'text-[11px]'}`}>{p === 'low' ? t.priorityLow : p === 'medium' ? t.priorityMed : t.priorityHigh}</button>))}</div></div>
                <div className="space-y-6 pt-6 border-t"><div className="flex items-center justify-between"><label className="font-black text-slate-800 uppercase tracking-widest text-xs">{t.files}</label><span className="text-[9px] font-bold text-slate-400 italic">{t.maxSize}</span></div><div className="grid grid-cols-4 sm:grid-cols-5 gap-4">{attachments.map((file, idx) => (<div key={idx} className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 relative group overflow-hidden shadow-sm">{file.type.startsWith('image/') ? (<img src={file.data} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-400"><i className="fas fa-file text-2xl"></i></div>)}<button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button></div>))}<label className={`aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-slate-400 hover:text-slate-400 cursor-pointer transition-all ${isUploading ? 'animate-pulse' : ''} bg-slate-50/50`}><input type="file" multiple onChange={handleFileChange} className="hidden" /><i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-2xl`}></i><span className="font-black mt-3 uppercase tracking-tighter text-[10px]">{isAr ? 'إضافة' : 'Ajouter'}</span></label></div></div>
              </div>
              <div className="p-10 bg-slate-50 border-t flex gap-4"><button onClick={resetForm} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"> {t.cancel} </button><button onClick={handleSave} className={`flex-[2] py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all ${isAr ? 'text-lg' : 'text-xs'}`}> {t.confirm} </button></div>
            </div>
          </div>
        )}
      </>
    );
  }
};

export default FollowUp;
