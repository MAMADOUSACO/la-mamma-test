/**
 * Configuration et initialisation de la base de données IndexedDB
 * pour l'application LA MAMMA
 */

// Importer la configuration de la base de données
// Dans un environnement de production, on utiliserait des imports ES6 standards
// const DBConfig = require('../../config/db.config.js');
// Comme nous utilisons une approche basée sur le web classique, nous accédons à la config via window

/**
 * Classe DatabaseManager - Gère la connexion et les opérations avec IndexedDB
 */
class DatabaseManager {
    constructor() {
      this.db = null;
      this.dbName = window.DBConfig.name;
      this.dbVersion = window.DBConfig.version;
      this.stores = window.DBConfig.stores;
      this.isInitialized = false;
      this.initPromise = null;
    }
  
    /**
     * Initialise la connexion à la base de données
     * @returns {Promise} - Résolu lorsque la DB est prête
     */
    async init() {
      if (this.isInitialized) {
        return Promise.resolve(this.db);
      }
  
      if (this.initPromise) {
        return this.initPromise;
      }
  
      this.initPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          console.error("Votre navigateur ne supporte pas IndexedDB");
          reject(new Error("IndexedDB non supporté"));
          return;
        }
  
        console.log(`Ouverture de la base de données ${this.dbName} v${this.dbVersion}`);
        const request = window.indexedDB.open(this.dbName, this.dbVersion);
  
        request.onerror = (event) => {
          console.error("Erreur d'ouverture de la base de données", event);
          reject(new Error("Erreur d'ouverture de la base de données"));
        };
  
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isInitialized = true;
          console.log("Base de données ouverte avec succès");
          
          // Écouter les erreurs de la base de données
          this.db.onerror = (event) => {
            console.error("Erreur de base de données", event);
          };
          
