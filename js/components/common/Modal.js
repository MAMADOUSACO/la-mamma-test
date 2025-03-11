/**
 * Composant Modal - Fenêtre modale
 * 
 * Utilisation:
 * const modal = new Modal({
 *   title: 'Titre de la modale',
 *   content: 'Contenu de la modale',
 *   onClose: () => console.log('Modale fermée')
 * });
 * modal.open();
 */

class Modal {
    /**
     * Constructeur
     * @param {Object} options - Options de la modale
     * @param {string|HTMLElement} options.title - Titre de la modale
     * @param {string|HTMLElement} options.content - Contenu de la modale
     * @param {string} options.size - Taille de la modale (small, medium, large, fullscreen)
     * @param {Function} options.onOpen - Fonction appelée à l'ouverture
     * @param {Function} options.onClose - Fonction appelée à la fermeture
     * @param {boolean} options.closeOnEscape - Fermeture avec la touche Echap
     * @param {boolean} options.closeOnOverlayClick - Fermeture au clic sur l'overlay
     * @param {boolean} options.showClose - Afficher le bouton de fermeture
     * @param {Array} options.buttons - Boutons à afficher dans le footer
     * @param {boolean} options.showFooter - Afficher le footer
     * @param {boolean} options.closeButton - Configuration du bouton de fermeture
     * @param {string} options.position - Position de la modale (center, top, bottom)
     * @param {string} options.id - ID de la modale
     */
    constructor(options = {}) {
      this.title = options.title || '';
      this.content = options.content || '';
      this.size = options.size || 'medium';
      this.onOpen = options.onOpen || null;
      this.onClose = options.onClose || null;
      this.closeOnEscape = options.closeOnEscape !== false;
      this.closeOnOverlayClick = options.closeOnOverlayClick !== false;
      this.showClose = options.showClose !== false;
      this.buttons = options.buttons || [];
      this.showFooter = options.showFooter !== false;
      this.position = options.position || 'center';
      this.id = options.id || 'modal-' + Date.now();
      
      this.element = null;
      this.overlay = null;
      this.modalContent = null;
      this.isOpen = false;
      this.closeButton = options.closeButton || {
        text: 'Fermer',
        type: 'outline'
      };
      
      this.keyDownHandler = this._handleKeyDown.bind(this);
    }
  
    /**
     * Rend la modale
     * @returns {HTMLElement} - Élément modale
     */
    render() {
      // Créer l'overlay
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      
      // Créer le conteneur de la modale
      this.element = document.createElement('div');
      this.element.className = `modal modal-${this.size} modal-${this.position}`;
      this.element.id = this.id;
      
      // Créer le contenu de la modale
      this.modalContent = document.createElement('div');
      this.modalContent.className = 'modal-content';
      
      // Créer l'en-tête
      const header = this._createHeader();
      
      // Créer le corps
      const body = this._createBody();
      
      // Créer le pied de page
      const footer = this._createFooter();
      
      // Assembler la modale
      this.modalContent.appendChild(header);
      this.modalContent.appendChild(body);
      
      if (this.showFooter) {
        this.modalContent.appendChild(footer);
      }
      
      this.element.appendChild(this.modalContent);
      
      // Ajouter la modale à l'overlay
      this.overlay.appendChild(this.element);
      
      // Attacher les gestionnaires d'événements
      this._attachEventListeners();
      
      return this.overlay;
    }
  
    /**
     * Crée l'en-tête de la modale
     * @returns {HTMLElement} - En-tête
     * @private
     */
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'modal-header';
      
      // Titre
      const title = document.createElement('h2');
      title.className = 'modal-title';
      
      if (typeof this.title === 'string') {
        title.textContent = this.title;
      } else if (this.title instanceof HTMLElement) {
        title.appendChild(this.title);
      }
      
      header.appendChild(title);
      
      // Bouton de fermeture
      if (this.showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Fermer');
        
        closeBtn.addEventListener('click', () => this.close());
        
        header.appendChild(closeBtn);
      }
      
