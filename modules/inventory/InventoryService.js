/**
 * Service d'inventaire - Logique métier
 * Fichier: modules/inventory/InventoryService.js
 * 
 * Ce service encapsule la logique métier de l'inventaire. Il utilise le référentiel
 * pour accéder aux données et implémente les règles métier spécifiques à l'inventaire.
 */

/**
 * Service d'inventaire
 */
const InventoryService = {
    repository: null,
    
    /**
     * Initialise le service
     * @param {Object} productRepository - Référentiel des produits
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init(productRepository) {
      this.repository = productRepository;
      console.log('Service d\'inventaire initialisé');
    },
    
    /**
     * Récupère tous les produits
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Liste des produits
     */
    async getAllProducts(filters = {}) {
      try {
        return await this.repository.getAll(filters);
      } catch (error) {
        console.error('Erreur dans le service lors de la récupération des produits:', error);
        throw error;
      }
    },
    
    /**
     * Récupère un produit par son ID
     * @param {number} productId - ID du produit
     * @param {boolean} includeHistory - Si true, inclut l'historique des mouvements
     * @returns {Promise<Object>} Le produit complet
     */
    async getProductById(productId, includeHistory = false) {
      try {
        const product = await this.repository.getById(productId);
        
        if (includeHistory) {
          const history = await this.repository.getProductInventoryLog(productId);
          product.history = history;
        }
        
        // Ajouter des statistiques utiles
        product.stockStatus = this._getStockStatus(product);
        
        return product;
      } catch (error) {
        console.error(`Erreur dans le service lors de la récupération du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère toutes les catégories de produits
     * @returns {Promise<Array>} Liste des catégories
     */
    async getAllCategories() {
      try {
        return await this.repository.getAllCategories();
      } catch (error) {
        console.error('Erreur dans le service lors de la récupération des catégories:', error);
        throw error;
      }
    },
    
    /**
     * Crée un nouveau produit
     * @param {Object} productData - Données du produit
     * @returns {Promise<number>} ID du nouveau produit
     */
    async createProduct(productData) {
      try {
        // Validation des données
        this._validateProductData(productData);
        
        // Formatage des valeurs numériques
        const formattedData = this._formatProductData(productData);
        
        // Créer le produit
        const productId = await this.repository.create(formattedData);
        
        // Notifier la création
        window.services.notification.success(`Produit "${formattedData.name}" créé avec succès`);
        
        return productId;
      } catch (error) {
        console.error('Erreur dans le service lors de la création d\'un produit:', error);
        throw error;
      }
    },
    
    /**
     * Met à jour un produit existant
     * @param {Object} productData - Données du produit
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateProduct(productData) {
      try {
        if (!productData.id) {
          throw new Error('L\'ID du produit est obligatoire pour la mise à jour');
        }
        
        // Récupérer le produit existant pour vérifier les modifications
        const existingProduct = await this.repository.getById(productData.id);
        
        // Validation des données
        this._validateProductData(productData);
        
        // Formatage des valeurs numériques
        const formattedData = this._formatProductData(productData);
        
        // Mettre à jour le produit
        await this.repository.update(formattedData);
        
        // Notifier la mise à jour
        window.services.notification.success(`Produit "${formattedData.name}" mis à jour avec succès`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la mise à jour du produit #${productData.id}:`, error);
        throw error;
      }
    },
    
    /**
     * Ajoute du stock à un produit
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité à ajouter
     * @param {string} reference - Référence (ex: numéro de facture)
     * @param {string} note - Note utilisateur
     * @returns {Promise<boolean>} True si l'ajout a réussi
     */
    async addStock(productId, quantity, reference, note) {
      try {
        // Vérifier que la quantité est positive
        if (quantity <= 0) {
          throw new Error('La quantité doit être positive pour un ajout de stock');
        }
        
        // Effectuer l'ajout
        await this.repository.modifyStock(productId, quantity, 'supply', reference, note);
        
        // Récupérer le produit mis à jour pour le message
        const product = await this.repository.getById(productId);
        
        // Notifier l'ajout
        window.services.notification.success(`${quantity} ${product.unit} de "${product.name}" ajouté au stock`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de l'ajout de stock au produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Retire du stock d'un produit
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité à retirer
     * @param {string} reason - Raison du retrait
     * @param {string} note - Note utilisateur
     * @returns {Promise<boolean>} True si le retrait a réussi
     */
    async removeStock(productId, quantity, reason, note) {
      try {
        // Vérifier que la quantité est positive
        if (quantity <= 0) {
          throw new Error('La quantité doit être positive pour un retrait de stock');
        }
        
        // Récupérer le produit pour vérifier le stock disponible
        const product = await this.repository.getById(productId);
        
        // Vérifier que le stock est suffisant
        if (product.quantity < quantity) {
          throw new Error(`Stock insuffisant pour "${product.name}". Disponible: ${product.quantity} ${product.unit}`);
        }
        
        // Effectuer le retrait
        await this.repository.modifyStock(productId, -quantity, reason, '', note);
        
        // Notifier le retrait
        window.services.notification.success(`${quantity} ${product.unit} de "${product.name}" retiré du stock`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors du retrait de stock du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Effectue un ajustement de stock (entrée ou sortie)
     * @param {number} productId - ID du produit
     * @param {number} quantityChange - Quantité à ajouter (positif) ou soustraire (négatif)
     * @param {string} reason - Raison de l'ajustement
     * @param {string} note - Note utilisateur
     * @returns {Promise<boolean>} True si l'ajustement a réussi
     */
    async adjustStock(productId, quantityChange, reason, note) {
      try {
        // Si la quantité est positive, c'est un ajout
        if (quantityChange > 0) {
          return await this.addStock(productId, quantityChange, reason, note);
        } 
        // Si la quantité est négative, c'est un retrait
        else if (quantityChange < 0) {
          return await this.removeStock(productId, Math.abs(quantityChange), reason, note);
        }
        // Si la quantité est 0, ne rien faire
        else {
          console.log('Aucun ajustement nécessaire (quantité = 0)');
          return true;
        }
      } catch (error) {
        console.error(`Erreur dans le service lors de l'ajustement de stock du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Effectue un inventaire complet
     * @param {Array} inventoryData - Données d'inventaire (liste de {productId, newQuantity})
     * @param {string} note - Note globale pour l'inventaire
     * @returns {Promise<boolean>} True si l'inventaire a réussi
     */
    async performInventory(inventoryData, note) {
      try {
        // Vérifier que les données sont valides
        if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
          throw new Error('Les données d\'inventaire sont invalides');
        }
        
        // Traiter chaque produit
        for (const item of inventoryData) {
          const { productId, newQuantity } = item;
          
          // Récupérer le produit actuel
          const product = await this.repository.getById(productId);
          
          // Calculer la différence
          const difference = newQuantity - product.quantity;
          
          // Si la quantité est différente, effectuer un ajustement
          if (difference !== 0) {
            await this.repository.modifyStock(
              productId,
              difference,
              'inventory',
              '',
              `Ajustement d'inventaire: ${note}`
            );
          }
        }
        
        // Notifier la fin de l'inventaire
        window.services.notification.success('Inventaire effectué avec succès');
        
        return true;
      } catch (error) {
        console.error('Erreur dans le service lors de l\'inventaire:', error);
        throw error;
      }
    },
    
    /**
     * Récupère le journal des mouvements d'inventaire
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Journal des mouvements
     */
    async getInventoryLog(filters = {}) {
      try {
        return await this.repository.getInventoryLog(filters);
      } catch (error) {
        console.error('Erreur dans le service lors de la récupération du journal d\'inventaire:', error);
        throw error;
      }
    },
    
    /**
     * Recherche des produits par texte
     * @param {string} query - Texte de recherche
     * @returns {Promise<Array>} Produits correspondants
     */
    async searchProducts(query) {
      try {
        if (!query || query.trim() === '') {
          return await this.repository.getAll();
        }
        
        return await this.repository.getAll({ search: query });
      } catch (error) {
        console.error('Erreur dans le service lors de la recherche de produits:', error);
        throw error;
      }
    },
    
    /**
     * Vérifie et retourne les produits à stock bas
     * @returns {Promise<Array>} Liste des produits avec stock bas
     */
    async checkLowStock() {
      try {
        return await this.repository.checkLowStock();
      } catch (error) {
        console.error('Erreur dans le service lors de la vérification des stocks bas:', error);
        throw error;
      }
    },
    
    /**
     * Désactive ou active un produit
     * @param {number} productId - ID du produit
     * @param {boolean} active - True pour activer, false pour désactiver
     * @returns {Promise<boolean>} True si l'opération a réussi
     */
    async setProductActive(productId, active) {
      try {
        // Récupérer le produit
        const product = await this.repository.getById(productId);
        
        // Mettre à jour le statut
        product.is_active = active;
        
        // Enregistrer les modifications
        await this.repository.update(product);
        
        // Notifier le changement
        const status = active ? 'activé' : 'désactivé';
        window.services.notification.success(`Produit "${product.name}" ${status}`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la modification du statut du produit #${productId}:`, error);
        throw error;
      }
    },
    
    /* Méthodes privées */
    
    /**
     * Valide les données d'un produit
     * @param {Object} productData - Données du produit
     * @private
     */
    _validateProductData(productData) {
      // Vérifier les champs obligatoires
      if (!productData.name || productData.name.trim() === '') {
        throw new Error('Le nom du produit est obligatoire');
      }
      
      if (!productData.category || productData.category.trim() === '') {
        throw new Error('La catégorie du produit est obligatoire');
      }
      
      // Vérifier que les prix sont positifs
      if (productData.selling_price < 0) {
        throw new Error('Le prix de vente ne peut pas être négatif');
      }
      
      if (productData.purchase_price < 0) {
        throw new Error('Le prix d\'achat ne peut pas être négatif');
      }
      
      // Vérifier que le stock minimum est positif ou nul
      if (productData.min_stock < 0) {
        throw new Error('Le stock minimum ne peut pas être négatif');
      }
      
      // Vérifier que la quantité est positive ou nulle
      if (productData.quantity < 0) {
        throw new Error('La quantité ne peut pas être négative');
      }
    },
    
    /**
     * Formate les données d'un produit
     * @param {Object} productData - Données du produit
     * @returns {Object} Données formatées
     * @private
     */
    _formatProductData(productData) {
      const formattedData = { ...productData };
      
      // Convertir les chaînes en nombres
      if (typeof formattedData.quantity === 'string') {
        formattedData.quantity = parseFloat(formattedData.quantity) || 0;
      }
      
      if (typeof formattedData.min_stock === 'string') {
        formattedData.min_stock = parseFloat(formattedData.min_stock) || 0;
      }
      
      if (typeof formattedData.purchase_price === 'string') {
        formattedData.purchase_price = parseFloat(formattedData.purchase_price) || 0;
      }
      
      if (typeof formattedData.selling_price === 'string') {
        formattedData.selling_price = parseFloat(formattedData.selling_price) || 0;
      }
      
      // Nettoyer le nom et la catégorie
      if (formattedData.name) {
        formattedData.name = formattedData.name.trim();
      }
      
      if (formattedData.category) {
        formattedData.category = formattedData.category.trim();
      }
      
      return formattedData;
    },
    
    /**
     * Détermine le statut de stock d'un produit
     * @param {Object} product - Produit
     * @returns {string} Statut de stock ('ok', 'low', 'out')
     * @private
     */
    _getStockStatus(product) {
      if (product.quantity <= 0) {
        return 'out';
      } else if (product.quantity <= product.min_stock) {
        return 'low';
      } else {
        return 'ok';
      }
    }
  };
  
  // Exposer le service dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.inventory = window.modules.inventory || {};
  window.modules.inventory.InventoryService = InventoryService;
  
  // Exporter pour les imports ES6
  export default InventoryService;