          resolve(this.db);
        };
  
        request.onupgradeneeded = (event) => {
          console.log("Mise à niveau de la base de données...");
          const db = event.target.result;
          
          // Créer ou mettre à jour les object stores (tables)
          this._createStores(db);
        };
      });
  
      return this.initPromise;
    }
  
    /**
     * Crée les "object stores" (tables) dans la base de données
     * @param {IDBDatabase} db - L'instance de la base de données
     * @private
     */
    _createStores(db) {
      // Parcourir les configurations des stores
      Object.keys(this.stores).forEach(storeName => {
        const storeConfig = this.stores[storeName];
        
        // Vérifier si le store existe déjà et le supprimer si nécessaire
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
        
        // Créer le store avec sa configuration
        console.log(`Création du store: ${storeName}`);
        const store = db.createObjectStore(storeName, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });
        
        // Créer les index pour ce store
        if (storeConfig.indexes && Array.isArray(storeConfig.indexes)) {
          storeConfig.indexes.forEach(indexConfig => {
            console.log(`Création de l'index: ${indexConfig.name} pour ${storeName}`);
            store.createIndex(indexConfig.name, indexConfig.keyPath, {
              unique: indexConfig.unique || false
            });
          });
        }
      });
      
      console.log("Création des stores terminée");
    }
  
    /**
     * Obtient une transaction en lecture seule
     * @param {string|string[]} storeNames - Nom du/des stores pour la transaction
     * @returns {IDBTransaction} - La transaction créée
     */
    getReadTransaction(storeNames) {
      return this.db.transaction(storeNames, "readonly");
    }
  
    /**
     * Obtient une transaction en lecture/écriture
     * @param {string|string[]} storeNames - Nom du/des stores pour la transaction
     * @returns {IDBTransaction} - La transaction créée
     */
    getWriteTransaction(storeNames) {
      return this.db.transaction(storeNames, "readwrite");
    }
  
    /**
     * Obtient un store à partir d'une transaction
     * @param {IDBTransaction} transaction - La transaction
     * @param {string} storeName - Nom du store
     * @returns {IDBObjectStore} - Le store demandé
     */
    getStoreFromTransaction(transaction, storeName) {
      return transaction.objectStore(storeName);
    }
  
    /**
     * Ajoute un élément dans un store
     * @param {string} storeName - Nom du store
     * @param {Object} data - Données à ajouter
     * @returns {Promise} - Résolu avec l'ID de l'élément ajouté
     */
    async add(storeName, data) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getWriteTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.add(data);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de l'ajout dans ${storeName}`, event);
          reject(new Error(`Erreur lors de l'ajout dans ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Met à jour un élément dans un store
     * @param {string} storeName - Nom du store
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise} - Résolu quand la mise à jour est terminée
     */
    async update(storeName, data) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getWriteTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.put(data);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de la mise à jour dans ${storeName}`, event);
          reject(new Error(`Erreur lors de la mise à jour dans ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Récupère un élément par sa clé
     * @param {string} storeName - Nom du store
     * @param {*} key - Clé de l'élément
     * @returns {Promise} - Résolu avec l'élément trouvé
     */
    async get(storeName, key) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getReadTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.get(key);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de la récupération depuis ${storeName}`, event);
          reject(new Error(`Erreur lors de la récupération depuis ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Récupère tous les éléments d'un store
     * @param {string} storeName - Nom du store
     * @returns {Promise} - Résolu avec un tableau des éléments
     */
    async getAll(storeName) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getReadTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.getAll();
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de la récupération de tous les éléments depuis ${storeName}`, event);
          reject(new Error(`Erreur lors de la récupération de tous les éléments depuis ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Supprime un élément par sa clé
     * @param {string} storeName - Nom du store
     * @param {*} key - Clé de l'élément à supprimer
     * @returns {Promise} - Résolu quand la suppression est terminée
     */
    async delete(storeName, key) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getWriteTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.delete(key);
        
        request.onsuccess = (event) => {
          resolve();
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de la suppression dans ${storeName}`, event);
          reject(new Error(`Erreur lors de la suppression dans ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Récupère des éléments selon un critère d'index
     * @param {string} storeName - Nom du store
     * @param {string} indexName - Nom de l'index
     * @param {*} value - Valeur recherchée
     * @returns {Promise} - Résolu avec un tableau des éléments correspondants
     */
    async getByIndex(storeName, indexName, value) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getReadTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        const index = store.index(indexName);
        
        const request = index.getAll(value);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors de la récupération par index depuis ${storeName}`, event);
          reject(new Error(`Erreur lors de la récupération par index depuis ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Efface tous les éléments d'un store
     * @param {string} storeName - Nom du store
     * @returns {Promise} - Résolu quand le nettoyage est terminé
     */
    async clear(storeName) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.getWriteTransaction(storeName);
        const store = this.getStoreFromTransaction(transaction, storeName);
        
        const request = store.clear();
        
        request.onsuccess = (event) => {
          resolve();
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors du nettoyage de ${storeName}`, event);
          reject(new Error(`Erreur lors du nettoyage de ${storeName}: ${event.target.error}`));
        };
      });
    }
  
    /**
     * Effectue une opération dans une transaction et assure sa complétion
     * @param {string|string[]} storeNames - Noms des stores
     * @param {function} callback - Fonction à exécuter dans la transaction
     * @param {boolean} readOnly - Si la transaction est en lecture seule
     * @returns {Promise} - Résolu avec le résultat du callback
     */
    async transact(storeNames, callback, readOnly = false) {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeNames, readOnly ? "readonly" : "readwrite");
        
        let result;
        try {
          result = callback(transaction);
        } catch (error) {
          reject(error);
          return;
        }
        
        transaction.oncomplete = () => {
          resolve(result);
        };
        
        transaction.onerror = (event) => {
          console.error("Erreur de transaction", event);
          reject(new Error(`Erreur de transaction: ${event.target.error}`));
        };
        
        transaction.onabort = (event) => {
          console.error("Transaction annulée", event);
          reject(new Error("Transaction annulée"));
        };
      });
    }
  }
  
  // Créer une instance unique du gestionnaire de base de données
  const dbManager = new DatabaseManager();
  
  // Exporter l'instance
  window.db = dbManager;