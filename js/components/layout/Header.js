/**
 * Composant Header - Barre d'en-tête de l'application
 * Fichier: js/components/layout/Header.js
 */

class Header {
    /**
     * Constructeur du composant Header
     * @param {Object} options - Options de configuration
     * @param {string} options.title - Titre à afficher dans le header
     * @param {string} options.logo - Chemin vers le logo (optionnel)
     * @param {Function} options.onMenuClick - Callback lors du clic sur le bouton menu
     * @param {Function} options.onHomeClick - Callback lors du clic sur le logo/titre
     * @param {boolean} options.showBackButton - Afficher le bouton retour
     * @param {Function} options.onBackClick - Callback lors du clic sur le bouton retour
     * @param {Array} options.actions - Boutons d'action supplémentaires à afficher
     */
    constructor(options = {}) {
      this.title = options.title || 'LA MAMMA';
      this.logo = options.logo || 'assets/images/logo/logo.png';
      this.onMenuClick = options.onMenuClick || (() => {});
      this.onHomeClick = options.onHomeClick || (() => {});
      this.showBackButton = options.showBackButton || false;
      this.onBackClick = options.onBackClick || (() => { window.router.back(); });
      this.actions = options.actions || [];
      
      this.element = null;
      this.menuButton = null;
      this.titleElement = null;
      this.logoElement = null;
      this.actionsContainer = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du header
     * @returns {HTMLElement} L'élément du header
     */
    render() {
      // Créer l'élément header principal
      this.element = document.createElement('header');
      this.element.className = 'app-header';
      
      // Bouton menu (hamburger)
      this.menuButton = document.createElement('button');
      this.menuButton.className = 'header-menu-button';
      this.menuButton.innerHTML = '<span class="menu-icon"></span>';
      this.menuButton.addEventListener('click', this._handleMenuClick.bind(this));
      
      // Bouton retour (si activé)
      if (this.showBackButton) {
        const backButton = document.createElement('button');
        backButton.className = 'header-back-button';
        backButton.innerHTML = '<span class="back-icon"></span>';
        backButton.addEventListener('click', this._handleBackClick.bind(this));
        this.element.appendChild(backButton);
      }
      
      // Logo (si présent)
      this.logoElement = document.createElement('img');
      this.logoElement.src = this.logo;
      this.logoElement.alt = 'Logo LA MAMMA';
      this.logoElement.className = 'header-logo';
      this.logoElement.addEventListener('click', this._handleHomeClick.bind(this));
      
      // Titre
      this.titleElement = document.createElement('h1');
      this.titleElement.className = 'header-title';
      this.titleElement.textContent = this.title;
      this.titleElement.addEventListener('click', this._handleHomeClick.bind(this));
      
      // Conteneur pour les actions
      this.actionsContainer = document.createElement('div');
      this.actionsContainer.className = 'header-actions';
      
      // Ajouter les actions
      this._renderActions();
      
      // Assembler les éléments
      this.element.appendChild(this.menuButton);
      this.element.appendChild(this.logoElement);
      this.element.appendChild(this.titleElement);
      this.element.appendChild(this.actionsContainer);
      
      return this.element;
    }
    
    /**
     * Met à jour le titre du header
     * @param {string} title - Nouveau titre
     */
    setTitle(title) {
      this.title = title;
      if (this.titleElement) {
        this.titleElement.textContent = title;
      }
    }
    
    /**
     * Met à jour les actions disponibles dans le header
     * @param {Array} actions - Nouvelles actions
     */
    setActions(actions) {
      this.actions = actions || [];
      this._renderActions();
    }
    
    /**
     * Affiche ou masque le bouton retour
     * @param {boolean} show - Afficher ou non
     */
    toggleBackButton(show) {
      this.showBackButton = show;
      // Nécessite une reconstruction du header pour changer l'affichage du bouton retour
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
      if (this.menuButton) {
        this.menuButton.removeEventListener('click', this._handleMenuClick);
      }
      
      if (this.titleElement) {
        this.titleElement.removeEventListener('click', this._handleHomeClick);
      }
      
      if (this.logoElement) {
        this.logoElement.removeEventListener('click', this._handleHomeClick);
      }
      
      // Nettoyer les écouteurs d'événements des actions
      if (this.actionsContainer) {
        const actionButtons = this.actionsContainer.querySelectorAll('button');
        actionButtons.forEach(button => {
          button.removeEventListener('click', button._clickHandler);
        });
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.menuButton = null;
      this.titleElement = null;
      this.logoElement = null;
      this.actionsContainer = null;
    }
    
    /**
     * Affiche ou masque le header
     * @param {boolean} visible - Afficher ou masquer
     */
    setVisible(visible) {
      if (this.element) {
        this.element.style.display = visible ? 'flex' : 'none';
      }
    }
    
    /* Méthodes privées */
    
    /**
     * Génère les boutons d'action dans le conteneur
     * @private
     */
    _renderActions() {
      if (!this.actionsContainer) return;
      
      // Vider le conteneur d'actions
      this.actionsContainer.innerHTML = '';
      
      // Ajouter chaque action
      this.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = `header-action-button ${action.className || ''}`;
        button.title = action.title || '';
        
        // Contenu du bouton (icône ou texte)
        if (action.icon) {
          const icon = document.createElement('span');
          icon.className = `action-icon ${action.icon}`;
          button.appendChild(icon);
        } else {
          button.textContent = action.text || '';
        }
        
        // Ajouter le badge de notification si nécessaire
        if (action.badge) {
          const badge = document.createElement('span');
          badge.className = 'action-badge';
          badge.textContent = action.badge;
          button.appendChild(badge);
        }
        
        // Gestionnaire de clic
        button._clickHandler = () => {
          if (typeof action.onClick === 'function') {
            action.onClick();
          }
        };
        
        button.addEventListener('click', button._clickHandler);
        this.actionsContainer.appendChild(button);
      });
    }
    
    /**
     * Gère le clic sur le bouton menu
     * @private
     */
    _handleMenuClick(event) {
      event.preventDefault();
      this.onMenuClick();
    }
    
    /**
     * Gère le clic sur le titre/logo
     * @private
     */
    _handleHomeClick(event) {
      event.preventDefault();
      this.onHomeClick();
    }
    
    /**
     * Gère le clic sur le bouton retour
     * @private
     */
    _handleBackClick(event) {
      event.preventDefault();
      this.onBackClick();
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.Header = Header;