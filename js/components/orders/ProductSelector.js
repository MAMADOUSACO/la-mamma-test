/**
 * Composant ProductSelector - Sélecteur de produits
 * Fichier: js/components/orders/ProductSelector.js
 * 
 * Ce composant permet de parcourir et sélectionner des produits
 * par catégorie pour les ajouter à une commande.
 */

class ProductSelector {
    /**
     * Constructeur du composant ProductSelector
     * @param {Object} options - Options de configuration
     * @param {Array} options.products - Liste des produits
     * @param {Array} options.categories - Liste des catégories
     * @param {string} options.activeCategory - Catégorie active
     * @param {Function} options.onProductSelect - Callback lors de la sélection d'un produit
     * @param {Function} options.onSearch - Callback lors de la recherche
     */
    constructor(options = {}) {
      this.products = options.products || [];
      this.categories = options.categories || this._extractCategories();
      this.activeCategory = options.activeCategory || (this.categories.length > 0 ? this.categories[0] : null);
      this.onProductSelect = options.onProductSelect || (() => {});
      this.onSearch = options.onSearch || (() => {});
      
      this.element = null;
      this.categoriesContainer = null;
      this.productsGrid = null;
      this.searchInput = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du sélecteur de produits
     * @returns {HTMLElement} Élément HTML du sélecteur
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'product-selector';
      
      // Créer la barre de recherche
      const searchBar = this._createSearchBar();
      this.element.appendChild(searchBar);
      
      // Créer les catégories
      this.categoriesContainer = document.createElement('div');
      this.categoriesContainer.className = 'product-categories';
      this._renderCategories();
      this.element.appendChild(this.categoriesContainer);
      
      // Créer la grille des produits
      this.productsGrid = document.createElement('div');
      this.productsGrid.className = 'product-grid';
      this._renderProducts();
      this.element.appendChild(this.productsGrid);
      
      return this.element;
    }
    
    /**
     * Met à jour la liste des produits
     * @param {Array} products - Nouveaux produits
     */
    updateProducts(products) {
      this.products = products || [];
      this.categories = this._extractCategories();
      
      // Si la catégorie active n'existe plus, prendre la première
      if (!this.categories.includes(this.activeCategory)) {
        this.activeCategory = this.categories.length > 0 ? this.categories[0] : null;
      }
      
      // Mettre à jour l'affichage
      if (this.categoriesContainer) {
        this._renderCategories();
      }
      
      if (this.productsGrid) {
        this._renderProducts();
      }
    }
    
    /**
     * Définit la catégorie active
     * @param {string} category - Nouvelle catégorie active
     */
    setActiveCategory(category) {
      this.activeCategory = category;
      
      // Mettre à jour l'affichage des catégories
      if (this.categoriesContainer) {
        const categoryElements = this.categoriesContainer.querySelectorAll('.product-category');
        categoryElements.forEach(element => {
          if (element.dataset.category === category) {
            element.classList.add('active');
          } else {
            element.classList.remove('active');
          }
        });
      }
      
      // Mettre à jour la liste des produits
      if (this.productsGrid) {
        this._renderProducts();
      }
    }
    
    /**
     * Effectue une recherche de produits
     * @param {string} query - Texte de recherche
     */
    search(query) {
      if (this.searchInput) {
        this.searchInput.value = query;
      }
      
      // Appeler le callback de recherche
      this.onSearch(query);
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements
      if (this.categoriesContainer) {
        const categoryElements = this.categoriesContainer.querySelectorAll('.product-category');
        categoryElements.forEach(element => {
          element.removeEventListener('click', element._clickHandler);
        });
      }
      
      if (this.productsGrid) {
        const productElements = this.productsGrid.querySelectorAll('.product-card');
        productElements.forEach(element => {
          element.removeEventListener('click', element._clickHandler);
        });
      }
      
      if (this.searchInput) {
        this.searchInput.removeEventListener('input', this.searchInput._inputHandler);
        this.searchInput.removeEventListener('keydown', this.searchInput._keydownHandler);
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.categoriesContainer = null;
      this.productsGrid = null;
      this.searchInput = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Crée la barre de recherche
     * @returns {HTMLElement} Barre de recherche
     * @private
     */
    _createSearchBar() {
      const searchBar = document.createElement('div');
      searchBar.className = 'search-bar';
      
      // Créer l'input
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = 'search-input';
      this.searchInput.placeholder = 'Rechercher un produit...';
      
      // Ajouter les écouteurs d'événements
      this.searchInput._inputHandler = () => {
        const query = this.searchInput.value.trim();
        this.onSearch(query);
      };
      
      this.searchInput._keydownHandler = (event) => {
        if (event.key === 'Escape') {
          this.searchInput.value = '';
          this.onSearch('');
        }
      };
      
      this.searchInput.addEventListener('input', this.searchInput._inputHandler);
      this.searchInput.addEventListener('keydown', this.searchInput._keydownHandler);
      
      // Icône de recherche
      const searchIcon = document.createElement('span');
      searchIcon.className = 'search-icon icon-search';
      
      // Assembler la barre de recherche
      searchBar.appendChild(searchIcon);
      searchBar.appendChild(this.searchInput);
      
      return searchBar;
    }
    
    /**
     * Rend les catégories
     * @private
     */
    _renderCategories() {
      if (!this.categoriesContainer) return;
      
      // Vider le conteneur
      this.categoriesContainer.innerHTML = '';
      
      // Catégorie "Tous"
      const allCategory = document.createElement('div');
      allCategory.className = `product-category ${this.activeCategory === 'all' ? 'active' : ''}`;
      allCategory.textContent = 'Tous';
      allCategory.dataset.category = 'all';
      
      allCategory._clickHandler = () => this.setActiveCategory('all');
      allCategory.addEventListener('click', allCategory._clickHandler);
      
      this.categoriesContainer.appendChild(allCategory);
      
      // Ajouter chaque catégorie
      this.categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = `product-category ${this.activeCategory === category ? 'active' : ''}`;
        categoryElement.textContent = this._formatCategoryName(category);
        categoryElement.dataset.category = category;
        
        categoryElement._clickHandler = () => this.setActiveCategory(category);
        categoryElement.addEventListener('click', categoryElement._clickHandler);
        
        this.categoriesContainer.appendChild(categoryElement);
      });
    }
    
