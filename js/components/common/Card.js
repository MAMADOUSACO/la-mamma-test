/**
 * Composant Card - Conteneur de type carte
 * 
 * Utilisation:
 * const card = new Card({
 *   title: 'Titre de la carte',
 *   content: 'Contenu de la carte',
 *   footer: 'Pied de la carte'
 * });
 * container.appendChild(card.render());
 */

class Card {
    /**
     * Constructeur
     * @param {Object} options - Options de la carte
     * @param {string|HTMLElement} options.title - Titre de la carte
     * @param {string|HTMLElement} options.content - Contenu de la carte
     * @param {string|HTMLElement} options.footer - Pied de la carte
     * @param {Array} options.actions - Actions dans l'en-tête
     * @param {boolean} options.collapsible - Si la carte peut être réduite
     * @param {boolean} options.collapsed - État initial (réduit ou non)
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     * @param {boolean} options.noPadding - Supprime le padding du contenu
     */
    constructor(options = {}) {
      this.title = options.title || '';
      this.content = options.content || '';
      this.footer = options.footer || '';
      this.actions = options.actions || [];
      this.collapsible = options.collapsible || false;
      this.collapsed = options.collapsed || false;
      this.className = options.className || '';
      this.id = options.id || 'card-' + Date.now();
      this.noPadding = options.noPadding || false;
      
      this.element = null;
      this.headerElement = null;
      this.contentElement = null;
      this.footerElement = null;
    }
  
    /**
     * Rend le composant carte
     * @returns {HTMLElement} - Élément carte
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'card';
      this.element.id = this.id;
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      if (this.collapsed) {
        this.element.classList.add('card-collapsed');
      }
      
      // Créer l'en-tête si un titre ou des actions sont spécifiés
      if (this.title || this.actions.length > 0 || this.collapsible) {
        this.headerElement = this._createHeader();
        this.element.appendChild(this.headerElement);
      }
      
      // Créer le corps
      this.contentElement = this._createContent();
      this.element.appendChild(this.contentElement);
      
      // Créer le pied de page si spécifié
      if (this.footer) {
        this.footerElement = this._createFooter();
        this.element.appendChild(this.footerElement);
      }
      
      return this.element;
    }
  
    /**
     * Crée l'en-tête de la carte
     * @returns {HTMLElement} - Élément d'en-tête
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'card-header';
      
      // Ajouter le titre
      if (this.title) {
        const titleElement = document.createElement('div');
        titleElement.className = 'card-title';
        
        if (typeof this.title === 'string') {
          titleElement.textContent = this.title;
        } else if (this.title instanceof HTMLElement) {
          titleElement.appendChild(this.title);
        }
        
        header.appendChild(titleElement);
      }
      
      // Ajouter les actions
      if (this.actions.length > 0 || this.collapsible) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'card-actions';
        
        // Ajouter les actions personnalisées
        this.actions.forEach(action => {
          // Si l'action est déjà un élément HTML, l'ajouter directement
          if (action instanceof HTMLElement) {
            actionsContainer.appendChild(action);
            return;
          }
          
          // Si l'action utilise le composant Button
          if (window.components && window.components.Button && action.type) {
            const buttonConfig = {
              ...action,
              size: action.size || 'small',
              isIconOnly: action.isIconOnly !== false && action.icon
            };
            
            const button = new window.components.Button(buttonConfig);
            actionsContainer.appendChild(button.render());
          } else {
            // Créer un bouton standard
            const button = document.createElement('button');
            button.className = `btn btn-${action.type || 'outline'} btn-small`;
            
            if (action.icon) {
              const iconSpan = document.createElement('span');
              iconSpan.className = `icon icon-${action.icon}`;
              button.appendChild(iconSpan);
            }
            
            if (action.text && (!action.icon || !action.isIconOnly)) {
              const textSpan = document.createElement('span');
              textSpan.textContent = action.text;
              button.appendChild(textSpan);
            }
            
            if (action.onClick && typeof action.onClick === 'function') {
              button.addEventListener('click', action.onClick);
            }
            
            actionsContainer.appendChild(button);
          }
        });
        
        // Ajouter le bouton de réduction si la carte est réductible
        if (this.collapsible) {
          const collapseButton = document.createElement('button');
          collapseButton.className = 'card-collapse-btn';
          collapseButton.type = 'button';
          collapseButton.innerHTML = `
            <svg class="collapse-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
            </svg>
            <svg class="expand-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            </svg>
          `;
          
          collapseButton.addEventListener('click', () => {
            this.toggle();
          });
          
          actionsContainer.appendChild(collapseButton);
        }
        
        header.appendChild(actionsContainer);
      }
      
      return header;
    }
  
    /**
     * Crée le corps de la carte
     * @returns {HTMLElement} - Élément de corps
     * @private
     */
    _createContent() {
      const content = document.createElement('div');
      content.className = 'card-content';
      
      if (this.noPadding) {
        content.classList.add('card-content-no-padding');
      }
      
      if (typeof this.content === 'string') {
        content.innerHTML = this.content;
      } else if (this.content instanceof HTMLElement) {
        content.appendChild(this.content);
      }
      
      return content;
    }
  
