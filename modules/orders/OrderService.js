/**
 * Service des commandes - Logique métier
 * Fichier: modules/orders/OrderService.js
 * 
 * Ce service encapsule la logique métier des commandes. Il utilise le référentiel
 * pour accéder aux données et implémente les règles métier spécifiques aux commandes.
 */

/**
 * Service des commandes
 */
const OrderService = {
    repository: null,
    
    /**
     * Initialise le service
     * @param {Object} orderRepository - Référentiel des commandes
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init(orderRepository) {
      this.repository = orderRepository;
      console.log('Service des commandes initialisé');
    },
    
    /**
     * Récupère toutes les commandes
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Liste des commandes
     */
    async getAllOrders(filters = {}) {
      try {
        return await this.repository.getAll(filters);
      } catch (error) {
        console.error('Erreur dans le service lors de la récupération des commandes:', error);
        throw error;
      }
    },
    
    /**
     * Récupère une commande par son ID
     * @param {number} orderId - ID de la commande
     * @param {boolean} includeItems - Si true, inclut les articles de la commande
     * @returns {Promise<Object>} La commande complète
     */
    async getOrderById(orderId, includeItems = true) {
      try {
        const order = await this.repository.getById(orderId);
        
        if (includeItems) {
          order.items = await this.repository.getOrderItems(orderId);
        }
        
        return order;
      } catch (error) {
        console.error(`Erreur dans le service lors de la récupération de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère les commandes actives
     * @returns {Promise<Array>} Liste des commandes actives
     */
    async getActiveOrders() {
      try {
        const orders = await this.repository.getActiveOrders();
        
        // Ajouter des informations supplémentaires pour chaque commande
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
          // Récupérer les articles de la commande
          const items = await this.repository.getOrderItems(order.id);
          
          return {
            ...order,
            itemCount: items.length,
            items: items
          };
        }));
        
        return ordersWithDetails;
      } catch (error) {
        console.error('Erreur dans le service lors de la récupération des commandes actives:', error);
        throw error;
      }
    },
    
    /**
     * Crée une nouvelle commande
     * @param {Object} orderData - Données de la commande
     * @returns {Promise<number>} ID de la nouvelle commande
     */
    async createOrder(orderData = {}) {
      try {
        // Configuration par défaut
        const defaultOrderData = {
          date: new Date().toISOString(),
          status: 'pending',
          total_ht: 0,
          total_ttc: 0,
          tva_amount: 0,
          note: ''
        };
        
        // Fusionner avec les données fournies
        const finalOrderData = { ...defaultOrderData, ...orderData };
        
        // Créer la commande
        const orderId = await this.repository.create(finalOrderData);
        
        // Notifier la création
        window.services.notification.success(`Commande #${orderId} créée avec succès`);
        
        return orderId;
      } catch (error) {
        console.error('Erreur dans le service lors de la création d\'une commande:', error);
        throw error;
      }
    },
    
    /**
     * Met à jour une commande existante
     * @param {Object} orderData - Données de la commande
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateOrder(orderData) {
      try {
        if (!orderData.id) {
          throw new Error('L\'ID de la commande est obligatoire pour la mise à jour');
        }
        
        // Récupérer la commande existante pour vérifier les modifications
        const existingOrder = await this.repository.getById(orderData.id);
        
        // Détecter le changement de statut
        const statusChanged = existingOrder.status !== orderData.status;
        
        // Mettre à jour la commande
        await this.repository.update(orderData);
        
        // Gérer les actions spécifiques au changement de statut
        if (statusChanged) {
          await this._handleStatusChange(orderData.id, orderData.status, existingOrder.status);
        }
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la mise à jour de la commande #${orderData.id}:`, error);
        throw error;
      }
    },
    
    /**
     * Change le statut d'une commande
     * @param {number} orderId - ID de la commande
     * @param {string} newStatus - Nouveau statut
     * @returns {Promise<boolean>} True si le changement a réussi
     */
    async changeOrderStatus(orderId, newStatus) {
      try {
        // Récupérer le statut actuel
        const order = await this.repository.getById(orderId);
        const currentStatus = order.status;
        
        // Vérifier si le changement est valide
        if (!this._isValidStatusTransition(currentStatus, newStatus)) {
          throw new Error(`Transition de statut invalide: ${currentStatus} -> ${newStatus}`);
        }
        
        // Mettre à jour le statut
        await this.repository.updateStatus(orderId, newStatus);
        
        // Gérer les actions spécifiques au changement de statut
        await this._handleStatusChange(orderId, newStatus, currentStatus);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors du changement de statut de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Ajoute un article à une commande
     * @param {number} orderId - ID de la commande
     * @param {Object} itemData - Données de l'article
     * @returns {Promise<number>} ID du nouvel article
     */
    async addOrderItem(orderId, itemData) {
      try {
        // Compléter les données de l'article
        const completeItemData = {
          ...itemData,
          order_id: orderId
        };
        
        // Vérifier que le produit existe et obtenir son prix
        const product = await window.db.get('PRODUCTS', completeItemData.product_id);
        if (!product) {
          throw new Error(`Produit #${completeItemData.product_id} introuvable`);
        }
        
        // Mettre à jour l'inventaire en déduisant la quantité commandée
        await this._updateInventory(completeItemData.product_id, -completeItemData.quantity, orderId);
        
        // Ajouter l'article
        const itemId = await this.repository.addOrderItem(completeItemData);
        
        // Si la commande est en attente, la passer en cours
        const order = await this.repository.getById(orderId);
        if (order.status === 'pending') {
          await this.repository.updateStatus(orderId, 'in_progress');
        }
        
        return itemId;
      } catch (error) {
        console.error(`Erreur dans le service lors de l'ajout d'un article à la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Met à jour un article de commande
     * @param {number} itemId - ID de l'article
     * @param {Object} itemData - Nouvelles données de l'article
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateOrderItem(itemId, itemData) {
      try {
        // Récupérer l'article existant
        const existingItem = await window.db.get('ORDER_ITEMS', itemId);
        if (!existingItem) {
          throw new Error(`Article #${itemId} introuvable`);
        }
        
        // Calculer la différence de quantité
        const quantityDiff = itemData.quantity - existingItem.quantity;
        
        // Si la quantité a changé, mettre à jour l'inventaire
        if (quantityDiff !== 0) {
          await this._updateInventory(existingItem.product_id, -quantityDiff, existingItem.order_id);
        }
        
        // Mettre à jour l'article
        const updatedItem = {
          ...existingItem,
          ...itemData,
          id: itemId
        };
        
        await this.repository.updateOrderItem(updatedItem);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la mise à jour de l'article #${itemId}:`, error);
        throw error;
      }
    },
    
    /**
     * Supprime un article d'une commande
     * @param {number} itemId - ID de l'article
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async removeOrderItem(itemId) {
      try {
        // Récupérer l'article pour connaître le produit et la quantité
        const item = await window.db.get('ORDER_ITEMS', itemId);
        if (!item) {
          throw new Error(`Article #${itemId} introuvable`);
        }
        
        // Remettre la quantité en stock
        await this._updateInventory(item.product_id, item.quantity, item.order_id);
        
        // Supprimer l'article
        await this.repository.deleteOrderItem(itemId);
        
        // Vérifier s'il reste des articles dans la commande
        const orderId = item.order_id;
        const remainingItems = await this.repository.getOrderItems(orderId);
        
        // Si c'était le dernier article, annuler la commande
        if (remainingItems.length === 0) {
          const order = await this.repository.getById(orderId);
          if (order.status === 'in_progress') {
            await this.repository.updateStatus(orderId, 'pending');
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la suppression de l'article #${itemId}:`, error);
        throw error;
      }
    },
    
    /**
     * Annule une commande
     * @param {number} orderId - ID de la commande
     * @param {string} reason - Raison de l'annulation
     * @returns {Promise<boolean>} True si l'annulation a réussi
     */
    async cancelOrder(orderId, reason = '') {
      try {
        // Récupérer la commande
        const order = await this.repository.getById(orderId);
        
        // Vérifier que la commande peut être annulée
        if (order.status === 'completed') {
          throw new Error('Impossible d\'annuler une commande terminée');
        }
        
        if (order.status === 'cancelled') {
          throw new Error('Cette commande est déjà annulée');
        }
        
        // Récupérer les articles de la commande
        const items = await this.repository.getOrderItems(orderId);
        
        // Remettre les produits en stock
        for (const item of items) {
          await this._updateInventory(item.product_id, item.quantity, orderId);
        }
        
        // Mettre à jour le statut et la note
        order.status = 'cancelled';
        if (reason) {
          order.note = order.note ? `${order.note}\nAnnulation: ${reason}` : `Annulation: ${reason}`;
        }
        
        await this.repository.update(order);
        
        window.services.notification.info(`Commande #${orderId} annulée`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de l'annulation de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Finalise une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<boolean>} True si la finalisation a réussi
     */
    async completeOrder(orderId) {
      try {
        // Récupérer la commande
        const order = await this.repository.getById(orderId);
        
        // Vérifier que la commande peut être finalisée
        if (order.status !== 'in_progress') {
          throw new Error('Seule une commande en cours peut être finalisée');
        }
        
        // Vérifier qu'il y a des articles dans la commande
        const items = await this.repository.getOrderItems(orderId);
        if (items.length === 0) {
          throw new Error('Impossible de finaliser une commande sans articles');
        }
        
        // Mettre à jour le statut
        order.status = 'completed';
        await this.repository.update(order);
        
        // Libérer la table
        await this._releaseTable(order.table_number);
        
        window.services.notification.success(`Commande #${orderId} finalisée`);
        
        return true;
      } catch (error) {
        console.error(`Erreur dans le service lors de la finalisation de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Recherche des commandes selon des critères
     * @param {Object} filters - Critères de recherche
     * @returns {Promise<Array>} Liste des commandes correspondant aux critères
     */
    async searchOrders(filters) {
      try {
        return await this.repository.searchOrders(filters);
      } catch (error) {
        console.error('Erreur dans le service lors de la recherche de commandes:', error);
        throw error;
      }
    },
    
    /**
     * Obtient les statistiques des commandes pour une période
     * @param {Object} period - Période (dates de début et fin)
     * @returns {Promise<Object>} Statistiques des commandes
     */
    async getOrderStatistics(period) {
      try {
        // Récupérer les commandes pour la période
        const filters = {
          startDate: period.start,
          endDate: period.end
        };
        
        const orders = await this.repository.getAll(filters);
        
        // Filtrer les commandes terminées
        const completedOrders = orders.filter(order => order.status === 'completed');
        
        // Calculer les statistiques
        const totalOrders = completedOrders.length;
        const totalAmount = completedOrders.reduce((sum, order) => sum + order.total_ttc, 0);
        const averageAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;
        
        // Compter par statut
        const countByStatus = {};
        orders.forEach(order => {
          countByStatus[order.status] = (countByStatus[order.status] || 0) + 1;
        });
        
        return {
          totalOrders,
          totalAmount,
          averageAmount,
          countByStatus
        };
      } catch (error) {
        console.error('Erreur dans le service lors du calcul des statistiques de commandes:', error);
        throw error;
      }
    },
    
    /* Méthodes privées */
    
    /**
     * Vérifie si une transition de statut est valide
     * @param {string} currentStatus - Statut actuel
     * @param {string} newStatus - Nouveau statut
     * @returns {boolean} True si la transition est valide
     * @private
     */
    _isValidStatusTransition(currentStatus, newStatus) {
      // Définir les transitions autorisées
      const allowedTransitions = {
        'pending': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [], // Pas de transition possible depuis "completed"
        'cancelled': ['pending'] // Permettre de réactiver une commande annulée
      };
      
      // Vérifier si la transition est autorisée
      return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    },
    
    /**
     * Gère les actions spécifiques lors d'un changement de statut
     * @param {number} orderId - ID de la commande
     * @param {string} newStatus - Nouveau statut
     * @param {string} oldStatus - Ancien statut
     * @returns {Promise<void>} Promesse résolue lorsque le traitement est terminé
     * @private
     */
    async _handleStatusChange(orderId, newStatus, oldStatus) {
      // Actions selon le nouveau statut
      switch (newStatus) {
        case 'completed':
          // Libérer la table
          const order = await this.repository.getById(orderId);
          await this._releaseTable(order.table_number);
          
          // Notification
          window.services.notification.success(`Commande #${orderId} terminée`);
          break;
          
        case 'cancelled':
          // Remettre les produits en stock si la commande était en cours
          if (oldStatus === 'in_progress') {
            const items = await this.repository.getOrderItems(orderId);
            for (const item of items) {
              await this._updateInventory(item.product_id, item.quantity, orderId);
            }
          }
          
          // Notification
          window.services.notification.info(`Commande #${orderId} annulée`);
          break;
          
        case 'in_progress':
          // Notification
          window.services.notification.info(`Commande #${orderId} en cours`);
          break;
      }
    },
    
    /**
     * Met à jour l'inventaire lors d'ajout/modification/suppression d'articles
     * @param {number} productId - ID du produit
     * @param {number} quantityChange - Changement de quantité (négatif pour sortie, positif pour entrée)
     * @param {number} orderId - ID de la commande (pour référence)
     * @returns {Promise<void>} Promesse résolue lorsque la mise à jour est terminée
     * @private
     */
    async _updateInventory(productId, quantityChange, orderId) {
      try {
        // Récupérer le produit
        const product = await window.db.get('PRODUCTS', productId);
        if (!product) {
          throw new Error(`Produit #${productId} introuvable`);
        }
        
        // Mettre à jour la quantité en stock
        const newQuantity = product.quantity + quantityChange;
        
        // Vérifier que la quantité ne devient pas négative
        if (newQuantity < 0) {
          throw new Error(`Stock insuffisant pour le produit "${product.name}"`);
        }
        
        // Mettre à jour le produit
        product.quantity = newQuantity;
        await window.db.update('PRODUCTS', product);
        
        // Ajouter une entrée dans le journal d'inventaire
        const logEntry = {
          product_id: productId,
          date: new Date().toISOString(),
          quantity: Math.abs(quantityChange),
          reason: quantityChange < 0 ? 'order' : 'order_cancel',
          type: quantityChange < 0 ? 'exit' : 'entry',
          reference: `order-${orderId}`,
          user_note: `Commande #${orderId}`
        };
        
        await window.db.add('INVENTORY_LOG', logEntry);
        
        // Vérifier si le stock est bas
        if (newQuantity <= product.min_stock) {
          this._notifyLowStock(product);
        }
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'inventaire pour le produit #${productId}:`, error);
        throw error;
      }
    },
    
    /**
     * Libère une table après finalisation d'une commande
     * @param {number} tableNumber - Numéro de la table
     * @returns {Promise<boolean>} True si la libération a réussi
     * @private
     */
    async _releaseTable(tableNumber) {
      try {
        // Vérifier s'il y a d'autres commandes actives pour cette table
        const activeOrders = await this.repository.getByTable(tableNumber, true);
        
        // Si c'était la dernière commande active, libérer la table
        if (activeOrders.length === 0) {
          // Récupérer la table
          const tables = await window.db.getByIndex('TABLES', 'number', tableNumber);
          if (tables.length > 0) {
            const table = tables[0];
            
            // Mettre à jour le statut
            table.status = 'available';
            await window.db.update('TABLES', table);
            
            console.log(`Table ${tableNumber} libérée`);
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Erreur lors de la libération de la table ${tableNumber}:`, error);
        return false;
      }
    },
    
    /**
     * Notifie d'un stock bas
     * @param {Object} product - Produit concerné
     * @private
     */
    _notifyLowStock(product) {
      // Créer une alerte
      const alert = {
        type: window.services.alerts.types.INVENTORY,
        priority: window.services.alerts.priorities.MEDIUM,
        title: 'Stock bas',
        message: `Le stock de "${product.name}" est bas (${product.quantity} ${product.unit} restant${product.quantity > 1 ? 's' : ''})`,
        data: {
          productId: product.id,
          currentStock: product.quantity,
          minStock: product.min_stock
        }
      };
      
      window.services.alerts.addAlert(alert);
    }
  };
  
  // Exposer le service dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.orders = window.modules.orders || {};
  window.modules.orders.OrderService = OrderService;
  
  // Exporter pour les imports ES6
  export default OrderService;