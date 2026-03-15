import React, { useState } from 'react';
import { BuildingInfo } from '../types';
import { api } from '../services/api';

interface LoginProps {
  apartments: any[];
  buildingInfo: BuildingInfo;
  onLogin: (user: any) => void;
}

// step 1  : saisie numéro téléphone
// step 2  : saisie OTP reçu sur WhatsApp
// step 3a : créer mot de passe (première connexion ou mot de passe oublié)
// step 3b : saisir mot de passe (connexions suivantes)

const Login: React.FC<LoginProps> = ({ buildingInfo, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'syndic' | 'owner'>('syndic');

  // Syndic
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Owner
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | '3a' | '3b'>(1);
  const [forgotMode, setForgotMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isOwnerEnabled = buildingInfo?.ownerInterfaceEnabled === true;
  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium";

  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(''), 5000); };
  const resetOwner = () => {
    setStep(1); setPhone(''); setOtp('');
    setNewPassword(''); setConfirmPassword(''); setOwnerPassword('');
    setForgotMode(false); setError(''); setInfo('');
  };

  // ---- SYNDIC ----
  const handleSyndicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = buildingInfo?.adminPassword || 'admin';
    if (username === 'admin' && adminPassword === stored) {
      onLogin({ id: 'admin', username: 'Administrateur', role: 'admin' });
    } else {
      showError('Identifiants incorrects.');
    }
  };

  // ---- OWNER STEP 1 : envoyer OTP ----
  const handleSendOtp = async () => {
    if (!phone.trim()) return showError('Entrez votre numéro de téléphone.');
    setLoading(true); setError(''); setInfo('');
    try {
      const res = await api.sendOtp(phone);
      setStep(2);
      setInfo('Code envoyé sur WhatsApp ✓');
      if (res.dev_code) setInfo(`[DEV] Code : ${res.dev_code}`);
    } catch (err: any) {
      showError(err.message || 'Erreur envoi OTP');
    } finally { setLoading(false); }
  };

  // ---- OWNER STEP 2 : vérifier OTP ----
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return showError('Le code doit contenir 6 chiffres.');
    setLoading(true); setError('');
    try {
      const res = await api.verifyOtp(phone, otp);
      setInfo('');
      if (forgotMode || res.isFirstLogin) {
        setStep('3a');
        setInfo(forgotMode ? 'Créez votre nouveau mot de passe.' : 'Bienvenue ! Créez votre mot de passe.');
      } else {
        setStep('3b');
      }
    } catch (err: any) {
      showError(err.message || 'Code incorrect ou expiré');
    } finally { setLoading(false); }
  };

  // ---- OWNER STEP 3a : créer mot de passe ----
  const handleSetPassword = async () => {
    if (newPassword.length < 6) return showError('Minimum 6 caractères.');
    if (newPassword !== confirmPassword) return showError('Les mots de passe ne correspondent pas.');
    setLoading(true); setError('');
    try {
      const res = await api.setPassword(phone, newPassword);
      onLogin(res.user);
    } catch (err: any) {
      showError(err.message || 'Erreur création mot de passe');
    } finally { setLoading(false); }
  };

  // ---- OWNER STEP 3b : connexion mot de passe ----
  const handleLoginPassword = async () => {
    if (!ownerPassword) return showError('Entrez votre mot de passe.');
    setLoading(true); setError('');
    try {
      const res = await api.loginWithPassword(phone, ownerPassword);
      onLogin(res.user);
    } catch (err: any) {
      showError(err.message || 'Mot de passe incorrect');
    } finally { setLoading(false); }
  };

  // ---- MOT DE PASSE OUBLIÉ ----
  const handleForgotPassword = async () => {
    setForgotMode(true);
    setLoading(true); setError(''); setOwnerPassword('');
    try {
      const res = await api.sendOtp(phone);
      setStep(2);
      setInfo('Nouveau code envoyé sur WhatsApp ✓');
      if (res.dev_code) setInfo(`[DEV] Code : ${res.dev_code}`);
    } catch (err: any) {
      showError(err.message || 'Erreur envoi OTP');
      setForgotMode(false);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">

        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <i className="fas fa-city text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black tracking-tight">SyndicPro Manager</h1>
          <p className="text-indigo-100 text-xs mt-1 font-medium opacity-80 uppercase tracking-widest">Portail de Copropriété</p>
        </div>

        {/* Tabs */}
        {isOwnerEnabled && (
          <div className="flex border-b">
            <button onClick={() => { setActiveTab('syndic'); setError(''); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'syndic' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}>
              Espace Syndic
            </button>
            <button onClick={() => { setActiveTab('owner'); resetOwner(); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'owner' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}>
              Espace Propriétaire
            </button>
          </div>
        )}

        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          {info && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
              <i className="fas fa-check-circle"></i> {info}
            </div>
          )}

          {/* ===== SYNDIC ===== */}
          {activeTab === 'syndic' && (
            <form onSubmit={handleSyndicLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant</label>
                <div className="relative">
                  <i className="fas fa-user-shield absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className={inputClass} placeholder="admin" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                Connexion Syndic <i className="fas fa-chevron-right"></i>
              </button>
            </form>
          )}

          {/* ===== OWNER ===== */}
          {activeTab === 'owner' && (
            <div className="space-y-5">

              {/* STEP 1 : numéro de téléphone */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="bg-indigo-50 rounded-2xl p-4 text-xs text-indigo-700 font-medium flex items-start gap-3">
                    <i className="fab fa-whatsapp text-lg mt-0.5"></i>
                    <span>Entrez votre numéro de téléphone enregistré. Vous recevrez un code de vérification sur WhatsApp.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N° Téléphone</label>
                    <div className="relative">
                      <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                        className={inputClass} placeholder="Ex: 06 12 34 56 78" autoFocus />
                    </div>
                  </div>
                  <button onClick={handleSendOtp} disabled={loading || !phone.trim()}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fab fa-whatsapp"></i> Recevoir le code</>}
                  </button>
                </div>
              )}

              {/* STEP 2 : code OTP */}
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Code envoyé au</p>
                    <p className="font-black text-slate-800">{phone}</p>
                    <p className="text-[10px] text-slate-400">Valide 10 minutes</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Code WhatsApp (6 chiffres)</label>
                    <input type="text" inputMode="numeric" maxLength={6} value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                      className="w-full text-center text-3xl font-black py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 tracking-[0.5em]"
                      autoFocus />
                  </div>
                  <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Vérifier le code'}
                  </button>
                  <button onClick={() => { setStep(1); setOtp(''); setInfo(''); setForgotMode(false); }}
                    className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-all py-1">
                    ← Changer de numéro
                  </button>
                </div>
              )}

              {/* STEP 3a : créer / réinitialiser mot de passe */}
              {step === '3a' && (
                <div className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="bg-emerald-50 rounded-2xl p-4 text-xs text-emerald-700 font-medium flex items-start gap-3">
                    <i className="fas fa-lock text-lg mt-0.5"></i>
                    <span>{forgotMode ? 'Créez votre nouveau mot de passe.' : 'Bienvenue ! Créez votre mot de passe pour les prochaines connexions.'}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className={inputClass} placeholder="Min. 6 caractères" autoFocus />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                        className={inputClass} placeholder="••••••••" />
                    </div>
                  </div>
                  <button onClick={handleSetPassword} disabled={loading}
                    className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> {forgotMode ? 'Enregistrer le nouveau mot de passe' : 'Créer mon compte'}</>}
                  </button>
                </div>
              )}

              {/* STEP 3b : connexion avec mot de passe */}
              {step === '3b' && (
                <div className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Connexion avec le numéro</p>
                    <p className="font-black text-slate-800">{phone}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLoginPassword()}
                        className={inputClass} placeholder="••••••••" autoFocus />
                    </div>
                  </div>
                  <button onClick={handleLoginPassword} disabled={loading}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Se connecter</>}
                  </button>
                  <button onClick={handleForgotPassword} disabled={loading}
                    className="w-full text-indigo-500 text-xs font-bold hover:text-indigo-700 transition-all py-1">
                    <i className="fab fa-whatsapp mr-1"></i> Mot de passe oublié ? Recevoir un nouveau code
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SyndicPro Manager © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
