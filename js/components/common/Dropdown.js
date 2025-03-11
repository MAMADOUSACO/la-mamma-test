/**
 * Composant Dropdown - Menu déroulant
 * 
 * Utilisation:
 * const dropdown = new Dropdown({
 *   label: 'Sélectionnez une option',
 *   items: [
 *     { id: 'option1', label: 'Option 1' },
 *     { id: 'option2', label: 'Option 2' }
 *   ],
 *   onChange: (selectedId) => console.log(`Option sélectionnée: ${selectedId}`)
 * });
 * container.appendChild(dropdown.render());
 */

class Dropdown {
    /**
     * Constructeur
     * @param {Object} options - Options du menu déroulant
     * @param {string} options.label - Libellé du menu
     * @param {Array} options.items - Éléments du menu
     * @param {string} options.value - Valeur sélectionnée par défaut
     * @param {Function} options.onChange - Fonction de rappel lors du changement
     * @param {string} options.placeholder - Texte d'indication
     * @param {boolean} options.disabled - Si le menu est désactivé
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     */
    constructor(options = {}) {
      this.label = options.label || '';
      this.items = options.items || [];
      this.value = options.value || null;
      this.onChange = options.onChange || null;
      this.placeholder = options.placeholder || 'Sélectionner...';
      this.disabled = options.disabled || false;
      this.className = options.className || '';
      this.id = options.id || 'dropdown-' + Date.now();
      
      this.element = null;
      this.dropdownButton = null;
      this.dropdownMenu = null;
      this.isOpen = false;
      
      this.clickOutsideHandler = this._handleClickOutside.bind(this);
    }
  
