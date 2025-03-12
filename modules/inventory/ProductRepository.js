/**
 * Référentiel des produits - Gestion des accès aux données
 * Fichier: modules/inventory/ProductRepository.js
 * 
 * Ce référentiel fournit une interface pour accéder et manipuler les données
 * des produits stockées dans IndexedDB. Il gère également les mouvements
 * d'inventaire.
 */

/**
 * Référentiel des produits
 */
const ProductRepository = {
    /**
     * Initialise le référentiel
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init() {
      // Vérifier que la connexion à la base de données est établie
      if (!window.db) {
        throw new Error('La connexion à la base de données n\'est pas disponible');
      }
      
      console.log('Référentiel des produits initialisé');
    },
    
    /**
     * Récupère tous les produits
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Liste des produits
     */
    async getAll(filters = {}) {
      try {
        let products = await window.db.getAll('PRODUCTS');
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par statut actif/inactif
          if (filters.active !== undefined) {
            products = products.filter(product => product.is_active === filters.active);
          }
          
          // Filtre par catégorie
          if (filters.category) {
            products = products.filter(product => product.category === filters.category);
          }
          
          // Filtre par niveau de stock
          if (filters.stockStatus) {
            switch (filters.stockStatus) {
              case 'low':
                products = products.filter(product => 
                  product.quantity > 0 && product.quantity <= product.min_stock
                );
                break;
              case 'out':
                products = products.filter(product => product.quantity <= 0);
                break;
              case 'ok':
                products = products.filter(product => product.quantity > product.min_stock);
                break;
            }
          }
          
          // Filtre par texte (nom ou description)
          if (filters.search) {
            const search = filters.search.toLowerCase();
            products = products.filter(product => 
              product.name.toLowerCase().includes(search) || 
              (product.description && product.description.toLowerCase().includes(search))
            );
          }
        }
        
        return products;
      } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        throw new Error('Impossible de récupérer les produits');
      }
    },
    
    /**
     * Récupère un produit par son ID
     * @param {number} id - ID du produit
     * @returns {Promise<Object>} Le produit
     */
    async getById(id) {
      try {
        const product = await window.db.get('PRODUCTS', id);
        if (!product) {
          throw new Error(`Produit #${id} introuvable`);
        }
        return product;
      } catch (error) {
        console.error(`Erreur lors de la récupération du produit #${id}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère des produits par catégorie
     * @param {string} category - Catégorie de produit
     * @param {boolean} onlyActive - Si true, ne récupère que les produits actifs
     * @returns {Promise<Array>} Liste des produits de la catégorie
     */
    async getByCategory(category, onlyActive = true) {
      try {
        const products = await this.getAll({
          category: category,
          active: onlyActive ? true : undefined
        });
        return products;
      } catch (error) {
        console.error(`Erreur lors de la récupération des produits de la catégorie "${category}":`, error);
        throw error;
      }
    },
    
    /**
     * Récupère les produits dont le stock est bas ou épuisé
     * @returns {Promise<Array>} Liste des produits avec stock bas ou épuisé
     */
    async getLowStockProducts() {
      try {
        const products = await window.db.getAll('PRODUCTS');
        return products.filter(product => 
          product.is_active && product.quantity <= product.min_stock
        );
      } catch (error) {
        console.error('Erreur lors de la récupération des produits à stock bas:', error);
        throw error;
      }
    },
    
    /**
     * Récupère toutes les catégories de produits
     * @returns {Promise<Array>} Liste des catégories uniques
     */
    async getAllCategories() {
      try {
        const products = await window.db.getAll('PRODUCTS');
        const categories = products.map(product => product.category);
        
        // Extraire les catégories uniques et les trier
        return [...new Set(categories)].filter(Boolean).sort();
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        throw error;
      }
    },
    
    /**
     * Crée un nouveau produit
     * @param {Object} productData - Données du produit
     * @returns {Promise<number>} ID du nouveau produit
     */
    async create(productData) {
      try {
        // Vérifier les champs obligatoires
        if (!productData.name) {
          throw new Error('Le nom du produit est obligatoire');
        }
        
        if (!productData.category) {
          throw new Error('La catégorie du produit est obligatoire');
        }
        
        // Valeurs par défaut
        const defaultProduct = {
          is_active: true,
          quantity: 0,
          min_stock: 0,
          unit: 'unité',
          purchase_price: 0,
          selling_price: 0,
          description: '',
          image_url: ''
        };
        
        // Fusionner avec les valeurs par défaut
        const newProduct = { ...defaultProduct, ...productData };
        
        // Créer le produit
        const productId = await window.db.add('PRODUCTS', newProduct);
        console.log(`Produit #${productId} créé avec succès`);
        
        // Ajouter une entrée dans le journal d'inventaire si le stock initial est > 0
        if (newProduct.quantity > 0) {
          await this.addInventoryLogEntry(
            productId,
            newProduct.quantity,
            'initial',
            'entry',
            'Création du produit',
            'Stock initial'
          );
        }
        
        return productId;
      } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        throw error;
      }
    },
    
    /**
     * Met à jour un produit existant
     * @param {Object} productData - Données du produit
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async update(productData) {
      try {
        // Vérifier que l'ID est défini
        if (!productData.id) {
          throw new Error('L\'ID du produit est obligatoire pour la mise à jour');
        }
        
        // Vérifier que le produit existe
        const existingProduct = await this.getById(productData.id);
        
        // Détecter les modifications de stock
        const hasStockChange = existingProduct.quantity !== productData.quantity;
        const oldQuantity = existingProduct.quantity;
        const newQuantity = productData.quantity;
        
        // Mise à jour du produit
        await window.db.update('PRODUCTS', productData);
        
        // Ajouter une entrée de journal si le stock a été modifié manuellement
        if (hasStockChange) {
          const difference = newQuantity - oldQuantity;
          const type = difference > 0 ? 'entry' : 'exit';
          
          await this.addInventoryLogEntry(
            productData.id,
            Math.abs(difference),
            'manual',
            type,
            'Mise à jour manuelle du produit',
            'Ajustement lors de la modification du produit'
          );
        }
        
        console.log(`Produit #${productData.id} mis à jour avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du produit #${productData.id}:`, error);
        throw error;
      }
    },
    
    /**
     * Met à jour la quantité en stock d'un produit
     * @param {number} productId - ID du produit
     * @param {number} quantity - Nouvelle quantité
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateQuantity(productId, quantity) {
      try {
        // Récupérer le produit
        const product = await this.getById(productId);
        
        // Mettre à jour la quantité
        product.quantity = quantity;
        
        // Enregistrer le produit
        await window.db.update('PRODUCTS', product);
        
        console.log(`Quantité du produit #${productId} mise à jour: ${quantity}`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la quantité du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Modifie le stock d'un produit (entrée ou sortie)
     * @param {number} productId - ID du produit
     * @param {number} quantityChange - Quantité à ajouter (positif) ou soustraire (négatif)
     * @param {string} reason - Raison du mouvement
     * @param {string} reference - Référence (ex: numéro de commande, facture)
     * @param {string} note - Note utilisateur
     * @returns {Promise<boolean>} True si la modification a réussi
     */
    async modifyStock(productId, quantityChange, reason, reference, note) {
      try {
        // Récupérer le produit
        const product = await this.getById(productId);
        
        // Calculer la nouvelle quantité
        const newQuantity = product.quantity + quantityChange;
        
        // Vérifier que la quantité ne devient pas négative
        if (newQuantity < 0) {
          throw new Error(`La quantité du produit "${product.name}" ne peut pas être négative`);
        }
        
        // Mettre à jour la quantité
        product.quantity = newQuantity;
        await window.db.update('PRODUCTS', product);
        
        // Ajouter une entrée dans le journal d'inventaire
        const type = quantityChange > 0 ? 'entry' : 'exit';
        await this.addInventoryLogEntry(
          productId,
          Math.abs(quantityChange),
          reason,
          type,
          reference,
          note
        );
        
        return true;
      } catch (error) {
        console.error(`Erreur lors de la modification du stock du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Ajoute une entrée au journal d'inventaire
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité concernée
     * @param {string} reason - Raison du mouvement
     * @param {string} type - Type de mouvement (entry, exit)
     * @param {string} reference - Référence (ex: numéro de commande)
     * @param {string} note - Note utilisateur
     * @returns {Promise<number>} ID de l'entrée de journal
     */
    async addInventoryLogEntry(productId, quantity, reason, type, reference, note) {
      try {
        const logEntry = {
          product_id: productId,
          date: new Date().toISOString(),
          quantity: quantity,
          reason: reason,
          type: type,
          reference: reference,
          user_note: note || ''
        };
        
        const entryId = await window.db.add('INVENTORY_LOG', logEntry);
        console.log(`Entrée de journal #${entryId} ajoutée pour le produit #${productId}`);
        
        return entryId;
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'une entrée au journal d\'inventaire:', error);
        throw error;
      }
    },
    
    /**
     * Récupère le journal d'inventaire pour un produit
     * @param {number} productId - ID du produit
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Entrées de journal
     */
    async getProductInventoryLog(productId, filters = {}) {
      try {
        // Récupérer toutes les entrées pour ce produit
        const logEntries = await window.db.getByIndex('INVENTORY_LOG', 'product_id', productId);
        
        // Appliquer les filtres
        let filteredEntries = logEntries;
        
        if (filters) {
          // Filtre par date de début
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredEntries = filteredEntries.filter(entry => 
              new Date(entry.date) >= startDate
            );
          }
          
          // Filtre par date de fin
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filteredEntries = filteredEntries.filter(entry => 
              new Date(entry.date) <= endDate
            );
          }
          
          // Filtre par type
          if (filters.type) {
            filteredEntries = filteredEntries.filter(entry => 
              entry.type === filters.type
            );
          }
          
          // Filtre par raison
          if (filters.reason) {
            filteredEntries = filteredEntries.filter(entry => 
              entry.reason === filters.reason
            );
          }
        }
        
        // Trier par date (du plus récent au plus ancien)
        return filteredEntries.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
      } catch (error) {
        console.error(`Erreur lors de la récupération du journal d'inventaire pour le produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère le journal d'inventaire global
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Entrées de journal
     */
    async getInventoryLog(filters = {}) {
      try {
        // Récupérer toutes les entrées
        let logEntries = await window.db.getAll('INVENTORY_LOG');
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par date de début
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            logEntries = logEntries.filter(entry => 
              new Date(entry.date) >= startDate
            );
          }
          
          // Filtre par date de fin
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            logEntries = logEntries.filter(entry => 
              new Date(entry.date) <= endDate
            );
          }
          
          // Filtre par produit
          if (filters.productId) {
            logEntries = logEntries.filter(entry => 
              entry.product_id === filters.productId
            );
          }
          
          // Filtre par type
          if (filters.type) {
            logEntries = logEntries.filter(entry => 
              entry.type === filters.type
            );
          }
          
          // Filtre par raison
          if (filters.reason) {
            logEntries = logEntries.filter(entry => 
              entry.reason === filters.reason
            );
          }
        }
        
        // Trier par date (du plus récent au plus ancien)
        const sortedEntries = logEntries.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        // Enrichir avec les informations des produits
        return await Promise.all(sortedEntries.map(async entry => {
          try {
            const product = await this.getById(entry.product_id);
            return {
              ...entry,
              product_name: product.name,
              product_unit: product.unit
            };
          } catch (error) {
            return {
              ...entry,
              product_name: `Produit #${entry.product_id}`,
              product_unit: 'unité'
            };
          }
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération du journal d\'inventaire:', error);
        throw error;
      }
    },
    
    /**
     * Supprime un produit
     * @param {number} productId - ID du produit à supprimer
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async delete(productId) {
      try {
        // Vérifier si le produit est utilisé dans des commandes
        const orderItems = await window.db.getByIndex('ORDER_ITEMS', 'product_id', productId);
        
        if (orderItems.length > 0) {
          // Au lieu de supprimer, désactiver le produit
          const product = await this.getById(productId);
          product.is_active = false;
          await window.db.update('PRODUCTS', product);
          
          console.log(`Produit #${productId} désactivé (utilisé dans des commandes)`);
          return true;
        }
        
        // Supprimer le produit
        await window.db.delete('PRODUCTS', productId);
        
        console.log(`Produit #${productId} supprimé avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Vérifie et retourne les produits dont le stock est bas
     * @returns {Promise<Array>} Liste des produits avec stock bas
     */
    async checkLowStock() {
      try {
        const products = await window.db.getAll('PRODUCTS');
        
        // Filtrer les produits actifs dont le stock est inférieur ou égal au seuil minimal
        return products.filter(product => 
          product.is_active && 
          product.quantity <= product.min_stock &&
          product.min_stock > 0
        );
      } catch (error) {
        console.error('Erreur lors de la vérification des stocks bas:', error);
        throw error;
      }
    }
  };
  
  // Exposer le référentiel dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.inventory = window.modules.inventory || {};
  window.modules.inventory.ProductRepository = ProductRepository;
  
  // Exporter pour les imports ES6
  export default ProductRepository;