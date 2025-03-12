/**
 * Composant de liste des produits en inventaire
 * Affiche les produits avec filtrage et recherche
 */
class InventoryList {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     * @param {Function} options.onProductSelect - Callback lors de la sélection d'un produit
     * @param {Function} options.onAddProduct - Callback pour ajouter un produit
     * @param {Function} options.onStockAdjust - Callback pour ajuster le stock
     * @param {Object} options.filters - Filtres initiaux
     */
    constructor(options) {
      this.container = options.container;
      this.onProductSelect = options.onProductSelect || function() {};
      this.onAddProduct = options.onAddProduct || function() {};
      this.onStockAdjust = options.onStockAdjust || function() {};
      
      this.products = [];
      this.categories = [];
      this.activeProductId = null;
      this.filters = options.filters || { 
        category: 'all', 
        status: 'all', 
        stockStatus: 'all' 
      };
      
      this.searchQuery = '';
      this.sortBy = 'name';
      this.sortDirection = 'asc';
      
      // Éléments DOM
      this.listElement = null;
      this.filterElement = null;
      this.searchElement = null;
      this.element = null;
    }
    
    /**
     * Rend le composant dans le conteneur
     * @returns {HTMLElement} Élément racine du composant
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'inventory-list-component';
      
      // En-tête avec filtres et recherche
      const header = document.createElement('div');
      header.className = 'inventory-list-header';
      
      // Barre de recherche
      this.searchElement = document.createElement('div');
      this.searchElement.className = 'search-container';
      this.searchElement.innerHTML = `
        <input type="text" class="search-input" placeholder="Rechercher un produit...">
        <button class="search-button"><i class="icon-search"></i></button>
      `;
      
      // Filtres
      this.filterElement = document.createElement('div');
      this.filterElement.className = 'filter-container';
      
      // Bouton d'ajout de produit
      const addButton = document.createElement('button');
      addButton.className = 'btn btn-primary add-product-btn';
      addButton.innerHTML = '<i class="icon-plus"></i> Nouveau Produit';
      addButton.addEventListener('click', () => this.onAddProduct());
      
      header.appendChild(this.searchElement);
      header.appendChild(this.filterElement);
      header.appendChild(addButton);
      
      // Liste des produits
      this.listElement = document.createElement('div');
      this.listElement.className = 'products-list';
      
      // Pied de liste avec compteur
      const footer = document.createElement('div');
      footer.className = 'inventory-list-footer';
      footer.innerHTML = '<span class="product-count">0 produits</span>';
      
      this.element.appendChild(header);
      this.element.appendChild(this.listElement);
      this.element.appendChild(footer);
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      this._setupEventListeners();
      this._renderFilters();
      
      return this.element;
    }
    
    /**
     * Met à jour la liste des produits
     * @param {Array} products - Liste des produits à afficher
     */
    updateProducts(products) {
      this.products = products || [];
      this._renderProductsList();
      this._updateProductCount();
    }
    