      return header;
    }
  
    /**
     * Crée le corps de la modale
     * @returns {HTMLElement} - Corps
     * @private
     */
    _createBody() {
      const body = document.createElement('div');
      body.className = 'modal-body';
      
      if (typeof this.content === 'string') {
        body.innerHTML = this.content;
      } else if (this.content instanceof HTMLElement) {
        body.appendChild(this.content);
      }
      
      return body;
    }
  
    /**
     * Crée le pied de page de la modale
     * @returns {HTMLElement} - Pied de page
     * @private
     */
    _createFooter() {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';
      
      // Ajouter les boutons personnalisés
      if (Array.isArray(this.buttons) && this.buttons.length > 0) {
        this.buttons.forEach(buttonConfig => {
          const Button = window.components.Button;
          
          if (Button) {
            const button = new Button(buttonConfig);
            footer.appendChild(button.render());
          } else {
            // Fallback si le composant Button n'est pas disponible
            const button = document.createElement('button');
            button.className = `btn btn-${buttonConfig.type || 'primary'}`;
            button.textContent = buttonConfig.text || 'Bouton';
            
            if (buttonConfig.onClick) {
              button.addEventListener('click', buttonConfig.onClick);
            }
            
            footer.appendChild(button);
          }
        });
      } else {
        // Bouton de fermeture par défaut
        const Button = window.components.Button;
        
        if (Button) {
          const closeButtonConfig = {
            ...this.closeButton,
            onClick: () => this.close()
          };
          
          const closeBtn = new Button(closeButtonConfig);
          footer.appendChild(closeBtn.render());
        } else {
          // Fallback
          const closeBtn = document.createElement('button');
          closeBtn.className = `btn btn-${this.closeButton.type || 'outline'}`;
          closeBtn.textContent = this.closeButton.text || 'Fermer';
          closeBtn.addEventListener('click', () => this.close());
          
          footer.appendChild(closeBtn);
        }
      }
      
      return footer;
    }
  
    /**
     * Attache les gestionnaires d'événements
     * @private
     */
    _attachEventListeners() {
      // Fermeture au clic sur l'overlay
      if (this.closeOnOverlayClick) {
        this.overlay.addEventListener('click', (event) => {
          if (event.target === this.overlay) {
            this.close();
          }
        });
      }
    }
  
    /**
     * Gère les événements clavier
     * @param {KeyboardEvent} event - Événement clavier
     * @private
     */
    _handleKeyDown(event) {
      if (this.closeOnEscape && event.key === 'Escape') {
        this.close();
      }
    }
  
    /**
     * Ouvre la modale
     */
    open() {
      if (this.isOpen) return;
      
      // Rendre la modale si ce n'est pas déjà fait
      if (!this.element) {
        this.render();
      }
      
      // Ajouter au DOM
      document.body.appendChild(this.overlay);
      
      // Empêcher le défilement du body
      document.body.style.overflow = 'hidden';
      
      // Ajouter l'écouteur d'événement pour Escape
      document.addEventListener('keydown', this.keyDownHandler);
      
      // Ajouter la classe active après un délai pour l'animation
      setTimeout(() => {
        this.overlay.classList.add('active');
        this.element.classList.add('active');
      }, 10);
      
      this.isOpen = true;
      
      // Appeler le callback onOpen
      if (this.onOpen && typeof this.onOpen === 'function') {
        this.onOpen();
      }
    }
  
    /**
     * Ferme la modale
     */
    close() {
      if (!this.isOpen) return;
      
      // Retirer les classes active pour l'animation
      this.overlay.classList.remove('active');
      this.element.classList.remove('active');
      
      // Retirer l'écouteur d'événement pour Escape
      document.removeEventListener('keydown', this.keyDownHandler);
      
      // Supprimer du DOM après l'animation
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Rétablir le défilement du body
        document.body.style.overflow = '';
        
        this.isOpen = false;
        
        // Appeler le callback onClose
        if (this.onClose && typeof this.onClose === 'function') {
          this.onClose();
        }
      }, 300); // Durée de l'animation
    }
  
    /**
     * Met à jour le contenu de la modale
     * @param {string|HTMLElement} content - Nouveau contenu
     */
    setContent(content) {
      this.content = content;
      
      if (this.element) {
        const body = this.modalContent.querySelector('.modal-body');
        
        if (body) {
          // Vider le corps
          body.innerHTML = '';
          
          // Ajouter le nouveau contenu
          if (typeof content === 'string') {
            body.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            body.appendChild(content);
          }
        }
      }
    }
  
    /**
     * Met à jour le titre de la modale
     * @param {string|HTMLElement} title - Nouveau titre
     */
    setTitle(title) {
      this.title = title;
      
      if (this.element) {
        const titleElement = this.modalContent.querySelector('.modal-title');
        
        if (titleElement) {
          // Vider le titre
          titleElement.innerHTML = '';
          
          // Ajouter le nouveau titre
          if (typeof title === 'string') {
            titleElement.textContent = title;
          } else if (title instanceof HTMLElement) {
            titleElement.appendChild(title);
          }
        }
      }
    }
  
    /**
     * Met à jour les boutons de la modale
     * @param {Array} buttons - Nouveaux boutons
     */
    setButtons(buttons) {
      this.buttons = buttons;
      
      if (this.element) {
        const footer = this.modalContent.querySelector('.modal-footer');
        
        if (footer) {
          // Vider le footer
          footer.innerHTML = '';
          
          // Créer un nouveau footer
          const newFooter = this._createFooter();
          
          // Remplacer l'ancien footer
          footer.parentNode.replaceChild(newFooter, footer);
        }
      }
    }
  
    /**
     * Détruit la modale et ses écouteurs d'événements
     */
    destroy() {
      if (this.isOpen) {
        this.close();
      }
      
      // Supprimer les écouteurs d'événements
      if (this.overlay) {
        const clonedOverlay = this.overlay.cloneNode(true);
        if (this.overlay.parentNode) {
          this.overlay.parentNode.replaceChild(clonedOverlay, this.overlay);
        }
      }
      
      document.removeEventListener('keydown', this.keyDownHandler);
      
      this.element = null;
      this.overlay = null;
      this.modalContent = null;
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Modal = Modal;