/**
 * Module d'inventaire - Point d'entrée
 * Fichier: modules/inventory/index.js
 * 
 * Ce module gère l'ensemble des fonctionnalités liées à l'inventaire du restaurant:
 * - Gestion des produits et ingrédients
 * - Suivi des niveaux de stock
 * - Entrées et sorties de stock
 * - Alertes de stock bas
 * - Journal des mouvements d'inventaire
 */

// Importer les dépendances
const InventoryController = window.modules.inventory.InventoryController;
const InventoryService = window.modules.inventory.InventoryService;
const ProductRepository = window.modules.inventory.ProductRepository;

/**
 * Module de gestion de l'inventaire
 */
const InventoryModule = {
  /**
   * Initialise le module d'inventaire
   * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
   */
  async init() {
    try {
      console.log('Initialisation du module d\'inventaire...');
      
      // Initialiser le repository
      await ProductRepository.init();
      
      // Initialiser le service avec le repository
      await InventoryService.init(ProductRepository);
      
      // Initialiser le controller avec le service
      await InventoryController.init(InventoryService);
      
      console.log('Module d\'inventaire initialisé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du module d\'inventaire:', error);
      window.services.notification.error('Impossible d\'initialiser le module d\'inventaire');
      return false;
    }
  },
  
  /**
   * Charge la vue d'inventaire dans un conteneur
   * @param {HTMLElement} container - Élément HTML où charger la vue
   * @returns {Promise<void>} Promesse résolue lorsque la vue est chargée
   */
  async loadView(container) {
    try {
      // Afficher un indicateur de chargement
      const spinner = window.components.Spinner.show('Chargement de l\'inventaire...');
      
      // Initialiser la vue d'inventaire
      const InventoryView = window.views.Inventory;
      const view = new InventoryView({
        controller: InventoryController
      });
      
      // Vider le conteneur et y ajouter la vue
      container.innerHTML = '';
      container.appendChild(view.render());
      
      // Masquer le spinner
      spinner.hide();
    } catch (error) {
      console.error('Erreur lors du chargement de la vue d\'inventaire:', error);
      window.services.notification.error('Impossible de charger la vue d\'inventaire');
    }
  },
  
  /**
   * Vérifie les alertes de stock et notifie si nécessaire
   * @returns {Promise<void>} Promesse résolue lorsque la vérification est terminée
   */
  async checkStockAlerts() {
    try {
      return await InventoryController.checkStockAlerts();
    } catch (error) {
      console.error('Erreur lors de la vérification des alertes de stock:', error);
    }
  },
  
  /**
   * Créé un nouveau produit
   * @param {Object} productData - Données du produit
   * @returns {Promise<number|null>} ID du nouveau produit ou null en cas d'erreur
   */
  async createProduct(productData) {
    try {
      return await InventoryController.createProduct(productData);
    } catch (error) {
      console.error('Erreur lors de la création d\'un produit:', error);
      window.services.notification.error('Impossible de créer le produit');
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
      return await InventoryController.updateProduct(productData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      window.services.notification.error('Impossible de mettre à jour le produit');
      return false;
    }
  },
  
  /**
   * Ajuste le stock d'un produit
   * @param {number} productId - ID du produit
   * @param {number} quantity - Quantité à ajouter (positif) ou soustraire (négatif)
   * @param {string} reason - Raison de l'ajustement
   * @param {string} note - Note supplémentaire
   * @returns {Promise<boolean>} True si l'ajustement a réussi
   */
  async adjustStock(productId, quantity, reason, note) {
    try {
      return await InventoryController.adjustStock(productId, quantity, reason, note);
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du stock:', error);
      window.services.notification.error('Impossible d\'ajuster le stock');
      return false;
    }
  },
  
  /**
   * Récupère le journal des mouvements d'inventaire
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Array>} Journal des mouvements
   */
  async getInventoryLog(filters = {}) {
    try {
      return await InventoryService.getInventoryLog(filters);
    } catch (error) {
      console.error('Erreur lors de la récupération du journal d\'inventaire:', error);
      window.services.notification.error('Impossible de récupérer le journal d\'inventaire');
      return [];
    }
  },
  
  /**
   * Récupère tous les produits
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Array>} Liste des produits
   */
  async getAllProducts(filters = {}) {
    try {
      return await InventoryService.getAllProducts(filters);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      window.services.notification.error('Impossible de récupérer les produits');
      return [];
    }
  }
};

// Exposer le module dans l'espace de nommage global
window.modules = window.modules || {};
window.modules.inventory = window.modules.inventory || {};
window.modules.inventory.module = InventoryModule;

// Exporter pour les imports ES6
export default InventoryModule;