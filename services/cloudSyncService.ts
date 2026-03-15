
/**
 * Service de synchronisation Cloud (Simulé)
 * Dans une application réelle, ce service appellerait une API REST avec authentification.
 */
export const cloudSyncService = {
  /**
   * Envoie l'intégralité des données vers le "serveur cloud"
   */
  pushToCloud: async (data: any): Promise<{ success: boolean; syncDate: string }> => {
    console.log("CloudSync: Préparation de l'envoi des données...", data);
    
    // Simulation de délai réseau
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation de succès (95% de réussite)
    const isError = Math.random() > 0.95;
    if (isError) {
      throw new Error("Erreur de connexion au serveur cloud distant.");
    }

    const syncDate = new Date().toISOString();
    // On simule une sauvegarde dans le cloud via un champ dédié du localStorage "cloud_backup"
    localStorage.setItem('syndic_cloud_backup', JSON.stringify({
      data,
      syncDate
    }));

    return { success: true, syncDate };
  },

  /**
   * Récupère la dernière sauvegarde depuis le "serveur cloud"
   */
  pullFromCloud: async (): Promise<{ data: any; syncDate: string } | null> => {
    console.log("CloudSync: Récupération de la dernière sauvegarde...");
    
    // Simulation de délai réseau
    await new Promise(resolve => setTimeout(resolve, 1500));

    const cloudData = localStorage.getItem('syndic_cloud_backup');
    if (!cloudData) {
      return null;
    }

    return JSON.parse(cloudData);
  }
};
