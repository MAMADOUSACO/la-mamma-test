/**
 * Composant OrderList - Liste des commandes
 * Fichier: js/components/orders/OrderList.js
 * 
 * Ce composant affiche la liste des commandes avec leur statut,
 * montant et numéro de table. Il permet de filtrer et de sélectionner
 * une commande pour l'éditer.
 */

class OrderList {
    /**
     * Constructeur du composant OrderList
     * @param {Object} options - Options de configuration
     * @param {Array} options.orders - Liste des commandes à afficher
     * @param {string} options.activeOrderId - ID de la commande active
     * @param {string} options.filter - Filtre à appliquer (all, active, completed)
     * @param {Function} options.onOrderSelect - Callback lors de la sélection d'une commande
     * @param {Function} options.onNewOrder - Callback lors de la création d'une nouvelle commande
     * @param {Function} options.onRefresh - Callback pour rafraîchir la liste
     */
    constructor(options = {}) {
      this.orders = options.orders || [];
      this.activeOrderId = options.activeOrderId || null;
      this.filter = options.filter || 'active';
      this.onOrderSelect = options.onOrderSelect || (() => {});
      this.onNewOrder = options.onNewOrder || (() => {});
      this.onRefresh = options.onRefresh || (() => {});
      
      this.element = null;
      this.listElement = null;
      this.filterButtons = {};
    }
  
    /**
     * Génère et retourne l'élément HTML de la liste des commandes
     * @returns {HTMLElement} Élément HTML de la liste
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'orders-list-container';
      
      // Créer l'en-tête
      const header = this._createHeader();
      this.element.appendChild(header);
      
      // Créer la liste
      this.listElement = document.createElement('div');
      this.listElement.className = 'orders-list';
      
      // Appliquer le filtre et rendre les commandes
      this._renderOrders();
      
      this.element.appendChild(this.listElement);
      
      return this.element;
    }
    
    /**
     * Met à jour la liste des commandes
     * @param {Array} orders - Nouvelles commandes
     */
    updateOrders(orders) {
      this.orders = orders || [];
      this._renderOrders();
    }
    
