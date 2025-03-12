/**
 * Composant de journal d'inventaire
 * Affiche l'historique des mouvements de stock
 */
class InventoryLogs {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     * @param {Function} options.onProductSelect - Callback à la sélection d'un produit
     * @param {Function} options.onExport - Callback pour l'exportation des données
     * @param {Object} options.filters - Filtres initiaux
     */
    constructor(options) {
      this.container = options.container;
      this.onProductSelect = options.onProductSelect || function() {};
      this.onExport = options.onExport || function() {};
      
      this.logs = [];
      this.filters = options.filters || {
        startDate: null,
        endDate: null,
        productId: null,
        type: 'all', // 'all', 'entry', 'exit'
        reason: 'all'
      };
      
      this.pagination = {
        page: 1,
        limit: 10,
        total: 0
      };
      
      // Éléments DOM
      this.element = null;
      this.filtersElement = null;
      this.logsContainer = null;
      this.paginationElement = null;
    }
    
    /**
     * Rend le composant dans le conteneur
     * @returns {HTMLElement} Élément racine du composant
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'inventory-logs-component';
      
      const header = document.createElement('div');
      header.className = 'logs-header';
      header.innerHTML = `
        <h3>Journal des mouvements de stock</h3>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline export-logs" title="Exporter">
            <i class="icon-download"></i> Exporter
          </button>
        </div>
      `;
      
      // Section des filtres
      this.filtersElement = document.createElement('div');
      this.filtersElement.className = 'logs-filters';
      
      // Conteneur des logs
      this.logsContainer = document.createElement('div');
      this.logsContainer.className = 'logs-container';
      
      // Pagination
      this.paginationElement = document.createElement('div');
      this.paginationElement.className = 'logs-pagination';
      
      this.element.appendChild(header);
      this.element.appendChild(this.filtersElement);
      this.element.appendChild(this.logsContainer);
      this.element.appendChild(this.paginationElement);
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      // Événements
      const exportButton = header.querySelector('.export-logs');
      exportButton.addEventListener('click', () => {
        this.onExport(this.filters);
      });
      
      this._renderFilters();
      
      return this.element;
    }
    
    /**
     * Met à jour les logs affichés
     * @param {Object} data - Données des logs et pagination
     * @param {Array} data.logs - Liste des mouvements de stock
     * @param {Object} data.pagination - Informations de pagination
     */
    updateLogs(data) {
      if (!data) return;
      
      this.logs = data.logs || [];
      
      if (data.pagination) {
        this.pagination = {
          ...this.pagination,
          ...data.pagination
        };
      }
      
      this._renderLogs();
      this._renderPagination();
    }
    
