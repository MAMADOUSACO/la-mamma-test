/**
 * Composant Alert - Message d'alerte ou de notification
 * 
 * Utilisation:
 * const alert = new Alert({
 *   type: 'success',
 *   title: 'Succès',
 *   message: 'Opération réussie',
 *   dismissible: true
 * });
 * container.appendChild(alert.render());
 */

class Alert {
    /**
     * Constructeur
     * @param {Object} options - Options de l'alerte
     * @param {string} options.type - Type d'alerte (success, warning, error, info)
     * @param {string} options.title - Titre de l'alerte
     * @param {string} options.message - Message de l'alerte
     * @param {boolean} options.dismissible - Si l'alerte peut être fermée
     * @param {Function} options.onDismiss - Fonction de rappel lors de la fermeture
     * @param {boolean} options.icon - Afficher une icône
     * @param {number} options.autoDismiss - Fermeture auto après X millisecondes
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     */
    constructor(options = {}) {
      this.type = options.type || 'info';
      this.title = options.title || '';
      this.message = options.message || '';
      this.dismissible = options.dismissible !== false;
      this.onDismiss = options.onDismiss || null;
      this.icon = options.icon !== false;
      this.autoDismiss = options.autoDismiss || 0;
      this.className = options.className || '';
      this.id = options.id || 'alert-' + Date.now();
      
      this.element = null;
      this.dismissTimer = null;
    }
  
    /**
     * Rend le composant d'alerte
     * @returns {HTMLElement} - Élément d'alerte
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
      
      // Créer le contenu de l'alerte
      const content = document.createElement('div');
      content.className = 'alert-content';
      
      // Ajouter l'icône si demandée
      if (this.icon) {
        const iconElement = document.createElement('div');
        iconElement.className = 'alert-icon';
        
        // Récupérer l'icône appropriée
        iconElement.innerHTML = this._getIconHtml();
        
        content.appendChild(iconElement);
      }
      
      // Créer le texte de l'alerte
      const textElement = document.createElement('div');
      textElement.className = 'alert-text';
      
      // Ajouter le titre si spécifié
      if (this.title) {
        const titleElement = document.createElement('div');
        titleElement.className = 'alert-title';
        titleElement.textContent = this.title;
        textElement.appendChild(titleElement);
      }
      
      // Ajouter le message
      const messageElement = document.createElement('div');
      messageElement.className = 'alert-message';
      
      if (typeof this.message === 'string') {
        messageElement.textContent = this.message;
      } else if (this.message instanceof HTMLElement) {
        messageElement.appendChild(this.message);
      }
      
      textElement.appendChild(messageElement);
      content.appendChild(textElement);
      
      this.element.appendChild(content);
      
      // Ajouter le bouton de fermeture si demandé
      if (this.dismissible) {
        const closeButton = document.createElement('button');
        closeButton.className = 'alert-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Fermer');
        closeButton.innerHTML = '&times;';
        
        closeButton.addEventListener('click', () => {
          this.dismiss();
        });
        
        this.element.appendChild(closeButton);
      }
      
      // Si auto-dismiss est activé, configurer le timer
      if (this.autoDismiss > 0) {
        this._setupAutoDismiss();
      }
      
      return this.element;
    }
  
    /**
     * Récupère le code HTML de l'icône selon le type d'alerte
     * @returns {string} - Code HTML de l'icône
     * @private
     */
    _getIconHtml() {
      // Essayer d'utiliser le composant Button pour récupérer l'icône
      if (window.components && window.components.Button) {
        let iconName;
        
        switch (this.type) {
          case 'success':
            iconName = 'check';
            break;
          case 'warning':
            iconName = 'warning';
            break;
          case 'error':
            iconName = 'error';
            break;
          case 'info':
          default:
            iconName = 'info';
            break;
        }
        
        const tempButton = new window.components.Button({ icon: iconName, isIconOnly: true });
        const tempElement = tempButton.render();
        const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
        
        if (iconWrapper) {
          return iconWrapper.innerHTML;
        }
      }
      
      // Fallback: icônes SVG directement
      switch (this.type) {
        case 'success':
          return `
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          `;
        case 'warning':
          return `
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          `;
        case 'error':
          return `
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          `;
        case 'info':
        default:
          return `
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          `;
      }
    }
  
