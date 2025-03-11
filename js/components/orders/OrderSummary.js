/**
 * Composant OrderSummary - Récapitulatif de commande
 * Fichier: js/components/orders/OrderSummary.js
 * 
 * Ce composant affiche le résumé d'une commande en cours, 
 * avec la liste des articles, les totaux et les notes.
 */

class OrderSummary {
    /**
     * Constructeur du composant OrderSummary
     * @param {Object} options - Options de configuration
     * @param {Object} options.order - Données de la commande
     * @param {Function} options.onItemUpdate - Callback pour mettre à jour un article
     * @param {Function} options.onItemRemove - Callback pour supprimer un article
     * @param {Function} options.onNoteUpdate - Callback pour mettre à jour la note
     * @param {Function} options.onOrderCancel - Callback pour annuler la commande
     * @param {Function} options.onOrderComplete - Callback pour finaliser la commande
     */
    constructor(options = {}) {
      this.order = options.order || null;
      this.onItemUpdate = options.onItemUpdate || (() => {});
      this.onItemRemove = options.onItemRemove || (() => {});
      this.onNoteUpdate = options.onNoteUpdate || (() => {});
      this.onOrderCancel = options.onOrderCancel || (() => {});
      this.onOrderComplete = options.onOrderComplete || (() => {});
      
      this.element = null;
      this.itemsContainer = null;
      this.notesTextarea = null;
      this.totalsContainer = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du récapitulatif
     * @returns {HTMLElement} Élément HTML du récapitulatif
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'order-summary';
      
      // Créer l'en-tête
      const header = this._createHeader();
      this.element.appendChild(header);
      
      // Conteneur des articles
      this.itemsContainer = document.createElement('div');
      this.itemsContainer.className = 'order-items';
      this._renderItems();
      this.element.appendChild(this.itemsContainer);
      
      // Totaux
      this.totalsContainer = document.createElement('div');
      this.totalsContainer.className = 'order-totals';
      this._renderTotals();
      this.element.appendChild(this.totalsContainer);
      
      // Notes
      const notesContainer = document.createElement('div');
      notesContainer.className = 'order-notes';
      
      const notesLabel = document.createElement('div');
      notesLabel.className = 'order-notes-label';
      notesLabel.textContent = 'Notes:';
      
      this.notesTextarea = document.createElement('textarea');
      this.notesTextarea.className = 'order-notes-textarea';
      this.notesTextarea.placeholder = 'Ajouter des notes pour cette commande...';
      
      // Ajouter la note existante
      if (this.order && this.order.note) {
        this.notesTextarea.value = this.order.note;
      }
      
      // Ajouter l'écouteur d'événement
      this.notesTextarea.addEventListener('blur', this._handleNoteChange.bind(this));
      
      notesContainer.appendChild(notesLabel);
      notesContainer.appendChild(this.notesTextarea);
      
      this.element.appendChild(notesContainer);
      
      // Pied de récapitulatif (boutons d'action)
      const footer = this._createFooter();
      this.element.appendChild(footer);
      
      return this.element;
    }
    