    /**
     * Met à jour la commande active
     * @param {string} orderId - ID de la commande active
     */
    setActiveOrder(orderId) {
      this.activeOrderId = orderId;
      
      // Mettre à jour l'affichage si l'élément existe
      if (this.listElement) {
        const orderItems = this.listElement.querySelectorAll('.order-item');
        orderItems.forEach(item => {
          if (item.dataset.id === orderId) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    }
    
    /**
     * Modifie le filtre appliqué aux commandes
     * @param {string} filter - Nouveau filtre (all, active, completed)
     */
    setFilter(filter) {
      this.filter = filter;
      
      // Mettre à jour l'affichage des boutons de filtre
      if (this.filterButtons) {
        Object.keys(this.filterButtons).forEach(key => {
          if (key === filter) {
            this.filterButtons[key].classList.add('active');
          } else {
            this.filterButtons[key].classList.remove('active');
          }
        });
      }
      
      // Mettre à jour la liste
      this._renderOrders();
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements
      if (this.listElement) {
        const orderItems = this.listElement.querySelectorAll('.order-item');
        orderItems.forEach(item => {
          item.removeEventListener('click', item._clickHandler);
        });
      }
      
      if (this.filterButtons) {
        Object.values(this.filterButtons).forEach(button => {
          button.removeEventListener('click', button._clickHandler);
        });
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.listElement = null;
      this.filterButtons = {};
    }
    
    /* Méthodes privées */
    
    /**
     * Crée l'en-tête de la liste
     * @returns {HTMLElement} En-tête de la liste
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'orders-section-header';
      
      // Titre
      const title = document.createElement('h2');
      title.className = 'orders-section-title';
      title.textContent = 'Commandes';
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'orders-section-actions';
      
      // Bouton nouveau
      const newButton = document.createElement('button');
      newButton.className = 'btn btn-primary btn-sm';
      newButton.innerHTML = '<span class="icon-plus"></span> Nouvelle';
      newButton.addEventListener('click', this.onNewOrder);
      
      // Bouton rafraîchir
      const refreshButton = document.createElement('button');
      refreshButton.className = 'btn btn-outline btn-sm';
      refreshButton.innerHTML = '<span class="icon-refresh"></span>';
      refreshButton.addEventListener('click', this.onRefresh);
      
      actions.appendChild(newButton);
      actions.appendChild(refreshButton);
      
      // Filtres
      const filters = document.createElement('div');
      filters.className = 'orders-filters';
      
      // Bouton "Toutes"
      const allButton = document.createElement('button');
      allButton.className = `btn btn-sm ${this.filter === 'all' ? 'active' : ''}`;
      allButton.textContent = 'Toutes';
      allButton._clickHandler = () => this.setFilter('all');
      allButton.addEventListener('click', allButton._clickHandler);
      this.filterButtons.all = allButton;
      
      // Bouton "Actives"
      const activeButton = document.createElement('button');
      activeButton.className = `btn btn-sm ${this.filter === 'active' ? 'active' : ''}`;
      activeButton.textContent = 'Actives';
      activeButton._clickHandler = () => this.setFilter('active');
      activeButton.addEventListener('click', activeButton._clickHandler);
      this.filterButtons.active = activeButton;
      
      // Bouton "Terminées"
      const completedButton = document.createElement('button');
      completedButton.className = `btn btn-sm ${this.filter === 'completed' ? 'active' : ''}`;
      completedButton.textContent = 'Terminées';
      completedButton._clickHandler = () => this.setFilter('completed');
      completedButton.addEventListener('click', completedButton._clickHandler);
      this.filterButtons.completed = completedButton;
      
      filters.appendChild(allButton);
      filters.appendChild(activeButton);
      filters.appendChild(completedButton);
      
      // Assembler l'en-tête
      header.appendChild(title);
      header.appendChild(filters);
      header.appendChild(actions);
      
      return header;
    }
    
    /**
     * Rend la liste des commandes
     * @private
     */
    _renderOrders() {
      if (!this.listElement) return;
      
      // Vider la liste
      this.listElement.innerHTML = '';
      
      // Filtrer les commandes
      const filteredOrders = this._filterOrders();
      
      // S'il n'y a pas de commandes, afficher un message
      if (filteredOrders.length === 0) {
        this._renderEmptyState();
        return;
      }
      
      // Ajouter chaque commande à la liste
      filteredOrders.forEach(order => {
        const orderElement = this._createOrderElement(order);
        this.listElement.appendChild(orderElement);
      });
    }
    
    /**
     * Crée un élément HTML pour une commande
     * @param {Object} order - Données de la commande
     * @returns {HTMLElement} Élément HTML de la commande
     * @private
     */
    _createOrderElement(order) {
      const orderElement = document.createElement('div');
      orderElement.className = `order-item ${order.id === this.activeOrderId ? 'active' : ''}`;
      orderElement.dataset.id = order.id;
      
      // En-tête
      const header = document.createElement('div');
      header.className = 'order-item-header';
      
      // Numéro de commande
      const orderNumber = document.createElement('div');
      orderNumber.className = 'order-number';
      orderNumber.textContent = `Commande #${order.id}`;
      
      // Statut
      const status = document.createElement('div');
      status.className = `order-status order-status-${order.status}`;
      status.textContent = this._getStatusText(order.status);
      
      header.appendChild(orderNumber);
      header.appendChild(status);
      
      // Détails
      const details = document.createElement('div');
      details.className = 'order-details-row';
      
      // Table
      const table = document.createElement('div');
      table.className = 'order-table';
      table.innerHTML = `<span class="order-table-icon icon-table"></span> Table ${order.table_number}`;
      
      // Heure
      const time = document.createElement('div');
      time.className = 'order-time';
      time.textContent = this._formatTime(order.date);
      
      details.appendChild(table);
      details.appendChild(time);
      
      // Total
      const total = document.createElement('div');
      total.className = 'order-total';
      total.textContent = this._formatPrice(order.total_ttc);
      
      // Assembler l'élément
      orderElement.appendChild(header);
      orderElement.appendChild(details);
      orderElement.appendChild(total);
      
      // Ajouter l'écouteur d'événement
      orderElement._clickHandler = () => this.onOrderSelect(order.id);
      orderElement.addEventListener('click', orderElement._clickHandler);
      
      return orderElement;
    }
    
    /**
     * Filtre les commandes selon le filtre actif
     * @returns {Array} Commandes filtrées
     * @private
     */
    _filterOrders() {
      if (this.filter === 'all') {
        return this.orders;
      } else if (this.filter === 'active') {
        return this.orders.filter(order => ['pending', 'in_progress'].includes(order.status));
      } else if (this.filter === 'completed') {
        return this.orders.filter(order => order.status === 'completed');
      }
      
      return this.orders;
    }
    
    /**
     * Affiche un état vide lorsqu'il n'y a pas de commandes
     * @private
     */
    _renderEmptyState() {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-file-text';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      
      if (this.filter === 'active') {
        message.textContent = 'Aucune commande active';
      } else if (this.filter === 'completed') {
        message.textContent = 'Aucune commande terminée';
      } else {
        message.textContent = 'Aucune commande';
      }
      
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.innerHTML = '<span class="icon-plus"></span> Nouvelle commande';
      button.addEventListener('click', this.onNewOrder);
      
      emptyState.appendChild(icon);
      emptyState.appendChild(message);
      emptyState.appendChild(button);
      
      this.listElement.appendChild(emptyState);
    }
    
    /**
     * Obtient le texte correspondant à un statut
     * @param {string} status - Statut de la commande
     * @returns {string} Texte du statut
     * @private
     */
    _getStatusText(status) {
      const statusMap = {
        'pending': 'En attente',
        'in_progress': 'En cours',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
      };
      
      return statusMap[status] || status;
    }
    
    /**
     * Formate une date en heure lisible
     * @param {string} date - Date ISO
     * @returns {string} Heure formatée
     * @private
     */
    _formatTime(date) {
      try {
        const dateObj = new Date(date);
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        return '';
      }
    }
    
    /**
     * Formate un prix
     * @param {number} price - Prix à formater
     * @returns {string} Prix formaté
     * @private
     */
    _formatPrice(price) {
      return window.utils.formatters.formatPrice(price, '€', 2);
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.orders = window.components.orders || {};
  window.components.orders.OrderList = OrderList;