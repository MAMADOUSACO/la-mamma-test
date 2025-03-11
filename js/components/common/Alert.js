/**
 * Composant Alert - Message d'alerte ou de notification
 * 
 * Utilisation:
 * const alert = new Alert({
 *   type: 'info',
 *   message: 'Ceci est une information importante',
 *   dismissible: true
 * });
 * container.appendChild(alert.render());
 */

class Alert {
    /**
     * Constructeur
     * @param {Object} options - Options de l'alerte
     * @param {string} options.type - Type d'alerte (info, success, warning, error)
     * @param {string|HTMLElement} options.message - Message de l'alerte
     * @param {string} options.title - Titre de l'alerte
     * @param {boolean} options.dismissible - Si l'alerte peut être fermée
     * @param {Function} options.onDismiss - Fonction appelée à la fermeture
     * @param {number} options.autoClose - Durée avant fermeture auto (ms), 0 pour désactiver
     * @param {boolean} options.icon - Afficher l'icône
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     */
    constructor(options = {}) {
      this.type = options.type || 'info';
      this.message = options.message || '';
      this.title = options.title || '';
      this.dismissible = options.dismissible !== false;
      this.onDismiss = options.onDismiss || null;
      this.autoClose = options.autoClose || 0;
      this.icon = options.icon !== false;
      this.className = options.className || '';
      this.id = options.id || 'alert-' + Date.now();
      
      this.element = null;
      this.autoCloseTimer = null;
    }
  
    /**
     * Rend l'alerte
     * @returns {HTMLElement} - Élément de l'alerte
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = `alert alert-${this.type}`;
      this.element.id = this.id;
      this.element.setAttribute('role', 'alert');
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      // Contenu de l'alerte
      let content = '';
      
      // Ajouter l'icône si nécessaire
      if (this.icon) {
        content += this._getIconHtml();
      }
      
      // Contenu principal
      content += '<div class="alert-content">';
      
      // Ajouter le titre si nécessaire
      if (this.title) {
        content += `<div class="alert-title">${this.title}</div>`;
      }
      
      // Ajouter le message
      content += '<div class="alert-message">';
      if (typeof this.message === 'string') {
        content += this.message;
      }
      content += '</div>';
      
      content += '</div>';
      
      // Ajouter le bouton de fermeture si dismissible
      if (this.dismissible) {
        content += '<button class="alert-close" aria-label="Fermer">&times;</button>';
      }
      
      this.element.innerHTML = content;
      
      // Si le message est un élément HTML, l'ajouter après le rendu initial
      if (this.message instanceof HTMLElement) {
        const messageContainer = this.element.querySelector('.alert-message');
        messageContainer.innerHTML = '';
        messageContainer.appendChild(this.message);
      }
      
      // Attacher les écouteurs d'événements
      this._attachEventListeners();
      
      // Configurer la fermeture automatique si nécessaire
      if (this.autoClose && this.autoClose > 0) {
        this._setAutoClose();
      }
      
      return this.element;
    }
  
    /**
     * Récupère le HTML de l'icône
     * @returns {string} - HTML de l'icône
     * @private
     */
    _getIconHtml() {
      let icon = '';
      
      // Déterminer l'icône en fonction du type
      switch (this.type) {
        case 'success':
          icon = 'check';
          break;
          
        case 'warning':
          icon = 'warning';
          break;
          
        case 'error':
          icon = 'error';
          break;
          
        case 'info':
        default:
          icon = 'info';
          break;
      }
      
      // Utiliser le composant Button pour récupérer l'icône
      if (window.components.Button) {
        const tempButton = new window.components.Button({ icon, isIconOnly: true });
        const tempElement = tempButton.render();
        const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
        
        if (iconWrapper) {
          return `<div class="alert-icon">${iconWrapper.innerHTML}</div>`;
        }
      }
      
      // Fallback avec des icônes SVG basiques
      let svgIcon = '';
      
      switch (this.type) {
        case 'success':
          svgIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
          break;
          
        case 'warning':
          svgIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
          break;
          
        case 'error':
          svgIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
          break;
          
        case 'info':
        default:
          svgIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
          break;
      }
      
      return `<div class="alert-icon">${svgIcon}</div>`;
    }
  
    /**
     * Attache les écouteurs d'événements
     * @private
     */
    _attachEventListeners() {
      if (this.dismissible) {
        const closeButton = this.element.querySelector('.alert-close');
        
        if (closeButton) {
          closeButton.addEventListener('click', () => {
            this.dismiss();
          });
        }
      }
    }
  
    /**
     * Configure la fermeture automatique
     * @private
     */
    _setAutoClose() {
      this.autoCloseTimer = setTimeout(() => {
        this.dismiss();
      }, this.autoClose);
    }
  
    /**
     * Ferme l'alerte
     */
    dismiss() {
      if (!this.element) return;
      
      // Annuler le timer de fermeture automatique
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = null;
      }
      
      // Ajouter une classe pour l'animation de sortie
      this.element.classList.add('alert-dismiss');
      
      // Supprimer l'élément après l'animation
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        
        // Appeler le callback onDismiss
        if (this.onDismiss && typeof this.onDismiss === 'function') {
          this.onDismiss();
        }
        
        this.element = null;
      }, 300); // Durée de l'animation
    }
  
    /**
     * Met à jour le message de l'alerte
     * @param {string|HTMLElement} message - Nouveau message
     */
    setMessage(message) {
      this.message = message;
      
      if (this.element) {
        const messageContainer = this.element.querySelector('.alert-message');
        
        if (messageContainer) {
          messageContainer.innerHTML = '';
          
          if (typeof message === 'string') {
            messageContainer.textContent = message;
          } else if (message instanceof HTMLElement) {
            messageContainer.appendChild(message);
          }
        }
      }
    }
  
    /**
     * Met à jour le type de l'alerte
     * @param {string} type - Nouveau type
     */
    setType(type) {
      // Supprimer l'ancienne classe de type
      if (this.element) {
        this.element.classList.remove(`alert-${this.type}`);
      }
      
      this.type = type;
      
      if (this.element) {
        // Ajouter la nouvelle classe de type
        this.element.classList.add(`alert-${this.type}`);
        
        // Mettre à jour l'icône si elle est affichée
        if (this.icon) {
          const iconContainer = this.element.querySelector('.alert-icon');
          
          if (iconContainer) {
            iconContainer.innerHTML = this._getIconHtml().replace('<div class="alert-icon">', '').replace('</div>', '');
          }
        }
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      // Annuler le timer de fermeture automatique
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = null;
      }
      
      if (this.element) {
        // Supprimer les écouteurs d'événements
        const closeButton = this.element.querySelector('.alert-close');
        
        if (closeButton) {
          closeButton.replaceWith(closeButton.cloneNode(true));
        }
        
        // Supprimer l'élément du DOM
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Alert = Alert;