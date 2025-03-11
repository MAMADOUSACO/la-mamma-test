/**
 * Composant Modal - Fenêtre modale
 * Fichier: js/components/common/Modal.js
 */

class Modal {
  /**
   * Constructeur du composant Modal
   * @param {Object} options - Options de configuration
   * @param {string} options.title - Titre de la modale
   * @param {string|HTMLElement} options.content - Contenu de la modale
   * @param {Array} options.buttons - Boutons de la modale
   * @param {string} options.size - Taille de la modale (small, medium, large, fullscreen)
   * @param {boolean} options.closeOnEscape - Si true, ferme la modale avec la touche Echap
   * @param {boolean} options.closeOnClickOutside - Si true, ferme la modale en cliquant à l'extérieur
   * @param {boolean} options.showClose - Si true, affiche un bouton de fermeture dans l'en-tête
   * @param {boolean} options.centered - Si true, centre la modale verticalement
   * @param {boolean} options.scrollable - Si true, permet le défilement du contenu
   * @param {string} options.className - Classes CSS additionnelles
   * @param {Function} options.onShow - Callback lors de l'ouverture de la modale
   * @param {Function} options.onHide - Callback lors de la fermeture de la modale
   * @param {Function} options.onAction - Callback lors du clic sur un bouton
   */
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.buttons = options.buttons || [];
    this.size = options.size || 'medium';
    this.closeOnEscape = options.closeOnEscape !== undefined ? options.closeOnEscape : true;
    this.closeOnClickOutside = options.closeOnClickOutside !== undefined ? options.closeOnClickOutside : false;
    this.showClose = options.showClose !== undefined ? options.showClose : true;
    this.centered = options.centered !== undefined ? options.centered : true;
    this.scrollable = options.scrollable !== undefined ? options.scrollable : true;
    this.className = options.className || '';
    this.onShow = options.onShow || (() => {});
    this.onHide = options.onHide || (() => {});
    this.onAction = options.onAction || (() => {});
    
