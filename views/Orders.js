/**
 * Vue Orders - Page principale des commandes
 * Fichier: views/Orders.js
 * 
 * Cette vue intègre tous les composants du module de commande
 * et gère les interactions avec le contrôleur.
 */

class OrdersView {
    /**
     * Constructeur de la vue Orders
     * @param {Object} options - Options de configuration
     * @param {Object} options.controller - Contrôleur des commandes
     */
    constructor(options = {}) {
      this.controller = options.controller;
      
      this.element = null;
      this.orderList = null;
      this.currentView = null; // 'list', 'details' ou 'form'
      this.detailsView = null;
      this.formView = null;
      
      this.activeOrderId = null;
      this.orderListSubscription = null;
      this.currentOrderSubscription = null;
      
      this.orders = [];
      this.products = [];
    }
  
    /**
     * Génère et retourne l'élément HTML de la vue
     * @returns {HTMLElement} Élément HTML de la vue
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'orders-view';
      
      // Charger les données initiales
      this._loadInitialData();
      
      return this.element;
    }
    
    /**
     * Nettoie les ressources utilisées par la vue
     */
    destroy() {
      // Se désabonner des changements
      if (this.currentOrderSubscription) {
        this.controller.unsubscribeFromOrderChanges(this.currentOrderSubscription);
      }
      
      // Détruire les composants
      if (this.orderList) {
        this.orderList.destroy();
      }
      
      if (this.detailsView) {
        this.detailsView.destroy();
      }
      
      if (this.formView) {
        this.formView.destroy();
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.orderList = null;
      this.currentView = null;
      this.detailsView = null;
      this.formView = null;
      this.activeOrderId = null;
      this.orderListSubscription = null;
      this.currentOrderSubscription = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Charge les données initiales
     * @private
     */
    async _loadInitialData() {
      try {
        // Afficher un spinner pendant le chargement
        const spinner = window.components.Spinner.show('Chargement des commandes...');
        
        // Charger les commandes actives
        await this.controller.loadActiveOrders(orders => {
          this.orders = orders;
          this._renderMainView();
        });
        
        // Charger tous les produits
        const products = await window.db.getAll('PRODUCTS');
        this.products = products.filter(product => product.is_active);
        
        // Masquer le spinner
        spinner.hide();
        
        // S'abonner aux changements de la commande courante
        this.currentOrderSubscription = this.controller.subscribeToOrderChanges(order => {
          this._handleCurrentOrderChange(order);
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données initiales:', error);
        window.services.notification.error('Impossible de charger les données');
      }
    }
    
    /**
     * Rend la vue principale
     * @private
     */
    _renderMainView() {
      // Vider l'élément
      this.element.innerHTML = '';
      
      // Conteneur principal
      const container = document.createElement('div');
      container.className = 'orders-container';
      
      // Créer la liste des commandes
      this.orderList = new window.components.orders.OrderList({
        orders: this.orders,
        activeOrderId: this.activeOrderId,
        filter: 'active',
        onOrderSelect: this._handleOrderSelect.bind(this),
        onNewOrder: this._handleNewOrder.bind(this),
        onRefresh: this._handleRefresh.bind(this)
      });
      
      container.appendChild(this.orderList.render());
      
      // Conteneur pour les détails ou le formulaire
      const detailContainer = document.createElement('div');
      detailContainer.className = 'orders-detail-container';
      
      // Afficher la vue appropriée
      if (this.currentView === 'details' && this.detailsView) {
        detailContainer.appendChild(this.detailsView.render());
      } else if (this.currentView === 'form' && this.formView) {
        detailContainer.appendChild(this.formView.render());
      } else {
        // Vue par défaut (message de bienvenue)
        detailContainer.appendChild(this._createWelcomeMessage());
      }
      
      container.appendChild(detailContainer);
      this.element.appendChild(container);
    }
    
    /**
     * Crée un message de bienvenue
     * @returns {HTMLElement} Message de bienvenue
     * @private
     */
    _createWelcomeMessage() {
      const welcome = document.createElement('div');
      welcome.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-shopping-cart';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      message.textContent = 'Gestion des commandes';
      
      const subMessage = document.createElement('div');
      subMessage.className = 'empty-state-subtext';
      subMessage.textContent = 'Sélectionnez une commande ou créez-en une nouvelle';
      
      // Bouton nouvelle commande
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.innerHTML = '<span class="icon-plus"></span> Nouvelle commande';
      button.addEventListener('click', this._handleNewOrder.bind(this));
      
      welcome.appendChild(icon);
      welcome.appendChild(message);
      welcome.appendChild(subMessage);
      welcome.appendChild(button);
      
      return welcome;
    }
    
    /**
     * Affiche les détails d'une commande
     * @param {number} orderId - ID de la commande
     * @private
     */
    _showOrderDetails(orderId) {
      // Récupérer les détails de la commande
      this.controller.getOrderDetails(orderId, order => {
        if (!order) {
          window.services.notification.error(`Impossible de charger la commande #${orderId}`);
          return;
        }
        
        // Créer la vue de détails
        this.detailsView = new window.components.orders.OrderDetails({
          order: order,
          onEdit: this._handleOrderEdit.bind(this),
          onPrint: this._handleOrderPrint.bind(this),
          onClose: this._handleDetailsClose.bind(this)
        });
        
        // Mettre à jour l'état
        this.currentView = 'details';
        this.activeOrderId = orderId;
        
        // Mettre à jour l'affichage
        this._renderMainView();
      });
    }
    
    /**
     * Affiche le formulaire d'édition de commande
     * @param {number} orderId - ID de la commande à éditer (null pour une nouvelle commande)
     * @private
     */
    _showOrderForm(orderId = null) {
      // Si orderId est fourni, charger la commande existante
      if (orderId) {
        this.controller.loadOrderForEdit(orderId);
      }
      
      // Créer la vue de formulaire
      this.formView = new window.components.orders.OrderForm({
        order: this.controller.currentOrder,
        products: this.products,
        onOrderUpdate: this._handleOrderUpdate.bind(this),
        onOrderComplete: this._handleOrderComplete.bind(this),
        onOrderCancel: this._handleOrderCancel.bind(this),
        onClose: this._handleFormClose.bind(this)
      });
      
      // Mettre à jour l'état
      this.currentView = 'form';
      this.activeOrderId = orderId;
      
      // Mettre à jour l'affichage
      this._renderMainView();
    }
    
    /**
     * Gère la sélection d'une commande
     * @param {number} orderId - ID de la commande sélectionnée
     * @private
     */
    _handleOrderSelect(orderId) {
      this._showOrderDetails(orderId);
    }
    
    /**
     * Gère la création d'une nouvelle commande
     * @private
     */
    _handleNewOrder() {
      this._showOrderForm();
    }
    
    /**
     * Gère le rafraîchissement de la liste
     * @private
     */
    _handleRefresh() {
      this.controller.loadActiveOrders(orders => {
        this.orders = orders;
        
        if (this.orderList) {
          this.orderList.updateOrders(orders);
        }
      });
    }
    
    /**
     * Gère le changement de la commande courante
     * @param {Object} order - Commande courante
     * @private
     */
    _handleCurrentOrderChange(order) {
      // Mettre à jour le formulaire si ouvert
      if (this.currentView === 'form' && this.formView) {
        this.formView.updateOrder(order);
      }
      
      // Mettre à jour la liste des commandes si la commande courante y est présente
      if (order && this.orderList) {
        const orderInList = this.orders.some(o => o.id === order.id);
        
        if (orderInList) {
          this._handleRefresh();
        }
      }
    }
    
    /**
     * Gère la modification d'une commande
     * @param {number} orderId - ID de la commande à modifier
     * @private
     */
    _handleOrderEdit(orderId) {
      this._showOrderForm(orderId);
    }
    
    /**
     * Gère l'impression d'une commande
     * @param {number} orderId - ID de la commande à imprimer
     * @private
     */
    _handleOrderPrint(orderId) {
      // Créer un format imprimable de la commande
      this.controller.getOrderDetails(orderId, order => {
        if (!order) {
          window.services.notification.error(`Impossible de charger la commande #${orderId}`);
          return;
        }
        
        // Implémenter l'impression (pourrait utiliser window.print() avec une feuille de style spécifique)
        window.services.notification.info('Fonctionnalité d\'impression en développement');
      });
    }
    
    /**
     * Gère la fermeture de la vue de détails
     * @private
     */
    _handleDetailsClose() {
      this.currentView = 'list';
      this.activeOrderId = null;
      this.detailsView = null;
      
      this._renderMainView();
    }
    
    /**
     * Gère la fermeture du formulaire
     * @private
     */
    _handleFormClose() {
      this.currentView = 'list';
      this.activeOrderId = null;
      this.formView = null;
      
      // Fermer la commande en cours dans le contrôleur
      this.controller.closeCurrentOrder();
      
      this._renderMainView();
    }
    
    /**
     * Gère les mises à jour de commande
     * @param {string} action - Action à effectuer
     * @param {Object} data - Données associées à l'action
     * @returns {Promise<any>} Promesse résolue avec le résultat
     * @private
     */
    async _handleOrderUpdate(action, data) {
      try {
        switch (action) {
          case 'create':
            return await this.controller.createOrder(data.tableNumber);
            
          case 'addProduct':
            return await this.controller.addProductToOrder(data.productId, data.quantity, data.note);
            
          case 'updateItem':
            return await this.controller.updateOrderItem(data.itemId, data.changes);
            
          case 'removeItem':
            return await this.controller.removeOrderItem(data.itemId);
            
          case 'updateNote':
            return await this.controller.updateOrderNote(data.note);
            
          default:
            console.warn(`Action inconnue: ${action}`);
            return null;
        }
      } catch (error) {
        console.error(`Erreur lors de l'action ${action}:`, error);
        window.services.notification.error(`Impossible d'effectuer l'action demandée`);
        throw error;
      }
    }
    
    /**
     * Gère la finalisation d'une commande
     * @returns {Promise<boolean>} Promesse résolue avec le résultat
     * @private
     */
    async _handleOrderComplete() {
      try {
        const result = await this.controller.completeOrder();
        
        if (result) {
          window.services.notification.success('Commande finalisée avec succès');
          this._handleFormClose();
        }
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la finalisation de la commande:', error);
        window.services.notification.error('Impossible de finaliser la commande');
        return false;
      }
    }
    
    /**
     * Gère l'annulation d'une commande
     * @returns {Promise<boolean>} Promesse résolue avec le résultat
     * @private
     */
    async _handleOrderCancel() {
      try {
        const result = await this.controller.cancelOrder();
        
        if (result) {
          window.services.notification.info('Commande annulée');
          this._handleFormClose();
        }
        
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'annulation de la commande:', error);
        window.services.notification.error('Impossible d\'annuler la commande');
        return false;
      }
    }
  }
  
  // Exposer la vue dans l'espace de nommage global
  window.views = window.views || {};
  window.views.Orders = OrdersView;
  
  // Exporter pour les imports ES6
  export default OrdersView;