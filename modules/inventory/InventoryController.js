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
     * Effectue une recherche de produits
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
        console.error('Erreur lors de la création du produit:', error);
        window.services.notification.error(`Impossible de créer le produit: ${error.message}`);
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
        const success = await this.service.updateProduct(productData);
        
        // Si le produit courant a été mis à jour, recharger ses données
        if (success && this.currentProduct && this.currentProduct.id === productData.id) {
          await this.loadProduct(productData.id, true, () => {});
        }
        
        return success;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        window.services.notification.error(`Impossible de mettre à jour le produit: ${error.message}`);
        return false;
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
        const success = await this.service.setProductActive(productId, active);
        
        // Si le produit courant a été modifié, recharger ses données
        if (success && this.currentProduct && this.currentProduct.id === productId) {
          await this.loadProduct(productId, true, () => {});
        }
        
        return success;
      } catch (error) {
        console.error(`Erreur lors de la ${active ? 'activation' : 'désactivation'} du produit:`, error);
        window.services.notification.error(`Impossible de ${active ? 'activer' : 'désactiver'} le produit`);
        return false;
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
        const success = await this.service.addStock(productId, quantity, reference, note);
        
        // Si le produit courant a été modifié, recharger ses données
        if (success && this.currentProduct && this.currentProduct.id === productId) {
          await this.loadProduct(productId, true, () => {});
        }
        
        return success;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de stock:', error);
        window.services.notification.error(`Impossible d'ajouter du stock: ${error.message}`);
        return false;
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
        const success = await this.service.removeStock(productId, quantity, reason, note);
        
        // Si le produit courant a été modifié, recharger ses données
        if (success && this.currentProduct && this.currentProduct.id === productId) {
          await this.loadProduct(productId, true, () => {});
        }
        
        return success;
      } catch (error) {
        console.error('Erreur lors du retrait de stock:', error);
        window.services.notification.error(`Impossible de retirer du stock: ${error.message}`);
        return false;
      }
    },
    
    /**
     * Ajuste le stock d'un produit (entrée ou sortie)
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité à ajouter (positif) ou retirer (négatif)
     * @param {string} reason - Raison de l'ajustement
     * @param {string} note - Note utilisateur
     * @returns {Promise<boolean>} True si l'ajustement a réussi
     */
    async adjustStock(productId, quantity, reason, note) {
      if (quantity > 0) {
        return await this.addStock(productId, quantity, reason, note);
      } else if (quantity < 0) {
        return await this.removeStock(productId, Math.abs(quantity), reason, note);
      } else {
        // Aucun changement si la quantité est 0
        return true;
      }
    },
    
    /**
     * Récupère le journal des mouvements d'inventaire
     * @param {Object} filters - Filtres à appliquer
     * @param {Function} callback - Fonction appelée avec le journal
     */
    async getInventoryLog(filters, callback) {
      try {
        const log = await this.service.getInventoryLog(filters);
        callback(log);
      } catch (error) {
        console.error('Erreur lors de la récupération du journal d\'inventaire:', error);
        window.services.notification.error('Impossible de récupérer le journal d\'inventaire');
        callback([]);
      }
    },
    
    /**
     * Vérifie les alertes de stock bas
     * @returns {Promise<Array>} Liste des produits avec stock bas
     */
    async checkStockAlerts() {
      try {
        const lowStockProducts = await this.service.checkLowStock();
        
        // Créer des alertes pour chaque produit à stock bas
        lowStockProducts.forEach(product => {
          // Déterminer la priorité selon la quantité
          let priority = window.services.alerts.priorities.MEDIUM;
          
          if (product.quantity <= 0) {
            priority = window.services.alerts.priorities.HIGH;
          }
          
          // Créer l'alerte
          const alert = {
            type: window.services.alerts.types.INVENTORY,
            priority: priority,
            title: 'Stock bas',
            message: `Le stock de "${product.name}" est bas (${product.quantity} ${product.unit} restant${product.quantity > 1 ? 's' : ''})`,
            data: {
              productId: product.id,
              currentStock: product.quantity,
              minStock: product.min_stock
            }
          };
          
          window.services.alerts.addAlert(alert);
        });
        
        return lowStockProducts;
      } catch (error) {
        console.error('Erreur lors de la vérification des alertes de stock:', error);
        return [];
      }
    },
    
    /**
     * Définit le produit courant
     * @param {Object} product - Produit à définir comme courant
     */
    setCurrentProduct(product) {
      this.currentProduct = product;
      this._notifyProductChanged();
    },
    
    /**
     * Réinitialise le produit courant
     */
    clearCurrentProduct() {
      this.currentProduct = null;
      this._notifyProductChanged();
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
    }
  };
  
  // Exposer le contrôleur dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.inventory = window.modules.inventory || {};
  window.modules.inventory.InventoryController = InventoryController;
  
  // Exporter pour les imports ES6
  export default InventoryController;