/**
 * Vue principale d'inventaire
 * Orchestration des composants d'inventaire
 */
class InventoryView {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     */
    constructor(options) {
      this.container = options.container;
      
      // Contrôleur d'inventaire
      this.controller = window.modules.inventory.InventoryController;
      
      // Composants
      this.inventoryList = null;
      this.productForm = null;
      this.stockAdjustment = null;
      this.stockAlerts = null;
      this.inventoryLogs = null;
      
      // État de la vue
      this.currentView = 'list'; // 'list', 'form', 'adjustment', 'logs'
      this.currentProduct = null;
      
      // Éléments DOM
      this.element = null;
      this.contentArea = null;
      this.sidebarArea = null;
      this.tabsElement = null;
    }
    
    /**
     * Rend la vue dans le conteneur
     * @returns {HTMLElement} Élément racine de la vue
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'inventory-view';
      
      // Structure principale
      this.element.innerHTML = `
        <div class="view-header">
          <h2>Gestion de l'inventaire</h2>
          <div class="view-actions"></div>
        </div>
        <div class="view-tabs"></div>
        <div class="view-content">
          <div class="content-main"></div>
          <div class="content-sidebar"></div>
        </div>
      `;
      
      // Références aux zones de contenu
      this.contentArea = this.element.querySelector('.content-main');
      this.sidebarArea = this.element.querySelector('.content-sidebar');
      this.tabsElement = this.element.querySelector('.view-tabs');
      
      // Initialisation des onglets
      this._initTabs();
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      // Affichage de la vue par défaut
      this._showListView();
      
      return this.element;
    }
    
    /**
     * Nettoie les ressources utilisées par la vue
     */
    destroy() {
      // Détruire les composants
      if (this.inventoryList) {
        this.inventoryList.destroy();
        this.inventoryList = null;
      }
      
      if (this.productForm) {
        this.productForm.destroy();
        this.productForm = null;
      }
      
      if (this.stockAdjustment) {
        this.stockAdjustment.destroy();
        this.stockAdjustment = null;
      }
      
      if (this.stockAlerts) {
        this.stockAlerts.destroy();
        this.stockAlerts = null;
      }
      
      if (this.inventoryLogs) {
        this.inventoryLogs.destroy();
        this.inventoryLogs = null;
      }
      
      // Supprimer les éléments DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.contentArea = null;
      this.sidebarArea = null;
      this.tabsElement = null;
      this.currentProduct = null;
    }
    
    // Méthodes privées
    
    /**
     * Initialise les onglets de la vue
     * @private
     */
    _initTabs() {
      const tabs = new window.components.Tabs({
        container: this.tabsElement,
        tabs: [
          { id: 'products', label: 'Produits', icon: 'icon-box', active: true },
          { id: 'logs', label: 'Journal', icon: 'icon-list' }
        ],
        onTabChange: (tabId) => {
          if (tabId === 'products') {
            this._showListView();
          } else if (tabId === 'logs') {
            this._showLogsView();
          }
        }
      });
      
      tabs.render();
    }
    
    /**
     * Vide la zone de contenu principal
     * @private
     */
    _clearContentArea() {
      if (this.contentArea) {
        this.contentArea.innerHTML = '';
      }
    }
    
    /**
     * Vide la zone de la barre latérale
     * @private
     */
    _clearSidebarArea() {
      if (this.sidebarArea) {
        this.sidebarArea.innerHTML = '';
      }
    }
    
    /**
     * Vide toutes les zones de contenu
     * @private
     */
    _clearAllAreas() {
      this._clearContentArea();
      this._clearSidebarArea();
    }
    
    /**
     * Affiche la vue de liste des produits
     * @private
     */
    _showListView() {
      this.currentView = 'list';
      this._clearAllAreas();
      
      // Créer et rendre la liste des produits
      this.inventoryList = new window.components.inventory.InventoryList({
        container: this.contentArea,
        onProductSelect: (product) => {
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          this._showProductDetails();
        },
        onAddProduct: () => {
          this._showAddProductForm();
        },
        onStockAdjust: (product) => {
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          this._showStockAdjustment();
        }
      });
      
      this.inventoryList.render();
      
      // Créer et rendre les alertes de stock dans la barre latérale
      this.stockAlerts = new window.components.inventory.StockAlerts({
        container: this.sidebarArea,
        onProductSelect: (product) => {
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          this.inventoryList.setActiveProduct(product.id);
          this._showProductDetails();
        },
        onRestock: (product) => {
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          this._showStockAdjustment();
        }
      });
      
      this.stockAlerts.render();
      
      // Charger les données
      this._loadProducts();
      this._loadStockAlerts();
    }
    