    /**
     * Définit le produit actif
     * @param {Number} productId - ID du produit à activer
     */
    setActiveProduct(productId) {
      this.activeProductId = productId;
      
      // Mettre à jour l'élément actif dans la liste
      const productItems = this.listElement.querySelectorAll('.product-item');
      productItems.forEach(item => {
        if (parseInt(item.dataset.id) === productId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    /**
     * Définit les catégories disponibles
     * @param {Array} categories - Liste des catégories
     */
    setCategories(categories) {
      this.categories = categories || [];
      this._renderFilters();
    }
    
    /**
     * Applique un filtre à la liste
     * @param {Object} filter - Filtre à appliquer
     */
    setFilter(filter) {
      this.filters = { ...this.filters, ...filter };
      this._renderFilters();
      this._renderProductsList();
    }
    
    /**
     * Effectue une recherche de produits
     * @param {String} query - Texte de recherche
     */
    search(query) {
      this.searchQuery = query;
      this._renderProductsList();
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Supprimer les écouteurs d'événements
      if (this.searchElement) {
        const searchInput = this.searchElement.querySelector('.search-input');
        if (searchInput) {
          searchInput.removeEventListener('input', this._onSearchInputChange);
        }
        
        const searchButton = this.searchElement.querySelector('.search-button');
        if (searchButton) {
          searchButton.removeEventListener('click', this._onSearchButtonClick);
        }
      }
      
      // Supprimer les éléments DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.listElement = null;
      this.filterElement = null;
      this.searchElement = null;
    }
    
    // Méthodes privées
    
    /**
     * Met en place les écouteurs d'événements
     * @private
     */
    _setupEventListeners() {
      // Recherche
      const searchInput = this.searchElement.querySelector('.search-input');
      this._onSearchInputChange = (e) => {
        this.search(e.target.value);
      };
      searchInput.addEventListener('input', this._onSearchInputChange);
      
      const searchButton = this.searchElement.querySelector('.search-button');
      this._onSearchButtonClick = () => {
        this.search(searchInput.value);
      };
      searchButton.addEventListener('click', this._onSearchButtonClick);
    }
    
    /**
     * Rend les filtres dans l'interface
     * @private
     */
    _renderFilters() {
      if (!this.filterElement) return;
      
      this.filterElement.innerHTML = '';
      
      // Filtre par catégorie
      const categoryFilter = document.createElement('div');
      categoryFilter.className = 'filter-group';
      
      const categoryLabel = document.createElement('label');
      categoryLabel.textContent = 'Catégorie:';
      
      const categorySelect = document.createElement('select');
      categorySelect.className = 'category-filter';
      
      // Option "Toutes"
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'Toutes';
      allOption.selected = this.filters.category === 'all';
      categorySelect.appendChild(allOption);
      
      // Options pour chaque catégorie
      this.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        option.selected = this.filters.category === category;
        categorySelect.appendChild(option);
      });
      
      categorySelect.addEventListener('change', (e) => {
        this.setFilter({ category: e.target.value });
      });
      
      categoryFilter.appendChild(categoryLabel);
      categoryFilter.appendChild(categorySelect);
      
      // Filtre par statut
      const statusFilter = document.createElement('div');
      statusFilter.className = 'filter-group';
      
      const statusLabel = document.createElement('label');
      statusLabel.textContent = 'Statut:';
      
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-filter';
      
      const statusOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'active', label: 'Actifs' },
        { value: 'inactive', label: 'Inactifs' }
      ];
      
      statusOptions.forEach(option => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        element.selected = this.filters.status === option.value;
        statusSelect.appendChild(element);
      });
      
      statusSelect.addEventListener('change', (e) => {
        this.setFilter({ status: e.target.value });
      });
      
      statusFilter.appendChild(statusLabel);
      statusFilter.appendChild(statusSelect);
      
      // Filtre par niveau de stock
      const stockFilter = document.createElement('div');
      stockFilter.className = 'filter-group';
      
      const stockLabel = document.createElement('label');
      stockLabel.textContent = 'Stock:';
      
      const stockSelect = document.createElement('select');
      stockSelect.className = 'stock-filter';
      
      const stockOptions = [
        { value: 'all', label: 'Tout' },
        { value: 'low', label: 'Stock bas' },
        { value: 'out', label: 'Rupture' }
      ];
      