    /**
     * Définit les filtres à appliquer
     * @param {Object} filters - Filtres à appliquer
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      this._renderFilters();
      
      // Réinitialiser la pagination
      this.pagination.page = 1;
      
      // Déclencher l'événement de mise à jour
      const event = new CustomEvent('update-inventory-logs', {
        detail: {
          filters: this.filters,
          pagination: { page: 1, limit: this.pagination.limit }
        }
      });
      document.dispatchEvent(event);
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Supprimer les éléments DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.filtersElement = null;
      this.logsContainer = null;
      this.paginationElement = null;
    }
    
    // Méthodes privées
    
    /**
     * Rend les filtres dans l'interface
     * @private
     */
    _renderFilters() {
      if (!this.filtersElement) return;
      
      this.filtersElement.innerHTML = '';
      
      // Dates
      const dateFilters = document.createElement('div');
      dateFilters.className = 'filter-group';
      
      const startDateInput = document.createElement('div');
      startDateInput.className = 'filter-item';
      startDateInput.innerHTML = `
        <label for="log-start-date">Du:</label>
        <input type="date" id="log-start-date" class="form-control">
      `;
      
      const endDateInput = document.createElement('div');
      endDateInput.className = 'filter-item';
      endDateInput.innerHTML = `
        <label for="log-end-date">Au:</label>
        <input type="date" id="log-end-date" class="form-control">
      `;
      
      dateFilters.appendChild(startDateInput);
      dateFilters.appendChild(endDateInput);
      
      // Type de mouvement
      const typeFilter = document.createElement('div');
      typeFilter.className = 'filter-item';
      typeFilter.innerHTML = `
        <label for="log-type">Type:</label>
        <select id="log-type" class="form-control">
          <option value="all">Tous</option>
          <option value="entry">Entrées</option>
          <option value="exit">Sorties</option>
        </select>
      `;
      
      // Raison
      const reasonFilter = document.createElement('div');
      reasonFilter.className = 'filter-item';
      reasonFilter.innerHTML = `
        <label for="log-reason">Raison:</label>
        <select id="log-reason" class="form-control">
          <option value="all">Toutes</option>
          <option value="purchase">Achat/Approvisionnement</option>
          <option value="sale">Vente</option>
          <option value="loss">Perte/Périmé</option>
          <option value="inventory">Inventaire</option>
          <option value="correction">Correction</option>
          <option value="other">Autre</option>
        </select>
      `;
      
      // Bouton d'application des filtres
      const applyButton = document.createElement('button');
      applyButton.className = 'btn btn-primary apply-filters';
      applyButton.textContent = 'Appliquer';
      
      // Construction des filtres
      this.filtersElement.appendChild(dateFilters);
      this.filtersElement.appendChild(typeFilter);
      this.filtersElement.appendChild(reasonFilter);
      this.filtersElement.appendChild(applyButton);
      
      // Définir les valeurs initiales
      if (this.filters.startDate) {
        startDateInput.querySelector('input').value = this._formatDateForInput(this.filters.startDate);
      }
      
      if (this.filters.endDate) {
        endDateInput.querySelector('input').value = this._formatDateForInput(this.filters.endDate);
      }
      
      typeFilter.querySelector('select').value = this.filters.type || 'all';
      reasonFilter.querySelector('select').value = this.filters.reason || 'all';
      
      // Événement d'application des filtres
      applyButton.addEventListener('click', () => {
        const newFilters = {
          startDate: startDateInput.querySelector('input').value || null,
          endDate: endDateInput.querySelector('input').value || null,
          type: typeFilter.querySelector('select').value,
          reason: reasonFilter.querySelector('select').value
        };
        
        this.setFilters(newFilters);
      });
    }
    
