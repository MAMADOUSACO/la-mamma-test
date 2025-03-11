/**
 * Composant OrderForm - Formulaire de commande
 * Fichier: js/components/orders/OrderForm.js
 * 
 * Ce composant intègre les sélecteurs de produits et de tables ainsi que
 * le récapitulatif de commande pour fournir une interface complète de création
 * et modification de commande.
 */

class OrderForm {
    /**
     * Constructeur du composant OrderForm
     * @param {Object} options - Options de configuration
     * @param {Object} options.order - Données de la commande (null pour nouvelle commande)
     * @param {Array} options.products - Liste des produits disponibles
     * @param {Function} options.onOrderUpdate - Callback lors de la mise à jour de la commande
     * @param {Function} options.onOrderComplete - Callback lors de la finalisation de la commande
     * @param {Function} options.onOrderCancel - Callback lors de l'annulation de la commande
     * @param {Function} options.onClose - Callback lors de la fermeture du formulaire
     */
    constructor(options = {}) {
      this.order = options.order || null;
      this.products = options.products || [];
      this.onOrderUpdate = options.onOrderUpdate || (() => {});
      this.onOrderComplete = options.onOrderComplete || (() => {});
      this.onOrderCancel = options.onOrderCancel || (() => {});
      this.onClose = options.onClose || (() => {});
      
      this.element = null;
      this.productSelector = null;
      this.orderSummary = null;
      this.spinner = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du formulaire de commande
     * @returns {HTMLElement} Élément HTML du formulaire
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'order-form';
      
      // Créer l'en-tête
      const header = this._createHeader();
      this.element.appendChild(header);
      
      // Créer le contenu principal
      const content = document.createElement('div');
      content.className = 'order-form-content';
      
      // Partie gauche (sélecteur de produits)
      const leftPanel = document.createElement('div');
      leftPanel.className = 'order-form-left';
      
      // Créer le sélecteur de produits
      this.productSelector = new window.components.orders.ProductSelector({
        products: this.products,
        onProductSelect: this._handleProductSelect.bind(this),
        onSearch: this._handleProductSearch.bind(this)
      });
      
      leftPanel.appendChild(this.productSelector.render());
      
      // Partie droite (récapitulatif de commande)
      const rightPanel = document.createElement('div');
      rightPanel.className = 'order-form-right';
      
      // Créer le récapitulatif de commande
      this.orderSummary = new window.components.orders.OrderSummary({
        order: this.order,
        onItemUpdate: this._handleItemUpdate.bind(this),
        onItemRemove: this._handleItemRemove.bind(this),
        onNoteUpdate: this._handleNoteUpdate.bind(this),
        onOrderCancel: this._handleOrderCancel.bind(this),
        onOrderComplete: this._handleOrderComplete.bind(this)
      });
      
      rightPanel.appendChild(this.orderSummary.render());
      
      // Assembler le contenu
      content.appendChild(leftPanel);
      content.appendChild(rightPanel);
      
      this.element.appendChild(content);
      
      return this.element;
    }
    
    /**
     * Met à jour les données de la commande
     * @param {Object} order - Nouvelles données de commande
     */
    updateOrder(order) {
      this.order = order;
      
      // Mettre à jour le récapitulatif
      if (this.orderSummary) {
        this.orderSummary.updateOrder(order);
      }
      
      // Mettre à jour le titre
      this._updateHeader();
    }
    
    /**
     * Met à jour la liste des produits
     * @param {Array} products - Nouveaux produits
     */
    updateProducts(products) {
      this.products = products || [];
      
      // Mettre à jour le sélecteur de produits
      if (this.productSelector) {
        this.productSelector.updateProducts(products);
      }
    }
    
