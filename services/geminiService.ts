
import { GoogleGenAI } from "@google/genai";
import { Apartment, Expense, Payment } from "../types";

export const analyzeFinances = async (
  apartments: Apartment[],
  expenses: Expense[],
  payments: Payment[],
  period: string
) => {
  // Always create a new GoogleGenAI instance right before the API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Filtrer les dépenses exclues pour l'analyse financière
  const includedExpenses = expenses.filter(e => !e.excludedFromReports);

  const dataSummary = {
    nbApartments: apartments.length,
    totalExpenses: includedExpenses.reduce((sum, e) => sum + e.amount, 0),
    totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
    expenseCategories: includedExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>),
  };

  const prompt = `En tant qu'expert en gestion de copropriété, analyse les données financières suivantes pour la période: ${period}.
  Données: ${JSON.stringify(dataSummary)}
  
  Note: Les dépenses exclues manuellement par le gérant ont déjà été filtrées.
  
  Fournis un rapport structuré en français comprenant:
  1. Un résumé de la santé financière.
  2. Les points d'attention (dépenses élevées, taux de recouvrement).
  3. Des recommandations pour optimiser le budget.
  4. Un court texte de synthèse pour le bilan annuel/mensuel.
  
  Réponds uniquement en texte structuré avec Markdown.`;

  try {
    // Using gemini-3-pro-preview for complex reasoning task (expert financial analysis).
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Access the text property directly (not a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Désolé, une erreur est survenue lors de l'analyse IA.";
  }
};
