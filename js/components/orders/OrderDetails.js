/**
 * Composant OrderDetails - Détails d'une commande
 * Fichier: js/components/orders/OrderDetails.js
 * 
 * Ce composant affiche les détails d'une commande existante,
 * avec les informations générales, les articles et les totaux.
 */

class OrderDetails {
    /**
     * Constructeur du composant OrderDetails
     * @param {Object} options - Options de configuration
     * @param {Object} options.order - Données de la commande
     * @param {Function} options.onEdit - Callback pour éditer la commande
     * @param {Function} options.onPrint - Callback pour imprimer la commande
     * @param {Function} options.onClose - Callback pour fermer les détails
     */
    constructor(options = {}) {
      this.order = options.order || null;
      this.onEdit = options.onEdit || (() => {});
      this.onPrint = options.onPrint || (() => {});
      this.onClose = options.onClose || (() => {});
      
      this.element = null;
    }
  
    /**
     * Génère et retourne l'élément HTML des détails
     * @returns {HTMLElement} Élément HTML des détails
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'order-details';
      
      // Vérifier que la commande existe
      if (!this.order) {
        this._renderEmptyState();
        return this.element;
      }
      
      // Créer l'en-tête
      const header = this._createHeader();
      this.element.appendChild(header);
      
      // Informations générales
      const infoPanel = this._createInfoPanel();
      this.element.appendChild(infoPanel);
      
      // Articles de la commande
      const itemsSection = this._createItemsSection();
      this.element.appendChild(itemsSection);
      
      // Notes de la commande si présentes
      if (this.order.note) {
        const noteSection = this._createNoteSection();
        this.element.appendChild(noteSection);
      }
      
      // Totaux
      const totalsSection = this._createTotalsSection();
      this.element.appendChild(totalsSection);
      
      // Boutons d'action
      const actions = this._createActions();
      this.element.appendChild(actions);
      
      return this.element;
    }
    
    /**
     * Met à jour les données de la commande
     * @param {Object} order - Nouvelles données de commande
     */
    updateOrder(order) {
      this.order = order;
      
      // Recréer l'élément complet (simple mais efficace)
      if (this.element && this.element.parentNode) {
        const parent = this.element.parentNode;
        parent.removeChild(this.element);
        parent.appendChild(this.render());
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements
      const editButton = this.element?.querySelector('.btn-edit');
      if (editButton) {
        editButton.removeEventListener('click', editButton._clickHandler);
      }
      
      const printButton = this.element?.querySelector('.btn-print');
      if (printButton) {
        printButton.removeEventListener('click', printButton._clickHandler);
      }
      
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
    }
    
    /* Méthodes privées */
    
    /**
     * Crée l'en-tête des détails
     * @returns {HTMLElement} En-tête
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'order-details-header';
      
      // Titre avec numéro de commande
      const title = document.createElement('div');
      title.className = 'order-details-title';
      title.textContent = `Commande #${this.order.id}`;
      
      // Statut de la commande
      const status = document.createElement('div');
      status.className = `order-details-status order-status-${this.order.status}`;
      status.textContent = this._getStatusText(this.order.status);
      
      header.appendChild(title);
      header.appendChild(status);
      
      return header;
    }
    
    /**
     * Crée le panneau d'informations générales
     * @returns {HTMLElement} Panneau d'informations
     * @private
     */
    _createInfoPanel() {
      const infoPanel = document.createElement('div');
      infoPanel.className = 'order-details-info';
      
      // Date et heure
      const dateItem = document.createElement('div');
      dateItem.className = 'order-details-info-item';
      
      const dateLabel = document.createElement('div');
      dateLabel.className = 'order-details-info-label';
      dateLabel.textContent = 'Date et heure';
      
      const dateValue = document.createElement('div');
      dateValue.className = 'order-details-info-value';
      dateValue.textContent = this._formatDateTime(this.order.date);
      
      dateItem.appendChild(dateLabel);
      dateItem.appendChild(dateValue);
      
      // Numéro de table
      const tableItem = document.createElement('div');
      tableItem.className = 'order-details-info-item';
      
      const tableLabel = document.createElement('div');
      tableLabel.className = 'order-details-info-label';
      tableLabel.textContent = 'Table';
      
      const tableValue = document.createElement('div');
      tableValue.className = 'order-details-info-value';
      tableValue.textContent = `Table ${this.order.table_number}`;
      
      tableItem.appendChild(tableLabel);
      tableItem.appendChild(tableValue);
      
      // Assembler le panneau
      infoPanel.appendChild(dateItem);
      infoPanel.appendChild(tableItem);
      
      return infoPanel;
    }
    
    /**
     * Crée la section des articles
     * @returns {HTMLElement} Section des articles
     * @private
     */
    _createItemsSection() {
      const section = document.createElement('div');
      section.className = 'order-details-items-section';
      
      // Titre de la section
      const sectionTitle = document.createElement('h3');
      sectionTitle.className = 'section-title';
      sectionTitle.textContent = 'Articles';
      section.appendChild(sectionTitle);
      
      // Créer le tableau des articles
      const table = document.createElement('table');
      table.className = 'order-details-table';
      
      // En-tête du tableau
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Produit</th>
          <th class="order-details-quantity">Quantité</th>
          <th class="order-details-price">Prix unitaire</th>
          <th class="order-details-price">Total</th>
        </tr>
      `;
      table.appendChild(thead);
      
      // Corps du tableau
      const tbody = document.createElement('tbody');
      
      // Vérifier si la commande a des articles
      if (this.order.items && this.order.items.length > 0) {
        // Ajouter chaque article
        this.order.items.forEach(item => {
          const row = document.createElement('tr');
          
          // Nom du produit + note
          const nameCell = document.createElement('td');
          
          const productName = document.createElement('div');
          productName.className = 'order-details-product-name';
          productName.textContent = item.product ? item.product.name : `Produit #${item.product_id}`;
          
          nameCell.appendChild(productName);
          
          // Ajouter la note si présente
          if (item.note) {
            const note = document.createElement('div');
            note.className = 'order-details-note';
            note.textContent = item.note;
            nameCell.appendChild(note);
          }
          
          // Quantité
          const quantityCell = document.createElement('td');
          quantityCell.className = 'order-details-quantity';
          quantityCell.textContent = item.quantity;
          
          // Prix unitaire
          const priceCell = document.createElement('td');
          priceCell.className = 'order-details-price';
          priceCell.textContent = this._formatPrice(item.price);
          
          // Total
          const totalCell = document.createElement('td');
          totalCell.className = 'order-details-price';
          totalCell.textContent = this._formatPrice(item.price * item.quantity);
          
          // Assembler la ligne
          row.appendChild(nameCell);
          row.appendChild(quantityCell);
          row.appendChild(priceCell);
          row.appendChild(totalCell);
          
          tbody.appendChild(row);
        });
      } else {
        // Afficher un message si pas d'articles
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.className = 'order-details-empty';
        emptyCell.textContent = 'Aucun article dans cette commande';
        
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }
      
      table.appendChild(tbody);
      section.appendChild(table);
      
      return section;
    }
    
    /**
     * Crée la section de note
     * @returns {HTMLElement} Section de note
     * @private
     */
    _createNoteSection() {
      const section = document.createElement('div');
      section.className = 'order-details-note-section';
      
      // Titre de la section
      const sectionTitle = document.createElement('h3');
      sectionTitle.className = 'section-title';
      sectionTitle.textContent = 'Notes';
      section.appendChild(sectionTitle);
      
      // Contenu de la note
      const noteContent = document.createElement('div');
      noteContent.className = 'order-details-note-content';
      noteContent.textContent = this.order.note;
      
      section.appendChild(noteContent);
      
      return section;
    }
    
    /**
     * Crée la section des totaux
     * @returns {HTMLElement} Section des totaux
     * @private
     */
    _createTotalsSection() {
      const section = document.createElement('div');
      section.className = 'order-details-totals';
      
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
      
      // Assembler la section
      section.appendChild(totalHT);
      section.appendChild(tva);
      section.appendChild(totalTTC);
      
      return section;
    }
    
    /**
     * Crée les boutons d'action
     * @returns {HTMLElement} Conteneur des boutons
     * @private
     */
    _createActions() {
      const actions = document.createElement('div');
      actions.className = 'order-details-actions';
      
      // Bouton fermer
      const closeButton = document.createElement('button');
      closeButton.className = 'btn btn-secondary btn-close';
      closeButton.innerHTML = '<span class="icon-arrow-left"></span> Retour';
      
      closeButton._clickHandler = this.onClose;
      closeButton.addEventListener('click', closeButton._clickHandler);
      
      // Bouton éditer (seulement si la commande n'est pas terminée ou annulée)
      if (this.order.status !== 'completed' && this.order.status !== 'cancelled') {
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-edit';
        editButton.innerHTML = '<span class="icon-edit"></span> Modifier';
        
        editButton._clickHandler = () => this.onEdit(this.order.id);
        editButton.addEventListener('click', editButton._clickHandler);
        
        actions.appendChild(editButton);
      }
      
      // Bouton imprimer
      const printButton = document.createElement('button');
      printButton.className = 'btn btn-outline btn-print';
      printButton.innerHTML = '<span class="icon-printer"></span> Imprimer';
      
      printButton._clickHandler = () => this.onPrint(this.order.id);
      printButton.addEventListener('click', printButton._clickHandler);
      
      actions.appendChild(printButton);
      actions.appendChild(closeButton);
      
      return actions;
    }
    
    /**
     * Affiche un état vide lorsqu'il n'y a pas de commande
     * @private
     */
    _renderEmptyState() {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-file-text';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      message.textContent = 'Aucune commande sélectionnée';
      
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.innerHTML = '<span class="icon-arrow-left"></span> Retour';
      button.addEventListener('click', this.onClose);
      
      emptyState.appendChild(icon);
      emptyState.appendChild(message);
      emptyState.appendChild(button);
      
      this.element.appendChild(emptyState);
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
     * Formate une date et heure
     * @param {string} dateTime - Date ISO
     * @returns {string} Date et heure formatées
     * @private
     */
    _formatDateTime(dateTime) {
      try {
        const date = new Date(dateTime);
        return date.toLocaleString([], { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        });
      } catch (error) {
        return dateTime || '';
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
  window.components.orders.OrderDetails = OrderDetails;