    this.element = null;
    this.modalElement = null;
    this.headerElement = null;
    this.bodyElement = null;
    this.footerElement = null;
    this.closeButton = null;
    this.escapeHandler = null;
    this.outsideClickHandler = null;
    this.isOpen = false;
  }

  /**
   * Génère et retourne l'élément HTML de la modale
   * @returns {HTMLElement} L'élément de la modale
   */
  render() {
    // Créer l'élément principal (overlay)
    this.element = document.createElement('div');
    this.element.className = `modal-overlay ${this.className}`;
    
    // Créer l'élément de la modale
    this.modalElement = document.createElement('div');
    this.modalElement.className = `modal modal-${this.size} ${this.centered ? 'modal-centered' : ''}`;
    
    // Créer l'en-tête si un titre est fourni ou si le bouton de fermeture est affiché
    if (this.title || this.showClose) {
      this._createHeader();
    }
    
    // Créer le corps de la modale
    this._createBody();
    
    // Créer le pied si des boutons sont définis
    if (this.buttons.length > 0) {
      this._createFooter();
    }
    
    // Ajouter la modale à l'overlay
    this.element.appendChild(this.modalElement);
    
    return this.element;
  }
  
  /**
   * Ouvre la modale
   * @returns {Modal} L'instance courante pour chaînage
   */
  open() {
    if (this.isOpen) return this;
    
    // Créer l'élément s'il n'existe pas
    if (!this.element) {
      this.render();
    }
    
    // Ajouter au document
    document.body.appendChild(this.element);
    
    // Ajouter la classe pour l'animation d'ouverture
    setTimeout(() => {
      this.element.classList.add('show');
    }, 10);
    
    // Empêcher le défilement de la page
    document.body.classList.add('modal-open');
    
    // Ajouter les gestionnaires d'événements
    this._bindEvents();
    
    this.isOpen = true;
    
    // Exécuter le callback
    this.onShow();
    
    return this;
  }
  
  /**
   * Ferme la modale
   * @returns {Modal} L'instance courante pour chaînage
   */
  close() {
    if (!this.isOpen || !this.element) return this;
    
    // Supprimer la classe pour l'animation de fermeture
    this.element.classList.remove('show');
    
    // Attendre la fin de l'animation avant de supprimer l'élément
    setTimeout(() => {
      // Supprimer du document
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Permettre le défilement de la page
      const otherModals = document.querySelector('.modal-overlay.show');
      if (!otherModals) {
        document.body.classList.remove('modal-open');
      }
      
      // Exécuter le callback
      this.onHide();
    }, 300); // Durée de l'animation
    
    // Supprimer les gestionnaires d'événements
    this._unbindEvents();
    
    this.isOpen = false;
    
    return this;
  }
  
  /**
   * Définit le contenu de la modale
   * @param {string|HTMLElement} content - Nouveau contenu
   * @returns {Modal} L'instance courante pour chaînage
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
    }
    
    return this;
  }
  
  /**
   * Définit le titre de la modale
   * @param {string} title - Nouveau titre
   * @returns {Modal} L'instance courante pour chaînage
   */
  setTitle(title) {
    this.title = title;
    
    if (title) {
      if (this.headerElement) {
        // Mettre à jour le titre existant
        let titleElement = this.headerElement.querySelector('.modal-title');
        if (titleElement) {
          titleElement.textContent = title;
        } else {
          // Créer l'élément titre s'il n'existe pas
          titleElement = document.createElement('h3');
          titleElement.className = 'modal-title';
          titleElement.textContent = title;
          
          // Insérer avant le bouton de fermeture s'il existe
          if (this.closeButton) {
            this.headerElement.insertBefore(titleElement, this.closeButton);
          } else {
            this.headerElement.appendChild(titleElement);
          }
        }
      } else {
        // Créer l'en-tête s'il n'existe pas
        this._createHeader();
      }
    } else if (this.headerElement) {
      // Supprimer le titre
      const titleElement = this.headerElement.querySelector('.modal-title');
      if (titleElement) {
        this.headerElement.removeChild(titleElement);
      }
      
      // Supprimer l'en-tête s'il est vide et qu'il n'y a pas de bouton de fermeture
      if (!this.showClose) {
        this.modalElement.removeChild(this.headerElement);
        this.headerElement = null;
      }
    }
    
    return this;
  }
  
  /**
   * Définit les boutons de la modale
   * @param {Array} buttons - Nouveaux boutons
   * @returns {Modal} L'instance courante pour chaînage
   */
  setButtons(buttons) {
    this.buttons = buttons || [];
    
    if (buttons.length > 0) {
      if (this.footerElement) {
        // Mettre à jour les boutons existants
        this._renderButtons();
      } else {
        // Créer le pied s'il n'existe pas
        this._createFooter();
      }
    } else if (this.footerElement) {
      // Supprimer le pied s'il est vide
      this.modalElement.removeChild(this.footerElement);
      this.footerElement = null;
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Fermer la modale si elle est ouverte
    if (this.isOpen) {
      this.close();
    }
    
    // Nettoyer les écouteurs d'événements
    this._unbindEvents();
    
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this._handleClose);
    }
    
    if (this.footerElement) {
      const buttons = this.footerElement.querySelectorAll('button');
      buttons.forEach(button => {
        button.removeEventListener('click', button._clickHandler);
      });
    }
    
    // Supprimer l'élément du DOM s'il est attaché
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Réinitialiser les références
    this.element = null;
    this.modalElement = null;
    this.headerElement = null;
    this.bodyElement = null;
    this.footerElement = null;
    this.closeButton = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Crée l'en-tête de la modale
   * @private
   */
  _createHeader() {
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'modal-header';
    
    // Ajouter le titre si présent
    if (this.title) {
      const titleElement = document.createElement('h3');
      titleElement.className = 'modal-title';
      titleElement.textContent = this.title;
      this.headerElement.appendChild(titleElement);
    }
    
    // Ajouter le bouton de fermeture si nécessaire
    if (this.showClose) {
      this.closeButton = document.createElement('button');
      this.closeButton.type = 'button';
      this.closeButton.className = 'modal-close';
      this.closeButton.innerHTML = '&times;';
      this.closeButton._handleClose = this.close.bind(this);
      this.closeButton.addEventListener('click', this.closeButton._handleClose);
      
      this.headerElement.appendChild(this.closeButton);
    }
    
    // Ajouter l'en-tête à la modale
    this.modalElement.appendChild(this.headerElement);
  }
  
  /**
   * Crée le corps de la modale
   * @private
   */
  _createBody() {
    this.bodyElement = document.createElement('div');
    this.bodyElement.className = `modal-body ${this.scrollable ? 'modal-scrollable' : ''}`;
    
    // Ajouter le contenu
    if (this.content instanceof HTMLElement) {
      this.bodyElement.appendChild(this.content);
    } else if (typeof this.content === 'string') {
      this.bodyElement.innerHTML = this.content;
    }
    
    // Ajouter le corps à la modale
    this.modalElement.appendChild(this.bodyElement);
  }
  
  /**
   * Crée le pied de la modale
   * @private
   */
  _createFooter() {
    this.footerElement = document.createElement('div');
    this.footerElement.className = 'modal-footer';
    
    // Rendre les boutons
    this._renderButtons();
    
    // Ajouter le pied à la modale
    this.modalElement.appendChild(this.footerElement);
  }
  
  /**
   * Rend les boutons dans le pied de la modale
   * @private
   */
  _renderButtons() {
    if (!this.footerElement) return;
    
    // Vider le pied
    this.footerElement.innerHTML = '';
    
    // Ajouter chaque bouton
    this.buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.type = 'button';
      buttonElement.className = `btn btn-${button.type || 'secondary'} ${button.className || ''}`;
      buttonElement.textContent = button.text || 'Button';
      
      if (button.disabled) {
        buttonElement.disabled = true;
      }
      
      // Gestionnaire de clic
      buttonElement._clickHandler = () => {
        // Exécuter le callback du bouton s'il existe
        if (typeof button.onClick === 'function') {
          button.onClick();
        }
        
        // Exécuter le callback général avec l'ID du bouton
        this.onAction(button.id || button.text);
        
        // Fermer la modale si demandé
        if (button.close) {
          this.close();
        }
      };
      
      buttonElement.addEventListener('click', buttonElement._clickHandler);
      this.footerElement.appendChild(buttonElement);
    });
  }
  
  /**
   * Active les gestionnaires d'événements
   * @private
   */
  _bindEvents() {
    // Gestionnaire pour la touche Echap
    if (this.closeOnEscape) {
      this.escapeHandler = (event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }
    
    // Gestionnaire pour le clic à l'extérieur
    if (this.closeOnClickOutside) {
      this.outsideClickHandler = (event) => {
        if (event.target === this.element) {
          this.close();
        }
      };
      this.element.addEventListener('click', this.outsideClickHandler);
    }
  }
  
  /**
   * Désactive les gestionnaires d'événements
   * @private
   */
  _unbindEvents() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
    
    if (this.outsideClickHandler && this.element) {
      this.element.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }
  
  /**
   * Crée et affiche une modale simple avec un message
   * @param {string} message - Message à afficher
   * @param {string} title - Titre de la modale
   * @param {Object} options - Options de configuration
   * @returns {Modal} Une instance de modale
   * @static
   */
  static alert(message, title = 'Information', options = {}) {
    const modal = new Modal({
      title: title,
      content: message,
      buttons: [
        {
          text: options.buttonText || 'OK',
          type: options.buttonType || 'primary',
          close: true
        }
      ],
      ...options
    });
    
    modal.open();
    
    return modal;
  }
  
  /**
   * Crée et affiche une modale de confirmation
   * @param {string} message - Message à afficher
   * @param {string} title - Titre de la modale
   * @param {Function} onConfirm - Callback lors de la confirmation
   * @param {Function} onCancel - Callback lors de l'annulation
   * @param {Object} options - Options de configuration
   * @returns {Modal} Une instance de modale
   * @static
   */
  static confirm(message, title = 'Confirmation', onConfirm = () => {}, onCancel = () => {}, options = {}) {
    const modal = new Modal({
      title: title,
      content: message,
      buttons: [
        {
          id: 'cancel',
          text: options.cancelText || 'Annuler',
          type: options.cancelType || 'secondary',
          close: true,
          onClick: onCancel
        },
        {
          id: 'confirm',
          text: options.confirmText || 'Confirmer',
          type: options.confirmType || 'primary',
          close: true,
          onClick: onConfirm
        }
      ],
      ...options
    });
    
    modal.open();
    
    return modal;
  }
  
  /**
   * Crée et affiche une modale avec un formulaire
   * @param {HTMLElement} form - Formulaire à afficher
   * @param {string} title - Titre de la modale
   * @param {Function} onSubmit - Callback lors de la soumission
   * @param {Object} options - Options de configuration
   * @returns {Modal} Une instance de modale
   * @static
   */
  static form(form, title = 'Formulaire', onSubmit = () => {}, options = {}) {
    const modal = new Modal({
      title: title,
      content: form,
      buttons: [
        {
          id: 'cancel',
          text: options.cancelText || 'Annuler',
          type: options.cancelType || 'secondary',
          close: true
        },
        {
          id: 'submit',
          text: options.submitText || 'Valider',
          type: options.submitType || 'primary',
          close: false,
          onClick: () => {
            const result = onSubmit();
            
            // Fermer la modale si le callback retourne true
            if (result === true) {
              modal.close();
            }
          }
        }
      ],
      ...options
    });
    
    modal.open();
    
    return modal;
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Modal = Modal;