    /**
     * Affiche la vue de formulaire d'ajout de produit
     * @private
     */
    _showAddProductForm() {
      this.currentView = 'form';
      this._clearContentArea();
      
      // Créer et rendre le formulaire
      this.productForm = new window.components.inventory.ProductForm({
        container: this.contentArea,
        isEdit: false,
        onSubmit: (productData) => {
          this._createProduct(productData);
        },
        onCancel: () => {
          this._showListView();
        }
      });
      
      this.productForm.render();
      
      // Charger les catégories
      this.controller.loadCategories((categories) => {
        this.productForm.setCategories(categories);
      });
    }
    
    /**
     * Affiche la vue de formulaire d'édition de produit
     * @private
     */
    _showEditProductForm() {
      if (!this.currentProduct) return;
      
      this.currentView = 'form';
      this._clearContentArea();
      
      // Créer et rendre le formulaire
      this.productForm = new window.components.inventory.ProductForm({
        container: this.contentArea,
        isEdit: true,
        onSubmit: (productData) => {
          this._updateProduct(productData);
        },
        onCancel: () => {
          this._showProductDetails();
        }
      });
      
      this.productForm.render();
      this.productForm.setProduct(this.currentProduct);
      
      // Charger les catégories
      this.controller.loadCategories((categories) => {
        this.productForm.setCategories(categories);
      });
    }
    
    /**
     * Affiche la vue des détails d'un produit
     * @private
     */
    _showProductDetails() {
      if (!this.currentProduct) return;
      
      // Créer une carte de détails dans la zone de contenu
      const detailsCard = document.createElement('div');
      detailsCard.className = 'product-details-card';
      
      const stockClass = this._getStockStatusClass(this.currentProduct);
      
      detailsCard.innerHTML = `
        <div class="card-header">
          <h3>${this.currentProduct.name}</h3>
          <div class="product-actions">
            <button class="btn btn-sm btn-outline edit-product" title="Modifier">
              <i class="icon-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline adjust-stock" title="Ajuster le stock">
              <i class="icon-plus-minus"></i>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="product-info-grid">
            <div class="info-item">
              <label>Catégorie:</label>
              <div>${this.currentProduct.category}</div>
            </div>
            <div class="info-item">
              <label>Statut:</label>
              <div>${this.currentProduct.is_active ? 'Actif' : 'Inactif'}</div>
            </div>
            <div class="info-item">
              <label>Stock actuel:</label>
              <div class="stock-value ${stockClass}">
                ${window.utils.formatters.formatQuantity(this.currentProduct.quantity, this.currentProduct.unit)}
              </div>
            </div>
            <div class="info-item">
              <label>Stock minimum:</label>
              <div>
                ${window.utils.formatters.formatQuantity(this.currentProduct.min_stock, this.currentProduct.unit)}
              </div>
            </div>
            <div class="info-item">
              <label>Prix d'achat:</label>
              <div>${window.utils.formatters.formatPrice(this.currentProduct.purchase_price, '€')}</div>
            </div>
            <div class="info-item">
              <label>Prix de vente:</label>
              <div>${window.utils.formatters.formatPrice(this.currentProduct.selling_price, '€')}</div>
            </div>
            <div class="info-item full-width">
              <label>Description:</label>
              <div>${this.currentProduct.description || 'Aucune description'}</div>
            </div>
          </div>
        </div>
      `;
      
      this._clearContentArea();
      this.contentArea.appendChild(detailsCard);
      
      // Événements
      const editButton = detailsCard.querySelector('.edit-product');
      editButton.addEventListener('click', () => {
        this._showEditProductForm();
      });
      
      const adjustButton = detailsCard.querySelector('.adjust-stock');
      adjustButton.addEventListener('click', () => {
        this._showStockAdjustment();
      });
      
      // Charger l'historique des mouvements pour ce produit
      this._loadProductHistory();
    }
    
    /**
     * Affiche la vue d'ajustement de stock
     * @private
     */
    _showStockAdjustment() {
      if (!this.currentProduct) return;
      
      this.currentView = 'adjustment';
      this._clearContentArea();
      
      // Créer et rendre le composant d'ajustement
      this.stockAdjustment = new window.components.inventory.StockAdjustment({
        container: this.contentArea,
        onSubmit: (adjustmentData) => {
          this._adjustStock(adjustmentData);
        },
        onCancel: () => {
          this._showProductDetails();
        }
      });
      
      this.stockAdjustment.render();
      this.stockAdjustment.setProduct(this.currentProduct);
    }
    
