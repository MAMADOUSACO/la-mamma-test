/**
 * Composant Navigation - Menu de navigation principal
 * Fichier: js/components/layout/Navigation.js
 */

class Navigation {
    /**
     * Constructeur du composant Navigation
     * @param {Object} options - Options de configuration
     * @param {Array} options.items - Éléments du menu
     * @param {string} options.activeItem - ID de l'élément actif
     * @param {Function} options.onSelect - Callback lors de la sélection d'un élément
     * @param {Function} options.onClose - Callback lors de la fermeture du menu
     * @param {boolean} options.isOpen - État initial du menu (ouvert/fermé)
     */
    constructor(options = {}) {
      this.items = options.items || this._getDefaultItems();
      this.activeItem = options.activeItem || '';
      this.onSelect = options.onSelect || (() => {});
      this.onClose = options.onClose || (() => {});
      this.isOpen = options.isOpen || false;
      
      this.element = null;
      this.menuContainer = null;
      this.overlay = null;
    }
  
    /**
     * Génère et retourne l'élément HTML de la navigation
     * @returns {HTMLElement} L'élément de navigation
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = `app-navigation ${this.isOpen ? 'open' : 'closed'}`;
      
      // Créer le conteneur du menu
      this.menuContainer = document.createElement('nav');
      this.menuContainer.className = 'navigation-menu';
      
      // Créer l'entête du menu
      const header = document.createElement('div');
      header.className = 'navigation-header';
      
      // Logo dans l'entête
      const logo = document.createElement('img');
      logo.src = 'assets/images/logo/logo.png';
      logo.alt = 'Logo LA MAMMA';
      logo.className = 'navigation-logo';
      
      // Bouton de fermeture
      const closeButton = document.createElement('button');
      closeButton.className = 'navigation-close';
      closeButton.innerHTML = '<span class="close-icon">&times;</span>';
      closeButton.addEventListener('click', this._handleClose.bind(this));
      
      // Ajouter les éléments à l'entête
      header.appendChild(logo);
      header.appendChild(closeButton);
      this.menuContainer.appendChild(header);
      
      // Créer la liste des éléments du menu
      const menuList = document.createElement('ul');
      menuList.className = 'navigation-list';
      
      // Ajouter chaque élément du menu
      this.items.forEach(item => {
        const menuItem = document.createElement('li');
        menuItem.className = `navigation-item ${this.activeItem === item.id ? 'active' : ''}`;
        menuItem.dataset.id = item.id;
        
        // Contenu de l'élément
        const itemContent = document.createElement('a');
        itemContent.href = '#';
        itemContent.addEventListener('click', (e) => {
          e.preventDefault();
          this._handleItemClick(item.id, item.route);
        });
        
        // Icône de l'élément
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = `item-icon ${item.icon}`;
          itemContent.appendChild(icon);
        }
        
        // Texte de l'élément
        const text = document.createElement('span');
        text.className = 'item-text';
        text.textContent = item.label;
        itemContent.appendChild(text);
        
        // Badge de notification (si présent)
        if (item.badge) {
          const badge = document.createElement('span');
          badge.className = 'item-badge';
          badge.textContent = item.badge;
          itemContent.appendChild(badge);
        }
        
        menuItem.appendChild(itemContent);
        menuList.appendChild(menuItem);
      });
      
      this.menuContainer.appendChild(menuList);
      
      // Créer le pied du menu
      const footer = document.createElement('div');
      footer.className = 'navigation-footer';
      
      // Information de version
      const version = document.createElement('div');
      version.className = 'version-info';
      version.textContent = 'LA MAMMA v1.0';
      
      footer.appendChild(version);
      this.menuContainer.appendChild(footer);
      
      // Overlay de fond (pour fermer en cliquant à l'extérieur)
      this.overlay = document.createElement('div');
      this.overlay.className = 'navigation-overlay';
      this.overlay.addEventListener('click', this._handleClose.bind(this));
      
      // Assembler les éléments
      this.element.appendChild(this.overlay);
      this.element.appendChild(this.menuContainer);
      
      return this.element;
    }
    
    /**
     * Ouvre le menu de navigation
     */
    open() {
      this.isOpen = true;
      if (this.element) {
        this.element.classList.add('open');
        this.element.classList.remove('closed');
      }
    }
    
