/**
 * Système de migrations pour la base de données IndexedDB
 * Permet de gérer les évolutions du schéma de façon contrôlée
 */

/**
 * Classe MigrationManager - Gère les migrations de la base de données
 */
class MigrationManager {
    constructor() {
      this.db = window.db;
      this.migrations = [];
      this.currentVersion = window.DBConfig.version;
      this.logMigrations = window.DBConfig.migration.logMigrations;
      this.failOnError = window.DBConfig.migration.failOnError;
    }
  
    /**
     * Ajoute une migration à la liste
     * @param {number} version - Version cible de la migration
     * @param {Function} migrationFunction - Fonction de migration à exécuter
     * @param {string} description - Description de la migration
     */
    addMigration(version, migrationFunction, description) {
      this.migrations.push({
        version,
        execute: migrationFunction,
        description
      });
      
      // Trier les migrations par version
      this.migrations.sort((a, b) => a.version - b.version);
      
      if (this.logMigrations) {
        console.log(`Migration enregistrée pour la version ${version}: ${description}`);
      }
    }
  
    /**
     * Exécute les migrations nécessaires pour atteindre la version cible
     * @param {IDBDatabase} db - L'instance de la base de données
     * @param {number} oldVersion - Version actuelle de la base de données
     * @param {number} newVersion - Version cible de la base de données
     * @returns {Promise} - Résolu lorsque toutes les migrations sont terminées
     */
    async executeMigrations(db, oldVersion, newVersion) {
      if (this.logMigrations) {
        console.log(`Exécution des migrations de la version ${oldVersion} vers ${newVersion}`);
      }
      
      // Filtrer les migrations à exécuter
      const migrationsToExecute = this.migrations.filter(
        migration => migration.version > oldVersion && migration.version <= newVersion
      );
      
      if (migrationsToExecute.length === 0) {
        console.log("Aucune migration à exécuter");
        return Promise.resolve();
      }
      
      // Exécuter les migrations séquentiellement
      for (const migration of migrationsToExecute) {
        try {
          if (this.logMigrations) {
            console.log(`Exécution de la migration vers v${migration.version}: ${migration.description}`);
          }
          
          await migration.execute(db);
          
          if (this.logMigrations) {
            console.log(`Migration vers v${migration.version} terminée avec succès`);
          }
        } catch (error) {
          console.error(`Erreur lors de la migration vers v${migration.version}:`, error);
          
          if (this.failOnError) {
            throw error;
          }
        }
      }
    }
  
