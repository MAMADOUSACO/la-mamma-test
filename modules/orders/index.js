/**
 * Module de commande - Point d'entrée
 * Fichier: modules/orders/index.js
 * 
 * Ce module gère l'ensemble des fonctionnalités liées aux commandes du restaurant:
 * - Création et modification de commandes
 * - Association des commandes aux tables
 * - Calcul automatique des totaux (HT, TTC, TVA)
 * - Gestion des articles de commande
 */

// Importer les dépendances
const OrderController = window.modules.orders.OrderController;
const OrderService = window.modules.orders.OrderService;
const OrderRepository = window.modules.orders.OrderRepository;

/**
 * Module de gestion des commandes
 */
const OrdersModule = {
  /**
   * Initialise le module de commandes
   * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
   */
  async init() {
    try {
      console.log('Initialisation du module de commandes...');
      
      // Initialiser le repository
      await OrderRepository.init();
      
      // Initialiser le service avec le repository
      await OrderService.init(OrderRepository);
      
      // Initialiser le controller avec le service
      await OrderController.init(OrderService);
      
      console.log('Module de commandes initialisé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du module de commandes:', error);
      window.services.notification.error('Impossible d\'initialiser le module de commandes');
      return false;
    }
  },
  
  /**
   * Charge la vue des commandes dans un conteneur
   * @param {HTMLElement} container - Élément HTML où charger la vue
   * @returns {Promise<void>} Promesse résolue lorsque la vue est chargée
   */
  async loadView(container) {
    try {
      // Afficher un indicateur de chargement
      const spinner = window.components.Spinner.show('Chargement des commandes...');
      
      // Initialiser la vue des commandes
      const OrdersView = window.views.Orders;
      const view = new OrdersView({
        controller: OrderController
      });
      
      // Vider le conteneur et y ajouter la vue
      container.innerHTML = '';
      container.appendChild(view.render());
      
      // Masquer le spinner
      spinner.hide();
    } catch (error) {
      console.error('Erreur lors du chargement de la vue des commandes:', error);
      window.services.notification.error('Impossible de charger la vue des commandes');
    }
  },
  
  /**
   * Crée une nouvelle commande
   * @returns {Promise<number|null>} ID de la nouvelle commande ou null en cas d'erreur
   */
  async createNewOrder() {
    try {
      return await OrderController.createOrder();
    } catch (error) {
      console.error('Erreur lors de la création d\'une nouvelle commande:', error);
      window.services.notification.error('Impossible de créer une nouvelle commande');
      return null;
    }
  },
  
  /**
   * Modifie une commande existante
   * @param {number} orderId - ID de la commande à modifier
   * @returns {Promise<boolean>} True si la modification a réussi, false sinon
   */
  async editOrder(orderId) {
    try {
      return await OrderController.loadOrderForEdit(orderId);
    } catch (error) {
      console.error(`Erreur lors de la modification de la commande #${orderId}:`, error);
      window.services.notification.error(`Impossible de modifier la commande #${orderId}`);
      return false;
    }
  },
  
  /**
   * Obtient la liste des commandes en cours
   * @returns {Promise<Array>} Liste des commandes en cours
   */
  async getActiveOrders() {
    try {
      return await OrderService.getActiveOrders();
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes actives:', error);
      window.services.notification.error('Impossible de récupérer les commandes actives');
      return [];
    }
  },
  
  /**
   * Recherche des commandes selon des critères
   * @param {Object} filters - Critères de recherche
   * @returns {Promise<Array>} Liste des commandes correspondant aux critères
   */
  async searchOrders(filters) {
    try {
      return await OrderService.searchOrders(filters);
    } catch (error) {
      console.error('Erreur lors de la recherche de commandes:', error);
      window.services.notification.error('Impossible de rechercher des commandes');
      return [];
    }
  }
};

// Exposer le module dans l'espace de nommage global
window.modules = window.modules || {};
window.modules.orders = window.modules.orders || {};
window.modules.orders.module = OrdersModule;

// Exporter pour les imports ES6
export default OrdersModule;