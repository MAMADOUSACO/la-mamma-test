/**
 * Utilitaires de stockage local pour l'application LA MAMMA
 */

const Storage = {
    /**
     * Préfixe pour toutes les clés de stockage
     */
    prefix: 'lamamma_',
    
    /**
     * Sauvegarde une valeur dans le localStorage
     * @param {string} key - Clé d'identification
     * @param {*} value - Valeur à sauvegarder
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si la sauvegarde a réussi
     */
    save: function(key, value, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const prefixedKey = this.prefix + key;
        
        // Convertir en chaîne JSON si ce n'est pas une chaîne
        const valueToStore = typeof value === 'string' 
          ? value 
          : JSON.stringify(value);
        
        storage.setItem(prefixedKey, valueToStore);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde de ${key}`, error);
        return false;
      }
    },
    
    /**
     * Récupère une valeur du localStorage
     * @param {string} key - Clé d'identification
     * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {*} - Valeur récupérée ou valeur par défaut
     */
    get: function(key, defaultValue = null, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const prefixedKey = this.prefix + key;
        const storedValue = storage.getItem(prefixedKey);
        
        if (storedValue === null) {
          return defaultValue;
        }
        
        // Essayer de parser en JSON, sinon retourner la chaîne
        try {
          return JSON.parse(storedValue);
        } catch (e) {
          return storedValue;
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de ${key}`, error);
        return defaultValue;
      }
    },
    
    /**
     * Supprime une valeur du localStorage
     * @param {string} key - Clé d'identification
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si la suppression a réussi
     */
    remove: function(key, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const prefixedKey = this.prefix + key;
        
        storage.removeItem(prefixedKey);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression de ${key}`, error);
        return false;
      }
    },
    
    /**
     * Vérifie si une clé existe dans le localStorage
     * @param {string} key - Clé d'identification
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si la clé existe
     */
    exists: function(key, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const prefixedKey = this.prefix + key;
        
        return storage.getItem(prefixedKey) !== null;
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'existence de ${key}`, error);
        return false;
      }
    },
    
    /**
     * Supprime toutes les valeurs du localStorage avec le préfixe
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si le nettoyage a réussi
     */
    clear: function(useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        
        // Ne supprimer que les clés avec notre préfixe
        const keys = Object.keys(storage);
        const prefixedKeys = keys.filter(key => key.startsWith(this.prefix));
        
        prefixedKeys.forEach(key => {
          storage.removeItem(key);
        });
        
        return true;
      } catch (error) {
        console.error('Erreur lors du nettoyage du stockage', error);
        return false;
      }
    },
    
    /**
     * Récupère toutes les valeurs du localStorage avec le préfixe
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {Object} - Objet contenant toutes les valeurs
     */
    getAll: function(useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const result = {};
        
        // Récupérer toutes les clés avec notre préfixe
        const keys = Object.keys(storage);
        const prefixedKeys = keys.filter(key => key.startsWith(this.prefix));
        
        prefixedKeys.forEach(key => {
          // Extraire la clé sans le préfixe
          const keyWithoutPrefix = key.substring(this.prefix.length);
          
          // Récupérer et parser la valeur
          const storedValue = storage.getItem(key);
          let value;
          
          try {
            value = JSON.parse(storedValue);
          } catch (e) {
            value = storedValue;
          }
          
          result[keyWithoutPrefix] = value;
        });
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la récupération de toutes les valeurs', error);
        return {};
      }
    },
    
    /**
     * Enregistre toutes les valeurs d'un objet dans le localStorage
     * @param {Object} data - Objet contenant les valeurs à sauvegarder
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si la sauvegarde a réussi
     */
    saveAll: function(data, useSession = false) {
      try {
        if (typeof data !== 'object' || data === null) {
          throw new Error('Les données doivent être un objet');
        }
        
        // Sauvegarder chaque propriété de l'objet
        Object.keys(data).forEach(key => {
          this.save(key, data[key], useSession);
        });
        
        return true;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de toutes les valeurs', error);
        return false;
      }
    },
    
    /**
     * Sauvegarde une valeur dans le localStorage avec une date d'expiration
     * @param {string} key - Clé d'identification
     * @param {*} value - Valeur à sauvegarder
     * @param {number} expirationMinutes - Durée de validité en minutes
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {boolean} - True si la sauvegarde a réussi
     */
    saveWithExpiration: function(key, value, expirationMinutes, useSession = false) {
      try {
        const now = new Date();
        const expirationMs = expirationMinutes * 60 * 1000;
        const expirationTime = now.getTime() + expirationMs;
        
        const dataWithExpiration = {
          value: value,
          expiration: expirationTime
        };
        
        return this.save(key, dataWithExpiration, useSession);
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde avec expiration de ${key}`, error);
        return false;
      }
    },
    
    /**
     * Récupère une valeur du localStorage avec vérification d'expiration
     * @param {string} key - Clé d'identification
     * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas ou est expirée
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {*} - Valeur récupérée ou valeur par défaut
     */
    getWithExpiration: function(key, defaultValue = null, useSession = false) {
      try {
        const data = this.get(key, null, useSession);
        
        if (!data || typeof data !== 'object' || !data.value || !data.expiration) {
          return defaultValue;
        }
        
        const now = new Date().getTime();
        
        if (now > data.expiration) {
          // La donnée est expirée, la supprimer et retourner la valeur par défaut
          this.remove(key, useSession);
          return defaultValue;
        }
        
        return data.value;
      } catch (error) {
        console.error(`Erreur lors de la récupération avec expiration de ${key}`, error);
        return defaultValue;
      }
    },
    
    /**
     * Vérifie si le stockage local est disponible
     * @param {string} type - Type de stockage ('localStorage' ou 'sessionStorage')
     * @returns {boolean} - True si le stockage est disponible
     */
    isStorageAvailable: function(type = 'localStorage') {
      try {
        const storage = window[type];
        const testKey = '__storage_test__';
        
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        
        return true;
      } catch (e) {
        return false;
      }
    },
    
    /**
     * Récupère l'espace utilisé dans le stockage local (en octets)
     * @param {boolean} useSession - Utiliser sessionStorage au lieu de localStorage
     * @returns {number} - Espace utilisé en octets
     */
    getStorageUsage: function(useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        let totalSize = 0;
        
        // Calculer la taille pour chaque élément
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          
          // Ne compter que les clés avec notre préfixe
          if (key.startsWith(this.prefix)) {
            const value = storage.getItem(key);
            totalSize += key.length + value.length;
          }
        }
        
        return totalSize;
      } catch (error) {
        console.error('Erreur lors du calcul de l\'utilisation du stockage', error);
        return 0;
      }
    },
    
    /**
     * Sauvegarde l'état de l'application pour la reprise plus tard
     * @param {Object} appState - État de l'application
     * @returns {boolean} - True si la sauvegarde a réussi
     */
    saveAppState: function(appState) {
      return this.save('app_state', appState);
    },
    
    /**
     * Récupère l'état sauvegardé de l'application
     * @returns {Object|null} - État de l'application ou null
     */
    getAppState: function() {
      return this.get('app_state', null);
    },
    
    /**
     * Sauvegarde les préférences utilisateur
     * @param {Object} preferences - Préférences utilisateur
     * @returns {boolean} - True si la sauvegarde a réussi
     */
    saveUserPreferences: function(preferences) {
      return this.save('user_preferences', preferences);
    },
    
    /**
     * Récupère les préférences utilisateur
     * @returns {Object} - Préférences utilisateur
     */
    getUserPreferences: function() {
      return this.get('user_preferences', {});
    }
  };
  
  // Exporter l'utilitaire
  window.utils = window.utils || {};
  window.utils.storage = Storage;