/**
 * Modèle Product - Gestion des produits du restaurant
 */

/**
 * Classe ProductModel - Interface pour les opérations sur les produits
 */
class ProductModel {
    constructor() {
      this.storeName = 'products';
      this.db = window.db;
    }
  
    /**
     * Récupère tous les produits
     * @param {boolean} onlyActive - Si true, ne renvoie que les produits actifs
     * @returns {Promise<Array>} - Liste des produits
     */
    async getAll(onlyActive = false) {
      try {
        const products = await this.db.getAll(this.storeName);
        
        if (onlyActive) {
          return products.filter(product => product.is_active);
        }
        
        return products;
      } catch (error) {
        console.error('Erreur lors de la récupération des produits', error);
        throw error;
      }
    }
  
    /**
     * Récupère un produit par son ID
     * @param {number} id - ID du produit
     * @returns {Promise<Object>} - Le produit demandé
     */
    async getById(id) {
      try {
        return await this.db.get(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la récupération du produit #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les produits par catégorie
     * @param {string} category - Catégorie des produits
     * @param {boolean} onlyActive - Si true, ne renvoie que les produits actifs
     * @returns {Promise<Array>} - Liste des produits de la catégorie
     */
    async getByCategory(category, onlyActive = true) {
      try {
        const products = await this.db.getByIndex(this.storeName, 'category', category);
        
        if (onlyActive) {
          return products.filter(product => product.is_active);
        }
        
        return products;
      } catch (error) {
        console.error(`Erreur lors de la récupération des produits de catégorie ${category}`, error);
        throw error;
      }
    }
  
    /**
     * Ajoute un nouveau produit
     * @param {Object} productData - Données du produit
     * @returns {Promise<number>} - ID du produit créé
     */
    async add(productData) {
      try {
        // Appliquer des valeurs par défaut si nécessaire
        const defaults = window.DefaultsConfig.defaultProduct || {};
        const product = { ...defaults, ...productData };
        
        // Validation des données
        this._validateProduct(product);
        
        return await this.db.add(this.storeName, product);
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un produit', error);
        throw error;
      }
    }
  
    /**
     * Met à jour un produit existant
     * @param {Object} productData - Données du produit avec ID
     * @returns {Promise<number>} - ID du produit mis à jour
     */
    async update(productData) {
      try {
        // Vérification de l'existence de l'ID
        if (!productData.id) {
          throw new Error('ID manquant pour la mise à jour du produit');
        }
        
        // Validation des données
        this._validateProduct(productData);
        
        return await this.db.update(this.storeName, productData);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du produit #${productData.id}`, error);
        throw error;
      }
    }
  
    /**
     * Modifie la quantité en stock d'un produit
     * @param {number} id - ID du produit
     * @param {number} quantityChange - Changement de quantité (positif ou négatif)
     * @param {string} reason - Raison du changement
     * @returns {Promise<Object>} - Produit mis à jour
     */
    async updateQuantity(id, quantityChange, reason) {
      try {
        // Récupérer le produit actuel
        const product = await this.getById(id);
        if (!product) {
          throw new Error(`Produit #${id} introuvable`);
        }
        
        // Mettre à jour la quantité
        product.quantity += quantityChange;
        
        // Si la quantité devient négative et que ce n'est pas un produit de menu
        if (product.quantity < 0 && product.unit !== 'unit') {
          throw new Error(`Stock insuffisant pour le produit ${product.name}`);
        }
        
        // Mettre à jour le produit
        await this.db.update(this.storeName, product);
        
        // Enregistrer le mouvement dans l'inventaire
        await this._logInventoryChange(id, quantityChange, reason);
        
        return product;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la quantité du produit #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Enregistre un mouvement dans le journal d'inventaire
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité changée
     * @param {string} reason - Raison du changement
     * @private
     */
    async _logInventoryChange(productId, quantity, reason) {
      try {
        const logEntry = {
          product_id: productId,
          date: new Date(),
          quantity: Math.abs(quantity),
          reason: reason,
          type: quantity >= 0 ? 'entry' : 'exit',
          reference: '',
          user_note: ''
        };
        
        await this.db.add('inventory_log', logEntry);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du mouvement d\'inventaire', error);
        // Ne pas propager l'erreur pour éviter de bloquer la mise à jour du produit
      }
    }
  
    /**
     * Supprime un produit (désactivation logique)
     * @param {number} id - ID du produit à supprimer
     * @returns {Promise<void>}
     */
    async delete(id) {
      try {
        // Récupérer le produit actuel
        const product = await this.getById(id);
        if (!product) {
          throw new Error(`Produit #${id} introuvable`);
        }
        
        // Désactivation logique
        product.is_active = false;
        
        await this.db.update(this.storeName, product);
      } catch (error) {
        console.error(`Erreur lors de la suppression du produit #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Vérifie les produits à faible stock
     * @returns {Promise<Array>} - Liste des produits en alerte de stock
     */
    async checkLowStock() {
      try {
        const products = await this.getAll(true); // Seulement les produits actifs
        
        return products.filter(product => 
          product.min_stock > 0 && // Produit ayant un seuil d'alerte
          product.quantity <= product.min_stock // Quantité inférieure ou égale au seuil
        );
      } catch (error) {
        console.error('Erreur lors de la vérification des stocks faibles', error);
        throw error;
      }
    }
  
    /**
     * Valide les données d'un produit
     * @param {Object} product - Produit à valider
     * @private
     * @throws {Error} Si la validation échoue
     */
    _validateProduct(product) {
      // Vérification des champs obligatoires
      if (!product.name || product.name.trim() === '') {
        throw new Error('Le nom du produit est obligatoire');
      }
      
      if (!product.category) {
        throw new Error('La catégorie du produit est obligatoire');
      }
      
      // Vérification des types de données
      if (typeof product.quantity !== 'number') {
        throw new Error('La quantité doit être un nombre');
      }
      
      if (typeof product.purchase_price !== 'number' || product.purchase_price < 0) {
        throw new Error('Le prix d\'achat doit être un nombre positif');
      }
      
      if (typeof product.selling_price !== 'number' || product.selling_price < 0) {
        throw new Error('Le prix de vente doit être un nombre positif');
      }
      
      // Vérifier que la catégorie existe
      const validCategories = window.DefaultsConfig.productCategories.map(cat => cat.id);
      if (!validCategories.includes(product.category)) {
        throw new Error(`Catégorie invalide: ${product.category}`);
      }
      
      // Vérifier que l'unité existe si spécifiée
      if (product.unit) {
        const validUnits = window.DefaultsConfig.units.map(unit => unit.id);
        if (!validUnits.includes(product.unit)) {
          throw new Error(`Unité invalide: ${product.unit}`);
        }
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.Product = new ProductModel();