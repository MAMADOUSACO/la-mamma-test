/**
 * Composant Spinner - Indicateur de chargement
 * 
 * Utilisation:
 * const spinner = new Spinner({
 *   size: 'medium',
 *   text: 'Chargement en cours...'
 * });
 * container.appendChild(spinner.render());
 */

class Spinner {
    /**
     * Constructeur
     * @param {Object} options - Options du spinner
     * @param {string} options.size - Taille du spinner (small, medium, large)
     * @param {string} options.text - Texte à afficher sous le spinner
     * @param {string} options.color - Couleur du spinner
     * @param {boolean} options.inline - Affichage en ligne
     * @param {boolean} options.overlay - Afficher avec un overlay
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     */
    constructor(options = {}) {
      this.size = options.size || 'medium';
      this.text = options.text || '';
      this.color = options.color || '';
      this.inline = options.inline || false;
      this.overlay = options.overlay || false;
      this.className = options.className || '';
      this.id = options.id || 'spinner-' + Date.now();
      
      this.element = null;
    }
  
    /**
     * Rend le spinner
     * @returns {HTMLElement} - Élément du spinner
     */
    render() {
      // Déterminer le conteneur principal
      if (this.overlay) {
        this.element = document.createElement('div');
        this.element.className = 'spinner-overlay';
        
        if (this.className) {
          this.className.split(' ').forEach(cls => {
            if (cls) {
              this.element.classList.add(cls);
            }
          });
        }
        
        this.element.id = this.id;
        
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';
        
        const spinner = this._createSpinnerElement();
        spinnerContainer.appendChild(spinner);
        
        // Ajouter le texte si nécessaire
        if (this.text) {
          const textElement = document.createElement('div');
          textElement.className = 'spinner-text';
          textElement.textContent = this.text;
          spinnerContainer.appendChild(textElement);
        }
        
        this.element.appendChild(spinnerContainer);
      } else {
        // Spinner simple (sans overlay)
        this.element = document.createElement('div');
        
        if (this.inline) {
          this.element.className = `spinner-inline spinner-${this.size}`;
        } else {
          this.element.className = `spinner-container spinner-${this.size}`;
        }
        
        if (this.className) {
          this.className.split(' ').forEach(cls => {
            if (cls) {
              this.element.classList.add(cls);
            }
          });
        }
        
        this.element.id = this.id;
        
        const spinner = this._createSpinnerElement();
        this.element.appendChild(spinner);
        
        // Ajouter le texte si nécessaire et si non inline
        if (this.text && !this.inline) {
          const textElement = document.createElement('div');
          textElement.className = 'spinner-text';
          textElement.textContent = this.text;
          this.element.appendChild(textElement);
        }
      }
      
      return this.element;
    }
  
    /**
     * Crée l'élément du spinner
     * @returns {HTMLElement} - Élément du spinner
     * @private
     */
    _createSpinnerElement() {
      const spinner = document.createElement('div');
      spinner.className = `spinner spinner-${this.size}`;
      
      if (this.color) {
        spinner.style.borderTopColor = this.color;
      }
      
      return spinner;
    }
  
    /**
     * Active ou désactive l'overlay (si applicable)
     * @param {boolean} visible - État visible
     */
    setVisible(visible) {
      if (!this.element) return;
      
      if (this.overlay) {
        if (visible) {
          this.element.style.display = 'flex';
        } else {
          this.element.style.display = 'none';
        }
      }
    }
  
    /**
     * Met à jour le texte du spinner
     * @param {string} text - Nouveau texte
     */
    setText(text) {
      this.text = text;
      
      if (this.element) {
        const textElement = this.element.querySelector('.spinner-text');
        
        if (textElement) {
          textElement.textContent = text;
        } else if (text && !this.inline) {
          // Créer l'élément de texte s'il n'existe pas
          const newTextElement = document.createElement('div');
          newTextElement.className = 'spinner-text';
          newTextElement.textContent = text;
          this.element.appendChild(newTextElement);
        }
      }
    }
  
    /**
     * Crée un spinner plein écran et l'affiche
     * @param {string} text - Texte à afficher
     * @returns {Spinner} - Instance du spinner
     * @static
     */
    static showGlobal(text = 'Chargement...') {
      const spinner = new Spinner({
        size: 'large',
        text,
        overlay: true,
        id: 'global-spinner'
      });
      
      // Supprimer un spinner global existant
      const existingSpinner = document.getElementById('global-spinner');
      if (existingSpinner) {
        existingSpinner.parentNode.removeChild(existingSpinner);
      }
      
      document.body.appendChild(spinner.render());
      return spinner;
    }
  
    /**
     * Masque le spinner global
     * @static
     */
    static hideGlobal() {
      const spinner = document.getElementById('global-spinner');
      
      if (spinner) {
        // Ajouter une classe de sortie pour l'animation
        spinner.classList.add('fade-out');
        
        // Supprimer après l'animation
        setTimeout(() => {
          if (spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
          }
        }, 300);
      }
    }
  
    /**
     * Détruit le composant
     */
    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Spinner = Spinner;