    /**
     * Crée le pied de page de la carte
     * @returns {HTMLElement} - Élément de pied de page
     * @private
     */
    _createFooter() {
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      
      if (typeof this.footer === 'string') {
        footer.innerHTML = this.footer;
      } else if (this.footer instanceof HTMLElement) {
        footer.appendChild(this.footer);
      }
      
      return footer;
    }
  
    /**
     * Bascule l'état réduit/étendu de la carte
     * @returns {boolean} - Nouvel état (true = réduit, false = étendu)
     */
    toggle() {
      if (!this.collapsible) return false;
      
      this.collapsed = !this.collapsed;
      
      if (this.element) {
        if (this.collapsed) {
          this.element.classList.add('card-collapsed');
        } else {
          this.element.classList.remove('card-collapsed');
        }
      }
      
      return this.collapsed;
    }
  
    /**
     * Réduit la carte
     */
    collapse() {
      if (this.collapsible && !this.collapsed) {
        this.toggle();
      }
    }
  
    /**
     * Étend la carte
     */
    expand() {
      if (this.collapsible && this.collapsed) {
        this.toggle();
      }
    }
  
    /**
     * Met à jour le contenu de la carte
     * @param {string|HTMLElement} content - Nouveau contenu
     */
    setContent(content) {
      this.content = content;
      
      if (this.contentElement) {
        // Vider le contenu
        this.contentElement.innerHTML = '';
        
        if (typeof content === 'string') {
          this.contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          this.contentElement.appendChild(content);
        }
      }
    }
  
    /**
     * Met à jour le titre de la carte
     * @param {string|HTMLElement} title - Nouveau titre
     */
    setTitle(title) {
      this.title = title;
      
      if (this.headerElement) {
        let titleElement = this.headerElement.querySelector('.card-title');
        
        if (title) {
          if (titleElement) {
            // Vider le titre
            titleElement.innerHTML = '';
            
            // Ajouter le nouveau titre
            if (typeof title === 'string') {
              titleElement.textContent = title;
            } else if (title instanceof HTMLElement) {
              titleElement.appendChild(title);
            }
          } else {
            // Créer un nouvel élément titre
            titleElement = document.createElement('div');
            titleElement.className = 'card-title';
            
            if (typeof title === 'string') {
              titleElement.textContent = title;
            } else if (title instanceof HTMLElement) {
              titleElement.appendChild(title);
            }
            
            // Insérer au début du header
            this.headerElement.insertBefore(titleElement, this.headerElement.firstChild);
          }
        } else if (titleElement && titleElement.parentNode) {
          // Supprimer le titre si le nouveau titre est vide
          titleElement.parentNode.removeChild(titleElement);
        }
      } else if (title) {
        // Créer un nouveau header si nécessaire
        this.headerElement = this._createHeader();
        
        if (this.element.firstChild) {
          this.element.insertBefore(this.headerElement, this.element.firstChild);
        } else {
          this.element.appendChild(this.headerElement);
        }
      }
    }
  
