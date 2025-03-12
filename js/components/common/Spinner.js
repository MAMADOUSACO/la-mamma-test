/**
 * Composant Spinner - Indicateur de chargement
 * Fichier: js/components/common/Spinner.js
 */

class Spinner {
  /**
   * Constructeur du composant Spinner
   * @param {Object} options - Options de configuration
   * @param {string} options.size - Taille du spinner (small, medium, large)
   * @param {string} options.color - Couleur personnalisée du spinner
   * @param {string} options.message - Message à afficher sous le spinner
   * @param {boolean} options.overlay - Si true, affiche un fond semi-transparent
   * @param {string} options.className - Classes CSS additionnelles
   */
  constructor(options = {}) {
    this.size = options.size || 'medium';
    this.color = options.color || '';
    this.message = options.message || '';
    this.overlay = options.overlay !== undefined ? options.overlay : false;
    this.className = options.className || '';
    
    this.element = null;
  }

  /**
   * Génère et retourne l'élément HTML du spinner
   * @returns {HTMLElement} L'élément du spinner
   */
  render() {
    // Créer l'élément principal
    this.element = document.createElement('div');
    
    // Construire les classes CSS
    let cssClasses = [
      'spinner-container',
      `spinner-${this.size}`
    ];
    
    if (this.overlay) cssClasses.push('spinner-overlay');
    if (this.className) cssClasses.push(this.className);
    
    this.element.className = cssClasses.join(' ');
    
    // Créer le spinner
    const spinnerElement = document.createElement('div');
    spinnerElement.className = 'spinner';
    
    // Appliquer la couleur personnalisée si spécifiée
    if (this.color) {
      spinnerElement.style.borderTopColor = this.color;
    }
    
    this.element.appendChild(spinnerElement);
    
    // Ajouter le message si présent
    if (this.message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'spinner-message';
      messageElement.textContent = this.message;
      this.element.appendChild(messageElement);
    }
    
    return this.element;
  }
  
  /**
   * Définit la taille du spinner
   * @param {string} size - Taille du spinner (small, medium, large)
   * @returns {Spinner} L'instance courante pour chaînage
   */
  setSize(size) {
    if (this.element) {
      this.element.classList.remove(`spinner-${this.size}`);
      this.element.classList.add(`spinner-${size}`);
    }
    
    this.size = size;
    return this;
  }
  
  /**
   * Définit la couleur du spinner
   * @param {string} color - Couleur CSS valide
   * @returns {Spinner} L'instance courante pour chaînage
   */
  setColor(color) {
    this.color = color;
    
    if (this.element) {
      const spinnerElement = this.element.querySelector('.spinner');
      if (spinnerElement) {
        spinnerElement.style.borderTopColor = color;
      }
    }
    
    return this;
  }
  
  /**
   * Définit le message du spinner
   * @param {string} message - Message à afficher
   * @returns {Spinner} L'instance courante pour chaînage
   */
  setMessage(message) {
    this.message = message;
    
    if (this.element) {
      let messageElement = this.element.querySelector('.spinner-message');
      
      if (message) {
        if (messageElement) {
          // Mettre à jour le message existant
          messageElement.textContent = message;
        } else {
          // Créer un nouvel élément message
          messageElement = document.createElement('div');
          messageElement.className = 'spinner-message';
          messageElement.textContent = message;
          this.element.appendChild(messageElement);
        }
      } else if (messageElement) {
        // Supprimer le message si vide
        messageElement.parentNode.removeChild(messageElement);
      }
    }
    
    return this;
  }
  
  /**
   * Active ou désactive l'overlay
   * @param {boolean} overlay - Si true, active l'overlay
   * @returns {Spinner} L'instance courante pour chaînage
   */
  setOverlay(overlay) {
    this.overlay = overlay;
    
    if (this.element) {
      if (overlay) {
        this.element.classList.add('spinner-overlay');
      } else {
        this.element.classList.remove('spinner-overlay');
      }
    }
    
    return this;
  }
  
  /**
   * Affiche le spinner comme overlay global sur toute la page
   * @returns {Spinner} L'instance courante pour chaînage
   */
  showGlobal() {
    if (!this.element) {
      this.render();
    }
    
    // Configurer comme overlay global
    this.setOverlay(true);
    
    // Ajouter au corps du document
    document.body.appendChild(this.element);
    
    return this;
  }
  
  /**
   * Masque et supprime le spinner
   * @returns {Spinner} L'instance courante pour chaînage
   */
  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Supprimer l'élément du DOM s'il est attaché
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
  }
  
  /**
   * Crée et affiche un spinner global
   * @param {string} message - Message à afficher
   * @param {Object} options - Options de configuration
   * @returns {Spinner} Une instance de spinner
   * @static
   */
  static show(message = '', options = {}) {
    const spinner = new Spinner({
      message,
      overlay: true,
      ...options
    });
    
    spinner.showGlobal();
    return spinner;
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.common = window.components.common || {};
window.components.common.Spinner = Spinner;