    /**
     * Met à jour les données de la commande
     * @param {Object} order - Nouvelles données de commande
     */
    updateOrder(order) {
      this.order = order;
      
      // Mettre à jour les articles
      if (this.itemsContainer) {
        this._renderItems();
      }
      
      // Mettre à jour les totaux
      if (this.totalsContainer) {
        this._renderTotals();
      }
      
      // Mettre à jour la note
      if (this.notesTextarea && order && order.note) {
        this.notesTextarea.value = order.note;
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements
      if (this.itemsContainer) {
        const itemElements = this.itemsContainer.querySelectorAll('.order-item-entry');
        itemElements.forEach(item => {
          const editButton = item.querySelector('.btn-edit');
          if (editButton) {
            editButton.removeEventListener('click', editButton._clickHandler);
          }
          
          const removeButton = item.querySelector('.btn-remove');
          if (removeButton) {
            removeButton.removeEventListener('click', removeButton._clickHandler);
          }
        });
      }
      
      if (this.notesTextarea) {
        this.notesTextarea.removeEventListener('blur', this._handleNoteChange);
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.itemsContainer = null;
      this.notesTextarea = null;
      this.totalsContainer = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Crée l'en-tête du récapitulatif
     * @returns {HTMLElement} En-tête
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'orders-section-header';
      
      // Titre
      const title = document.createElement('h2');
      title.className = 'orders-section-title';
      title.textContent = 'Récapitulatif';
      
      // Informations de la commande
      const orderInfo = document.createElement('div');
      orderInfo.className = 'order-header-info';
      
      if (this.order) {
        // Afficher les informations de la commande
        const tableInfo = document.createElement('div');
        tableInfo.className = 'order-header-table';
        tableInfo.innerHTML = `<span class="icon-table"></span> Table ${this.order.table_number}`;
        
        const orderStatus = document.createElement('div');
        orderStatus.className = `order-header-status order-status-${this.order.status}`;
        orderStatus.textContent = this._getStatusText(this.order.status);
        
        orderInfo.appendChild(tableInfo);
        orderInfo.appendChild(orderStatus);
      }
      
      header.appendChild(title);
      header.appendChild(orderInfo);
      
      return header;
    }
    
    /**
     * Crée le pied du récapitulatif avec les boutons d'action
     * @returns {HTMLElement} Pied du récapitulatif
     * @private
     */
    _createFooter() {
      const footer = document.createElement('div');
      footer.className = 'order-form-footer';
      
      // Conteneur des boutons de gauche
      const leftButtons = document.createElement('div');
      leftButtons.className = 'footer-buttons-left';
      
      // Bouton annuler
      const cancelButton = document.createElement('button');
      cancelButton.className = 'btn btn-outline btn-danger';
      cancelButton.innerHTML = '<span class="icon-trash"></span> Annuler';
      cancelButton.addEventListener('click', this._handleOrderCancel.bind(this));
      
      leftButtons.appendChild(cancelButton);
      
      // Conteneur des boutons de droite
      const rightButtons = document.createElement('div');
      rightButtons.className = 'footer-buttons-right';
      
      // Bouton finaliser
      const completeButton = document.createElement('button');
      completeButton.className = 'btn btn-success';
      completeButton.innerHTML = '<span class="icon-check"></span> Terminer';
      completeButton.addEventListener('click', this._handleOrderComplete.bind(this));
      
      // Désactiver le bouton si la commande est vide
      if (!this.order || !this.order.items || this.order.items.length === 0) {
        completeButton.disabled = true;
      }
      
      rightButtons.appendChild(completeButton);
      
      footer.appendChild(leftButtons);
      footer.appendChild(rightButtons);
      
      return footer;
    }
    
    /**
     * Rend les articles de la commande
     * @private
     */
    _renderItems() {
      if (!this.itemsContainer) return;
      
      // Vider le conteneur
      this.itemsContainer.innerHTML = '';
      
      // S'il n'y a pas de commande ou pas d'articles, afficher un message
      if (!this.order || !this.order.items || this.order.items.length === 0) {
        this._renderEmptyState();
        return;
      }
      
      // Ajouter chaque article
      this.order.items.forEach(item => {
        const itemElement = this._createItemElement(item);
        this.itemsContainer.appendChild(itemElement);
      });
    }
    
    /**
     * Crée un élément HTML pour un article
     * @param {Object} item - Données de l'article
     * @returns {HTMLElement} Élément HTML de l'article
     * @private
     */
    _createItemElement(item) {
      const itemElement = document.createElement('div');
      itemElement.className = 'order-item-entry';
      itemElement.dataset.id = item.id;
      
      // Contenu principal
      const content = document.createElement('div');
      content.className = 'order-item-content';
      
      // Nom du produit
      const name = document.createElement('div');
      name.className = 'order-item-name';
      name.textContent = item.product ? item.product.name : `Produit #${item.product_id}`;
      
      // Détails
      const details = document.createElement('div');
      details.className = 'order-item-details';
      
      // Quantité et prix unitaire
      const quantity = document.createElement('div');
      quantity.className = 'order-item-quantity';
      quantity.textContent = `${item.quantity} × ${this._formatPrice(item.price)}`;
      
      // Prix total
      const price = document.createElement('div');
      price.className = 'order-item-price';
      price.textContent = this._formatPrice(item.quantity * item.price);
      
      details.appendChild(quantity);
      details.appendChild(price);
      
      // Note si présente
      if (item.note) {
        const note = document.createElement('div');
        note.className = 'order-item-note';
        note.textContent = item.note;
        content.appendChild(name);
        content.appendChild(details);
        content.appendChild(note);
      } else {
        content.appendChild(name);
        content.appendChild(details);
      }
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'order-item-actions';
      
      // Bouton éditer
      const editButton = document.createElement('button');
      editButton.className = 'btn btn-icon btn-sm btn-edit';
      editButton.innerHTML = '<span class="icon-edit"></span>';
      editButton.title = 'Modifier';
      
      editButton._clickHandler = (e) => {
        e.stopPropagation();
        this._handleItemEdit(item);
      };
      
      editButton.addEventListener('click', editButton._clickHandler);
      
      // Bouton supprimer
      const removeButton = document.createElement('button');
      removeButton.className = 'btn btn-icon btn-sm btn-danger btn-remove';
      removeButton.innerHTML = '<span class="icon-trash"></span>';
      removeButton.title = 'Supprimer';
      
      removeButton._clickHandler = (e) => {
        e.stopPropagation();
        this._handleItemRemove(item);
      };
      
      removeButton.addEventListener('click', removeButton._clickHandler);
      
      actions.appendChild(editButton);
      actions.appendChild(removeButton);
      
      // Assembler l'élément
      itemElement.appendChild(content);
      itemElement.appendChild(actions);
      
      return itemElement;
    }
    
    /**
     * Rend les totaux de la commande
     * @private
     */
    _renderTotals() {
      if (!this.totalsContainer) return;
      
      // Vider le conteneur
      this.totalsContainer.innerHTML = '';
      
      // S'il n'y a pas de commande, ne rien afficher
      if (!this.order) return;
      
      // Total HT
      const totalHT = document.createElement('div');
      totalHT.className = 'order-total-row';
      totalHT.innerHTML = `<div>Total HT:</div><div>${this._formatPrice(this.order.total_ht)}</div>`;
      
      // TVA
      const tva = document.createElement('div');
      tva.className = 'order-total-row';
      tva.innerHTML = `<div>TVA:</div><div>${this._formatPrice(this.order.tva_amount)}</div>`;
      
      // Total TTC
      const totalTTC = document.createElement('div');
      totalTTC.className = 'order-total-row final';
      totalTTC.innerHTML = `<div>Total TTC:</div><div>${this._formatPrice(this.order.total_ttc)}</div>`;
      
      // Assembler les totaux
      this.totalsContainer.appendChild(totalHT);
      this.totalsContainer.appendChild(tva);
      this.totalsContainer.appendChild(totalTTC);
    }
    
    /**
     * Affiche un état vide lorsqu'il n'y a pas d'articles
     * @private
     */
    _renderEmptyState() {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-shopping-cart';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      message.textContent = 'Aucun article dans la commande';
      
      const subMessage = document.createElement('div');
      subMessage.className = 'empty-state-subtext';
      subMessage.textContent = 'Sélectionnez des produits à ajouter';
      
      emptyState.appendChild(icon);
      emptyState.appendChild(message);
      emptyState.appendChild(subMessage);
      
      this.itemsContainer.appendChild(emptyState);
    }
    
    /**
     * Gère la modification d'un article
     * @param {Object} item - Article à modifier
     * @private
     */
    _handleItemEdit(item) {
      // Créer un dialogue de quantité
      const dialog = this._createQuantityDialog(item, (newQuantity, newNote) => {
        // Appeler le callback avec les nouvelles données
        this.onItemUpdate(item.id, { quantity: newQuantity, note: newNote });
        
        // Fermer le dialogue
        modal.close();
      });
      
      // Afficher dans une modale
      const modal = new window.components.Modal({
        title: 'Modifier l\'article',
        content: dialog,
        size: 'small'
      });
      
      modal.open();
    }
    
    /**
     * Gère la suppression d'un article
     * @param {Object} item - Article à supprimer
     * @private
     */
    _handleItemRemove(item) {
      // Demander confirmation
      window.components.Modal.confirm(
        `Êtes-vous sûr de vouloir supprimer "${item.product ? item.product.name : 'cet article'}" de la commande ?`,
        'Supprimer l\'article',
        () => this.onItemRemove(item.id),
        null,
        {
          confirmText: 'Supprimer',
          confirmType: 'danger'
        }
      );
    }
    
    /**
     * Gère le changement de note
     * @private
     */
    _handleNoteChange() {
      if (!this.notesTextarea) return;
      
      const note = this.notesTextarea.value.trim();
      this.onNoteUpdate(note);
    }
    
    /**
     * Gère l'annulation de la commande
     * @private
     */
    _handleOrderCancel() {
      // Demander confirmation
      window.components.Modal.confirm(
        'Êtes-vous sûr de vouloir annuler cette commande ? Cette action ne peut pas être annulée.',
        'Annuler la commande',
        this.onOrderCancel,
        null,
        {
          confirmText: 'Annuler la commande',
          confirmType: 'danger'
        }
      );
    }
    
    /**
     * Gère la finalisation de la commande
     * @private
     */
    _handleOrderComplete() {
      // Demander confirmation
      window.components.Modal.confirm(
        'Êtes-vous sûr de vouloir finaliser cette commande ? Cette action ne peut pas être annulée.',
        'Finaliser la commande',
        this.onOrderComplete,
        null,
        {
          confirmText: 'Finaliser',
          confirmType: 'success'
        }
      );
    }
    
    /**
     * Crée un dialogue de modification de quantité
     * @param {Object} item - Article à modifier
     * @param {Function} onConfirm - Callback à appeler lors de la confirmation
     * @returns {HTMLElement} Dialogue de quantité
     * @private
     */
    _createQuantityDialog(item, onConfirm) {
      const dialog = document.createElement('div');
      dialog.className = 'quantity-dialog';
      
      // Titre
      const title = document.createElement('div');
      title.className = 'quantity-dialog-title';
      title.textContent = item.product ? item.product.name : `Produit #${item.product_id}`;
      dialog.appendChild(title);
      
      // Contrôles de quantité
      const controls = document.createElement('div');
      controls.className = 'quantity-controls';
      
      // Bouton moins
      const minusButton = document.createElement('button');
      minusButton.className = 'quantity-button';
      minusButton.textContent = '-';
      minusButton.disabled = item.quantity <= 1;
      
      // Input de quantité
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.className = 'quantity-input';
      quantityInput.min = '1';
      quantityInput.max = '99';
      quantityInput.value = item.quantity;
      
      // Bouton plus
      const plusButton = document.createElement('button');
      plusButton.className = 'quantity-button';
      plusButton.textContent = '+';
      
      // Ajouter les écouteurs d'événements
      minusButton.addEventListener('click', () => {
        const newValue = parseInt(quantityInput.value) - 1;
        if (newValue >= 1) {
          quantityInput.value = newValue;
          minusButton.disabled = newValue <= 1;
        }
      });
      
      plusButton.addEventListener('click', () => {
        const newValue = parseInt(quantityInput.value) + 1;
        if (newValue <= 99) {
          quantityInput.value = newValue;
          minusButton.disabled = false;
        }
      });
      
      quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        
        // Vérifier les limites
        if (isNaN(value) || value < 1) {
          value = 1;
        } else if (value > 99) {
          value = 99;
        }
        
        quantityInput.value = value;
        minusButton.disabled = value <= 1;
      });
      
      controls.appendChild(minusButton);
      controls.appendChild(quantityInput);
      controls.appendChild(plusButton);
      
      dialog.appendChild(controls);
      
      // Zone de note
      const noteContainer = document.createElement('div');
      noteContainer.className = 'quantity-note';
      
      const noteLabel = document.createElement('div');
      noteLabel.className = 'quantity-note-label';
      noteLabel.textContent = 'Note (optionnelle):';
      
      const noteInput = document.createElement('textarea');
      noteInput.className = 'quantity-note-input';
      noteInput.placeholder = 'ex: sans glace, cuisson à point, etc.';
      if (item.note) {
        noteInput.value = item.note;
      }
      
      noteContainer.appendChild(noteLabel);
      noteContainer.appendChild(noteInput);
      
      dialog.appendChild(noteContainer);
      
      // Boutons d'action
      const actions = document.createElement('div');
      actions.className = 'dialog-actions';
      
      const cancelButton = document.createElement('button');
      cancelButton.className = 'btn btn-secondary';
      cancelButton.textContent = 'Annuler';
      cancelButton.addEventListener('click', () => {
        if (dialog.parentNode && dialog.parentNode._modalInstance) {
          dialog.parentNode._modalInstance.close();
        }
      });
      
      const confirmButton = document.createElement('button');
      confirmButton.className = 'btn btn-primary';
      confirmButton.textContent = 'Valider';
      confirmButton.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value);
        const note = noteInput.value.trim();
        onConfirm(quantity, note);
      });
      
      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      
      dialog.appendChild(actions);
      
      return dialog;
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
  window.components.orders.OrderSummary = OrderSummary;