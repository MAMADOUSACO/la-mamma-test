/**
 * Composant TableSelector - Sélecteur de tables
 * Fichier: js/components/orders/TableSelector.js
 * 
 * Ce composant permet de sélectionner une table pour une commande,
 * en affichant les tables disponibles, occupées et réservées.
 */

class TableSelector {
    /**
     * Constructeur du composant TableSelector
     * @param {Object} options - Options de configuration
     * @param {Array} options.tables - Liste des tables
     * @param {number} options.selectedTable - Numéro de la table sélectionnée
     * @param {boolean} options.showUnavailable - Si true, affiche les tables indisponibles
     * @param {Function} options.onSelect - Callback lors de la sélection d'une table
     */
    constructor(options = {}) {
      this.tables = options.tables || [];
      this.selectedTable = options.selectedTable || null;
      this.showUnavailable = options.showUnavailable !== undefined ? options.showUnavailable : true;
      this.onSelect = options.onSelect || (() => {});
      
      this.element = null;
      this.tableGrid = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du sélecteur de tables
     * @returns {HTMLElement} Élément HTML du sélecteur
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'table-selector';
      
      // Titre
      const title = document.createElement('h3');
      title.className = 'section-title';
      title.textContent = 'Sélectionner une table';
      this.element.appendChild(title);
      
      // Légende
      const legend = this._createLegend();
      this.element.appendChild(legend);
      
      // Grille des tables
      this.tableGrid = document.createElement('div');
      this.tableGrid.className = 'table-grid';
      this._renderTables();
      this.element.appendChild(this.tableGrid);
      
      return this.element;
    }
    
    /**
     * Met à jour la liste des tables
     * @param {Array} tables - Nouvelles tables
     */
    updateTables(tables) {
      this.tables = tables || [];
      
      if (this.tableGrid) {
        this._renderTables();
      }
    }
    
    /**
     * Définit la table sélectionnée
     * @param {number} tableNumber - Numéro de la table sélectionnée
     */
    setSelectedTable(tableNumber) {
      this.selectedTable = tableNumber;
      
      // Mettre à jour l'affichage si l'élément existe
      if (this.tableGrid) {
        const tableCards = this.tableGrid.querySelectorAll('.table-card');
        tableCards.forEach(card => {
          if (parseInt(card.dataset.number) === tableNumber) {
            card.classList.add('selected');
          } else {
            card.classList.remove('selected');
          }
        });
      }
    }
    
    /**
     * Affiche ou masque les tables indisponibles
     * @param {boolean} show - Si true, affiche les tables indisponibles
     */
    setShowUnavailable(show) {
      this.showUnavailable = show;
      
      if (this.tableGrid) {
        this._renderTables();
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements
      if (this.tableGrid) {
        const tableCards = this.tableGrid.querySelectorAll('.table-card');
        tableCards.forEach(card => {
          card.removeEventListener('click', card._clickHandler);
        });
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.tableGrid = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Crée la légende du statut des tables
     * @returns {HTMLElement} Légende
     * @private
     */
    _createLegend() {
      const legend = document.createElement('div');
      legend.className = 'table-legend';
      
      // Item disponible
      const availableItem = document.createElement('div');
      availableItem.className = 'legend-item';
      availableItem.innerHTML = '<span class="legend-color available"></span><span class="legend-label">Disponible</span>';
      
      // Item occupé
      const occupiedItem = document.createElement('div');
      occupiedItem.className = 'legend-item';
      occupiedItem.innerHTML = '<span class="legend-color occupied"></span><span class="legend-label">Occupée</span>';
      
      // Item réservé
      const reservedItem = document.createElement('div');
      reservedItem.className = 'legend-item';
      reservedItem.innerHTML = '<span class="legend-color reserved"></span><span class="legend-label">Réservée</span>';
      
      // Assembler la légende
      legend.appendChild(availableItem);
      legend.appendChild(occupiedItem);
      legend.appendChild(reservedItem);
      
      return legend;
    }
    
    /**
     * Rend la grille des tables
     * @private
     */
    _renderTables() {
      if (!this.tableGrid) return;
      
      // Vider la grille
      this.tableGrid.innerHTML = '';
      
      // Filtrer les tables
      const filteredTables = this._filterTables();
      
      // S'il n'y a pas de tables, afficher un message
      if (filteredTables.length === 0) {
        this._renderEmptyState();
        return;
      }
      
      // Trier les tables par numéro
      const sortedTables = filteredTables.sort((a, b) => a.number - b.number);
      
      // Ajouter chaque table
      sortedTables.forEach(table => {
        const tableElement = this._createTableElement(table);
        this.tableGrid.appendChild(tableElement);
      });
    }
    
    /**
     * Crée un élément HTML pour une table
     * @param {Object} table - Données de la table
     * @returns {HTMLElement} Élément HTML de la table
     * @private
     */
    _createTableElement(table) {
      const tableElement = document.createElement('div');
      tableElement.className = `table-card ${this._getTableStatusClass(table)}`;
      tableElement.dataset.number = table.number;
      
      // Si la table est sélectionnée, ajouter la classe
      if (table.number === this.selectedTable) {
        tableElement.classList.add('selected');
      }
      
      // Numéro de la table
      const number = document.createElement('div');
      number.className = 'table-number';
      number.textContent = table.number;
      tableElement.appendChild(number);
      
      // Capacité de la table
      const capacity = document.createElement('div');
      capacity.className = 'table-capacity';
      capacity.textContent = `${table.capacity} ${table.capacity > 1 ? 'personnes' : 'personne'}`;
      tableElement.appendChild(capacity);
      
      // Ajouter l'écouteur d'événement si la table est disponible
      if (table.status === 'available') {
        tableElement._clickHandler = () => this.onSelect(table.number);
        tableElement.addEventListener('click', tableElement._clickHandler);
      }
      
      return tableElement;
    }
    
    /**
     * Affiche un état vide lorsqu'il n'y a pas de tables
     * @private
     */
    _renderEmptyState() {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-table';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      
      if (this.showUnavailable) {
        message.textContent = 'Aucune table n\'est définie';
      } else {
        message.textContent = 'Aucune table disponible';
      }
      
      emptyState.appendChild(icon);
      emptyState.appendChild(message);
      
      this.tableGrid.appendChild(emptyState);
    }
    
    /**
     * Filtre les tables selon les paramètres
     * @returns {Array} Tables filtrées
     * @private
     */
    _filterTables() {
      if (this.showUnavailable) {
        return this.tables;
      } else {
        return this.tables.filter(table => table.status === 'available');
      }
    }
    
    /**
     * Obtient la classe CSS correspondant au statut de la table
     * @param {Object} table - Table
     * @returns {string} Classe CSS
     * @private
     */
    _getTableStatusClass(table) {
      switch (table.status) {
        case 'occupied':
          return 'occupied';
        case 'reserved':
          return 'reserved';
        case 'available':
        default:
          return '';
      }
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.orders = window.components.orders || {};
  window.components.orders.TableSelector = TableSelector;