    /**
     * Initialise les données pour une nouvelle base de données
     * @param {IDBDatabase} db - L'instance de la base de données
     * @returns {Promise} - Résolu lorsque toutes les initialisations sont terminées
     */
    async initializeData(db) {
      if (this.logMigrations) {
        console.log("Initialisation des données de base");
      }
      
      try {
        // Créer les données initiales pour chaque table
        await this._initializeProducts(db);
        await this._initializeTables(db);
        await this._initializeSettings(db);
        
        if (this.logMigrations) {
          console.log("Initialisation des données terminée avec succès");
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation des données:", error);
        
        if (this.failOnError) {
          throw error;
        }
      }
    }
  
    /**
     * Initialise les produits par défaut
     * @param {IDBDatabase} db - L'instance de la base de données
     * @private
     */
    async _initializeProducts(db) {
      const transaction = db.transaction("products", "readwrite");
      const store = transaction.objectStore("products");
      
      // Quelques produits par défaut
      const defaultProducts = [
        {
          name: "Pizza Margherita",
          category: "pizzas",
          quantity: 0,
          unit: "unit",
          min_stock: 0,
          purchase_price: 3.5,
          selling_price: 9.5,
          description: "Tomate, mozzarella, basilic frais",
          is_active: true
        },
        {
          name: "Pâtes Carbonara",
          category: "pastas",
          quantity: 0,
          unit: "unit",
          min_stock: 0,
          purchase_price: 2.8,
          selling_price: 11.9,
          description: "Crème fraîche, œuf, lardons, parmesan",
          is_active: true
        },
        {
          name: "Tiramisu",
          category: "desserts",
          quantity: 0,
          unit: "unit",
          min_stock: 0,
          purchase_price: 2.2,
          selling_price: 6.5,
          description: "Mascarpone, café, biscuits, cacao",
          is_active: true
        },
        {
          name: "Farine type 00",
          category: "supplies",
          quantity: 25,
          unit: "kg",
          min_stock: 10,
          purchase_price: 1.2,
          selling_price: 0,
          description: "Farine italienne pour pizzas",
          is_active: true
        },
        {
          name: "Mozzarella",
          category: "supplies",
          quantity: 15,
          unit: "kg",
          min_stock: 5,
          purchase_price: 7.5,
          selling_price: 0,
          description: "Mozzarella Fior di Latte",
          is_active: true
        }
      ];
      
      for (const product of defaultProducts) {
        await new Promise((resolve, reject) => {
          const request = store.add(product);
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });
    }
  
    /**
     * Initialise les tables par défaut
     * @param {IDBDatabase} db - L'instance de la base de données
     * @private
     */
    async _initializeTables(db) {
      const transaction = db.transaction("tables", "readwrite");
      const store = transaction.objectStore("tables");
      
      // Tables par défaut
      const defaultTables = [];
      
      // Créer 15 tables avec configurations variées
      for (let i = 1; i <= 15; i++) {
        let capacity, shape;
        
        // Varier les capacités et formes
        if (i <= 5) {
          capacity = 2;
          shape = "round";
        } else if (i <= 10) {
          capacity = 4;
          shape = i % 2 === 0 ? "square" : "round";
        } else if (i <= 13) {
          capacity = 6;
          shape = "rectangle";
        } else {
          capacity = 8;
          shape = "rectangle";
        }
        
        // Calculer la position sur une grille imaginaire
        const col = (i - 1) % 5;
        const row = Math.floor((i - 1) / 5);
        
        defaultTables.push({
          number: i,
          capacity,
          position_x: 50 + col * 120,
          position_y: 50 + row * 120,
          status: "available",
          shape,
          size: shape === "rectangle" ? "120x80" : "80x80"
        });
      }
      
      for (const table of defaultTables) {
        await new Promise((resolve, reject) => {
          const request = store.add(table);
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });
    }
  
    /**
     * Initialise les paramètres par défaut
     * @param {IDBDatabase} db - L'instance de la base de données
     * @private
     */
    async _initializeSettings(db) {
      const transaction = db.transaction("settings", "readwrite");
      const store = transaction.objectStore("settings");
      
      // Paramètres par défaut
      const defaultSettings = [
        {
          id: "restaurant_info",
          category: "general",
          name: "Informations restaurant",
          value: {
            name: "LA MAMMA",
            address: "15 Rue de la Méditerranée",
            city: "Lyon",
            zipCode: "69003",
            phone: "04 72 XX XX XX",
            email: "contact@lamamma.fr"
          }
        },
        {
          id: "tax_rates",
          category: "accounting",
          name: "Taux de TVA",
          value: {
            standard: 20,
            reduced: 10,
            special: 5.5
          }
        },
        {
          id: "security_settings",
          category: "security",
          name: "Paramètres de sécurité",
          value: {
            password: "1234", // Dans une vraie application, ce serait un hash sécurisé
            requireLogin: true,
            autoLogout: true,
            autoLogoutDelay: 30 // minutes
          }
        },
        {
          id: "display_settings",
          category: "interface",
          name: "Paramètres d'affichage",
          value: {
            theme: "default",
            tablePlanMode: "grid",
            defaultModule: "dashboard"
          }
        }
      ];
      
      for (const setting of defaultSettings) {
        await new Promise((resolve, reject) => {
          const request = store.add(setting);
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });
    }
  }
  
  // Créer une instance du gestionnaire de migrations
  const migrationManager = new MigrationManager();
  
  // Exemple de migration pour une future version
  migrationManager.addMigration(2, async (db) => {
    // Exemple: Ajouter un nouveau champ à tous les produits
    const transaction = db.transaction("products", "readwrite");
    const store = transaction.objectStore("products");
    
    const products = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = reject;
    });
    
    for (const product of products) {
      // Ajouter un nouveau champ
      product.allergens = "";
      
      await new Promise((resolve, reject) => {
        const updateRequest = store.put(product);
        updateRequest.onsuccess = resolve;
        updateRequest.onerror = reject;
      });
    }
  }, "Ajout du champ 'allergens' aux produits");
  
  // Exporter le gestionnaire de migrations
  window.migrationManager = migrationManager;