    /**
     * Affiche la vue du journal des mouvements
     * @private
     */
    _showLogsView() {
      this.currentView = 'logs';
      this._clearAllAreas();
      
      // Créer et rendre le journal
      this.inventoryLogs = new window.components.inventory.InventoryLogs({
        container: this.contentArea,
        onProductSelect: (product) => {
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          
          // Changer d'onglet
          const tabs = this.tabsElement.querySelector('.tabs-component');
          if (tabs) {
            const tabsInstance = Object.values(window.components.Tabs.instances).find(t => t.element === tabs);
            if (tabsInstance) {
              tabsInstance.activateTab('products');
            }
          }
          
          this._showProductDetails();
        },
        onExport: (filters) => {
          this._exportInventoryLogs(filters);
        }
      });
      
      this.inventoryLogs.render();
      
      // Charger les données
      this._loadInventoryLogs();
    }
    
    /**
     * Charge et affiche la liste des produits
     * @private
     */
    _loadProducts() {
      if (!this.inventoryList) return;
      
      this.controller.loadProducts((products) => {
        this.inventoryList.updateProducts(products);
      });
      
      this.controller.loadCategories((categories) => {
        this.inventoryList.setCategories(categories);
      });
    }
    
    /**
     * Charge et affiche les alertes de stock
     * @private
     */
    _loadStockAlerts() {
      if (!this.stockAlerts) return;
      
      this.controller.checkStockAlerts().then(alerts => {
        this.stockAlerts.updateAlerts(alerts);
      });
    }
    