    /**
     * Rend le composant de menu déroulant
     * @returns {HTMLElement} - Élément du menu déroulant
     */
    render() {
      // Créer le conteneur principal
      this.element = document.createElement('div');
      this.element.className = 'dropdown-container';
      this.element.id = this.id;
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      // Ajouter le label si spécifié
      if (this.label) {
        const labelElement = document.createElement('label');
        labelElement.className = 'dropdown-label';
        labelElement.textContent = this.label;
        this.element.appendChild(labelElement);
      }
      
      // Créer le bouton de menu déroulant
      this.dropdownButton = document.createElement('button');
      this.dropdownButton.className = 'dropdown-button';
      this.dropdownButton.type = 'button';
      this.dropdownButton.setAttribute('aria-haspopup', 'true');
      this.dropdownButton.setAttribute('aria-expanded', 'false');
      
      // État désactivé
      if (this.disabled) {
        this.dropdownButton.disabled = true;
        this.element.classList.add('disabled');
      }
      
      // Ajouter le texte du bouton
      const buttonTextSpan = document.createElement('span');
      buttonTextSpan.className = 'dropdown-button-text';
      
      // Définir le texte initial du bouton
      this._updateButtonText(buttonTextSpan);
      
      // Ajouter l'icône de flèche
      const arrowIcon = document.createElement('span');
      arrowIcon.className = 'dropdown-arrow';
      arrowIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 10l5 5 5-5z"/>
        </svg>
      `;
      
      // Assembler le bouton
      this.dropdownButton.appendChild(buttonTextSpan);
      this.dropdownButton.appendChild(arrowIcon);
      
      // Créer le menu déroulant
      this.dropdownMenu = document.createElement('div');
      this.dropdownMenu.className = 'dropdown-menu';
      this.dropdownMenu.setAttribute('role', 'menu');
      
      // Ajouter les éléments du menu
      this.items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'dropdown-item';
        menuItem.setAttribute('role', 'menuitem');
        menuItem.setAttribute('data-value', item.id);
        menuItem.textContent = item.label;
        
        // Marquer l'élément comme sélectionné si nécessaire
        if (item.id === this.value) {
          menuItem.classList.add('selected');
        }
        
        // Ajouter l'icône si nécessaire
        if (item.icon) {
          const iconElement = document.createElement('span');
          iconElement.className = 'dropdown-item-icon';
          
          // Utiliser le composant Button pour récupérer l'icône
          if (window.components && window.components.Button) {
            const tempButton = new window.components.Button({ icon: item.icon, isIconOnly: true });
            const tempElement = tempButton.render();
            const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
            
            if (iconWrapper) {
              iconElement.innerHTML = iconWrapper.innerHTML;
            }
          } else {
            // Fallback
            iconElement.classList.add('icon', `icon-${item.icon}`);
          }
          
          menuItem.insertBefore(iconElement, menuItem.firstChild);
        }
        
        // Gérer le clic sur un élément du menu
        menuItem.addEventListener('click', () => {
          if (!this.disabled) {
            this._selectItem(item.id);
            this.close();
          }
        });
        
        this.dropdownMenu.appendChild(menuItem);
      });
      
      // Assembler le composant
      this.element.appendChild(this.dropdownButton);
      this.element.appendChild(this.dropdownMenu);
      
      // Attacher les gestionnaires d'événements
      this._attachEventListeners();
      
      return this.element;
    }
  
    /**
     * Met à jour le texte du bouton
     * @param {HTMLElement} buttonTextElement - Élément de texte du bouton
     * @private
     */
    _updateButtonText(buttonTextElement) {
      // Si un élément est sélectionné, afficher son libellé
      if (this.value !== null) {
        const selectedItem = this.items.find(item => item.id === this.value);
        if (selectedItem) {
          buttonTextElement.textContent = selectedItem.label;
          return;
        }
      }
      
      // Sinon, afficher le placeholder
      buttonTextElement.textContent = this.placeholder;
      buttonTextElement.classList.add('placeholder');
    }
  
    /**
     * Attache les gestionnaires d'événements
     * @private
     */
    _attachEventListeners() {
      // Ouvrir/fermer le menu au clic sur le bouton
      this.dropdownButton.addEventListener('click', () => {
        if (!this.disabled) {
          this.isOpen ? this.close() : this.open();
        }
      });
      
      // Gestion du clavier pour l'accessibilité
      this.dropdownButton.addEventListener('keydown', (event) => {
        if (!this.disabled) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.open();
          }
        }
      });
      
      this.element.addEventListener('keydown', (event) => {
        if (!this.disabled && this.isOpen) {
          if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this._navigateWithKeyboard(event.key === 'ArrowDown' ? 1 : -1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const focusedItem = this.dropdownMenu.querySelector('.dropdown-item:focus');
            if (focusedItem) {
              const value = focusedItem.getAttribute('data-value');
              this._selectItem(value);
              this.close();
            }
          }
        }
      });
    }
  
    /**
     * Gère le clic en dehors du menu déroulant
     * @param {Event} event - Événement de clic
     * @private
     */
    _handleClickOutside(event) {
      if (this.element && !this.element.contains(event.target)) {
        this.close();
      }
    }
  
    /**
     * Navigation avec le clavier
     * @param {number} direction - Direction (1 pour bas, -1 pour haut)
     * @private
     */
    _navigateWithKeyboard(direction) {
      const items = Array.from(this.dropdownMenu.querySelectorAll('.dropdown-item'));
      if (items.length === 0) return;
      
      // Trouver l'élément actuellement focus
      const focusedItem = this.dropdownMenu.querySelector('.dropdown-item:focus');
      let index = focusedItem ? items.indexOf(focusedItem) : -1;
      
      // Calculer le nouvel index
      index += direction;
      
      // Assurer que l'index est dans les limites
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      
      // Focus sur le nouvel élément
      items[index].focus();
    }
  
    /**
     * Sélectionne un élément du menu
     * @param {string} itemId - ID de l'élément à sélectionner
     * @private
     */
    _selectItem(itemId) {
      // Mettre à jour la valeur sélectionnée
      this.value = itemId;
      
      // Mettre à jour l'affichage du bouton
      const buttonTextElement = this.dropdownButton.querySelector('.dropdown-button-text');
      if (buttonTextElement) {
        this._updateButtonText(buttonTextElement);
      }
      
      // Mettre à jour la classe selected des éléments du menu
      const items = this.dropdownMenu.querySelectorAll('.dropdown-item');
      items.forEach(item => {
        const itemValue = item.getAttribute('data-value');
        if (itemValue === itemId) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
      
      // Appeler le callback onChange
      if (this.onChange && typeof this.onChange === 'function') {
        this.onChange(itemId);
      }
    }
  
    /**
     * Ouvre le menu déroulant
     */
    open() {
      if (this.disabled || this.isOpen) return;
      
      // Ajouter la classe active
      this.element.classList.add('active');
      this.dropdownButton.setAttribute('aria-expanded', 'true');
      this.isOpen = true;
      
      // Ajouter l'écouteur de clic extérieur
      document.addEventListener('click', this.clickOutsideHandler);
      
      // Donner le focus au premier élément pour l'accessibilité
      setTimeout(() => {
        const firstItem = this.dropdownMenu.querySelector('.dropdown-item');
        if (firstItem) {
          firstItem.focus();
        }
      }, 10);
    }
  
    /**
     * Ferme le menu déroulant
     */
    close() {
      if (!this.isOpen) return;
      
      // Retirer la classe active
      this.element.classList.remove('active');
      this.dropdownButton.setAttribute('aria-expanded', 'false');
      this.isOpen = false;
      
      // Retirer l'écouteur de clic extérieur
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  
    /**
     * Définit la valeur sélectionnée
     * @param {string} value - Valeur à sélectionner
     */
    setValue(value) {
      if (this.items.some(item => item.id === value)) {
        this._selectItem(value);
      }
    }
  
    /**
     * Obtient la valeur sélectionnée
     * @returns {string|null} - Valeur sélectionnée
     */
    getValue() {
      return this.value;
    }
  
    /**
     * Met à jour les éléments du menu
     * @param {Array} items - Nouveaux éléments
     */
    setItems(items) {
      this.items = items || [];
      
      if (this.dropdownMenu) {
        // Vider le menu
        this.dropdownMenu.innerHTML = '';
        
        // Ajouter les nouveaux éléments
        this.items.forEach(item => {
          const menuItem = document.createElement('div');
          menuItem.className = 'dropdown-item';
          menuItem.setAttribute('role', 'menuitem');
          menuItem.setAttribute('data-value', item.id);
          menuItem.textContent = item.label;
          
          // Marquer l'élément comme sélectionné si nécessaire
          if (item.id === this.value) {
            menuItem.classList.add('selected');
          }
          
          // Ajouter l'icône si nécessaire
          if (item.icon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'dropdown-item-icon';
            
            // Utiliser le composant Button pour récupérer l'icône
            if (window.components && window.components.Button) {
              const tempButton = new window.components.Button({ icon: item.icon, isIconOnly: true });
              const tempElement = tempButton.render();
              const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
              
              if (iconWrapper) {
                iconElement.innerHTML = iconWrapper.innerHTML;
              }
            } else {
              // Fallback
              iconElement.classList.add('icon', `icon-${item.icon}`);
            }
            
            menuItem.insertBefore(iconElement, menuItem.firstChild);
          }
          
          // Gérer le clic sur un élément du menu
          menuItem.addEventListener('click', () => {
            if (!this.disabled) {
              this._selectItem(item.id);
              this.close();
            }
          });
          
          this.dropdownMenu.appendChild(menuItem);
        });
        
        // Mettre à jour l'affichage du bouton
        const buttonTextElement = this.dropdownButton.querySelector('.dropdown-button-text');
        if (buttonTextElement) {
          this._updateButtonText(buttonTextElement);
        }
      }
    }
  
    /**
     * Active ou désactive le menu déroulant
     * @param {boolean} disabled - État désactivé
     */
    setDisabled(disabled) {
      this.disabled = disabled;
      
      if (this.element) {
        if (disabled) {
          this.element.classList.add('disabled');
          this.dropdownButton.disabled = true;
          this.close();
        } else {
          this.element.classList.remove('disabled');
          this.dropdownButton.disabled = false;
        }
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      if (this.isOpen) {
        this.close();
      }
      
      document.removeEventListener('click', this.clickOutsideHandler);
      
      if (this.element) {
        // Supprimer tous les écouteurs d'événements en remplaçant les éléments
        const newElement = this.element.cloneNode(true);
        if (this.element.parentNode) {
          this.element.parentNode.replaceChild(newElement, this.element);
        }
        
        this.element = null;
        this.dropdownButton = null;
        this.dropdownMenu = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Dropdown = Dropdown;