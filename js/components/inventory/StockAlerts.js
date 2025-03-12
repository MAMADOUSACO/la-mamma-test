/**
 * Composant d'alertes de stock
 * Affiche les produits dont le stock est bas ou en rupture
 */
class StockAlerts {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     * @param {Function} options.onProductSelect - Callback à la sélection d'un produit
     * @param {Function} options.onRestock - Callback pour le réapprovisionnement
     */
    constructor(options) {
      this.container = options.container;
      this.onProductSelect = options.onProductSelect || function() {};
      this.onRestock = options.onRestock || function() {};
      
      this.alerts = [];
      this.element = null;
      this.alertsContainer = null;
    }
    
    /**
     * Rend le composant dans le conteneur
     * @returns {HTMLElement} Élément racine du composant
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'stock-alerts-component';
      
      const header = document.createElement('div');
      header.className = 'alerts-header';
      header.innerHTML = `
        <h3>Alertes de stock</h3>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline refresh-alerts" title="Rafraîchir">
            <i class="icon-refresh"></i>
          </button>
        </div>
      `;
      
      this.alertsContainer = document.createElement('div');
      this.alertsContainer.className = 'alerts-container';
      
      this.element.appendChild(header);
      this.element.appendChild(this.alertsContainer);
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      // Événements
      const refreshButton = header.querySelector('.refresh-alerts');
      refreshButton.addEventListener('click', () => {
        // Déclencher l'événement de vérification des alertes
        const event = new CustomEvent('check-stock-alerts');
        document.dispatchEvent(event);
      });
      
      return this.element;
    }
    
    /**
     * Met à jour les alertes affichées
     * @param {Array} alerts - Liste des alertes de stock
     */
    updateAlerts(alerts) {
      this.alerts = alerts || [];
      this._renderAlerts();
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
      this.alertsContainer = null;
    }
    
    // Méthodes privées
    
    /**
     * Rend les alertes dans le conteneur
     * @private
     */
    _renderAlerts() {
      if (!this.alertsContainer) return;
      
      // Vider le conteneur
      this.alertsContainer.innerHTML = '';
      
      if (this.alerts.length === 0) {
        this.alertsContainer.innerHTML = '<div class="no-alerts">Aucune alerte de stock.</div>';
        return;
      }
      
      // Grouper les alertes par type (rupture de stock / stock bas)
      const stockOut = this.alerts.filter(alert => alert.quantity <= 0);
      const lowStock = this.alerts.filter(alert => alert.quantity > 0 && alert.quantity <= alert.min_stock);
      
      // Créer les sections
      if (stockOut.length > 0) {
        const outSection = document.createElement('div');
        outSection.className = 'alerts-section stock-out-section';
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `<h4>Rupture de stock (${stockOut.length})</h4>`;
        
        outSection.appendChild(sectionHeader);
        
        stockOut.forEach(product => {
          outSection.appendChild(this._createAlertItem(product, 'out'));
        });
        
        this.alertsContainer.appendChild(outSection);
      }
      
      if (lowStock.length > 0) {
        const lowSection = document.createElement('div');
        lowSection.className = 'alerts-section low-stock-section';
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `<h4>Stock bas (${lowStock.length})</h4>`;
        
        lowSection.appendChild(sectionHeader);
        
        lowStock.forEach(product => {
          lowSection.appendChild(this._createAlertItem(product, 'low'));
        });
        
        this.alertsContainer.appendChild(lowSection);
      }
    }
    
    /**
     * Crée un élément d'alerte pour un produit
     * @private
     * @param {Object} product - Produit concerné
     * @param {String} type - Type d'alerte ('out' ou 'low')
     * @returns {HTMLElement} Élément d'alerte
     */
    _createAlertItem(product, type) {
      const alertItem = document.createElement('div');
      alertItem.className = `alert-item ${type === 'out' ? 'stock-out' : 'stock-low'}`;
      alertItem.dataset.id = product.id;
      
      // Contenu de l'alerte
      alertItem.innerHTML = `
        <div class="alert-content">
          <div class="product-name">${product.name}</div>
          <div class="product-category">${product.category}</div>
          <div class="stock-info">
            <span class="current-stock">${window.utils.formatters.formatQuantity(product.quantity, product.unit)}</span>
            <span class="stock-separator">/</span>
            <span class="min-stock">${window.utils.formatters.formatQuantity(product.min_stock, product.unit)}</span>
          </div>
        </div>
        <div class="alert-actions">
          <button class="btn btn-sm btn-primary restock-btn" title="Réapprovisionner">
            <i class="icon-plus"></i>
          </button>
          <button class="btn btn-sm btn-secondary details-btn" title="Détails">
            <i class="icon-info"></i>
          </button>
        </div>
      `;
      
      // Événements
      const restockBtn = alertItem.querySelector('.restock-btn');
      restockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onRestock(product);
      });
      
      const detailsBtn = alertItem.querySelector('.details-btn');
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onProductSelect(product);
      });
      
      alertItem.addEventListener('click', () => {
        this.onProductSelect(product);
      });
      
      return alertItem;
    }
  }
  
  // Exposition du composant
  window.components = window.components || {};
  window.components.inventory = window.components.inventory || {};
  window.components.inventory.StockAlerts = StockAlerts;