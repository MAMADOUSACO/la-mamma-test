/**
 * Composant Card - Conteneur stylisé pour le contenu
 * Fichier: js/components/common/Card.js
 */

class Card {
  /**
   * Constructeur du composant Card
   * @param {Object} options - Options de configuration
   * @param {string} options.title - Titre de la carte
   * @param {string|HTMLElement} options.content - Contenu de la carte
   * @param {Array} options.actions - Actions dans l'en-tête de la carte
   * @param {string} options.footer - Contenu du pied de la carte
   * @param {boolean} options.collapsible - Si true, la carte peut être réduite
   * @param {boolean} options.collapsed - État initial (réduit ou non)
   * @param {string} options.icon - Icône à côté du titre
   * @param {string} options.className - Classes CSS additionnelles
   * @param {boolean} options.fullHeight - Si true, prend toute la hauteur disponible
   * @param {boolean} options.bordered - Si true, affiche une bordure
   * @param {boolean} options.shadow - Si true, affiche une ombre
   * @param {boolean} options.loading - Si true, affiche un état de chargement
   */
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.actions = options.actions || [];
    this.footer = options.footer || '';
    this.collapsible = options.collapsible || false;
    this.collapsed = options.collapsed || false;
    this.icon = options.icon || '';
    this.className = options.className || '';
    this.fullHeight = options.fullHeight || false;
    this.bordered = options.bordered !== undefined ? options.bordered : true;
    this.shadow = options.shadow !== undefined ? options.shadow : true;
    this.loading = options.loading || false;
    
