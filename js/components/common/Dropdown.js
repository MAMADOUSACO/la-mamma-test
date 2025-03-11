/**
 * Composant Dropdown - Menu déroulant
 * Fichier: js/components/common/Dropdown.js
 */

class Dropdown {
  /**
   * Constructeur du composant Dropdown
   * @param {Object} options - Options de configuration
   * @param {string|HTMLElement} options.trigger - Élément déclencheur (texte ou élément HTML)
   * @param {Array} options.items - Éléments du menu
   * @param {string} options.placement - Position du menu (top, bottom, left, right)
   * @param {boolean} options.arrow - Si true, affiche une flèche
   * @param {boolean} options.closeOnSelect - Si true, ferme le menu après sélection
   * @param {boolean} options.closeOnClickOutside - Si true, ferme le menu en cliquant à l'extérieur
   * @param {string} options.triggerType - Type de déclencheur (button, link, custom)
   * @param {string} options.size - Taille du menu (small, medium, large)
   * @param {string} options.className - Classes CSS additionnelles
   * @param {Function} options.onShow - Callback lors de l'ouverture du menu
   * @param {Function} options.onHide - Callback lors de la fermeture du menu
   * @param {Function} options.onSelect - Callback lors de la sélection d'un élément
   */
  constructor(options = {}) {
    this.trigger = options.trigger || 'Menu';
    this.items = options.items || [];
    this.placement = options.placement || 'bottom';
    this.arrow = options.arrow !== undefined ? options.arrow : true;
    this.closeOnSelect = options.closeOnSelect !== undefined ? options.closeOnSelect : true;
    this.closeOnClickOutside = options.closeOnClickOutside !== undefined ? options.closeOnClickOutside : true;
    this.triggerType = options.triggerType || 'button';
    this.size = options.size || 'medium';
    this.className = options.className || '';
    this.onShow = options.onShow || (() => {});
    this.onHide = options.onHide || (() => {});
    this.onSelect = options.onSelect || (() => {});
    
    this.element = null;
    this.triggerElement = null;
    this.menuElement = null;
    this.isOpen = false;
    this.outsideClickHandler = null;
  }

  /**
   * Génère et retourne l'élément HTML du dropdown
   * @returns {HTMLElement} L'élément du dropdown
   */
  render() {
    // Créer l'élément principal
    this.element = document.createElement('div');
    this.element.className = `dropdown ${this.className}`;
    
    // Créer l'élément déclencheur
    this._createTrigger();
    
    // Créer le menu
    this._createMenu();
    
    return this.element;
  }
  
  /**
   * Ouvre le menu déroulant
   * @returns {Dropdown} L'instance courante pour chaînage
   */
  open() {
    if (this.isOpen) return this;
    
    this.isOpen = true;
    
    if (this.menuElement) {
      // Afficher le menu
      this.menuElement.classList.add('show');
      
      // Positionner le menu
      this._positionMenu();
      
      // Ajouter le gestionnaire de clic extérieur
      if (this.closeOnClickOutside) {
        this.outsideClickHandler = this._handleOutsideClick.bind(this);
        document.addEventListener('click', this.outsideClickHandler);
      }
      
      // Exécuter le callback
      this.onShow();
    }
    
    return this;
  }
  
  /**
   * Ferme le menu déroulant
   * @returns {Dropdown} L'instance courante pour chaînage
   */
  close() {
    if (!this.isOpen) return this;
    
    this.isOpen = false;
    
    if (this.menuElement) {
      // Masquer le menu
      this.menuElement.classList.remove('show');
      
      // Supprimer le gestionnaire de clic extérieur
      if (this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
        this.outsideClickHandler = null;
      }
      
      // Exécuter le callback
      this.onHide();
    }
    
    return this;
  }
  
  /**
   * Bascule l'état du menu (ouvert/fermé)
   * @returns {Dropdown} L'instance courante pour chaînage
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    
    return this;
  }
  
  /**
   * Met à jour les éléments du menu
   * @param {Array} items - Nouveaux éléments
   * @returns {Dropdown} L'instance courante pour chaînage
   */
  setItems(items) {
    this.items = items || [];
    
    if (this.menuElement) {
      // Vider le menu actuel
      while (this.menuElement.firstChild) {
        this.menuElement.removeChild(this.menuElement.firstChild);
      }
      
      // Rendre les nouveaux éléments
      this._renderMenuItems();
    }
    
    return this;
  }
  
