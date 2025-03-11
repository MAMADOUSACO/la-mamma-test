/**
 * Composant Button - Bouton interactif
 * 
 * Utilisation:
 * const button = new Button({
 *   text: 'Cliquez-moi',
 *   type: 'primary',
 *   icon: 'plus',
 *   onClick: () => alert('Clic !')
 * });
 * container.appendChild(button.render());
 */

class Button {
    /**
     * Constructeur
     * @param {Object} options - Options du bouton
     * @param {string} options.text - Texte du bouton
     * @param {string} options.type - Type de bouton (primary, secondary, outline, danger)
     * @param {string} options.icon - Nom de l'icône à afficher
     * @param {string} options.size - Taille du bouton (small, medium, large)
     * @param {string} options.className - Classes CSS additionnelles
     * @param {Function} options.onClick - Fonction de rappel au clic
     * @param {boolean} options.disabled - Si le bouton est désactivé
     * @param {string} options.title - Texte d'infobulle
     * @param {boolean} options.isIconOnly - Si le bouton affiche uniquement une icône
     * @param {boolean} options.rounded - Si le bouton doit être arrondi (style circulaire)
     * @param {boolean} options.submit - Si le bouton est de type submit
     * @param {string} options.id - ID du bouton
     */
    constructor(options = {}) {
      this.text = options.text || '';
      this.type = options.type || 'primary';
      this.icon = options.icon || null;
      this.size = options.size || 'medium';
      this.className = options.className || '';
      this.onClick = options.onClick || null;
      this.disabled = options.disabled || false;
      this.title = options.title || '';
      this.isIconOnly = options.isIconOnly || false;
      this.rounded = options.rounded || false;
      this.submit = options.submit || false;
      this.id = options.id || '';
      
      this.element = null;
    }
  
    /**
     * Rend le bouton
     * @returns {HTMLElement} - Élément bouton
     */
    render() {
      // Créer l'élément bouton
      this.element = document.createElement('button');
      
      // Définir le type
      this.element.type = this.submit ? 'submit' : 'button';
      
      // Définir l'ID si fourni
      if (this.id) {
        this.element.id = this.id;
      }
      
      // Définir les classes CSS
      this._applyClasses();
      
      // Définir le contenu
      this._setContent();
      
      // Définir l'état désactivé
      if (this.disabled) {
        this.element.disabled = true;
      }
      
      // Définir le titre (infobulle)
      if (this.title) {
        this.element.title = this.title;
      }
      
      // Attacher les gestionnaires d'événements
      this._attachEventListeners();
      
      return this.element;
    }
  
    /**
     * Applique les classes CSS au bouton
     * @private
     */
    _applyClasses() {
      // Classe de base
      this.element.className = 'btn';
      
      // Classe de type
      if (this.type) {
        this.element.classList.add(`btn-${this.type}`);
      }
      
      // Classe de taille
      if (this.size) {
        this.element.classList.add(`btn-${this.size}`);
      }
      
      // Bouton avec icône seule
      if (this.isIconOnly) {
        this.element.classList.add('btn-icon');
      }
      
      // Bouton arrondi
      if (this.rounded) {
        this.element.classList.add('btn-rounded');
      }
      
      // Classes additionnelles
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
    }
  
    /**
     * Définit le contenu du bouton
     * @private
     */
    _setContent() {
      // Si le bouton contient une icône
      if (this.icon) {
        const iconElement = this._createIconElement();
        this.element.appendChild(iconElement);
      }
      
      // Si le bouton contient du texte (et n'est pas un bouton icône seulement)
      if (this.text && !this.isIconOnly) {
        const textElement = document.createElement('span');
        textElement.textContent = this.text;
        
        // Ajouter une classe d'espacement si une icône est présente
        if (this.icon) {
          textElement.classList.add('btn-text');
        }
        
        this.element.appendChild(textElement);
      }
    }
  
    /**
     * Crée un élément d'icône
     * @returns {HTMLElement} - Élément d'icône
     * @private
     */
    _createIconElement() {
      const iconElement = document.createElement('span');
      iconElement.className = 'btn-icon-wrapper';
      
      // Utiliser des icônes SVG intégrées
      const iconSvg = this._getIconSvg();
      
      if (iconSvg) {
        iconElement.innerHTML = iconSvg;
      } else {
        // Fallback: utiliser une classe d'icône
        iconElement.classList.add('icon', `icon-${this.icon}`);
      }
      
      return iconElement;
    }
  
    /**
     * Récupère le code SVG pour l'icône
     * @returns {string} - Code SVG de l'icône
     * @private
     */
    _getIconSvg() {
      // Dictionnaire d'icônes SVG communes
      const icons = {
        plus: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
        
        minus: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>',
        
        edit: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
        
        delete: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
        
        save: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
        
        search: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
        
        close: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        
        check: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        
        info: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
        
        warning: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
        
        menu: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
        
        calendar: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>',
        
        receipt: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"/></svg>',
        
        shopping_cart: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>',
        
        home: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
        
        settings: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
        
        person: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
      };
      
      return icons[this.icon] || null;
    }
  
    /**
     * Attache les gestionnaires d'événements
     * @private
     */
    _attachEventListeners() {
      if (this.onClick && typeof this.onClick === 'function') {
        this.element.addEventListener('click', (event) => {
          if (!this.disabled) {
            this.onClick(event);
          }
        });
      }
      
      // Ajout d'un effet visuel au clic (retour tactile)
      this.element.addEventListener('touchstart', () => {
        if (!this.disabled) {
          this.element.classList.add('btn-pressed');
        }
      });
      
      this.element.addEventListener('touchend', () => {
        this.element.classList.remove('btn-pressed');
      });
      
      this.element.addEventListener('touchcancel', () => {
        this.element.classList.remove('btn-pressed');
      });
    }
  
    /**
     * Active ou désactive le bouton
     * @param {boolean} disabled - État désactivé
     */
    setDisabled(disabled) {
      this.disabled = disabled;
      
      if (this.element) {
        this.element.disabled = disabled;
      }
    }
  
    /**
     * Change le texte du bouton
     * @param {string} text - Nouveau texte
     */
    setText(text) {
      this.text = text;
      
      if (this.element) {
        // Supprimer tout le contenu
        this.element.innerHTML = '';
        
        // Redéfinir le contenu
        this._setContent();
      }
    }
  
    /**
     * Simule un clic sur le bouton
     */
    click() {
      if (this.element && !this.disabled) {
        this.element.click();
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      if (this.element) {
        // Supprimer tous les écouteurs d'événements
        this.element.replaceWith(this.element.cloneNode(true));
        this.element = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Button = Button;