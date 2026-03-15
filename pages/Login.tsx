import React, { useState, useMemo } from 'react';
import { Apartment, BuildingInfo } from '../types';

interface LoginProps {
  apartments: Apartment[];
  buildingInfo: BuildingInfo;
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ apartments, buildingInfo, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'syndic' | 'owner'>('syndic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // États pour proprio
  const [selectedAptId, setSelectedAptId] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  
  const [error, setError] = useState('');

  const isOwnerInterfaceEnabled = buildingInfo?.ownerInterfaceEnabled === true;

  // Trier les appartements pour la liste déroulante
  const sortedApartments = useMemo(() => {
    return [...apartments].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [apartments]);

  // Fonction pour nettoyer un numéro de téléphone (ne garder que les chiffres)
  const normalizePhone = (p: string) => p.replace(/\D/g, '');

  const handleSyndicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = buildingInfo?.adminPassword || 'admin';
    
    if (username === 'admin' && password === storedPassword) {
      onLogin({ id: 'admin', username: 'Administrateur', role: 'admin' });
    } else {
      setError('Identifiants Syndic incorrects.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSendOtp = () => {
    const inputPhone = normalizePhone(phone);

    if (!selectedAptId || !inputPhone) {
      setError('Veuillez sélectionner votre appartement et saisir votre téléphone.');
      return;
    }

    const apt = apartments.find(a => a.id === selectedAptId);

    if (apt) {
      const storedPhone = normalizePhone(apt.phone || '');
      const phoneMatch = storedPhone !== '' && (storedPhone === inputPhone || storedPhone.endsWith(inputPhone) || inputPhone.endsWith(storedPhone));
      
      if (phoneMatch) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setStep(2);
        setError('');
        alert(`Simulation WhatsApp pour ${apt.owner} :\n\n"Votre code d'accès SyndicPro est : ${otp}"`);
      } else {
        setError("Le numéro de téléphone ne correspond pas à celui enregistré.");
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp && generatedOtp !== '') {
      const apt = apartments.find(a => a.id === selectedAptId);
      onLogin({ 
        id: apt?.id || 'owner', 
        username: apt?.owner || 'Propriétaire', 
        role: 'owner',
        apartmentId: apt?.id 
      });
    } else {
      setError('Code de vérification incorrect.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <i className="fas fa-city text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black tracking-tight">SyndicPro Manager</h1>
          <p className="text-indigo-100 text-xs mt-1 font-medium opacity-80 uppercase tracking-widest">Portail de Copropriété</p>
        </div>

        <div className={`flex border-b ${!isOwnerInterfaceEnabled ? 'hidden' : ''}`}>
          <button 
            onClick={() => { setActiveTab('syndic'); setStep(1); setError(''); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'syndic' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Espace Syndic
          </button>
          <button 
            onClick={() => { setActiveTab('owner'); setStep(1); setError(''); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'owner' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Espace Propriétaire
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {activeTab === 'syndic' ? (
            <form onSubmit={handleSyndicLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant</label>
                <div className="relative">
                  <i className="fas fa-user-shield absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="Ex: admin" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest mt-4">
                Connexion Syndic <i className="fas fa-chevron-right"></i>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
                {step === 1 ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appartement</label>
                        <div className="relative">
                          <i className="fas fa-door-closed absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
                          <select 
                            value={selectedAptId} 
                            onChange={e => setSelectedAptId(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium appearance-none"
                          >
                            <option value="">Choisir un appartement...</option>
                            {sortedApartments.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                {apt.number} - {apt.owner}
                              </option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N° Téléphone</label>
                        <div className="relative">
                          <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="Ex: 06 12 34 56 78" />
                        </div>
                      </div>
                      <button 
                        onClick={handleSendOtp} 
                        disabled={!selectedAptId}
                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest mt-4"
                      >
                        Recevoir le code <i className="fab fa-whatsapp"></i>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Saisir le code reçu</label>
                        <input 
                          type="text" 
                          maxLength={6} 
                          value={enteredOtp} 
                          onChange={e => setEnteredOtp(e.target.value)}
                          className="w-full text-center text-2xl font-black py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <button onClick={handleVerifyOtp} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                        Confirmer
                      </button>
                    </div>
                  )}
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SyndicPro Manager © 2024 - Sécurisé LOCAL-ONLY</p>
        </div>
      </div>
    </div>
  );
};

export default Login;