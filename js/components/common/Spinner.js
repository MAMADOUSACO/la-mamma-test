/**
 * Composant Alert - Messages d'alerte et notifications
 * Fichier: js/components/common/Alert.js
 */

class Alert {
  /**
   * Constructeur du composant Alert
   * @param {Object} options - Options de configuration
   * @param {string} options.type - Type d'alerte (info, success, warning, error)
   * @param {string} options.title - Titre de l'alerte
   * @param {string} options.message - Message de l'alerte
   * @param {boolean} options.dismissible - Si true, l'alerte peut être fermée
   * @param {number} options.duration - Durée d'affichage en ms (0 pour permanent)
   * @param {string} options.icon - Classe CSS de l'icône
   * @param {string} options.position - Position de l'alerte (top, bottom, etc.)
   * @param {Function} options.onDismiss - Callback appelé lors de la fermeture
   * @param {string} options.className - Classes CSS additionnelles
   * @param {boolean} options.showBorder - Si true, affiche une bordure colorée
   */
  constructor(options = {}) {
    this.type = options.type || 'info';
    this.title = options.title || '';
    this.message = options.message || '';
    this.dismissible = options.dismissible !== undefined ? options.dismissible : true;
    this.duration = options.duration || 0; // 0 = pas de fermeture automatique
    this.icon = options.icon || this._getDefaultIcon();
    this.position = options.position || 'default';
    this.onDismiss = options.onDismiss || (() => {});
    this.className = options.className || '';
    this.showBorder = options.showBorder !== undefined ? options.showBorder : true;
    
    this.element = null;
    this.dismissButton = null;
    this.timeoutId = null;
  }