    /**
     * Met à jour le pied de page de la carte
     * @param {string|HTMLElement} footer - Nouveau pied de page
     */
    setFooter(footer) {
      this.footer = footer;
      
      if (this.footerElement && this.footerElement.parentNode) {
        // Supprimer le footer existant
        this.footerElement.parentNode.removeChild(this.footerElement);
        this.footerElement = null;
      }
      
      if (footer) {
        // Créer un nouveau footer
        this.footerElement = this._createFooter();
        this.element.appendChild(this.footerElement);
      }
    }
  
    /**
     * Met à jour les actions de la carte
     * @param {Array} actions - Nouvelles actions
     */
    setActions(actions) {
      this.actions = actions || [];
      
      if (this.headerElement) {
        let actionsContainer = this.headerElement.querySelector('.card-actions');
        
        if (actionsContainer) {
          // Supprimer toutes les actions sauf le bouton de réduction
          const collapseButton = actionsContainer.querySelector('.card-collapse-btn');
          actionsContainer.innerHTML = '';
          
          if (collapseButton) {
            actionsContainer.appendChild(collapseButton);
          }
        } else if (this.actions.length > 0 || this.collapsible) {
          // Créer un nouveau conteneur d'actions
          actionsContainer = document.createElement('div');
          actionsContainer.className = 'card-actions';
          this.headerElement.appendChild(actionsContainer);
        } else {
          return; // Rien à faire si pas d'actions ni de bouton de réduction
        }
        
        // Ajouter les nouvelles actions
        this.actions.forEach(action => {
          // Si l'action est déjà un élément HTML, l'ajouter directement
          if (action instanceof HTMLElement) {
            actionsContainer.insertBefore(action, collapseButton);
            return;
          }
          
          // Si l'action utilise le composant Button
          if (window.components && window.components.Button && action.type) {
            const buttonConfig = {
              ...action,
              size: action.size || 'small',
              isIconOnly: action.isIconOnly !== false && action.icon
            };
            
            const button = new window.components.Button(buttonConfig);
            actionsContainer.insertBefore(button.render(), collapseButton);
          } else {
            // Créer un bouton standard
            const button = document.createElement('button');
            button.className = `btn btn-${action.type || 'outline'} btn-small`;
            
            if (action.icon) {
              const iconSpan = document.createElement('span');
              iconSpan.className = `icon icon-${action.icon}`;
              button.appendChild(iconSpan);
            }
            
            if (action.text && (!action.icon || !action.isIconOnly)) {
              const textSpan = document.createElement('span');
              textSpan.textContent = action.text;
              button.appendChild(textSpan);
            }
            
            if (action.onClick && typeof action.onClick === 'function') {
              button.addEventListener('click', action.onClick);
            }
            
            actionsContainer.insertBefore(button, collapseButton);
          }
        });
      } else if (this.actions.length > 0 || this.collapsible) {
        // Créer un nouveau header si nécessaire
        this.headerElement = this._createHeader();
        
        if (this.element.firstChild) {
          this.element.insertBefore(this.headerElement, this.element.firstChild);
        } else {
          this.element.appendChild(this.headerElement);
        }
      }
    }
  
    /**
     * Ajoute une classe CSS à la carte
     * @param {string} className - Classe à ajouter
     */
    addClass(className) {
      if (this.element) {
        this.element.classList.add(className);
      }
    }
  
    /**
     * Supprime une classe CSS de la carte
     * @param {string} className - Classe à supprimer
     */
    removeClass(className) {
      if (this.element) {
        this.element.classList.remove(className);
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      if (this.element) {
        // Supprimer les écouteurs d'événements
        const buttons = this.element.querySelectorAll('button');
        buttons.forEach(button => {
          const newButton = button.cloneNode(true);
          if (button.parentNode) {
            button.parentNode.replaceChild(newButton, button);
          }
        });
        
        // Supprimer l'élément
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.footerElement = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Card = Card;