  /**
   * Sélectionne un élément du menu par son ID
   * @param {string} itemId - ID de l'élément à sélectionner
   * @param {boolean} fireCallback - Si true, exécute le callback onSelect
   * @returns {Dropdown} L'instance courante pour chaînage
   */
  selectItem(itemId, fireCallback = true) {
    // Trouver l'élément dans les données
    const item = this.items.find(item => item.id === itemId);
    if (!item) return this;
    
    // Mettre à jour l'élément sélectionné dans le menu
    if (this.menuElement) {
      // Supprimer la classe selected de tous les éléments
      const menuItems = this.menuElement.querySelectorAll('.dropdown-item');
      menuItems.forEach(menuItem => {
        menuItem.classList.remove('selected');
      });
      
      // Ajouter la classe selected à l'élément sélectionné
      const selectedItem = this.menuElement.querySelector(`.dropdown-item[data-id="${itemId}"]`);
      if (selectedItem) {
        selectedItem.classList.add('selected');
      }
    }
    
    // Exécuter le callback si demandé
    if (fireCallback) {
      this.onSelect(item);
    }
    
    // Fermer le menu si nécessaire
    if (this.closeOnSelect) {
      this.close();
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Fermer le menu s'il est ouvert
    this.close();
    
    // Nettoyer les écouteurs d'événements
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', this._handleTriggerClick);
    }
    
    if (this.menuElement) {
      const menuItems = this.menuElement.querySelectorAll('.dropdown-item');
      menuItems.forEach(item => {
        item.removeEventListener('click', item._clickHandler);
      });
    }
    
    // Supprimer l'élément du DOM s'il est attaché
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Réinitialiser les références
    this.element = null;
    this.triggerElement = null;
    this.menuElement = null;
    this.outsideClickHandler = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Crée l'élément déclencheur du dropdown
   * @private
   */
  _createTrigger() {
    if (this.trigger instanceof HTMLElement) {
      // Utiliser l'élément fourni
      this.triggerElement = this.trigger;
    } else {
      // Créer un nouveau déclencheur selon le type
      switch (this.triggerType) {
        case 'link':
          this.triggerElement = document.createElement('a');
          this.triggerElement.href = '#';
          this.triggerElement.className = 'dropdown-trigger dropdown-link';
          break;
        case 'button':
        default:
          this.triggerElement = document.createElement('button');
          this.triggerElement.type = 'button';
          this.triggerElement.className = `dropdown-trigger dropdown-button btn-${this.size}`;
          break;
      }
      
      // Ajouter le contenu au déclencheur
      if (typeof this.trigger === 'string') {
        this.triggerElement.innerHTML = this.trigger;
      }
    }
    
    // Ajouter l'écouteur d'événement de clic
    this.triggerElement._handleTriggerClick = this._handleTriggerClick.bind(this);
    this.triggerElement.addEventListener('click', this.triggerElement._handleTriggerClick);
    
    // Ajouter au conteneur
    this.element.appendChild(this.triggerElement);
  }
  
  /**
   * Crée le menu déroulant
   * @private
   */
  _createMenu() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = `dropdown-menu dropdown-${this.size}`;
    
    // Ajouter la flèche si nécessaire
    if (this.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'dropdown-arrow';
      this.menuElement.appendChild(arrow);
    }
    
    // Rendre les éléments du menu
    this._renderMenuItems();
    
    // Ajouter au conteneur
    this.element.appendChild(this.menuElement);
  }
  