    /**
     * Ferme le menu de navigation
     */
    close() {
      this.isOpen = false;
      if (this.element) {
        this.element.classList.remove('open');
        this.element.classList.add('closed');
      }
    }
    
    /**
     * Bascule l'état du menu (ouvert/fermé)
     */
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
    
    /**
     * Définit l'élément actif du menu
     * @param {string} itemId - ID de l'élément à activer
     */
    setActiveItem(itemId) {
      this.activeItem = itemId;
      
      if (this.menuContainer) {
        // Supprimer la classe active de tous les éléments
        const items = this.menuContainer.querySelectorAll('.navigation-item');
        items.forEach(item => {
          item.classList.remove('active');
        });
        
        // Ajouter la classe active à l'élément sélectionné
        const activeItem = this.menuContainer.querySelector(`.navigation-item[data-id="${itemId}"]`);
        if (activeItem) {
          activeItem.classList.add('active');
        }
      }
    }
    
    /**
     * Met à jour le badge de notification pour un élément
     * @param {string} itemId - ID de l'élément
     * @param {string|number} badgeContent - Contenu du badge (null pour masquer)
     */
    updateBadge(itemId, badgeContent) {
      // Mettre à jour dans le modèle de données
      const item = this.items.find(item => item.id === itemId);
      if (item) {
        item.badge = badgeContent;
      }
      
      // Mettre à jour dans le DOM
      if (this.menuContainer) {
        const menuItem = this.menuContainer.querySelector(`.navigation-item[data-id="${itemId}"]`);
        if (menuItem) {
          let badge = menuItem.querySelector('.item-badge');
          
          if (badgeContent) {
            // Créer ou mettre à jour le badge
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'item-badge';
              menuItem.querySelector('a').appendChild(badge);
            }
            badge.textContent = badgeContent;
          } else if (badge) {
            // Supprimer le badge s'il existe et qu'on veut le masquer
            badge.parentNode.removeChild(badge);
          }
        }
      }
    }
    
    /**
     * Met à jour les éléments du menu
     * @param {Array} items - Nouveaux éléments du menu
     */
    setItems(items) {
      this.items = items || this._getDefaultItems();
      
      // Nécessite un re-rendu complet du menu
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
      if (this.overlay) {
        this.overlay.removeEventListener('click', this._handleClose);
      }
      
      if (this.menuContainer) {
        const closeButton = this.menuContainer.querySelector('.navigation-close');
        if (closeButton) {
          closeButton.removeEventListener('click', this._handleClose);
        }
        
        const menuItems = this.menuContainer.querySelectorAll('.navigation-item a');
        menuItems.forEach(item => {
          item.removeEventListener('click', this._handleItemClick);
        });
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.menuContainer = null;
      this.overlay = null;
    }
    
    /* Méthodes privées */
    
    /**
     * Gère le clic sur un élément du menu
     * @param {string} itemId - ID de l'élément cliqué
     * @param {string} route - Route associée à l'élément
     * @private
     */
    _handleItemClick(itemId, route) {
      this.setActiveItem(itemId);
      this.close();
      
      // Appeler le callback de sélection
      this.onSelect(itemId, route);
      
      // Naviguer vers la route si elle est définie
      if (route) {
        window.router.navigate(route);
      }
    }
    
    /**
     * Gère la fermeture du menu
     * @private
     */
    _handleClose() {
      this.close();
      this.onClose();
    }
    
    /**
     * Retourne les éléments par défaut du menu
     * @returns {Array} Éléments par défaut
     * @private
     */
    _getDefaultItems() {
      return [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: 'icon-dashboard',
          route: '/dashboard'
        },
        {
          id: 'orders',
          label: 'Commandes',
          icon: 'icon-orders',
          route: '/orders'
        },
        {
          id: 'inventory',
          label: 'Inventaire',
          icon: 'icon-inventory',
          route: '/inventory'
        },
        {
          id: 'reservations',
          label: 'Réservations',
          icon: 'icon-reservations',
          route: '/reservations'
        },
        {
          id: 'accounting',
          label: 'Comptabilité',
          icon: 'icon-accounting',
          route: '/accounting'
        },
        {
          id: 'analytics',
          label: 'Analyses',
          icon: 'icon-analytics',
          route: '/analytics'
        },
        {
          id: 'settings',
          label: 'Configuration',
          icon: 'icon-settings',
          route: '/settings'
        }
      ];
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.Navigation = Navigation;