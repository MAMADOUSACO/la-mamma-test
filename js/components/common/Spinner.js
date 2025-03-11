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
     * @param {string} options.text - Texte à afficher
     * @param {string} options.color - Couleur du spinner
     * @param {boolean} options.overlay - Affiche un overlay sur le conteneur
     * @param {boolean} options.centered - Centre le spinner dans son conteneur
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     */
    constructor(options = {}) {
      this.size = options.size || 'medium';
      this.text = options.text || '';
      this.color = options.color || null;
      this.overlay = options.overlay || false;
      this.centered = options.centered !== false;
      this.className = options.className || '';
      this.id = options.id || 'spinner-' + Date.now();
      
      this.element = null;
    }
  
    /**
     * Rend le composant spinner
     * @returns {HTMLElement} - Élément spinner
     */
    render() {
      // Créer le conteneur
      this.element = document.createElement('div');
      this.element.className = `spinner-container spinner-${this.size}`;
      this.element.id = this.id;
      
      if (this.overlay) {
        this.element.classList.add('spinner-overlay');
      }
      
      if (this.centered) {
        this.element.classList.add('spinner-centered');
      }
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      // Créer l'élément spinner
      const spinnerElement = document.createElement('div');
      spinnerElement.className = 'spinner';
      
      // Appliquer la couleur si spécifiée
      if (this.color) {
        spinnerElement.style.borderTopColor = this.color;
      }
      
      this.element.appendChild(spinnerElement);
      
      // Ajouter le texte si spécifié
      if (this.text) {
        const textElement = document.createElement('div');
        textElement.className = 'spinner-text';
        textElement.textContent = this.text;
        
        // Appliquer la couleur au texte si spécifiée
        if (this.color) {
          textElement.style.color = this.color;
        }
        
        this.element.appendChild(textElement);
      }
      
      return this.element;
    }
  
    /**
     * Ajoute ou remplace le spinner dans un conteneur
     * @param {HTMLElement} container - Élément conteneur
     * @returns {HTMLElement} - Élément spinner
     */
    attachTo(container) {
      if (!container || !(container instanceof HTMLElement)) {
        console.error('Le conteneur doit être un élément HTML valide');
        return null;
      }
      
      // Rendre le spinner s'il n'est pas déjà rendu
      if (!this.element) {
        this.render();
      }
      
      // S'assurer que le conteneur a une position relative ou absolute
      // pour permettre le positionnement correct du spinner centré ou en overlay
      const containerPosition = window.getComputedStyle(container).position;
      if (containerPosition !== 'relative' && containerPosition !== 'absolute' && containerPosition !== 'fixed') {
        container.style.position = 'relative';
      }
      
      // Ajouter le spinner au conteneur
      container.appendChild(this.element);
      
      return this.element;
    }
  
    /**
     * Modifie le texte du spinner
     * @param {string} text - Nouveau texte
     */
    setText(text) {
      this.text = text;
      
      if (this.element) {
        let textElement = this.element.querySelector('.spinner-text');
        
        if (text) {
          if (textElement) {
            // Mettre à jour le texte existant
            textElement.textContent = text;
          } else {
            // Créer un nouvel élément texte
            textElement = document.createElement('div');
            textElement.className = 'spinner-text';
            textElement.textContent = text;
            
            // Appliquer la couleur au texte si spécifiée
            if (this.color) {
              textElement.style.color = this.color;
            }
            
            this.element.appendChild(textElement);
          }
        } else if (textElement && textElement.parentNode) {
          // Supprimer le texte s'il existe et que le nouveau texte est vide
          textElement.parentNode.removeChild(textElement);
        }
      }
    }
  
    /**
     * Modifie la taille du spinner
     * @param {string} size - Nouvelle taille (small, medium, large)
     */
    setSize(size) {
      if (['small', 'medium', 'large'].includes(size)) {
        this.size = size;
        
        if (this.element) {
          // Mettre à jour la classe de taille
          this.element.className = this.element.className.replace(/spinner-\w+/, `spinner-${size}`);
        }
      }
    }
  
    /**
     * Modifie la couleur du spinner
     * @param {string} color - Nouvelle couleur
     */
    setColor(color) {
      this.color = color;
      
      if (this.element) {
        const spinnerElement = this.element.querySelector('.spinner');
        if (spinnerElement) {
          spinnerElement.style.borderTopColor = color;
        }
        
        const textElement = this.element.querySelector('.spinner-text');
        if (textElement) {
          textElement.style.color = color;
        }
      }
    }
  
    /**
     * Affiche le spinner s'il était caché
     */
    show() {
      if (this.element) {
        this.element.style.display = '';
      }
    }
  
    /**
     * Cache le spinner
     */
    hide() {
      if (this.element) {
        this.element.style.display = 'none';
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