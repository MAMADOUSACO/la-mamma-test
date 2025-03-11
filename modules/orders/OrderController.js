/**
 * Contrôleur des commandes - Gestion des interactions utilisateur
 * Fichier: modules/orders/OrderController.js
 * 
 * Ce contrôleur gère les interactions entre l'interface utilisateur et le service
 * des commandes. Il reçoit les actions de l'utilisateur, les traite et met à jour
 * l'interface en conséquence.
 */

/**
 * Contrôleur des commandes
 */
const OrderController = {
    service: null,
    currentOrder: null,
    
    /**
     * Initialise le contrôleur
     * @param {Object} orderService - Service des commandes
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init(orderService) {
      this.service = orderService;
      this.currentOrder = null;
      console.log('Contrôleur des commandes initialisé');
    },
    
    /**
     * Charge la liste des commandes actives
     * @param {Function} callback - Fonction appelée avec les commandes chargées
     */
    async loadActiveOrders(callback) {
      try {
        const orders = await this.service.getActiveOrders();
        callback(orders);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes actives:', error);
        window.services.notification.error('Impossible de charger les commandes actives');
        callback([]);
      }
    },
    
    /**
     * Charge l'historique des commandes
     * @param {Object} filters - Filtres à appliquer
     * @param {Function} callback - Fonction appelée avec les commandes chargées
     */
    async loadOrderHistory(filters, callback) {
      try {
        const orders = await this.service.searchOrders(filters);
        callback(orders);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des commandes:', error);
        window.services.notification.error('Impossible de charger l\'historique des commandes');
        callback([]);
      }
    },
    
    /**
     * Crée une nouvelle commande
     * @param {number} tableNumber - Numéro de table (optionnel)
     * @returns {Promise<number|null>} ID de la nouvelle commande ou null en cas d'erreur
     */
    async createOrder(tableNumber = null) {
      try {
        if (!tableNumber) {
          // Si aucune table n'est spécifiée, ouvrir le sélecteur de table
          const tableId = await this._promptForTable();
          if (!tableId) {
            return null; // L'utilisateur a annulé
          }
          tableNumber = tableId;
        }
        
        // Créer la commande
        const orderData = {
          table_number: tableNumber,
          status: 'pending'
        };
        
        const orderId = await this.service.createOrder(orderData);
        
        // Définir comme commande courante
        await this.loadOrderForEdit(orderId);
        
        return orderId;
      } catch (error) {
        console.error('Erreur lors de la création d\'une commande:', error);
        window.services.notification.error('Impossible de créer une nouvelle commande');
        return null;
      }
    },
    
    /**
     * Charge une commande pour modification
     * @param {number} orderId - ID de la commande
     * @returns {Promise<boolean>} True si le chargement a réussi
     */
    async loadOrderForEdit(orderId) {
      try {
        const order = await this.service.getOrderById(orderId);
        this.currentOrder = order;
        
        // Notifier le changement
        this._notifyOrderChanged();
        
        return true;
      } catch (error) {
        console.error(`Erreur lors du chargement de la commande #${orderId} pour modification:`, error);
        window.services.notification.error(`Impossible de charger la commande #${orderId}`);
        return false;
      }
    },
    
    /**
     * Ferme la commande en cours d'édition
     */
    closeCurrentOrder() {
      this.currentOrder = null;
      this._notifyOrderChanged();
    },
    
    /**
     * Ajoute un produit à la commande en cours
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité
     * @param {string} note - Note spécifique à l'article
     * @returns {Promise<boolean>} True si l'ajout a réussi
     */
    async addProductToOrder(productId, quantity = 1, note = '') {
      try {
        if (!this.currentOrder) {
          throw new Error('Aucune commande en cours d\'édition');
        }
        
        // Créer les données de l'article
        const itemData = {
          product_id: productId,
          quantity: quantity,
          note: note
        };
        
        // Ajouter l'article
        await this.service.addOrderItem(this.currentOrder.id, itemData);
        
        // Recharger la commande pour avoir les totaux à jour
        await this.loadOrderForEdit(this.currentOrder.id);
        
        return true;
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un produit à la commande:', error);
        window.services.notification.error('Impossible d\'ajouter le produit à la commande');
        return false;
      }
    },
    
    /**
     * Modifie un article de la commande en cours
     * @param {number} itemId - ID de l'article
     * @param {Object} changes - Modifications à appliquer
     * @returns {Promise<boolean>} True si la modification a réussi
     */
    async updateOrderItem(itemId, changes) {
      try {
        if (!this.currentOrder) {
          throw new Error('Aucune commande en cours d\'édition');
        }
        
        // Vérifier que l'article appartient à la commande courante
        const item = this.currentOrder.items.find(item => item.id === itemId);
        if (!item) {
          throw new Error(`L'article #${itemId} n'appartient pas à la commande en cours`);
        }
        
        // Mettre à jour l'article
        await this.service.updateOrderItem(itemId, changes);
        
        // Recharger la commande pour avoir les totaux à jour
        await this.loadOrderForEdit(this.currentOrder.id);
        
        return true;
      } catch (error) {
        console.error(`Erreur lors de la modification de l'article #${itemId}:`, error);
        window.services.notification.error('Impossible de modifier l\'article');
        return false;
      }
    },
    
    /**
     * Supprime un article de la commande en cours
     * @param {number} itemId - ID de l'article
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async removeOrderItem(itemId) {
      try {
        if (!this.currentOrder) {
          throw new Error('Aucune commande en cours d\'édition');
        }
        
        // Vérifier que l'article appartient à la commande courante
        const item = this.currentOrder.items.find(item => item.id === itemId);
        if (!item) {
          throw new Error(`L'article #${itemId} n'appartient pas à la commande en cours`);
        }
        
        // Demander confirmation
        const confirmed = await this._confirmAction(
          'Supprimer l\'article',
          'Êtes-vous sûr de vouloir supprimer cet article de la commande ?'
        );
        
        if (!confirmed) {
          return false;
        }
        
        // Supprimer l'article
        await this.service.removeOrderItem(itemId);
        
        // Recharger la commande
        await this.loadOrderForEdit(this.currentOrder.id);
        
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'article #${itemId}:`, error);
        window.services.notification.error('Impossible de supprimer l\'article');
        return false;
      }
    },
    
    /**
     * Modifie la note de la commande en cours
     * @param {string} note - Nouvelle note
     * @returns {Promise<boolean>} True si la modification a réussi
     */
    async updateOrderNote(note) {
      try {
        if (!this.currentOrder) {
          throw new Error('Aucune commande en cours d\'édition');
        }
        
        // Mettre à jour la commande
        const updatedOrder = {
          ...this.currentOrder,
          note: note
        };
        
        await this.service.updateOrder(updatedOrder);
        
        // Mettre à jour la commande courante
        this.currentOrder.note = note;
        this._notifyOrderChanged();
        
        return true;
      } catch (error) {
        console.error('Erreur lors de la modification de la note:', error);
        window.services.notification.error('Impossible de modifier la note');
        return false;
      }
    },
    
    /**
     * Change le statut de la commande en cours
     * @param {string} newStatus - Nouveau statut
     * @returns {Promise<boolean>} True si le changement a réussi
     */
    async changeOrderStatus(newStatus) {
      try {
        if (!this.currentOrder) {
          throw new Error('Aucune commande en cours d\'édition');
        }
        
        // Si le statut est "completed", demander confirmation
        if (newStatus === 'completed') {
          const confirmed = await this._confirmAction(
            'Finaliser la commande',
            'Êtes-vous sûr de vouloir finaliser cette commande ? Cette action ne peut pas être annulée.'
          );
          
          if (!confirmed) {
            return false;
          }
        }
        
        // Si le statut est "cancelled", demander la raison
        let reason = '';
        if (newStatus === 'cancelled') {
          reason = await this._promptForCancellationReason();
          if (reason === null) {
            return false; // L'utilisateur a annulé
          }
        }
        
        // Mettre à jour le statut
        if (newStatus === 'cancelled') {
          await this.service.cancelOrder(this.currentOrder.id, reason);
        } else {
          await this.service.changeOrderStatus(this.currentOrder.id, newStatus);
        }
        
        // Recharger la commande
        await this.loadOrderForEdit(this.currentOrder.id);
        
        return true;
      } catch (error) {
        console.error(`Erreur lors du changement de statut vers "${newStatus}":`, error);
        window.services.notification.error(`Impossible de changer le statut de la commande`);
        return false;
      }
    },
    
    /**
     * Finalise la commande en cours
     * @returns {Promise<boolean>} True si la finalisation a réussi
     */
    async completeOrder() {
      return await this.changeOrderStatus('completed');
    },
    
    /**
     * Annule la commande en cours
     * @returns {Promise<boolean>} True si l'annulation a réussi
     */
    async cancelOrder() {
      return await this.changeOrderStatus('cancelled');
    },
    
    /**
     * Recherche des commandes selon des critères
     * @param {Object} filters - Critères de recherche
     * @param {Function} callback - Fonction appelée avec les résultats
     */
    async searchOrders(filters, callback) {
      try {
        const orders = await this.service.searchOrders(filters);
        callback(orders);
      } catch (error) {
        console.error('Erreur lors de la recherche de commandes:', error);
        window.services.notification.error('Impossible de rechercher des commandes');
        callback([]);
      }
    },
    
    /**
     * Obtient les détails d'une commande
     * @param {number} orderId - ID de la commande
     * @param {Function} callback - Fonction appelée avec les détails
     */
    async getOrderDetails(orderId, callback) {
      try {
        const order = await this.service.getOrderById(orderId);
        callback(order);
      } catch (error) {
        console.error(`Erreur lors de la récupération des détails de la commande #${orderId}:`, error);
        window.services.notification.error('Impossible de récupérer les détails de la commande');
        callback(null);
      }
    },
    
    /**
     * S'abonne aux changements de la commande en cours
     * @param {Function} callback - Fonction appelée lors d'un changement
     * @returns {number} ID de l'abonnement
     */
    subscribeToOrderChanges(callback) {
      // Utilisation de la propriété privée pour stocker les abonnements
      this._orderChangeSubscribers = this._orderChangeSubscribers || [];
      
      // Générer un ID unique pour l'abonnement
      const subscriptionId = Date.now() + Math.floor(Math.random() * 1000);
      
      // Ajouter l'abonnement
      this._orderChangeSubscribers.push({
        id: subscriptionId,
        callback: callback
      });
      
      // Appeler immédiatement le callback avec l'état actuel
      callback(this.currentOrder);
      
      return subscriptionId;
    },
    
    /**
     * Se désabonne des changements de la commande en cours
     * @param {number} subscriptionId - ID de l'abonnement
     */
    unsubscribeFromOrderChanges(subscriptionId) {
      if (!this._orderChangeSubscribers) return;
      
      // Filtrer les abonnements
      this._orderChangeSubscribers = this._orderChangeSubscribers.filter(
        sub => sub.id !== subscriptionId
      );
    },
    
    /* Méthodes privées */
    
    /**
     * Notifie les abonnés d'un changement de la commande en cours
     * @private
     */
    _notifyOrderChanged() {
      if (!this._orderChangeSubscribers) return;
      
      // Notifier tous les abonnés
      this._orderChangeSubscribers.forEach(sub => {
        try {
          sub.callback(this.currentOrder);
        } catch (error) {
          console.error('Erreur dans un abonné aux changements de commande:', error);
        }
      });
    },
    
    /**
     * Demande une confirmation à l'utilisateur
     * @param {string} title - Titre de la confirmation
     * @param {string} message - Message de confirmation
     * @returns {Promise<boolean>} True si l'utilisateur a confirmé
     * @private
     */
    async _confirmAction(title, message) {
      return new Promise(resolve => {
        window.components.Modal.confirm(
          message,
          title,
          () => resolve(true),
          () => resolve(false)
        );
      });
    },
    
    /**
     * Demande à l'utilisateur de sélectionner une table
     * @returns {Promise<number|null>} Numéro de la table sélectionnée ou null si annulé
     * @private
     */
    async _promptForTable() {
      return new Promise(async (resolve) => {
        try {
          // Récupérer les tables disponibles
          const tables = await window.db.getAll('TABLES');
          const availableTables = tables.filter(table => table.status === 'available');
          
          if (availableTables.length === 0) {
            window.services.notification.warning('Aucune table disponible');
            resolve(null);
            return;
          }
          
          // Créer le contenu du sélecteur de table
          const tableSelector = new window.components.TableSelector({
            tables: availableTables,
            onSelect: (tableNumber) => {
              modal.close();
              resolve(tableNumber);
            }
          });
          
          // Afficher dans une modale
          const modal = new window.components.Modal({
            title: 'Sélectionner une table',
            content: tableSelector.render(),
            buttons: [
              {
                text: 'Annuler',
                type: 'secondary',
                close: true,
                onClick: () => resolve(null)
              }
            ],
            onHide: () => resolve(null)
          });
          
          modal.open();
        } catch (error) {
          console.error('Erreur lors de la sélection d\'une table:', error);
          window.services.notification.error('Impossible de charger les tables disponibles');
          resolve(null);
        }
      });
    },
    
    /**
     * Demande à l'utilisateur la raison de l'annulation
     * @returns {Promise<string|null>} Raison de l'annulation ou null si annulé
     * @private
     */
    async _promptForCancellationReason() {
      return new Promise(resolve => {
        // Créer un formulaire pour la raison
        const form = document.createElement('div');
        form.className = 'cancellation-reason-form';
        
        const label = document.createElement('label');
        label.textContent = 'Raison de l\'annulation:';
        label.htmlFor = 'cancellation-reason';
        
        const input = document.createElement('textarea');
        input.id = 'cancellation-reason';
        input.rows = 3;
        input.className = 'form-control';
        input.placeholder = 'Saisir la raison (optionnel)';
        
        form.appendChild(label);
        form.appendChild(input);
        
        // Afficher dans une modale
        window.components.Modal.form(
          form,
          'Annuler la commande',
          () => {
            const reason = input.value.trim();
            resolve(reason);
            return true;
          },
          {
            cancelText: 'Ne pas annuler',
            submitText: 'Annuler la commande',
            submitType: 'danger',
            onHide: () => resolve(null)
          }
        );
      });
    }
  };
  
  // Exposer le contrôleur dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.orders = window.modules.orders || {};
  window.modules.orders.OrderController = OrderController;
  
  // Exporter pour les imports ES6
  export default OrderController;