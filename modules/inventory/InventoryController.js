/**
 * Contrôleur d'inventaire - Gestion des interactions utilisateur
 * Fichier: modules/inventory/InventoryController.js
 * 
 * Ce contrôleur gère les interactions entre l'interface utilisateur et le service
 * d'inventaire. Il reçoit les actions de l'utilisateur, les traite et met à jour
 * l'interface en conséquence.
 */

/**
 * Contrôleur d'inventaire
 */
const InventoryController = {
    service: null,
    currentProduct: null,
    
    /**
     * Initialise le contrôleur
     * @param {Object} inventoryService - Service d'inventaire
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init(inventoryService) {
      this.service = inventoryService;
      this.currentProduct = null;
      console.log('Contrôleur d\'inventaire initialisé');
    },
    
    /**
     * Charge la liste des produits
     * @param {Object} filters - Filtres à appliquer
     * @param {Function} callback - Fonction appelée avec les produits chargés
     */
    async loadProducts(filters, callback) {
      try {
        const products = await this.service.getAllProducts(filters);
        callback(products);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        window.services.notification.error('Impossible de charger les produits');
        callback([]);
      }
    },
    
    /**
     * Charge les catégories de produits
     * @param {Function} callback - Fonction appelée avec les catégories chargées
     */
    async loadCategories(callback) {
      try {
        const categories = await this.service.getAllCategories();
        callback(categories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        window.services.notification.error('Impossible de charger les catégories');
        callback([]);
      }
    },
    
    /**
     * Charge un produit par son ID
     * @param {number} productId - ID du produit
     * @param {boolean} setAsCurrent - Si true, définit le produit comme produit courant
     * @param {Function} callback - Fonction appelée avec le produit chargé
     */
    async loadProduct(productId, setAsCurrent = false, callback) {
      try {
        const product = await this.service.getProductById(productId, true);
        
        if (setAsCurrent) {
          this.currentProduct = product;
          this._notifyProductChanged();
        }
        
        callback(product);
      } catch (error) {
        console.error(`Erreur lors du chargement du produit #${productId}:`, error);
        window.services.notification.error(`Impossible de charger le produit #${productId}`);
        callback(null);
      }
    },
    
    /**
     * Recherche des produits par texte
     * @param {string} query - Texte de recherche
     * @param {Function} callback - Fonction appelée avec les résultats
     */
    async searchProducts(query, callback) {
      try {
        const products = await this.service.searchProducts(query);
        callback(products);
      } catch (error) {
        console.error('Erreur lors de la recherche de produits:', error);
        window.services.notification.error('Impossible de rechercher des produits');
        callback([]);
      }
    },
    
    /**
     * Crée un nouveau produit
     * @param {Object} productData - Données du produit
     * @returns {Promise<number|null>} ID du nouveau produit ou null en cas d'erreur
     */
    async createProduct(productData) {
      try {
        return await this.service.createProduct(productData);
      } catch (error) {
        console.error('Erreur lors de la création d\'un produit:', error);
        window.services.notification.error('Impossible de créer le produit: ' + error.message);
        return null;
      }
    },
    
    /**
     * Met à jour un produit existant
     * @param {Object} productData - Données du produit
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateProduct(productData) {
      try {
        return await this.service.updateProduct(productData);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        window.services.notification.error('Impossible de mettre à jour le produit: ' + error.message);
        return false;
      }
    },
    
    /**
     * Ajuste le stock d'un produit
     * @param {number} productId - ID du produit
     * @param {number} quantityChange - Quantité à ajouter (positif) ou soustraire (négatif)
     * @param {string} reason - Raison de l'ajustement
     * @param {string} note - Note supplémentaire
     * @returns {Promise<boolean>} True si l'ajustement a réussi
     */
    async adjustStock(productId, quantityChange, reason, note) {
      try {
        return await this.service.adjustStock(productId, quantityChange, reason, note);
      } catch (error) {
        console.error('Erreur lors de l\'ajustement du stock:', error);
        window.services.notification.error('Impossible d\'ajuster le stock: ' + error.message);
        return false;
      }
    },
    
    /**
     * Vérifie les alertes de stock et notifie si nécessaire
     * @returns {Promise<Array>} Liste des produits avec alertes
     */
    async checkStockAlerts() {
      try {
        const alertProducts = await this.service.checkLowStock();
        
        // Créer des alertes pour chaque produit avec stock bas
        alertProducts.forEach(product => {
          this._createStockAlert(product);
        });
        
        return alertProducts;
      } catch (error) {
        console.error('Erreur lors de la vérification des alertes de stock:', error);
        return [];
      }
    },
    
    /**
     * Active ou désactive un produit
     * @param {number} productId - ID du produit
     * @param {boolean} active - True pour activer, false pour désactiver
     * @returns {Promise<boolean>} True si l'opération a réussi
     */
    async setProductActive(productId, active) {
      try {
        return await this.service.setProductActive(productId, active);
      } catch (error) {
        console.error('Erreur lors de la modification du statut du produit:', error);
        window.services.notification.error('Impossible de modifier le statut du produit');
        return false;
      }
    },
    
    /**
     * Charge le journal d'inventaire
     * @param {Object} filters - Filtres à appliquer
     * @param {Function} callback - Fonction appelée avec le journal chargé
     */
    async loadInventoryLog(filters, callback) {
      try {
        const logEntries = await this.service.getInventoryLog(filters);
        callback(logEntries);
      } catch (error) {
        console.error('Erreur lors du chargement du journal d\'inventaire:', error);
        window.services.notification.error('Impossible de charger le journal d\'inventaire');
        callback([]);
      }
    },
    
    /**
     * S'abonne aux changements du produit courant
     * @param {Function} callback - Fonction appelée lors d'un changement
     * @returns {number} ID de l'abonnement
     */
    subscribeToProductChanges(callback) {
      // Utilisation de la propriété privée pour stocker les abonnements
      this._productChangeSubscribers = this._productChangeSubscribers || [];
      
      // Générer un ID unique pour l'abonnement
      const subscriptionId = Date.now() + Math.floor(Math.random() * 1000);
      
      // Ajouter l'abonnement
      this._productChangeSubscribers.push({
        id: subscriptionId,
        callback: callback
      });
      
      // Appeler immédiatement le callback avec l'état actuel
      callback(this.currentProduct);
      
      return subscriptionId;
    },
    
    /**
     * Se désabonne des changements du produit courant
     * @param {number} subscriptionId - ID de l'abonnement
     */
    unsubscribeFromProductChanges(subscriptionId) {
      if (!this._productChangeSubscribers) return;
      
      // Filtrer les abonnements
      this._productChangeSubscribers = this._productChangeSubscribers.filter(
        sub => sub.id !== subscriptionId
      );
    },
    
    /**
     * Ferme le produit courant
     */
    closeCurrentProduct() {
      this.currentProduct = null;
      this._notifyProductChanged();
    },
    
    /* Méthodes privées */
    
    /**
     * Notifie les abonnés d'un changement du produit courant
     * @private
     */
    _notifyProductChanged() {
      if (!this._productChangeSubscribers) return;
      
      // Notifier tous les abonnés
      this._productChangeSubscribers.forEach(sub => {
        try {
          sub.callback(this.currentProduct);
        } catch (error) {
          console.error('Erreur dans un abonné aux changements de produit:', error);
        }
      });
    },
    
    /**
     * Crée une alerte pour un produit avec stock bas
     * @param {Object} product - Produit avec stock bas
     * @private
     */
    _createStockAlert(product) {
      // Définir la priorité selon le niveau de stock
      let priority;
      
      if (product.quantity <= 0) {
        priority = window.services.alerts.priorities.CRITICAL;
      } else {
        priority = window.services.alerts.priorities.MEDIUM;
      }
      
      // Créer le message d'alerte
      let message;
      if (product.quantity <= 0) {
        message = `Le produit "${product.name}" est en rupture de stock !`;
      } else {
        message = `Le stock de "${product.name}" est bas (${product.quantity} ${product.unit} restant${product.quantity > 1 ? 's' : ''})`;
      }
      
      // Créer l'alerte
      const alert = {
        type: window.services.alerts.types.INVENTORY,
        priority: priority,
        title: 'Stock bas',
        message: message,
        data: {
          productId: product.id,
          currentStock: product.quantity,
          minStock: product.min_stock
        }
      };
      
      window.services.alerts.addAlert(alert);
    }
  };
  
  // Exposer le contrôleur dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.inventory = window.modules.inventory || {};
  window.modules.inventory.InventoryController = InventoryController;
  
  // Exporter pour les imports ES6
  export default InventoryController;