    /**
     * Rend les logs dans le conteneur
     * @private
     */
    _renderLogs() {
      if (!this.logsContainer) return;
      
      // Vider le conteneur
      this.logsContainer.innerHTML = '';
      
      if (this.logs.length === 0) {
        this.logsContainer.innerHTML = '<div class="no-logs">Aucun mouvement de stock trouvé.</div>';
        return;
      }
      
      // Créer le tableau
      const table = document.createElement('table');
      table.className = 'logs-table';
      
      // En-tête du tableau
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Date</th>
          <th>Produit</th>
          <th>Type</th>
          <th>Quantité</th>
          <th>Raison</th>
          <th>Référence</th>
          <th>Note</th>
        </tr>
      `;
      
      // Corps du tableau
      const tbody = document.createElement('tbody');
      
      this.logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = log.type === 'entry' ? 'log-entry' : 'log-exit';
        row.dataset.id = log.id;
        
        const date = new Date(log.date);
        const formattedDate = window.utils.formatters.formatDate(date, 'DD/MM/YYYY HH:mm');
        
        // Mettre en forme la quantité avec signe + ou -
        const formattedQuantity = log.type === 'entry' 
          ? `+${window.utils.formatters.formatQuantity(log.quantity, log.product?.unit || '')}`
          : `-${window.utils.formatters.formatQuantity(log.quantity, log.product?.unit || '')}`;
        
        // Traduction des raisons
        const reasonLabels = {
          'purchase': 'Achat',
          'sale': 'Vente',
          'loss': 'Perte',
          'inventory': 'Inventaire',
          'correction': 'Correction',
          'return': 'Retour',
          'damage': 'Dommage',
          'other': 'Autre'
        };
        
        const reasonLabel = reasonLabels[log.reason] || log.reason;
        
        row.innerHTML = `
          <td>${formattedDate}</td>
          <td class="product-cell" data-product-id="${log.product_id}">${log.product?.name || `Produit #${log.product_id}`}</td>
          <td>${log.type === 'entry' ? 'Entrée' : 'Sortie'}</td>
          <td class="quantity-cell">${formattedQuantity}</td>
          <td>${reasonLabel}</td>
          <td>${log.reference || '-'}</td>
          <td>${log.user_note || '-'}</td>
        `;
        
        // Événement sur la cellule du produit
        const productCell = row.querySelector('.product-cell');
        productCell.addEventListener('click', () => {
          if (log.product) {
            this.onProductSelect(log.product);
          }
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(thead);
      table.appendChild(tbody);
      this.logsContainer.appendChild(table);
    }
    
    /**
     * Rend la pagination
     * @private
     */
    _renderPagination() {
      if (!this.paginationElement) return;
      
      this.paginationElement.innerHTML = '';
      
      const totalPages = Math.ceil(this.pagination.total / this.pagination.limit);
      
      if (totalPages <= 1) {
        return;
      }
      
      const paginationInfo = document.createElement('div');
      paginationInfo.className = 'pagination-info';
      paginationInfo.textContent = `Page ${this.pagination.page} sur ${totalPages}`;
      
      const paginationControls = document.createElement('div');
      paginationControls.className = 'pagination-controls';
      
      // Bouton précédent
      const prevButton = document.createElement('button');
      prevButton.className = 'btn btn-sm pagination-prev';
      prevButton.innerHTML = '<i class="icon-chevron-left"></i>';
      prevButton.disabled = this.pagination.page <= 1;
      prevButton.addEventListener('click', () => {
        if (this.pagination.page > 1) {
          this._changePage(this.pagination.page - 1);
        }
      });
      
      // Bouton suivant
      const nextButton = document.createElement('button');
      nextButton.className = 'btn btn-sm pagination-next';
      nextButton.innerHTML = '<i class="icon-chevron-right"></i>';
      nextButton.disabled = this.pagination.page >= totalPages;
      nextButton.addEventListener('click', () => {
        if (this.pagination.page < totalPages) {
          this._changePage(this.pagination.page + 1);
        }
      });
      
      // Ajouter les boutons
      paginationControls.appendChild(prevButton);
      paginationControls.appendChild(nextButton);
      
      // Construction de la pagination
      this.paginationElement.appendChild(paginationInfo);
      this.paginationElement.appendChild(paginationControls);
    }
    
    /**
     * Change la page courante
     * @private
     * @param {Number} page - Numéro de page
     */
    _changePage(page) {
      this.pagination.page = page;
      
      // Déclencher l'événement de mise à jour
      const event = new CustomEvent('update-inventory-logs', {
        detail: {
          filters: this.filters,
          pagination: { 
            page: this.pagination.page, 
            limit: this.pagination.limit 
          }
        }
      });
      document.dispatchEvent(event);
    }
    
    /**
     * Formate une date pour un input date
     * @private
     * @param {Date|String} date - Date à formater
     * @returns {String} Date formatée (YYYY-MM-DD)
     */
    _formatDateForInput(date) {
      if (!date) return '';
      
      const d = new Date(date);
      
      if (isNaN(d.getTime())) {
        return '';
      }
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  }
  
  // Exposition du composant
  window.components = window.components || {};
  window.components.inventory = window.components.inventory || {};
  window.components.inventory.InventoryLogs = InventoryLogs;