  /**
   * Rend les éléments du menu
   * @private
   */
  _renderMenuItems() {
    if (!this.menuElement) return;
    
    // Vider le menu actuel
    const arrow = this.menuElement.querySelector('.dropdown-arrow');
    this.menuElement.innerHTML = '';
    
    // Remettre la flèche si elle existait
    if (arrow) {
      this.menuElement.appendChild(arrow);
    }
    
    // Créer la liste des éléments
    const menuList = document.createElement('ul');
    menuList.className = 'dropdown-list';
    
    // Ajouter chaque élément
    this.items.forEach(item => {
      // Ignorer les éléments invisibles
      if (item.hidden) return;
      
      const listItem = document.createElement('li');
      
      if (item.type === 'divider') {
        // Élément séparateur
        listItem.className = 'dropdown-divider';
      } else if (item.type === 'header') {
        // Élément d'en-tête
        listItem.className = 'dropdown-header';
        listItem.textContent = item.label || '';
      } else {
        // Élément normal
        const itemElement = document.createElement('a');
        itemElement.href = '#';
        itemElement.className = `dropdown-item ${item.selected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`;
        
        if (item.id) {
          itemElement.dataset.id = item.id;
        }
        
        // Icône si présente
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = `dropdown-item-icon ${item.icon}`;
          itemElement.appendChild(icon);
        }
        
        // Libellé
        const label = document.createElement('span');
        label.className = 'dropdown-item-label';
        label.textContent = item.label || '';
        itemElement.appendChild(label);
        
        // Badge si présent
        if (item.badge) {
          const badge = document.createElement('span');
          badge.className = 'dropdown-item-badge';
          badge.textContent = item.badge;
          itemElement.appendChild(badge);
        }
        
        // Gestionnaire de clic
        if (!item.disabled) {
          itemElement._clickHandler = (e) => {
            e.preventDefault();
            this._handleItemClick(item);
          };
          itemElement.addEventListener('click', itemElement._clickHandler);
        }
        
        listItem.appendChild(itemElement);
      }
      
      menuList.appendChild(listItem);
    });
    
    this.menuElement.appendChild(menuList);
  }
  
  /**
   * Positionne le menu par rapport au déclencheur
   * @private
   */
  _positionMenu() {
    if (!this.menuElement || !this.triggerElement) return;
    
    // Obtenir les dimensions et positions
    const triggerRect = this.triggerElement.getBoundingClientRect();
    const menuRect = this.menuElement.getBoundingClientRect();
    
    // Réinitialiser les styles de positionnement
    this.menuElement.style.top = '';
    this.menuElement.style.right = '';
    this.menuElement.style.bottom = '';
    this.menuElement.style.left = '';
    
    // Supprimer les classes de placement
    this.menuElement.classList.remove('dropdown-top', 'dropdown-right', 'dropdown-bottom', 'dropdown-left');
    
    // Positionner selon le placement demandé
    switch (this.placement) {
      case 'top':
        this.menuElement.style.bottom = `${window.innerHeight - triggerRect.top}px`;
        this.menuElement.style.left = `${triggerRect.left}px`;
        this.menuElement.classList.add('dropdown-top');
        break;
      case 'right':
        this.menuElement.style.top = `${triggerRect.top}px`;
        this.menuElement.style.left = `${triggerRect.right}px`;
        this.menuElement.classList.add('dropdown-right');
        break;
      case 'left':
        this.menuElement.style.top = `${triggerRect.top}px`;
        this.menuElement.style.right = `${window.innerWidth - triggerRect.left}px`;
        this.menuElement.classList.add('dropdown-left');
        break;
      case 'bottom':
      default:
        this.menuElement.style.top = `${triggerRect.bottom}px`;
        this.menuElement.style.left = `${triggerRect.left}px`;
        this.menuElement.classList.add('dropdown-bottom');
        break;
    }
    
    // Ajuster la position pour éviter que le menu ne dépasse de la fenêtre
    const menuRect2 = this.menuElement.getBoundingClientRect();
    
    // Ajustement horizontal
    if (menuRect2.right > window.innerWidth) {
      this.menuElement.style.left = '';
      this.menuElement.style.right = '0';
    }
    
    // Ajustement vertical
    if (menuRect2.bottom > window.innerHeight) {
      this.menuElement.style.top = '';
      this.menuElement.style.bottom = '0';
    }
  }
  
  /**
   * Gère le clic sur le déclencheur
   * @param {Event} event - Événement de clic
   * @private
   */
  _handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }
  
  /**
   * Gère le clic sur un élément du menu
   * @param {Object} item - Élément cliqué
   * @private
   */
  _handleItemClick(item) {
    // Sélectionner l'élément
    if (item.id) {
      this.selectItem(item.id);
    } else {
      // Exécuter le callback
      this.onSelect(item);
      
      // Fermer le menu si nécessaire
      if (this.closeOnSelect) {
        this.close();
      }
    }
    
    // Exécuter le callback spécifique à l'élément
    if (typeof item.onClick === 'function') {
      item.onClick(item);
    }
  }
  
  /**
   * Gère le clic en dehors du dropdown
   * @param {Event} event - Événement de clic
   * @private
   */
  _handleOutsideClick(event) {
    // Vérifier si le clic est en dehors du dropdown
    if (this.element && !this.element.contains(event.target)) {
      this.close();
    }
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Dropdown = Dropdown;