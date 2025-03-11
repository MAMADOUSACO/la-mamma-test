/**
 * Composant TabBar - Barre d'onglets pour la navigation
 * Fichier: js/components/layout/TabBar.js
 */

class TabBar {
    /**
     * Constructeur du composant TabBar
     * @param {Object} options - Options de configuration
     * @param {Array} options.tabs - Onglets à afficher
     * @param {string} options.activeTab - ID de l'onglet actif
     * @param {Function} options.onTabChange - Callback lors du changement d'onglet
     * @param {boolean} options.fixed - Si true, la barre est fixée en bas de l'écran
     * @param {number} options.maxVisibleTabs - Nombre maximum d'onglets visibles
     */
    constructor(options = {}) {
      this.tabs = options.tabs || [];
      this.activeTab = options.activeTab || (this.tabs.length > 0 ? this.tabs[0].id : '');
      this.onTabChange = options.onTabChange || (() => {});
      this.fixed = options.fixed !== undefined ? options.fixed : true;
      this.maxVisibleTabs = options.maxVisibleTabs || 5;
      
      this.element = null;
      this.tabsContainer = null;
      this.moreButton = null;
      this.moreMenu = null;
    }
  
    /**
     * Génère et retourne l'élément HTML de la barre d'onglets
     * @returns {HTMLElement} L'élément de la barre d'onglets
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = `app-tabbar ${this.fixed ? 'fixed' : ''}`;
      
      // Conteneur pour les onglets
      this.tabsContainer = document.createElement('div');
      this.tabsContainer.className = 'tabbar-tabs';
      
      // Déterminer quels onglets afficher directement et lesquels mettre dans le menu "more"
      const visibleTabs = this.tabs.slice(0, this.maxVisibleTabs);
      const hiddenTabs = this.tabs.slice(this.maxVisibleTabs);
      
      // Ajouter les onglets visibles
      visibleTabs.forEach(tab => {
        const tabElement = this._createTabElement(tab);
        this.tabsContainer.appendChild(tabElement);
      });
      
      // Ajouter le bouton "more" si nécessaire
      if (hiddenTabs.length > 0) {
        this._createMoreButton(hiddenTabs);
        this.tabsContainer.appendChild(this.moreButton);
      }
      
      this.element.appendChild(this.tabsContainer);
      
      // Ajouter au document pour les calculs de taille si fixe
      if (this.fixed) {
        document.body.style.paddingBottom = '60px'; // Hauteur approximative de la TabBar
      }
      
      return this.element;
    }
    
    /**
     * Définit l'onglet actif
     * @param {string} tabId - ID de l'onglet à activer
     * @param {boolean} triggerCallback - Si true, appelle le callback onTabChange
     */
    setActiveTab(tabId, triggerCallback = true) {
      // Vérifier si l'onglet existe
      const tabExists = this.tabs.some(tab => tab.id === tabId);
      if (!tabExists) return;
      
      this.activeTab = tabId;
      
      // Mettre à jour l'affichage si l'élément existe
      if (this.tabsContainer) {
        // Supprimer la classe active de tous les onglets
        const allTabs = this.tabsContainer.querySelectorAll('.tabbar-tab');
        allTabs.forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Ajouter la classe active à l'onglet sélectionné
        const activeTab = this.tabsContainer.querySelector(`.tabbar-tab[data-id="${tabId}"]`);
        if (activeTab) {
          activeTab.classList.add('active');
        }
        
        // Gérer aussi le cas où l'onglet actif est dans le menu "more"
        if (this.moreMenu) {
          const moreMenuItems = this.moreMenu.querySelectorAll('.more-menu-item');
          moreMenuItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === tabId) {
              item.classList.add('active');
            }
          });
        }
      }
      
      // Appeler le callback si demandé
      if (triggerCallback) {
        const selectedTab = this.tabs.find(tab => tab.id === tabId);
        if (selectedTab) {
          this.onTabChange(selectedTab.id, selectedTab.route);
        }
      }
    }
    
    /**
     * Met à jour le badge de notification pour un onglet
     * @param {string} tabId - ID de l'onglet
     * @param {string|number} badgeContent - Contenu du badge (null pour masquer)
     */
    updateBadge(tabId, badgeContent) {
      // Mettre à jour dans le modèle de données
      const tab = this.tabs.find(tab => tab.id === tabId);
      if (tab) {
        tab.badge = badgeContent;
      }
      
      // Mettre à jour dans le DOM
      if (this.tabsContainer) {
        const tabElement = this.tabsContainer.querySelector(`.tabbar-tab[data-id="${tabId}"]`);
        if (tabElement) {
          let badge = tabElement.querySelector('.tab-badge');
          
          if (badgeContent) {
            // Créer ou mettre à jour le badge
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'tab-badge';
              tabElement.appendChild(badge);
            }
            badge.textContent = badgeContent;
          } else if (badge) {
            // Supprimer le badge
            badge.parentNode.removeChild(badge);
          }
        }
        
        // Gérer aussi le cas où l'onglet est dans le menu "more"
        if (this.moreMenu) {
          const menuItem = this.moreMenu.querySelector(`.more-menu-item[data-id="${tabId}"]`);
          if (menuItem) {
            let badge = menuItem.querySelector('.item-badge');
            
            if (badgeContent) {
              if (!badge) {
                badge = document.createElement('span');
                badge.className = 'item-badge';
                menuItem.appendChild(badge);
              }
              badge.textContent = badgeContent;
            } else if (badge) {
              badge.parentNode.removeChild(badge);
            }
          }
        }
      }
    }
    
    /**
     * Met à jour les onglets de la barre
     * @param {Array} tabs - Nouveaux onglets
     */
    setTabs(tabs) {
      this.tabs = tabs || [];
      this.activeTab = tabs.length > 0 ? tabs[0].id : '';
      
      // Nécessite un re-rendu complet
      if (this.element && this.element.parentNode) {
        const parent = this.element.parentNode;
        parent.removeChild(this.element);
        parent.appendChild(this.render());
      }
    }
    
    /**
     * Affiche ou masque la barre d'onglets
     * @param {boolean} visible - Afficher ou masquer
     */
    setVisible(visible) {
      if (this.element) {
        this.element.style.display = visible ? 'block' : 'none';
        
        // Ajuster le padding du document si la barre est fixe
        if (this.fixed) {
          document.body.style.paddingBottom = visible ? '60px' : '0';
        }
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements des onglets
      if (this.tabsContainer) {
        const tabs = this.tabsContainer.querySelectorAll('.tabbar-tab');
        tabs.forEach(tab => {
          tab.removeEventListener('click', tab._clickHandler);
        });
      }
      
      // Nettoyer le bouton "more" s'il existe
      if (this.moreButton) {
        this.moreButton.removeEventListener('click', this.moreButton._clickHandler);
      }
      
      // Nettoyer le menu "more" s'il existe
      if (this.moreMenu) {
        const items = this.moreMenu.querySelectorAll('.more-menu-item');
        items.forEach(item => {
          item.removeEventListener('click', item._clickHandler);
        });
        
        // Supprimer le menu du DOM s'il est attaché
        if (this.moreMenu.parentNode) {
          this.moreMenu.parentNode.removeChild(this.moreMenu);
        }
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser le padding du document si la barre est fixe
      if (this.fixed) {
        document.body.style.paddingBottom = '0';
      }
      
      // Réinitialiser les références
      this.element = null;
      this.tabsContainer = null;
      this.moreButton = null;
      this.moreMenu = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Crée l'élément HTML pour un onglet
     * @param {Object} tab - Données de l'onglet
     * @returns {HTMLElement} Élément de l'onglet
     * @private
     */
    _createTabElement(tab) {
      const tabElement = document.createElement('div');
      tabElement.className = `tabbar-tab ${this.activeTab === tab.id ? 'active' : ''}`;
      tabElement.dataset.id = tab.id;
      
      // Icône de l'onglet
      if (tab.icon) {
        const icon = document.createElement('span');
        icon.className = `tab-icon ${tab.icon}`;
        tabElement.appendChild(icon);
      }
      
      // Texte de l'onglet
      const label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = tab.label;
      tabElement.appendChild(label);
      
      // Badge de notification si présent
      if (tab.badge) {
        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.textContent = tab.badge;
        tabElement.appendChild(badge);
      }
      
      // Gestionnaire de clic
      tabElement._clickHandler = () => {
        this._handleTabClick(tab.id, tab.route);
      };
      tabElement.addEventListener('click', tabElement._clickHandler);
      
      return tabElement;
    }
    
    /**
     * Crée le bouton "more" et son menu déroulant
     * @param {Array} hiddenTabs - Onglets à placer dans le menu
     * @private
     */
    _createMoreButton(hiddenTabs) {
      // Créer le bouton
      this.moreButton = document.createElement('div');
      this.moreButton.className = 'tabbar-tab more-button';
      this.moreButton.dataset.id = 'more';
      
      // Icône du bouton
      const icon = document.createElement('span');
      icon.className = 'tab-icon icon-more';
      this.moreButton.appendChild(icon);
      
      // Texte du bouton
      const label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = 'Plus';
      this.moreButton.appendChild(label);
      
      // Créer le menu déroulant
      this.moreMenu = document.createElement('div');
      this.moreMenu.className = 'more-menu';
      
      // Ajouter les éléments cachés au menu
      hiddenTabs.forEach(tab => {
        const menuItem = document.createElement('div');
        menuItem.className = `more-menu-item ${this.activeTab === tab.id ? 'active' : ''}`;
        menuItem.dataset.id = tab.id;
        
        // Icône de l'élément
        if (tab.icon) {
          const itemIcon = document.createElement('span');
          itemIcon.className = `item-icon ${tab.icon}`;
          menuItem.appendChild(itemIcon);
        }
        
        // Texte de l'élément
        const itemLabel = document.createElement('span');
        itemLabel.className = 'item-label';
        itemLabel.textContent = tab.label;
        menuItem.appendChild(itemLabel);
        
        // Badge si présent
        if (tab.badge) {
          const itemBadge = document.createElement('span');
          itemBadge.className = 'item-badge';
          itemBadge.textContent = tab.badge;
          menuItem.appendChild(itemBadge);
        }
        
        // Gestionnaire de clic
        menuItem._clickHandler = () => {
          this._handleTabClick(tab.id, tab.route);
          this._closeMoreMenu();
        };
        menuItem.addEventListener('click', menuItem._clickHandler);
        
        this.moreMenu.appendChild(menuItem);
      });
      
      // Ajouter le menu au document
      document.body.appendChild(this.moreMenu);
      
      // Gestionnaire de clic pour le bouton "more"
      this.moreButton._clickHandler = (e) => {
        e.stopPropagation();
        this._toggleMoreMenu();
      };
      this.moreButton.addEventListener('click', this.moreButton._clickHandler);
      
      // Fermer le menu lors d'un clic ailleurs dans le document
      document.addEventListener('click', () => {
        this._closeMoreMenu();
      });
    }
    
    /**
     * Gère le clic sur un onglet
     * @param {string} tabId - ID de l'onglet cliqué
     * @param {string} route - Route associée à l'onglet
     * @private
     */
    _handleTabClick(tabId, route) {
      this.setActiveTab(tabId);
      
      // Naviguer vers la route si elle est définie
      if (route) {
        window.router.navigate(route);
      }
    }
    
    /**
     * Affiche ou masque le menu "more"
     * @private
     */
    _toggleMoreMenu() {
      if (!this.moreMenu) return;
      
      const isVisible = this.moreMenu.classList.contains('visible');
      
      if (isVisible) {
        this._closeMoreMenu();
      } else {
        this._openMoreMenu();
      }
    }
    
    /**
     * Ouvre le menu "more"
     * @private
     */
    _openMoreMenu() {
      if (!this.moreMenu || !this.moreButton) return;
      
      // Positionner le menu au-dessus du bouton "more"
      const buttonRect = this.moreButton.getBoundingClientRect();
      this.moreMenu.style.bottom = `${window.innerHeight - buttonRect.top}px`;
      this.moreMenu.style.left = `${buttonRect.left}px`;
      
      // Afficher le menu
      this.moreMenu.classList.add('visible');
    }
    
    /**
     * Ferme le menu "more"
     * @private
     */
    _closeMoreMenu() {
      if (!this.moreMenu) return;
      
      this.moreMenu.classList.remove('visible');
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.TabBar = TabBar;