    /**
     * Charge et affiche l'historique des mouvements d'un produit
     * @private
     */
    _loadProductHistory() {
      if (!this.currentProduct) return;
      
      const historyContainer = document.createElement('div');
      historyContainer.className = 'product-history-container';
      historyContainer.innerHTML = `
        <h4>Derniers mouvements</h4>
        <div class="history-content">
          <div class="loading-spinner">Chargement...</div>
        </div>
      `;
      
      this.contentArea.appendChild(historyContainer);
      
      this.controller.getInventoryLog({ 
        productId: this.currentProduct.id,
        limit: 5
      }, (logs) => {
        const historyContent = historyContainer.querySelector('.history-content');
        
        if (!logs || logs.length === 0) {
          historyContent.innerHTML = '<div class="no-history">Aucun mouvement enregistré</div>';
          return;
        }
        
        const table = document.createElement('table');
        table.className = 'history-table compact';
        
        table.innerHTML = `
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Raison</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        logs.forEach(log => {
          const row = document.createElement('tr');
          row.className = log.type === 'entry' ? 'log-entry' : 'log-exit';
          
          const date = new Date(log.date);
          const formattedDate = window.utils.formatters.formatDate(date, 'DD/MM/YYYY');
          
          const formattedQuantity = log.type === 'entry' 
            ? `+${window.utils.formatters.formatQuantity(log.quantity, this.currentProduct.unit)}`
            : `-${window.utils.formatters.formatQuantity(log.quantity, this.currentProduct.unit)}`;
            
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
            <td>${log.type === 'entry' ? 'Entrée' : 'Sortie'}</td>
            <td class="quantity-cell">${formattedQuantity}</td>
            <td>${reasonLabel}</td>
          `;
          
          tbody.appendChild(row);
        });
        
        historyContent.innerHTML = '';
        historyContent.appendChild(table);
        
        // Bouton pour voir tous les mouvements
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'btn btn-link view-all-logs';
        viewAllButton.textContent = 'Voir tous les mouvements';
        viewAllButton.addEventListener('click', () => {
          const tabs = this.tabsElement.querySelector('.tabs-component');
          if (tabs) {
            const tabsInstance = Object.values(window.components.Tabs.instances).find(t => t.element === tabs);
            if (tabsInstance) {
              tabsInstance.activateTab('logs');
            }
          }
          
          // Appliquer un filtre pour ce produit
          if (this.inventoryLogs) {
            this.inventoryLogs.setFilters({ productId: this.currentProduct.id });
          }
        });
        
        historyContent.appendChild(viewAllButton);
      });
    }
    
    /**
     * Charge et affiche le journal d'inventaire
     * @private
     */
    _loadInventoryLogs() {
      if (!this.inventoryLogs) return;
      
      // Charger les données avec les filtres actuels
      this.controller.getInventoryLog({}, (result) => {
        this.inventoryLogs.updateLogs(result);
      });
      
      // S'abonner aux événements de mise à jour
      document.addEventListener('update-inventory-logs', (e) => {
        this.controller.getInventoryLog(e.detail, (result) => {
          this.inventoryLogs.updateLogs(result);
        });
      });
    }
    
    /**
     * Crée un nouveau produit
     * @private
     * @param {Object} productData - Données du produit
     */
    _createProduct(productData) {
      this.productForm.showLoading(true, 'Création du produit...');
      
      this.controller.createProduct(productData)
        .then(product => {
          // Afficher une notification de succès
          window.services.notification.success('Produit créé avec succès');
          
          // Mettre à jour le produit courant
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          
          // Recharger la liste et les alertes
          this._loadProducts();
          this._loadStockAlerts();
          
          // Afficher les détails du produit
          this._showProductDetails();
        })
        .catch(error => {
          console.error('Erreur lors de la création du produit:', error);
          window.services.notification.error('Erreur lors de la création du produit');
          
          // Si c'est une erreur de validation, afficher les erreurs
          if (error.validationErrors) {
            this.productForm.setErrors(error.validationErrors);
          }
        })
        .finally(() => {
          this.productForm.showLoading(false);
        });
    }
    
    /**
     * Met à jour un produit existant
     * @private
     * @param {Object} productData - Données du produit
     */
    _updateProduct(productData) {
      this.productForm.showLoading(true, 'Mise à jour du produit...');
      
      this.controller.updateProduct(productData)
        .then(product => {
          // Afficher une notification de succès
          window.services.notification.success('Produit mis à jour avec succès');
          
          // Mettre à jour le produit courant
          this.currentProduct = product;
          this.controller.setCurrentProduct(product);
          
          // Recharger la liste et les alertes
          this._loadProducts();
          this._loadStockAlerts();
          
          // Afficher les détails du produit
          this._showProductDetails();
        })
        .catch(error => {
          console.error('Erreur lors de la mise à jour du produit:', error);
          window.services.notification.error('Erreur lors de la mise à jour du produit');
          
          // Si c'est une erreur de validation, afficher les erreurs
          if (error.validationErrors) {
            this.productForm.setErrors(error.validationErrors);
          }
        })
        .finally(() => {
          this.productForm.showLoading(false);
        });
    }
    
    /**
     * Ajuste le stock d'un produit
     * @private
     * @param {Object} adjustmentData - Données d'ajustement
     */
    _adjustStock(adjustmentData) {
      if (!this.currentProduct) return;
      
      const { quantity, type, reason, note } = adjustmentData;
      
      // Appel à la méthode appropriée selon le type
      const action = type === 'add' ? 'addStock' : 'removeStock';
      
      this.controller[action](this.currentProduct.id, quantity, reason, note)
        .then(updatedProduct => {
          // Afficher une notification de succès
          window.services.notification.success('Stock ajusté avec succès');
          
          // Mettre à jour le produit courant
          this.currentProduct = updatedProduct;
          this.controller.setCurrentProduct(updatedProduct);
          
          // Recharger la liste et les alertes
          this._loadProducts();
          this._loadStockAlerts();
          
          // Afficher les détails du produit
          this._showProductDetails();
        })
        .catch(error => {
          console.error('Erreur lors de l\'ajustement du stock:', error);
          window.services.notification.error('Erreur lors de l\'ajustement du stock');
        });
    }
    
    /**
     * Exporte le journal d'inventaire
     * @private
     * @param {Object} filters - Filtres d'exportation
     */
    _exportInventoryLogs(filters) {
      window.services.notification.info('Préparation de l\'export...');
      
      this.controller.getInventoryLog({
        ...filters,
        pagination: { limit: 1000, page: 1 } // Exporter plus de données
      }, (result) => {
        if (!result || !result.logs || result.logs.length === 0) {
          window.services.notification.warning('Aucune donnée à exporter');
          return;
        }
        
        try {
          // Préparer les données pour l'export
          const exportData = result.logs.map(log => {
            const date = new Date(log.date);
            const formattedDate = window.utils.formatters.formatDate(date, 'DD/MM/YYYY HH:mm');
            
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
            
            return {
              'Date': formattedDate,
              'Produit': log.product?.name || `Produit #${log.product_id}`,
              'Type': log.type === 'entry' ? 'Entrée' : 'Sortie',
              'Quantité': log.quantity,
              'Unité': log.product?.unit || '',
              'Raison': reasonLabels[log.reason] || log.reason,
              'Référence': log.reference || '',
              'Note': log.user_note || ''
            };
          });
          
          // Générer le nom du fichier
          const today = new Date();
          const dateStr = window.utils.formatters.formatDate(today, 'YYYYMMDD');
          const fileName = `journal-inventaire-${dateStr}.csv`;
          
          // Exporter en CSV
          window.utils.export.exportAsCSV(exportData, Object.keys(exportData[0]), fileName);
          
          window.services.notification.success('Export réalisé avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'export:', error);
          window.services.notification.error('Erreur lors de l\'export des données');
        }
      });
    }
    
    /**
     * Retourne la classe CSS correspondant au statut de stock
     * @private
     * @param {Object} product - Produit à évaluer
     * @returns {String} Classe CSS
     */
    _getStockStatusClass(product) {
      if (product.quantity <= 0) {
        return 'stock-out';
      } else if (product.quantity <= product.min_stock) {
        return 'stock-low';
      } else {
        return 'stock-ok';
      }
    }
  }
  
  // Exposition de la vue
  window.views = window.views || {};
  window.views.Inventory = InventoryView;