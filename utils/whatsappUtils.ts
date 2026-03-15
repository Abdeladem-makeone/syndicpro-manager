
import { Apartment, BuildingInfo, Payment, Project, Complaint } from '../types';

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const DEFAULT_TEMPLATES = {
  ar: {
    simple: `مرحباً *{propriétaire}*، معكم سانديك *{immeuble}*. 🏢\n\nنذكركم بأداء مساهمة شهر *{mois} {annee}* وقدرها *{montant} DH* الخاصة بالشقة *{appartement}*.\n\nشكراً لتسوية وضعيتكم. 🙏`,
    detailed: `مرحباً *{propriétaire}*، معكم سانديك إقامة *{immeuble}*. 🏢\n\nنحيطكم علماً أن مساهمة شهر *{mois} {annee}* للشقة *{appartement}* لم يتم التوصل بها بعد.\n\n{details}\n*ملخص الوضعية:*\n- عدد الأشهر المستحقة: {nb_mois}\n- المبلغ الإجمالي: *{total_du} DH*\n\nيرجى تسوية وضعيتكم في أقرب وقت possible. 🙏\nمع تحيات السانديك.`
  },
  fr: {
    simple: `Bonjour *{propriétaire}*, ici le syndic de *{immeuble}*. 🏢\n\nNous vous rappelons de régler la cotisation du mois de *{mois} {annee}* d'un montant de *{montant} DH* pour l'appartement *{appartement}*.\n\nMerci de votre collaboration. 🙏`,
    detailed: `Bonjour *{propriétaire}*, ici le syndic de la résidence *{immeuble}*. 🏢\n\nNous vous informons que la cotisation du mois de *{mois} {annee}* pour l'appartement *{appartement}* est toujours impayée.\n\n{details}\n*Récapitulatif :*\n- Mois dus : {nb_mois}\n- Total à payer : *{total_du} DH*\n\nMerci de régulariser votre situation au plus vite. 🙏`
  }
};

/**
 * Nettoie et formate le numéro de téléphone pour WhatsApp.
 */
const formatPhoneNumber = (phone: string): string | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return null;
  
  if (cleanPhone.startsWith('0')) {
    return '212' + cleanPhone.substring(1);
  } else if (cleanPhone.length > 0 && !cleanPhone.startsWith('212')) {
    return '212' + cleanPhone;
  }
  return cleanPhone;
};

/**
 * Remplace les variables dans le template.
 */
const parseTemplate = (template: string, vars: Record<string, string | number>): string => {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value));
  });
  return result;
};

/**
 * Génère un lien WhatsApp simple pour un rappel du mois en cours.
 */
export const generateWhatsAppReminderLink = (
  apt: Apartment, 
  buildingInfo: BuildingInfo, 
  isPaid: boolean
) => {
  if (isPaid || !apt.phone) return null;

  const currentMonthIdx = new Date().getMonth();
  const lang = buildingInfo.reminderLanguage || 'ar';
  const currentMonthName = lang === 'ar' ? MONTHS_AR[currentMonthIdx] : MONTHS_FR[currentMonthIdx];
  const currentYear = new Date().getFullYear();

  const finalPhone = formatPhoneNumber(apt.phone);
  if (!finalPhone) return null;

  const template = buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[lang].simple;
  const message = parseTemplate(template, {
    propriétaire: apt.owner,
    immeuble: buildingInfo.name,
    mois: currentMonthName,
    annee: currentYear,
    montant: apt.monthlyFee,
    appartement: apt.number
  });

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Génère un rappel détaillé incluant les impayés cumulés.
 */
export const generateDetailedWhatsAppReminder = (
  apt: Apartment, 
  buildingInfo: BuildingInfo, 
  selectedMonthIdx: number, 
  selectedYear: number, 
  allPayments: Payment[]
) => {
  const aptPayments = allPayments.filter(p => p.apartmentId === apt.id && p.year === selectedYear);
  const isSelectedMonthPaid = aptPayments.some(p => p.month === selectedMonthIdx);
  if (isSelectedMonthPaid) return null;

  const lang = buildingInfo.reminderLanguage || 'ar';
  const monthsList = lang === 'ar' ? MONTHS_AR : MONTHS_FR;
  
  const previousUnpaidMonthsNames = [];
  let unpaidCount = 0;
  for (let m = 0; m < selectedMonthIdx; m++) {
    if (!aptPayments.some(p => p.month === m)) {
      previousUnpaidMonthsNames.push(monthsList[m]);
      unpaidCount++;
    }
  }

  const totalMonthsOwed = unpaidCount + 1;
  const totalAmountOwed = totalMonthsOwed * apt.monthlyFee;

  const finalPhone = formatPhoneNumber(apt.phone);
  if (!finalPhone) return null;

  let detailsText = '';
  if (previousUnpaidMonthsNames.length > 0) {
    detailsText = lang === 'ar' 
      ? `⚠️ لديكم أيضاً *${previousUnpaidMonthsNames.length}* أشهر غير مؤداة سابقاً (${previousUnpaidMonthsNames.join('، ')}).\n\n`
      : `⚠️ Vous avez également *${previousUnpaidMonthsNames.length}* mois impayés précédemment (${previousUnpaidMonthsNames.join(', ')}).\n\n`;
  }

  const template = buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[lang].detailed;
  const message = parseTemplate(template, {
    propriétaire: apt.owner,
    immeuble: buildingInfo.name,
    mois: monthsList[selectedMonthIdx],
    annee: selectedYear,
    appartement: apt.number,
    details: detailsText,
    nb_mois: totalMonthsOwed,
    total_du: totalAmountOwed,
    montant: apt.monthlyFee
  });

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Génère un lien de partage pour un projet
 */
export const generateProjectWhatsAppLink = (project: Project, buildingName: string) => {
  const priorityEmoji = project.priority === 'high' ? '🚨' : project.priority === 'medium' ? '⚠️' : 'ℹ️';
  const statusLabel = project.status === 'completed' ? 'Terminé ✅' : project.status === 'in-progress' ? 'En cours 🚧' : 'Prévu 📅';
  
  const message = `🏗️ *Suivi de Projet - ${buildingName}*
  
📍 *Projet:* ${project.title}
📊 *Statut:* ${statusLabel}
${priorityEmoji} *Priorité:* ${project.priority.toUpperCase()}
💰 *Budget:* ${project.estimatedBudget ? project.estimatedBudget.toLocaleString() + ' DH' : 'Non défini'}

📝 *Description:*
${project.description}

_Envoyé via SyndicPro Manager_`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Génère un lien de partage pour une sélection de réclamations
 */
export const generateComplaintsWhatsAppLink = (complaints: Complaint[], buildingName: string) => {
  if (complaints.length === 0) return null;

  let message = `📢 *Liste des Réclamations - ${buildingName}*\n`;
  message += `----------------------------\n\n`;

  complaints.forEach((c, index) => {
    const priorityEmoji = c.priority === 'high' ? '🔴' : c.priority === 'medium' ? '🟡' : '🟢';
    const statusLabel = c.status === 'resolved' ? 'Résolu' : c.status === 'pending' ? 'En attente' : 'Ouvert';
    
    message += `${index + 1}. 🏠 *Appartement ${c.apartmentNumber}*\n`;
    message += `📝 *Description:* ${c.description}\n`;
    message += `${priorityEmoji} *Urgence:* ${c.priority.toUpperCase()}\n`;
    message += `📌 *Statut:* ${statusLabel}\n`;
    message += `----------------------------\n\n`;
  });

  message += `_Total: ${complaints.length} réclamation(s)_`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};