    this.element = null;
    this.headerElement = null;
    this.bodyElement = null;
    this.footerElement = null;
    this.collapseButton = null;
    this.actionsContainer = null;
    this.loadingOverlay = null;
  }

  /**
   * Génère et retourne l'élément HTML de la carte
   * @returns {HTMLElement} L'élément de la carte
   */
  render() {
    // Créer l'élément principal
    this.element = document.createElement('div');
    
    // Construire les classes CSS
    let cssClasses = ['card'];
    
    if (this.fullHeight) cssClasses.push('card-full-height');
    if (this.bordered) cssClasses.push('card-bordered');
    if (this.shadow) cssClasses.push('card-shadow');
    if (this.className) cssClasses.push(this.className);
    
    this.element.className = cssClasses.join(' ');
    
    // Créer l'en-tête si un titre, une icône ou des actions sont définis
    if (this.title || this.icon || this.actions.length > 0 || this.collapsible) {
      this._createHeader();
    }
    
    // Créer le corps de la carte
    this._createBody();
    
    // Créer le pied de la carte si défini
    if (this.footer) {
      this._createFooter();
    }
    
    // Appliquer l'état initial de collapse
    if (this.collapsible && this.collapsed) {
      this._collapse(false);
    }
    
    // Appliquer l'état de chargement si nécessaire
    if (this.loading) {
      this.setLoading(true);
    }
    
    return this.element;
  }
  
  /**
   * Définit le titre de la carte
   * @param {string} title - Nouveau titre
   * @returns {Card} L'instance courante pour chaînage
   */
  setTitle(title) {
    this.title = title;
    
    if (this.element) {
      let titleElement = this.element.querySelector('.card-title');
      
      if (title) {
        if (titleElement) {
          // Mettre à jour le titre existant
          titleElement.textContent = title;
        } else if (!this.headerElement) {
          // Créer l'en-tête s'il n'existe pas
          this._createHeader();
        } else {
          // Créer l'élément titre dans l'en-tête existant
          titleElement = document.createElement('div');
          titleElement.className = 'card-title';
          titleElement.textContent = title;
          
          // Insérer après l'icône si elle existe, sinon en premier
          const iconElement = this.headerElement.querySelector('.card-icon');
          if (iconElement) {
            this.headerElement.insertBefore(titleElement, iconElement.nextSibling);
          } else {
            this.headerElement.insertBefore(titleElement, this.headerElement.firstChild);
          }
        }
      } else if (titleElement) {
        // Supprimer le titre si vide
        titleElement.parentNode.removeChild(titleElement);
        
        // Supprimer l'en-tête s'il est vide
        this._removeHeaderIfEmpty();
      }
    }
    
    return this;
  }
  
  /**
   * Définit le contenu de la carte
   * @param {string|HTMLElement} content - Nouveau contenu
   * @returns {Card} L'instance courante pour chaînage
   */
  setContent(content) {
    this.content = content;
    
    if (this.bodyElement) {
      // Vider le contenu actuel
      this.bodyElement.innerHTML = '';
      
      // Ajouter le nouveau contenu
      if (content instanceof HTMLElement) {
        this.bodyElement.appendChild(content);
      } else if (typeof content === 'string') {
        this.bodyElement.innerHTML = content;
      }
    } else {
      // Créer le corps si nécessaire
      this._createBody();
    }
    
    return this;
  }
  
  /**
   * Définit le pied de la carte
   * @param {string|HTMLElement} footer - Nouveau pied
   * @returns {Card} L'instance courante pour chaînage
   */
  setFooter(footer) {
    this.footer = footer;
    
    if (footer) {
      if (this.footerElement) {
        // Mettre à jour le pied existant
        this.footerElement.innerHTML = '';
        
        if (footer instanceof HTMLElement) {
          this.footerElement.appendChild(footer);
        } else {
          this.footerElement.innerHTML = footer;
        }
      } else {
        // Créer le pied s'il n'existe pas
        this._createFooter();
      }
    } else if (this.footerElement) {
      // Supprimer le pied s'il est vide
      this.element.removeChild(this.footerElement);
      this.footerElement = null;
    }
    
    return this;
  }
  
  /**
   * Met à jour les actions dans l'en-tête
   * @param {Array} actions - Nouvelles actions
   * @returns {Card} L'instance courante pour chaînage
   */
  setActions(actions) {
    this.actions = actions || [];
    
    if (this.element) {
      if (actions.length > 0) {
        if (this.actionsContainer) {
          // Mettre à jour les actions existantes
          this._renderActions();
        } else if (!this.headerElement) {
          // Créer l'en-tête s'il n'existe pas
          this._createHeader();
        } else {
          // Créer le conteneur d'actions dans l'en-tête existant
          this.actionsContainer = document.createElement('div');
          this.actionsContainer.className = 'card-actions';
          this.headerElement.appendChild(this.actionsContainer);
          
          // Rendre les actions
          this._renderActions();
        }
      } else if (this.actionsContainer) {
        // Supprimer le conteneur d'actions s'il est vide
        this.actionsContainer.parentNode.removeChild(this.actionsContainer);
        this.actionsContainer = null;
        
        // Supprimer l'en-tête s'il est vide
        this._removeHeaderIfEmpty();
      }
    }
    
    return this;
  }
  
  /**
   * Réduit ou développe la carte
   * @param {boolean} collapsed - Si true, réduit la carte
   * @returns {Card} L'instance courante pour chaînage
   */
  setCollapsed(collapsed) {
    if (!this.collapsible) return this;
    
    this.collapsed = collapsed;
    
    if (this.element) {
      this._collapse(!collapsed);
    }
    
    return this;
  }
  
  /**
   * Active ou désactive l'état de chargement
   * @param {boolean} loading - Si true, active l'état de chargement
   * @returns {Card} L'instance courante pour chaînage
   */
  setLoading(loading) {
    this.loading = loading;
    
    if (this.element) {
      if (loading) {
        if (!this.loadingOverlay) {
          // Créer l'overlay de chargement
          this.loadingOverlay = document.createElement('div');
          this.loadingOverlay.className = 'card-loading-overlay';
          
          // Créer le spinner
          const spinner = new window.components.Spinner({
            size: 'medium',
            color: 'primary'
          });
          
          this.loadingOverlay.appendChild(spinner.render());
          this.element.appendChild(this.loadingOverlay);
        }
      } else if (this.loadingOverlay) {
        // Supprimer l'overlay de chargement
        this.element.removeChild(this.loadingOverlay);
        this.loadingOverlay = null;
      }
    }
    
    return this;
  }
  
  /**
   * Ajoute une classe CSS à la carte
   * @param {string} className - Classe à ajouter
   * @returns {Card} L'instance courante pour chaînage
   */
  addClass(className) {
    if (this.element) {
      this.element.classList.add(className);
    } else {
      this.className += ` ${className}`;
    }
    
    return this;
  }
  
  /**
   * Supprime une classe CSS de la carte
   * @param {string} className - Classe à supprimer
   * @returns {Card} L'instance courante pour chaînage
   */
  removeClass(className) {
    if (this.element) {
      this.element.classList.remove(className);
    } else {
      this.className = this.className.replace(new RegExp(`\\b${className}\\b`, 'g'), '');
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Nettoyer les écouteurs d'événements
    if (this.collapseButton) {
      this.collapseButton.removeEventListener('click', this._handleCollapseClick);
    }
    
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
    this.headerElement = null;
    this.bodyElement = null;
    this.footerElement = null;
    this.collapseButton = null;
    this.actionsContainer = null;
    this.loadingOverlay = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Crée l'en-tête de la carte
   * @private
   */
  _createHeader() {
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'card-header';
    
    // Ajouter l'icône si présente
    if (this.icon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'card-icon';
      
      const iconSpan = document.createElement('span');
      iconSpan.className = this.icon;
      iconElement.appendChild(iconSpan);
      
      this.headerElement.appendChild(iconElement);
    }
    
    // Ajouter le titre si présent
    if (this.title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'card-title';
      titleElement.textContent = this.title;
      
      this.headerElement.appendChild(titleElement);
    }
    
    // Ajouter le bouton de collapse si la carte est collapsible
    if (this.collapsible) {
      this.collapseButton = document.createElement('button');
      this.collapseButton.type = 'button';
      this.collapseButton.className = 'card-collapse-button';
      this.collapseButton.innerHTML = '<span class="collapse-icon"></span>';
      this.collapseButton.addEventListener('click', this._handleCollapseClick.bind(this));
      
      this.headerElement.appendChild(this.collapseButton);
    }
    
    // Ajouter les actions si présentes
    if (this.actions.length > 0) {
      this.actionsContainer = document.createElement('div');
      this.actionsContainer.className = 'card-actions';
      
      this._renderActions();
      
      this.headerElement.appendChild(this.actionsContainer);
    }
    
    // Insérer l'en-tête en premier dans la carte
    if (this.element.firstChild) {
      this.element.insertBefore(this.headerElement, this.element.firstChild);
    } else {
      this.element.appendChild(this.headerElement);
    }
  }
  
  /**
   * Crée le corps de la carte
   * @private
   */
  _createBody() {
    this.bodyElement = document.createElement('div');
    this.bodyElement.className = 'card-body';
    
    // Ajouter le contenu
    if (this.content instanceof HTMLElement) {
      this.bodyElement.appendChild(this.content);
    } else if (typeof this.content === 'string') {
      this.bodyElement.innerHTML = this.content;
    }
    
    // Insérer le corps après l'en-tête s'il existe, sinon en premier
    if (this.headerElement && this.headerElement.nextSibling) {
      this.element.insertBefore(this.bodyElement, this.headerElement.nextSibling);
    } else if (this.headerElement) {
      this.element.appendChild(this.bodyElement);
    } else if (this.element.firstChild) {
      this.element.insertBefore(this.bodyElement, this.element.firstChild);
    } else {
      this.element.appendChild(this.bodyElement);
    }
  }
  
  /**
   * Crée le pied de la carte
   * @private
   */
  _createFooter() {
    this.footerElement = document.createElement('div');
    this.footerElement.className = 'card-footer';
    
    // Ajouter le contenu du pied
    if (this.footer instanceof HTMLElement) {
      this.footerElement.appendChild(this.footer);
    } else {
      this.footerElement.innerHTML = this.footer;
    }
    
    // Ajouter le pied à la fin de la carte
    this.element.appendChild(this.footerElement);
  }
  
  /**
   * Rend les actions dans l'en-tête
   * @private
   */
  _renderActions() {
    if (!this.actionsContainer) return;
    
    // Vider le conteneur
    this.actionsContainer.innerHTML = '';
    
    // Ajouter chaque action
    this.actions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `card-action-button ${action.className || ''}`;
      
      if (action.title) {
        button.title = action.title;
      }
      
      // Contenu du bouton (icône ou texte)
      if (action.icon) {
        const icon = document.createElement('span');
        icon.className = action.icon;
        button.appendChild(icon);
      } else {
        button.textContent = action.text || '';
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
   * Gère le clic sur le bouton de collapse
   * @private
   */
  _handleCollapseClick() {
    this.setCollapsed(!this.collapsed);
  }
  
  /**
   * Réduit ou développe la carte
   * @param {boolean} show - Si true, développe la carte
   * @private
   */
  _collapse(show) {
    if (!this.bodyElement) return;
    
    if (show) {
      this.bodyElement.style.display = '';
      if (this.footerElement) {
        this.footerElement.style.display = '';
      }
      if (this.collapseButton) {
        this.collapseButton.classList.remove('collapsed');
      }
      this.element.classList.remove('card-collapsed');
    } else {
      this.bodyElement.style.display = 'none';
      if (this.footerElement) {
        this.footerElement.style.display = 'none';
      }
      if (this.collapseButton) {
        this.collapseButton.classList.add('collapsed');
      }
      this.element.classList.add('card-collapsed');
    }
  }
  
  /**
   * Supprime l'en-tête s'il est vide
   * @private
   */
  _removeHeaderIfEmpty() {
    if (!this.headerElement) return;
    
    // Vérifier s'il reste des éléments dans l'en-tête
    const hasTitle = !!this.headerElement.querySelector('.card-title');
    const hasIcon = !!this.headerElement.querySelector('.card-icon');
    const hasActions = !!this.actionsContainer && this.actionsContainer.children.length > 0;
    const hasCollapseButton = !!this.collapseButton;
    
    if (!hasTitle && !hasIcon && !hasActions && !hasCollapseButton) {
      // Supprimer l'en-tête s'il est vide
      this.element.removeChild(this.headerElement);
      this.headerElement = null;
    }
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Card = Card;