    /**
     * Rend la grille de produits
     * @private
     */
    _renderProducts() {
      if (!this.productsGrid) return;
      
      // Vider la grille
      this.productsGrid.innerHTML = '';
      
      // Filtrer les produits par catégorie
      const filteredProducts = this._filterProducts();
      
      // S'il n'y a pas de produits, afficher un message
      if (filteredProducts.length === 0) {
        this._renderEmptyState();
        return;
      }
      
      // Ajouter chaque produit
      filteredProducts.forEach(product => {
        const productElement = this._createProductElement(product);
        this.productsGrid.appendChild(productElement);
      });
    }
    
    /**
     * Crée un élément HTML pour un produit
     * @param {Object} product - Données du produit
     * @returns {HTMLElement} Élément HTML du produit
     * @private
     */
    _createProductElement(product) {
      const productElement = document.createElement('div');
      productElement.className = `product-card ${product.is_active ? '' : 'product-card-disabled'}`;
      productElement.dataset.id = product.id;
      
      // Image du produit
      if (product.image_url) {
        const image = document.createElement('img');
        image.className = 'product-image';
        image.src = product.image_url;
        image.alt = product.name;
        productElement.appendChild(image);
      } else {
        // Image par défaut si pas d'image
        const imagePlaceholder = document.createElement('div');
        imagePlaceholder.className = 'product-image-placeholder';
        imagePlaceholder.innerHTML = '<span class="icon-image"></span>';
        productElement.appendChild(imagePlaceholder);
      }
      
      // Nom du produit
      const name = document.createElement('div');
      name.className = 'product-name';
      name.textContent = product.name;
      productElement.appendChild(name);
      
      // Prix du produit
      const price = document.createElement('div');
      price.className = 'product-price';
      price.textContent = this._formatPrice(product.selling_price);
      productElement.appendChild(price);
      
      // Indicateur de stock
      const stock = document.createElement('div');
      stock.className = `product-stock ${this._getStockClass(product)}`;
      stock.textContent = this._formatStock(product);
      productElement.appendChild(stock);
      
      // Ajouter l'écouteur d'événement si le produit est actif
      if (product.is_active) {
        productElement._clickHandler = () => this.onProductSelect(product);
        productElement.addEventListener('click', productElement._clickHandler);
      }
      
      return productElement;
    }
    
    /**
     * Affiche un état vide lorsqu'il n'y a pas de produits
     * @private
     */
    _renderEmptyState() {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon icon-box';
      
      const message = document.createElement('div');
      message.className = 'empty-state-message';
      
      if (this.activeCategory === 'all') {
        message.textContent = 'Aucun produit trouvé';
      } else {
        message.textContent = `Aucun produit dans la catégorie "${this._formatCategoryName(this.activeCategory)}"`;
      }
      
      emptyState.appendChild(icon);
      emptyState.appendChild(message);
      
      this.productsGrid.appendChild(emptyState);
    }
    
    /**
     * Filtre les produits selon la catégorie active
     * @returns {Array} Produits filtrés
     * @private
     */
    _filterProducts() {
      if (this.activeCategory === 'all') {
        return this.products;
      } else {
        return this.products.filter(product => product.category === this.activeCategory);
      }
    }
    
    /**
     * Extrait les catégories uniques à partir des produits
     * @returns {Array} Liste des catégories
     * @private
     */
    _extractCategories() {
      const categories = this.products.map(product => product.category);
      return [...new Set(categories)].filter(Boolean).sort();
    }
    
    /**
     * Formate le nom d'une catégorie
     * @param {string} category - Nom de la catégorie
     * @returns {string} Nom formaté
     * @private
     */
    _formatCategoryName(category) {
      // Première lettre en majuscule, reste en minuscule
      return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
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
    
    /**
     * Obtient la classe CSS correspondant à l'état du stock
     * @param {Object} product - Produit
     * @returns {string} Classe CSS
     * @private
     */
    _getStockClass(product) {
      if (product.quantity <= 0) {
        return 'product-stock-critical';
      } else if (product.quantity <= product.min_stock) {
        return 'product-stock-warning';
      } else {
        return 'product-stock-ok';
      }
    }
    
    /**
     * Formate l'affichage du stock
     * @param {Object} product - Produit
     * @returns {string} Texte du stock
     * @private
     */
    _formatStock(product) {
      if (product.quantity <= 0) {
        return 'Rupture de stock';
      } else if (product.quantity === 1) {
        return '1 en stock';
      } else {
        return `${product.quantity} en stock`;
      }
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.orders = window.components.orders || {};
  window.components.orders.ProductSelector = ProductSelector;