  /**
   * Génère et retourne l'élément HTML de l'alerte
   * @param {HTMLElement} container - Conteneur où ajouter l'alerte (optionnel)
   * @returns {HTMLElement} L'élément de l'alerte
   */
  render(container = null) {
    // Créer l'élément principal
    this.element = document.createElement('div');
    
    // Construire les classes CSS
    let cssClasses = [
      'alert',
      `alert-${this.type}`
    ];
    
    if (this.dismissible) cssClasses.push('alert-dismissible');
    if (this.position !== 'default') cssClasses.push(`alert-${this.position}`);
    if (this.showBorder) cssClasses.push('alert-bordered');
    if (this.className) cssClasses.push(this.className);
    
    this.element.className = cssClasses.join(' ');
    this.element.role = 'alert';
    
    // Créer la structure interne
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'alert-content';
    
    // Ajouter l'icône si présente
    if (this.icon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'alert-icon';
      
      const iconSpan = document.createElement('span');
      iconSpan.className = this.icon;
      iconElement.appendChild(iconSpan);
      
      contentWrapper.appendChild(iconElement);
    }
    
    // Créer le conteneur de texte
    const textElement = document.createElement('div');
    textElement.className = 'alert-text';
    
    // Ajouter le titre si présent
    if (this.title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'alert-title';
      titleElement.textContent = this.title;
      textElement.appendChild(titleElement);
    }
    
    // Ajouter le message
    const messageElement = document.createElement('div');
    messageElement.className = 'alert-message';
    
    // Supporter HTML ou texte simple
    if (this.message.includes('<') && this.message.includes('>')) {
      messageElement.innerHTML = this.message;
    } else {
      messageElement.textContent = this.message;
    }
    
    textElement.appendChild(messageElement);
    contentWrapper.appendChild(textElement);
    
    // Ajouter le bouton de fermeture si dismissible
    if (this.dismissible) {
      this.dismissButton = document.createElement('button');
      this.dismissButton.type = 'button';
      this.dismissButton.className = 'alert-close';
      this.dismissButton.innerHTML = '&times;';
      this.dismissButton.addEventListener('click', this._handleDismiss.bind(this));
      
      this.element.appendChild(this.dismissButton);
    }
    
    this.element.appendChild(contentWrapper);
    
    // Ajouter l'alerte au conteneur spécifié
    if (container) {
      container.appendChild(this.element);
    }
    
    // Configurer la fermeture automatique si nécessaire
    if (this.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
    
    return this.element;
  }
  
  /**
   * Affiche l'alerte dans un conteneur
   * @param {HTMLElement} container - Conteneur où ajouter l'alerte
   * @returns {Alert} L'instance courante pour chaînage
   */
  show(container) {
    if (!this.element) {
      this.render(container);
    } else if (container && !this.element.parentNode) {
      container.appendChild(this.element);
    }
    
    return this;
  }
  
  /**
   * Ferme et supprime l'alerte
   * @param {boolean} runCallback - Si true, exécute le callback onDismiss
   * @returns {Alert} L'instance courante pour chaînage
   */
  dismiss(runCallback = true) {
    // Annuler le timeout de fermeture automatique
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // Ajouter la classe de sortie pour l'animation
    if (this.element) {
      this.element.classList.add('alert-dismissing');
      
      // Attendre la fin de l'animation avant de supprimer l'élément
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
          
          // Exécuter le callback si demandé
          if (runCallback) {
            this.onDismiss();
          }
        }
      }, 300); // Durée de l'animation
    }
    
    return this;
  }
  
  /**
   * Modifie le type de l'alerte
   * @param {string} type - Nouveau type (info, success, warning, error)
   * @returns {Alert} L'instance courante pour chaînage
   */
  setType(type) {
    if (this.element) {
      // Supprimer l'ancien type
      this.element.classList.remove(`alert-${this.type}`);
      
      // Ajouter le nouveau type
      this.type = type;
      this.element.classList.add(`alert-${this.type}`);
      
      // Mettre à jour l'icône si c'est l'icône par défaut
      if (this._isDefaultIcon()) {
        const iconElement = this.element.querySelector('.alert-icon span');
        if (iconElement) {
          iconElement.className = this._getDefaultIcon();
        }
      }
    } else {
      this.type = type;
    }
    
    return this;
  }
  
  /**
   * Modifie le message de l'alerte
   * @param {string} message - Nouveau message
   * @returns {Alert} L'instance courante pour chaînage
   */
  setMessage(message) {
    this.message = message;
    
    if (this.element) {
      const messageElement = this.element.querySelector('.alert-message');
      if (messageElement) {
        // Supporter HTML ou texte simple
        if (message.includes('<') && message.includes('>')) {
          messageElement.innerHTML = message;
        } else {
          messageElement.textContent = message;
        }
      }
    }
    
    return this;
  }
  
  /**
   * Modifie le titre de l'alerte
   * @param {string} title - Nouveau titre
   * @returns {Alert} L'instance courante pour chaînage
   */
  setTitle(title) {
    this.title = title;
    
    if (this.element) {
      let titleElement = this.element.querySelector('.alert-title');
      const textElement = this.element.querySelector('.alert-text');
      
      if (title) {
        if (titleElement) {
          // Mettre à jour le titre existant
          titleElement.textContent = title;
        } else if (textElement) {
          // Créer un nouvel élément titre
          titleElement = document.createElement('div');
          titleElement.className = 'alert-title';
          titleElement.textContent = title;
          
          // Insérer avant le message
          const messageElement = textElement.querySelector('.alert-message');
          if (messageElement) {
            textElement.insertBefore(titleElement, messageElement);
          } else {
            textElement.appendChild(titleElement);
          }
        }
      } else if (titleElement) {
        // Supprimer le titre si vide
        titleElement.parentNode.removeChild(titleElement);
      }
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Annuler le timeout de fermeture automatique
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // Nettoyer les écouteurs d'événements
    if (this.dismissButton) {
      this.dismissButton.removeEventListener('click', this._handleDismiss);
    }
    
    // Supprimer l'élément du DOM s'il est attaché
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Réinitialiser les références
    this.element = null;
    this.dismissButton = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Gère l'événement de fermeture de l'alerte
   * @private
   */
  _handleDismiss() {
    this.dismiss();
  }
  
  /**
   * Détermine l'icône par défaut selon le type
   * @returns {string} Classe CSS de l'icône
   * @private
   */
  _getDefaultIcon() {
    switch (this.type) {
      case 'success':
        return 'icon-check-circle';
      case 'warning':
        return 'icon-alert-triangle';
      case 'error':
        return 'icon-x-circle';
      case 'info':
      default:
        return 'icon-info';
    }
  }
  
  /**
   * Vérifie si l'icône actuelle est l'icône par défaut
   * @returns {boolean} True si c'est l'icône par défaut
   * @private
   */
  _isDefaultIcon() {
    const defaultIcons = [
      'icon-check-circle',
      'icon-alert-triangle',
      'icon-x-circle',
      'icon-info'
    ];
    
    return defaultIcons.includes(this.icon);
  }
  
  /**
   * Crée et affiche une alerte de type info
   * @param {string} message - Message de l'alerte
   * @param {Object} options - Options de configuration
   * @returns {Alert} Une instance d'alerte
   * @static
   */
  static info(message, options = {}) {
    const alert = new Alert({
      type: 'info',
      message: message,
      ...options
    });
    
    return Alert._showGlobal(alert);
  }
  
  /**
   * Crée et affiche une alerte de type succès
   * @param {string} message - Message de l'alerte
   * @param {Object} options - Options de configuration
   * @returns {Alert} Une instance d'alerte
   * @static
   */
  static success(message, options = {}) {
    const alert = new Alert({
      type: 'success',
      message: message,
      ...options
    });
    
    return Alert._showGlobal(alert);
  }
  
  /**
   * Crée et affiche une alerte de type avertissement
   * @param {string} message - Message de l'alerte
   * @param {Object} options - Options de configuration
   * @returns {Alert} Une instance d'alerte
   * @static
   */
  static warning(message, options = {}) {
    const alert = new Alert({
      type: 'warning',
      message: message,
      ...options
    });
    
    return Alert._showGlobal(alert);
  }
  
  /**
   * Crée et affiche une alerte de type erreur
   * @param {string} message - Message de l'alerte
   * @param {Object} options - Options de configuration
   * @returns {Alert} Une instance d'alerte
   * @static
   */
  static error(message, options = {}) {
    const alert = new Alert({
      type: 'error',
      message: message,
      ...options
    });
    
    return Alert._showGlobal(alert);
  }
  
  /**
   * Affiche une alerte dans le conteneur global
   * @param {Alert} alert - Instance d'alerte à afficher
   * @returns {Alert} L'instance d'alerte
   * @private
   * @static
   */
  static _showGlobal(alert) {
    // Obtenir ou créer le conteneur d'alertes global
    let alertsContainer = document.getElementById('global-alerts-container');
    
    if (!alertsContainer) {
      alertsContainer = document.createElement('div');
      alertsContainer.id = 'global-alerts-container';
      alertsContainer.className = 'alerts-container';
      document.body.appendChild(alertsContainer);
    }
    
    // Afficher l'alerte dans le conteneur
    alert.show(alertsContainer);
    
    return alert;
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Alert = Alert;