      stockOptions.forEach(option => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        element.selected = this.filters.stockStatus === option.value;
        stockSelect.appendChild(element);
      });
      
      stockSelect.addEventListener('change', (e) => {
        this.setFilter({ stockStatus: e.target.value });
      });
      
      stockFilter.appendChild(stockLabel);
      stockFilter.appendChild(stockSelect);
      
      // Ajout des filtres à l'élément
      this.filterElement.appendChild(categoryFilter);
      this.filterElement.appendChild(statusFilter);
      this.filterElement.appendChild(stockFilter);
    }
    
    /**
     * Rend la liste des produits après filtrage
     * @private
     */
    _renderProductsList() {
      if (!this.listElement) return;
      
      // Vider la liste
      this.listElement.innerHTML = '';
      
      // Filtrer les produits
      const filteredProducts = this._filterProducts();
      
      if (filteredProducts.length === 0) {
        this.listElement.innerHTML = '<div class="no-products">Aucun produit trouvé.</div>';
        return;
      }
      
      // Créer un élément pour chaque produit
      filteredProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.dataset.id = product.id;
        
        if (product.id === this.activeProductId) {
          productElement.classList.add('active');
        }
        
        // Alerte visuelle si stock bas
        if (product.quantity <= product.min_stock) {
          productElement.classList.add('low-stock');
        }
        
        // Contenu du produit
        productElement.innerHTML = `
          <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
          </div>
          <div class="product-stock ${this._getStockClass(product)}">
            <span class="stock-value">${window.utils.formatters.formatQuantity(product.quantity, product.unit)}</span>
          </div>
          <div class="product-actions">
            <button class="btn btn-icon stock-adjust" title="Ajuster le stock">
              <i class="icon-edit"></i>
            </button>
          </div>
        `;
        
        // Événements
        productElement.addEventListener('click', (e) => {
          // Ignorer si le clic vient du bouton d'ajustement
          if (e.target.closest('.stock-adjust')) return;
          
          this.setActiveProduct(product.id);
          this.onProductSelect(product);
        });
        
        const adjustButton = productElement.querySelector('.stock-adjust');
        adjustButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Empêcher la sélection du produit
          this.onStockAdjust(product);
        });
        
        this.listElement.appendChild(productElement);
      });
    }
    
    /**
     * Filtre les produits selon les critères actuels
     * @private
     * @returns {Array} Produits filtrés
     */
    _filterProducts() {
      return this.products.filter(product => {
        // Filtre par catégorie
        if (this.filters.category !== 'all' && product.category !== this.filters.category) {
          return false;
        }
        
        // Filtre par statut
        if (this.filters.status === 'active' && !product.is_active) {
          return false;
        }
        if (this.filters.status === 'inactive' && product.is_active) {
          return false;
        }
        
        // Filtre par niveau de stock
        if (this.filters.stockStatus === 'low' && product.quantity > product.min_stock) {
          return false;
        }
        if (this.filters.stockStatus === 'out' && product.quantity > 0) {
          return false;
        }
        
        // Filtre par recherche
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          return (
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query)
          );
        }
        
        return true;
      }).sort((a, b) => {
        // Tri
        if (this.sortBy === 'name') {
          return this.sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else if (this.sortBy === 'stock') {
          return this.sortDirection === 'asc' 
            ? a.quantity - b.quantity 
            : b.quantity - a.quantity;
        }
        return 0;
      });
    }
    
    /**
     * Met à jour le compteur de produits
     * @private
     */
    _updateProductCount() {
      const countElement = this.element.querySelector('.product-count');
      if (countElement) {
        const filteredCount = this._filterProducts().length;
        const totalCount = this.products.length;
        
        if (filteredCount === totalCount) {
          countElement.textContent = `${totalCount} produit${totalCount > 1 ? 's' : ''}`;
        } else {
          countElement.textContent = `${filteredCount} sur ${totalCount} produit${totalCount > 1 ? 's' : ''}`;
        }
      }
    }
    
    /**
     * Retourne la classe CSS correspondant au niveau de stock
     * @private
     * @param {Object} product - Produit à évaluer
     * @returns {String} Classe CSS
     */
    _getStockClass(product) {
      if (product.quantity <= 0) {
        return 'stock-out';
      } else if (product.quantity <= product.min_stock) {
        return 'stock-low';
      } else {
        return 'stock-ok';
      }
    }
  }
  
  // Exposition du composant
  window.components = window.components || {};
  window.components.inventory = window.components.inventory || {};
  window.components.inventory.InventoryList = InventoryList;