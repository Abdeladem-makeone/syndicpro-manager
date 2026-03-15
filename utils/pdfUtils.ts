
// Add missing imports for PDF generation
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define theme colors for PDF generation consistent with the UI
const COLORS = {
  PRIMARY: [79, 70, 229], // indigo-600
  SECONDARY: [100, 116, 139], // slate-500
  SUCCESS: [16, 185, 129], // emerald-500
  DANGER: [239, 68, 68], // rose-500
  TEXT_DARK: [30, 41, 59], // slate-800
  WHITE: [255, 255, 255]
};

// Helper function to draw a consistent header on each PDF page
const drawHeader = (doc: any, title: string, subtitle: string) => {
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 34);
};

/**
 * Generic PDF export function used by various listing pages (Apartments, Expenses, Owners, Payments)
 */
export const exportToPDF = (title: string, headers: string[], rows: any[][], fileName: string) => {
  const doc = new jsPDF() as any;
  drawHeader(doc, "SYNDICPRO MANAGER", title.toUpperCase());
  
  doc.autoTable({
    startY: 50,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica', fontSize: 9 }
  });
  
  doc.save(`${fileName}.pdf`);
};

/**
 * Specialized export for cash flow state overview
 */
export const exportCashStatePDF = (buildingName: string, summary: any, transactions: any[]) => {
  const doc = new jsPDF() as any;
  drawHeader(doc, "ÉTAT DE CAISSE", buildingName.toUpperCase());

  doc.autoTable({
    startY: 50,
    head: [['Désignation', 'Valeur']],
    body: [
      ['Total Recettes', `${summary.totalRevenue.toLocaleString()} DH`],
      ['Total Dépenses', `${summary.totalExpenses.toLocaleString()} DH`],
      ['Solde Actuel', `${summary.balance.toLocaleString()} DH`]
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' }
  });

  doc.autoTable({
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Date', 'Type', 'Description', 'Montant']],
    body: transactions.map(t => [t.date, t.type, t.description, t.amount]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.SECONDARY },
    styles: { font: 'helvetica' }
  });

  doc.save(`Etat_Caisse_${buildingName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Detailed annual report with categories breakdown and unpaid status
 */
export const exportAnnualReportPDF = async (
  buildingName: string,
  year: number,
  summary: any,
  unpaidList: any[],
  expenseBreakdown: any[],
  revenueBreakdown: any[] // Nouveau paramètre
) => {
  const doc = new jsPDF() as any;

  drawHeader(doc, "BILAN ANNUEL DE GESTION", `${buildingName.toUpperCase()} - ANNÉE ${year}`);

  // Section I : Recettes Consolidées
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("I. RÉCAPITULATIF DES RECETTES", 14, 65);

  doc.autoTable({
    startY: 70,
    head: [['Source de Revenu', 'Montant Encaissé']],
    body: revenueBreakdown.map(r => [
      r.name,
      `${r.value.toLocaleString()} DH`
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' },
    columnStyles: { 1: { halign: 'right' } }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;

  // Section II : Résumé financier
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.text("II. ANALYSE FINANCIÈRE GLOBALE", 14, nextY);

  const drawStatBox = (x: number, y: number, label: string, value: string, color: number[]) => {
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(...COLORS.WHITE);
    doc.roundedRect(x, y, 60, 25, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.SECONDARY);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 5, y + 18);
  };

  drawStatBox(14, nextY + 10, "TOTAL RECETTES", `+${summary.totalRevenue.toLocaleString()} DH`, COLORS.SUCCESS);
  drawStatBox(77, nextY + 10, "TOTAL DÉPENSES", `-${summary.totalExpenses.toLocaleString()} DH`, COLORS.DANGER);
  drawStatBox(140, nextY + 10, "SOLDE NET", `${summary.balance.toLocaleString()} DH`, COLORS.PRIMARY);

  // Section III
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("III. ÉTAT DES CRÉANCES (IMPAYÉS RÉSIDENTS)", 14, nextY + 50);

  doc.autoTable({
    startY: nextY + 55,
    head: [['Appartement', 'Propriétaire', 'Retards', 'Montant Dû']],
    body: unpaidList.map(item => [
      item.number,
      item.owner,
      `${item.unpaidCount} mois`,
      `${item.totalOwed.toLocaleString()} DH`
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.DANGER },
    styles: { font: 'helvetica' },
    columnStyles: { 3: { halign: 'right' } }
  });

  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 200;
  
  // Section IV
  if (lastY < 230) {
    doc.text("IV. RÉPARTITION DES CHARGES", 14, lastY + 20);
    doc.autoTable({
      startY: lastY + 25,
      head: [['Catégorie', 'Montant', 'Part (%)']],
      body: expenseBreakdown.map(item => [
        item.name,
        `${item.value.toLocaleString()} DH`,
        `${item.percentage.toFixed(1)} %`
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.PRIMARY },
      styles: { font: 'helvetica' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } }
    });
  }

  doc.save(`Bilan_SyndicPro_${buildingName.replace(/\s+/g, '_')}_${year}.pdf`);
};