    /**
     * Affiche un indicateur de chargement
     * @param {boolean} show - Si true, affiche le spinner
     * @param {string} message - Message à afficher
     */
    showLoading(show, message = 'Chargement...') {
      if (show) {
        if (!this.spinner) {
          this.spinner = new window.components.Spinner({
            message: message,
            overlay: true
          });
          
          if (this.element) {
            this.element.appendChild(this.spinner.render());
          }
        } else {
          this.spinner.setMessage(message);
        }
      } else if (this.spinner) {
        if (this.spinner.element && this.spinner.element.parentNode) {
          this.spinner.element.parentNode.removeChild(this.spinner.element);
        }
        this.spinner = null;
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Détruire les sous-composants
      if (this.productSelector) {
        this.productSelector.destroy();
      }
      
      if (this.orderSummary) {
        this.orderSummary.destroy();
      }
      
      if (this.spinner) {
        this.spinner.destroy();
      }
      
      // Nettoyer les écouteurs d'événements
      const closeButton = this.element?.querySelector('.btn-close');
      if (closeButton) {
        closeButton.removeEventListener('click', closeButton._clickHandler);
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.productSelector = null;
      this.orderSummary = null;
      this.spinner = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Crée l'en-tête du formulaire
     * @returns {HTMLElement} En-tête
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'orders-section-header';
      
      // Titre
      const title = document.createElement('h2');
      title.className = 'orders-section-title order-form-title';
      
      // Définir le titre selon le contexte (nouvelle commande ou modification)
      if (this.order && this.order.id) {
        title.textContent = `Commande #${this.order.id}`;
        
        // Ajouter le statut
        const status = document.createElement('span');
        status.className = `order-status order-status-${this.order.status}`;
        status.textContent = this._getStatusText(this.order.status);
        title.appendChild(status);
      } else {
        title.textContent = 'Nouvelle commande';
      }
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'orders-section-actions';
      
      // Bouton fermer
      const closeButton = document.createElement('button');
      closeButton.className = 'btn btn-outline btn-sm btn-close';
      closeButton.innerHTML = '<span class="icon-x"></span>';
      
      closeButton._clickHandler = this._handleClose.bind(this);
      closeButton.addEventListener('click', closeButton._clickHandler);
      
      actions.appendChild(closeButton);
      
      header.appendChild(title);
      header.appendChild(actions);
      
      return header;
    }
    
    /**
     * Met à jour l'en-tête du formulaire
     * @private
     */
    _updateHeader() {
      const title = this.element?.querySelector('.order-form-title');
      if (!title) return;
      
      // Vider le contenu actuel
      title.innerHTML = '';
      
      // Définir le nouveau titre
      if (this.order && this.order.id) {
        title.textContent = `Commande #${this.order.id}`;
        
        // Ajouter le statut
        const status = document.createElement('span');
        status.className = `order-status order-status-${this.order.status}`;
        status.textContent = this._getStatusText(this.order.status);
        title.appendChild(status);
      } else {
        title.textContent = 'Nouvelle commande';
      }
    }
    
    /**
     * Gère la sélection d'un produit
     * @param {Object} product - Produit sélectionné
     * @private
     */
    _handleProductSelect(product) {
      // Vérifier que la commande existe
      if (!this.order || !this.order.id) {
        // Si c'est une nouvelle commande, demander d'abord la table
        this._promptForTableSelection().then(tableNumber => {
          if (tableNumber) {
            // Créer la commande avec cette table
            this._createOrderWithTable(tableNumber).then(orderId => {
              if (orderId) {
                // Ajouter le produit à la nouvelle commande
                this._addProductToOrder(product);
              }
            });
          }
        });
        return;
      }
      
      // Ajouter le produit à la commande existante
      this._addProductToOrder(product);
    }
    
    /**
     * Gère la recherche de produits
     * @param {string} query - Texte de recherche
     * @private
     */
    _handleProductSearch(query) {
      // Filtrer les produits selon la recherche
      const filteredProducts = this._searchProducts(query);
      
      // Mettre à jour le sélecteur
      if (this.productSelector) {
        this.productSelector.updateProducts(filteredProducts);
      }
    }
    
    /**
     * Gère la mise à jour d'un article
     * @param {number} itemId - ID de l'article
     * @param {Object} changes - Modifications à appliquer
     * @private
     */
    _handleItemUpdate(itemId, changes) {
      this.showLoading(true, 'Mise à jour...');
      
      this.onOrderUpdate('updateItem', { itemId, changes })
        .finally(() => {
          this.showLoading(false);
        });
    }
    
    /**
     * Gère la suppression d'un article
     * @param {number} itemId - ID de l'article à supprimer
     * @private
     */
    _handleItemRemove(itemId) {
      this.showLoading(true, 'Suppression...');
      
      this.onOrderUpdate('removeItem', { itemId })
        .finally(() => {
          this.showLoading(false);
        });
    }
    
    /**
     * Gère la mise à jour de la note
     * @param {string} note - Nouvelle note
     * @private
     */
    _handleNoteUpdate(note) {
      this.onOrderUpdate('updateNote', { note });
    }
    
    /**
     * Gère l'annulation de la commande
     * @private
     */
    _handleOrderCancel() {
      this.showLoading(true, 'Annulation...');
      
      this.onOrderCancel()
        .finally(() => {
          this.showLoading(false);
        });
    }
    
    /**
     * Gère la finalisation de la commande
     * @private
     */
    _handleOrderComplete() {
      this.showLoading(true, 'Finalisation...');
      
      this.onOrderComplete()
        .finally(() => {
          this.showLoading(false);
        });
    }
    
    /**
     * Gère la fermeture du formulaire
     * @private
     */
    _handleClose() {
      // Vérifier s'il y a des modifications non enregistrées
      if (this.order && !this.order.items?.length && this.order.status === 'pending') {
        // Demander confirmation pour une commande vide
        window.components.Modal.confirm(
          'Cette commande est vide. Voulez-vous l\'annuler ?',
          'Annuler la commande',
          () => {
            this.onOrderCancel().finally(() => {
              this.onClose();
            });
          },
          () => {
            this.onClose();
          }
        );
        return;
      }
      
      this.onClose();
    }
    
    /**
     * Ajoute un produit à la commande courante
     * @param {Object} product - Produit à ajouter
     * @private
     */
    _addProductToOrder(product) {
      this.showLoading(true, 'Ajout du produit...');
      
      this.onOrderUpdate('addProduct', { productId: product.id, quantity: 1 })
        .finally(() => {
          this.showLoading(false);
        });
    }
    
    /**
     * Demande à l'utilisateur de sélectionner une table
     * @returns {Promise<number|null>} Promesse résolue avec le numéro de table ou null
     * @private
     */
    async _promptForTableSelection() {
      return new Promise(async (resolve) => {
        try {
          // Récupérer les tables disponibles
          const allTables = await window.db.getAll('TABLES');
          const availableTables = allTables.filter(table => table.status === 'available');
          
          if (availableTables.length === 0) {
            window.services.notification.warning('Aucune table disponible');
            resolve(null);
            return;
          }
          
          // Créer le sélecteur de table
          const tableSelector = new window.components.orders.TableSelector({
            tables: availableTables,
            showUnavailable: true,
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
    }
    
    /**
     * Crée une nouvelle commande avec une table spécifiée
     * @param {number} tableNumber - Numéro de la table
     * @returns {Promise<number|null>} Promesse résolue avec l'ID de la commande ou null
     * @private
     */
    async _createOrderWithTable(tableNumber) {
      return new Promise((resolve) => {
        this.showLoading(true, 'Création de la commande...');
        
        this.onOrderUpdate('create', { tableNumber })
          .then(orderId => {
            resolve(orderId);
          })
          .catch(error => {
            console.error('Erreur lors de la création de la commande:', error);
            window.services.notification.error('Impossible de créer la commande');
            resolve(null);
          })
          .finally(() => {
            this.showLoading(false);
          });
      });
    }
    
    /**
     * Recherche des produits selon un texte
     * @param {string} query - Texte de recherche
     * @returns {Array} Produits filtrés
     * @private
     */
    _searchProducts(query) {
      if (!query) {
        return this.products;
      }
      
      // Normaliser la recherche (insensible à la casse et aux accents)
      const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      return this.products.filter(product => {
        const normalizedName = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedCategory = product.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        return normalizedName.includes(normalizedQuery) || 
               normalizedCategory.includes(normalizedQuery);
      });
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
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.orders = window.components.orders || {};
  window.components.orders.OrderForm = OrderForm;