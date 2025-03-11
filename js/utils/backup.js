/**
 * Utilitaires de sauvegarde et restauration pour l'application LA MAMMA
 */

const BackupUtils = {
  /**
   * Préfixe pour les sauvegardes stockées localement
   */
  backupPrefix: 'backup_',
  
  /**
   * Crée une sauvegarde complète de la base de données
   * @param {string} description - Description de la sauvegarde
   * @returns {Promise<Object>} - Informations sur la sauvegarde créée
   */
  createBackup: async function(description = '') {
    try {
      const db = window.db;
      const exportUtils = window.utils.export;
      const storageUtils = window.utils.storage;
      
      console.log('Création d\'une sauvegarde complète...');
      
      // Exporter toutes les données de la base
      const exportData = await exportUtils.exportDatabase();
      
      // Ajouter des métadonnées à la sauvegarde
      const backupData = {
        id: this._generateBackupId(),
        timestamp: new Date().toISOString(),
        description: description || `Sauvegarde du ${new Date().toLocaleDateString('fr-FR')}`,
        version: window.DBConfig.version,
        data: exportData
      };
      
      // Stocker la sauvegarde dans le localStorage
      const backupKey = this.backupPrefix + backupData.id;
      
      // Vérifier si le stockage local est disponible et a assez d'espace
      if (!storageUtils.isStorageAvailable()) {
        throw new Error('Le stockage local n\'est pas disponible');
      }
      
      // Sauvegarder dans le stockage local
      const success = storageUtils.save(backupKey, backupData);
      
      if (!success) {
        throw new Error('Échec de la sauvegarde dans le stockage local');
      }
      
      // Gérer la rotation des sauvegardes (conserver uniquement les plus récentes)
      await this._manageBackupRotation();
      
      console.log(`Sauvegarde créée avec succès: ${backupData.id}`);
      
      return {
        id: backupData.id,
        timestamp: backupData.timestamp,
        description: backupData.description
      };
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde', error);
      throw error;
    }
  },
  
  /**
   * Télécharge une sauvegarde
   * @param {string} backupId - ID de la sauvegarde ou null pour une nouvelle sauvegarde
   * @param {string} fileName - Nom du fichier de sauvegarde
   * @returns {Promise<void>}
   */
  downloadBackup: async function(backupId = null, fileName = null) {
    try {
      const exportUtils = window.utils.export;
      const storageUtils = window.utils.storage;
      
      let backupData;
      
      if (backupId) {
        // Récupérer une sauvegarde existante
        const backupKey = this.backupPrefix + backupId;
        backupData = storageUtils.get(backupKey);
        
        if (!backupData) {
          throw new Error(`Sauvegarde ${backupId} non trouvée`);
        }
      } else {
        // Créer une nouvelle sauvegarde
        const backupInfo = await this.createBackup();
        const backupKey = this.backupPrefix + backupInfo.id;
        backupData = storageUtils.get(backupKey);
      }
      
      // Déterminer le nom de fichier
      const defaultFileName = `lamamma_backup_${backupData.id}.json`;
      const outputFileName = fileName || defaultFileName;
      
      // Télécharger la sauvegarde
      exportUtils.exportAsJSON(backupData, outputFileName);
      
      console.log(`Sauvegarde téléchargée: ${outputFileName}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement de la sauvegarde', error);
      throw error;
    }
  },
  
  /**
   * Liste toutes les sauvegardes disponibles
   * @returns {Array} - Liste des sauvegardes
   */
  listBackups: function() {
    try {
      const storageUtils = window.utils.storage;
      const allData = storageUtils.getAll();
      
      // Filtrer les sauvegardes
      const backups = [];
      
      for (const key in allData) {
        if (key.startsWith(this.backupPrefix)) {
          const backup = allData[key];
          backups.push({
            id: backup.id,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp),
            description: backup.description,
            version: backup.version,
            size: JSON.stringify(backup).length
          });
        }
      }
      
      // Trier par date (le plus récent d'abord)
      backups.sort((a, b) => b.date - a.date);
      
      return backups;
    } catch (error) {
      console.error('Erreur lors de la liste des sauvegardes', error);
      return [];
    }
  },
  
  /**
   * Restaure une sauvegarde
   * @param {string|Object} backup - ID de la sauvegarde ou objet de sauvegarde
   * @returns {Promise<boolean>} - True si la restauration a réussi
   */
  restoreBackup: async function(backup) {
    try {
      const db = window.db;
      const storageUtils = window.utils.storage;
      
      let backupData;
      
      if (typeof backup === 'string') {
        // Chercher la sauvegarde par ID
        const backupKey = this.backupPrefix + backup;
        backupData = storageUtils.get(backupKey);
        
        if (!backupData) {
          throw new Error(`Sauvegarde ${backup} non trouvée`);
        }
      } else if (typeof backup === 'object' && backup !== null) {
        // Utiliser l'objet de sauvegarde fourni
        backupData = backup;
      } else {
        throw new Error('Format de sauvegarde invalide');
      }
      
      // Vérifier la compatibilité de version
      if (backupData.version > window.DBConfig.version) {
        throw new Error(`La sauvegarde est d'une version plus récente (${backupData.version}) que l'application (${window.DBConfig.version})`);
      }
      
      console.log(`Restauration de la sauvegarde ${backupData.id}...`);
      
      // Récupérer les données à restaurer
      const exportData = backupData.data;
      
      // Pour chaque table, supprimer les données existantes et insérer les nouvelles
      for (const storeName in exportData.tables) {
        // Vérifier que la table existe dans la configuration actuelle
        if (!window.DBConfig.stores[storeName]) {
          console.warn(`Table ${storeName} non définie dans la configuration actuelle, ignorée.`);
          continue;
        }
        
        // Récupérer les données à restaurer
        const tableData = exportData.tables[storeName];
        
        // Supprimer les données existantes
        await db.clear(storeName);
        console.log(`Données existantes supprimées pour la table ${storeName}`);
        
        // Insérer les nouvelles données
        for (const item of tableData) {
          await db.add(storeName, item);
        }
        
        console.log(`${tableData.length} enregistrements restaurés dans la table ${storeName}`);
      }
      
      console.log('Restauration terminée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la restauration de la sauvegarde', error);
      throw error;
    }
  },
  
  /**
   * Restaure une sauvegarde à partir d'un fichier
   * @param {File} file - Fichier de sauvegarde
   * @returns {Promise<boolean>} - True si la restauration a réussi
   */
  restoreFromFile: async function(file) {
    try {
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }
      
      // Vérifier le type de fichier
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        throw new Error('Le fichier doit être au format JSON');
      }
      
      console.log(`Lecture du fichier de sauvegarde: ${file.name}`);
      
      // Lire le contenu du fichier
      const fileContent = await this._readFileAsText(file);
      
      // Parser le JSON
      try {
        const backupData = JSON.parse(fileContent);
        
        // Vérifier la structure de la sauvegarde
        if (!backupData.id || !backupData.timestamp || !backupData.data || !backupData.data.tables) {
          throw new Error('Format de sauvegarde invalide');
        }
        
        // Restaurer la sauvegarde
        return await this.restoreBackup(backupData);
      } catch (parseError) {
        throw new Error(`Erreur lors de l'analyse du fichier JSON: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration depuis un fichier', error);
      throw error;
    }
  },
  
  /**
   * Supprime une sauvegarde
   * @param {string} backupId - ID de la sauvegarde
   * @returns {boolean} - True si la suppression a réussi
   */
  deleteBackup: function(backupId) {
    try {
      const storageUtils = window.utils.storage;
      const backupKey = this.backupPrefix + backupId;
      
      // Vérifier si la sauvegarde existe
      if (!storageUtils.exists(backupKey)) {
        throw new Error(`Sauvegarde ${backupId} non trouvée`);
      }
      
      // Supprimer la sauvegarde
      const success = storageUtils.remove(backupKey);
      
      if (success) {
        console.log(`Sauvegarde ${backupId} supprimée`);
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde', error);
      return false;
    }
  },
  
  /**
   * Configure la sauvegarde automatique
   * @param {boolean} enabled - Activer/désactiver la sauvegarde automatique
   * @param {number} interval - Intervalle en heures
   * @returns {boolean} - True si la configuration a réussi
   */
  configureAutoBackup: function(enabled, interval = 24) {
    try {
      const storageUtils = window.utils.storage;
      
      // Sauvegarder la configuration
      const config = {
        enabled: enabled,
        interval: interval, // en heures
        lastBackup: enabled ? storageUtils.get('lastAutoBackup') : null
      };
      
      storageUtils.save('autoBackupConfig', config);
      
      console.log(`Sauvegarde automatique ${enabled ? 'activée' : 'désactivée'} (intervalle: ${interval}h)`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la configuration de la sauvegarde automatique', error);
      return false;
    }
  },
  
  /**
   * Vérifie si une sauvegarde automatique est nécessaire
   * @returns {Promise<boolean>} - True si une sauvegarde a été effectuée
   */
  checkAutoBackup: async function() {
    try {
      const storageUtils = window.utils.storage;
      
      // Récupérer la configuration
      const config = storageUtils.get('autoBackupConfig');
      
      if (!config || !config.enabled) {
        return false;
      }
      
      // Récupérer la date de la dernière sauvegarde
      const lastBackup = storageUtils.get('lastAutoBackup');
      const now = new Date();
      
      // Si aucune sauvegarde n'a été faite ou si l'intervalle est dépassé
      if (!lastBackup) {
        // Première sauvegarde
        await this.createBackup('Sauvegarde automatique initiale');
        storageUtils.save('lastAutoBackup', now.toISOString());
        return true;
      } else {
        const lastBackupDate = new Date(lastBackup);
        const intervalMs = config.interval * 60 * 60 * 1000; // conversion en millisecondes
        
        if (now - lastBackupDate >= intervalMs) {
          // Intervalle dépassé, faire une sauvegarde
          await this.createBackup('Sauvegarde automatique périodique');
          storageUtils.save('lastAutoBackup', now.toISOString());
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de la sauvegarde automatique', error);
      return false;
    }
  },
  
  /**
   * Lit un fichier en tant que texte
   * @param {File} file - Fichier à lire
   * @returns {Promise<string>} - Contenu du fichier
   * @private
   */
  _readFileAsText: function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  },
  
  /**
   * Génère un ID unique pour une sauvegarde
   * @returns {string} - ID unique
   * @private
   */
  _generateBackupId: function() {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    return timestamp;
  },
  
  /**
   * Gère la rotation des sauvegardes (conserve uniquement les plus récentes)
   * @returns {Promise<void>}
   * @private
   */
  _manageBackupRotation: async function() {
    try {
      const maxBackups = window.AppConfig.backup.maxLocalBackups || 7;
      
      // Lister toutes les sauvegardes
      const backups = this.listBackups();
      
      // Si le nombre de sauvegardes dépasse la limite, supprimer les plus anciennes
      if (backups.length > maxBackups) {
        // Déterminer combien de sauvegardes à supprimer
        const countToDelete = backups.length - maxBackups;
        
        // Récupérer les sauvegardes les plus anciennes
        const backupsToDelete = backups.slice(-countToDelete);
        
        for (const backup of backupsToDelete) {
          this.deleteBackup(backup.id);
        }
        
        console.log(`Rotation des sauvegardes: ${countToDelete} sauvegarde(s) supprimée(s)`);
      }
    } catch (error) {
      console.error('Erreur lors de la rotation des sauvegardes', error);
    }
  }
};

// Exporter l'utilitaire
window.utils = window.utils || {};
window.utils.backup = BackupUtils;