    /**
     * Configure la fermeture automatique
     * @private
     */
    _setupAutoDismiss() {
      // Annuler le timer existant si présent
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
      }
      
      // Mettre en place le nouveau timer
      this.dismissTimer = setTimeout(() => {
        this.dismiss();
      }, this.autoDismiss);
      
      // Mettre en pause le timer lorsque la souris est sur l'alerte
      if (this.element) {
        this.element.addEventListener('mouseenter', () => {
          if (this.dismissTimer) {
            clearTimeout(this.dismissTimer);
            this.dismissTimer = null;
          }
        });
        
        this.element.addEventListener('mouseleave', () => {
          if (!this.dismissTimer && this.autoDismiss > 0) {
            this.dismissTimer = setTimeout(() => {
              this.dismiss();
            }, this.autoDismiss);
          }
        });
      }
    }
  
    /**
     * Supprime l'alerte
     */
    dismiss() {
      if (this.element) {
        // Annuler le timer de fermeture automatique
        if (this.dismissTimer) {
          clearTimeout(this.dismissTimer);
          this.dismissTimer = null;
        }
        
        // Ajouter une classe pour l'animation de sortie
        this.element.classList.add('alert-dismissing');
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
          if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
            
            // Appeler le callback onDismiss
            if (this.onDismiss && typeof this.onDismiss === 'function') {
              this.onDismiss();
            }
          }
        }, 300); // Durée de l'animation
      }
    }
  
    /**
     * Met à jour le message de l'alerte
     * @param {string|HTMLElement} message - Nouveau message
     */
    updateMessage(message) {
      this.message = message;
      
      if (this.element) {
        const messageElement = this.element.querySelector('.alert-message');
        
        if (messageElement) {
          // Vider l'élément
          messageElement.innerHTML = '';
          
          // Ajouter le nouveau message
          if (typeof message === 'string') {
            messageElement.textContent = message;
          } else if (message instanceof HTMLElement) {
            messageElement.appendChild(message);
          }
        }
      }
    }
  
    /**
     * Met à jour le titre de l'alerte
     * @param {string} title - Nouveau titre
     */
    updateTitle(title) {
      this.title = title;
      
      if (this.element) {
        let titleElement = this.element.querySelector('.alert-title');
        
        if (title) {
          if (titleElement) {
            // Mettre à jour le titre existant
            titleElement.textContent = title;
          } else {
            // Créer un nouvel élément titre
            titleElement = document.createElement('div');
            titleElement.className = 'alert-title';
            titleElement.textContent = title;
            
            // Insérer avant le message
            const messageElement = this.element.querySelector('.alert-message');
            if (messageElement && messageElement.parentNode) {
              messageElement.parentNode.insertBefore(titleElement, messageElement);
            }
          }
        } else if (titleElement && titleElement.parentNode) {
          // Supprimer le titre s'il existe et que le nouveau titre est vide
          titleElement.parentNode.removeChild(titleElement);
        }
      }
    }
  
    /**
     * Change le type de l'alerte
     * @param {string} type - Nouveau type (success, warning, error, info)
     */
    setType(type) {
      if (['success', 'warning', 'error', 'info'].includes(type)) {
        this.type = type;
        
        if (this.element) {
          // Mettre à jour la classe de type
          this.element.className = this.element.className.replace(/alert-\w+/, `alert-${type}`);
          
          // Mettre à jour l'icône si présente
          const iconElement = this.element.querySelector('.alert-icon');
          if (iconElement) {
            iconElement.innerHTML = this._getIconHtml();
          }
        }
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      // Annuler le timer de fermeture automatique
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
      }
      
      if (this.element) {
        // Supprimer tous les écouteurs d'événements en remplaçant les éléments
        const closeBtn = this.element.querySelector('.alert-close');
        if (closeBtn) {
          const newCloseBtn = closeBtn.cloneNode(true);
          closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        }
        
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