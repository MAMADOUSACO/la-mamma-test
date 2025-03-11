/**
 * Composant Button - Bouton interactif standardisé
 * Fichier: js/components/common/Button.js
 */

class Button {
  /**
   * Constructeur du composant Button
   * @param {Object} options - Options de configuration
   * @param {string} options.text - Texte du bouton
   * @param {string} options.type - Type de bouton (primary, secondary, danger, success, etc.)
   * @param {string} options.size - Taille du bouton (small, medium, large)
   * @param {string} options.icon - Classe CSS de l'icône à afficher
   * @param {boolean} options.iconOnly - Si true, affiche uniquement l'icône sans texte
   * @param {boolean} options.disabled - Si true, le bouton est désactivé
   * @param {Function} options.onClick - Fonction appelée lors du clic
   * @param {string} options.tooltip - Texte d'info-bulle
   * @param {string} options.className - Classes CSS additionnelles
   * @param {boolean} options.fullWidth - Si true, le bouton prend toute la largeur disponible
   * @param {boolean} options.outline - Si true, le bouton a un style avec contour uniquement
   * @param {boolean} options.rounded - Si true, le bouton a des coins arrondis
   * @param {string} options.id - Identifiant HTML du bouton
   */
  constructor(options = {}) {
    this.text = options.text || '';
    this.type = options.type || 'primary';
    this.size = options.size || 'medium';
    this.icon = options.icon || null;
    this.iconOnly = options.iconOnly || false;
    this.disabled = options.disabled || false;
    this.onClick = options.onClick || (() => {});
    this.tooltip = options.tooltip || '';
    this.className = options.className || '';
    this.fullWidth = options.fullWidth || false;
    this.outline = options.outline || false;
    this.rounded = options.rounded || false;
    this.id = options.id || `btn-${Math.random().toString(36).substr(2, 9)}`;
    
    this.element = null;
  }

  /**
   * Génère et retourne l'élément HTML du bouton
   * @returns {HTMLElement} L'élément du bouton
   */
  render() {
    // Créer l'élément bouton
    this.element = document.createElement('button');
    this.element.id = this.id;
    
    // Construire les classes CSS
    let cssClasses = [
      'btn',
      `btn-${this.type}`,
      `btn-${this.size}`
    ];
    
    if (this.fullWidth) cssClasses.push('btn-full-width');
    if (this.outline) cssClasses.push('btn-outline');
    if (this.rounded) cssClasses.push('btn-rounded');
    if (this.iconOnly) cssClasses.push('btn-icon-only');
    if (this.className) cssClasses.push(this.className);
    
    this.element.className = cssClasses.join(' ');
    
    // Configurer les attributs
    this.element.disabled = this.disabled;
    if (this.tooltip) {
      this.element.title = this.tooltip;
    }
    
    // Créer le contenu du bouton
    this._renderContent();
    
    // Ajouter l'écouteur d'événement
    this.element.addEventListener('click', this._handleClick.bind(this));
    
    return this.element;
  }
  
  /**
   * Active ou désactive le bouton
   * @param {boolean} disabled - Si true, désactive le bouton
   * @returns {Button} L'instance courante pour chaînage
   */
  setDisabled(disabled) {
    this.disabled = disabled;
    
    if (this.element) {
      this.element.disabled = disabled;
    }
    
    return this;
  }
  
  /**
   * Modifie le texte du bouton
   * @param {string} text - Nouveau texte
   * @returns {Button} L'instance courante pour chaînage
   */
  setText(text) {
    this.text = text;
    
    if (this.element) {
      // Mettre à jour le contenu
      this._renderContent();
    }
    
    return this;
  }
  
  /**
   * Modifie l'icône du bouton
   * @param {string} icon - Classe CSS de l'icône
   * @returns {Button} L'instance courante pour chaînage
   */
  setIcon(icon) {
    this.icon = icon;
    
    if (this.element) {
      // Mettre à jour le contenu
      this._renderContent();
    }
    
    return this;
  }
  
  /**
   * Change le type du bouton (primary, secondary, etc.)
   * @param {string} type - Nouveau type
   * @returns {Button} L'instance courante pour chaînage
   */
  setType(type) {
    if (this.element) {
      // Supprimer l'ancien type
      this.element.classList.remove(`btn-${this.type}`);
      
      // Ajouter le nouveau type
      this.type = type;
      this.element.classList.add(`btn-${this.type}`);
    } else {
      this.type = type;
    }
    
    return this;
  }
  
  /**
   * Simule un clic sur le bouton
   * @returns {Button} L'instance courante pour chaînage
   */
  click() {
    if (this.element && !this.disabled) {
      this.element.click();
    }
    
    return this;
  }
  
  /**
   * Affiche un indicateur de chargement sur le bouton
   * @param {boolean} loading - Si true, affiche l'indicateur
   * @param {string} loadingText - Texte à afficher pendant le chargement
   * @returns {Button} L'instance courante pour chaînage
   */
  setLoading(loading, loadingText = 'Chargement...') {
    if (!this.element) return this;
    
    if (loading) {
      // Sauvegarder l'état actuel
      this._originalText = this.text;
      this._originalIcon = this.icon;
      this._originalDisabled = this.disabled;
      
      // Mettre à jour l'état
      this.setText(loadingText);
      this.setIcon('icon-spinner spin');
      this.setDisabled(true);
      this.element.classList.add('btn-loading');
    } else {
      // Restaurer l'état d'origine
      this.setText(this._originalText || this.text);
      this.setIcon(this._originalIcon);
      this.setDisabled(this._originalDisabled);
      this.element.classList.remove('btn-loading');
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    if (this.element) {
      // Supprimer l'écouteur d'événement
      this.element.removeEventListener('click', this._handleClick);
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
    
    // Réinitialiser les références
    this.element = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Gère l'événement de clic sur le bouton
   * @private
   */
  _handleClick(event) {
    if (!this.disabled) {
      this.onClick(event);
    }
  }
  
  /**
   * Génère le contenu du bouton (texte et/ou icône)
   * @private
   */
  _renderContent() {
    if (!this.element) return;
    
    // Vider le contenu actuel
    this.element.innerHTML = '';
    
    // Ajouter l'icône si elle est définie
    if (this.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `btn-icon ${this.icon}`;
      this.element.appendChild(iconElement);
    }
    
    // Ajouter le texte si ce n'est pas un bouton icône uniquement
    if (!this.iconOnly && this.text) {
      const textElement = document.createElement('span');
      textElement.className = 'btn-text';
      textElement.textContent = this.text;
      this.element.appendChild(textElement);
    }
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Button = Button;