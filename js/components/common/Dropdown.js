/**
 * Composant Dropdown - Menu déroulant
 * 
 * Utilisation:
 * const dropdown = new Dropdown({
 *   trigger: 'Sélectionner une option',
 *   items: [
 *     { id: 'option1', text: 'Option 1' },
 *     { id: 'option2', text: 'Option 2' }
 *   ],
 *   onSelect: (item) => console.log('Option sélectionnée:', item)
 * });
 * container.appendChild(dropdown.render());
 */

class Dropdown {
    /**
     * Constructeur
     * @param {Object} options - Options du menu déroulant
     * @param {string|HTMLElement} options.trigger - Élément déclencheur
     * @param {Array} options.items - Liste des éléments du menu
     * @param {Function} options.onSelect - Fonction appelée à la sélection
     * @param {string} options.selectedId - ID de l'élément sélectionné
     * @param {string} options.position - Position du menu (bottom, top, left, right)
     * @param {boolean} options.closeOnSelect - Fermer après sélection
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     * @param {boolean} options.disabled - Si le dropdown est désactivé
     */
    constructor(options = {}) {
      this.trigger = options.trigger || 'Sélectionner';
      this.items = options.items || [];
      this.onSelect = options.onSelect || null;
      this.selectedId = options.selectedId || null;
      this.position = options.position || 'bottom';
      this.closeOnSelect = options.closeOnSelect !== false;
      this.className = options.className || '';
      this.id = options.id || 'dropdown-' + Date.now();
      this.disabled = options.disabled || false;
      
      this.element = null;
      this.triggerElement = null;
      this.menuElement = null;
      this.isOpen = false;
      this.documentClickHandler = this._handleDocumentClick.bind(this);
    }
  
    /**
     * Rend le menu déroulant
     * @returns {HTMLElement} - Élément du menu déroulant
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'dropdown';
      this.element.id = this.id;
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      if (this.disabled) {
        this.element.classList.add('disabled');
      }
      
      // Créer l'élément déclencheur
      this.triggerElement = document.createElement('button');
      this.triggerElement.className = 'dropdown-trigger';
      this.triggerElement.setAttribute('aria-haspopup', 'true');
      this.triggerElement.setAttribute('aria-expanded', 'false');
      
      if (this.disabled) {
        this.triggerElement.disabled = true;
      }
      
      // Ajouter le contenu du déclencheur
      if (typeof this.trigger === 'string') {
        this.triggerElement.innerHTML = `
          <span class="dropdown-trigger-text">${this.trigger}</span>
          <span class="dropdown-arrow">&#9662;</span>
        `;
      } else if (this.trigger instanceof HTMLElement) {
        this.triggerElement.appendChild(this.trigger);
        
        // Ajouter une flèche si aucune n'est présente
        if (!this.trigger.querySelector('.dropdown-arrow')) {
          const arrow = document.createElement('span');
          arrow.className = 'dropdown-arrow';
          arrow.innerHTML = '&#9662;';
          this.triggerElement.appendChild(arrow);
        }
      }
      
      // Créer le menu
      this.menuElement = document.createElement('div');
      this.menuElement.className = `dropdown-menu dropdown-position-${this.position}`;
      this.menuElement.setAttribute('role', 'menu');
      
      // Ajouter les éléments du menu
      this.items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'dropdown-item';
        menuItem.setAttribute('role', 'menuitem');
        menuItem.setAttribute('data-id', item.id);
        
        if (item.id === this.selectedId) {
          menuItem.classList.add('selected');
        }
        
        if (item.disabled) {
          menuItem.classList.add('disabled');
        }
        
        // Si l'élément a une icône
        if (item.icon) {
          const iconElement = document.createElement('span');
          iconElement.className = 'dropdown-item-icon';
          
          // Utiliser le composant Button pour récupérer l'icône
          if (window.components.Button) {
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
          
          menuItem.appendChild(iconElement);
        }
        
        // Ajouter le texte
        const textElement = document.createElement('span');
        textElement.className = 'dropdown-item-text';
        textElement.textContent = item.text || item.id;
        menuItem.appendChild(textElement);
        
        // Ajouter un indicateur de sélection si nécessaire
        if (item.id === this.selectedId) {
          const checkmark = document.createElement('span');
          checkmark.className = 'dropdown-item-selected';
          checkmark.textContent = '✓';
          menuItem.appendChild(checkmark);
        }
        
        // Ajouter l'événement de clic
        if (!item.disabled) {
          menuItem.addEventListener('click', (event) => {
            this._onItemClick(item, event);
          });
        }
        
        this.menuElement.appendChild(menuItem);
      });
      
      // Si le menu est vide, ajouter un message
      if (this.items.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'dropdown-item dropdown-item-empty';
        emptyItem.textContent = 'Aucun élément';
        this.menuElement.appendChild(emptyItem);
      }
      
      // Ajouter l'événement de clic sur le déclencheur
      this.triggerElement.addEventListener('click', (event) => {
        if (!this.disabled) {
          this.toggle();
          event.stopPropagation();
        }
      });
      
      // Assembler le composant
      this.element.appendChild(this.triggerElement);
      this.element.appendChild(this.menuElement);
      
      return this.element;
    }
  
    /**
     * Ouvre le menu déroulant
     */
    open() {
      if (this.isOpen || this.disabled) return;
      
      // Ajouter la classe active
      this.element.classList.add('active');
      this.menuElement.classList.add('active');
      this.triggerElement.setAttribute('aria-expanded', 'true');
      
      // Ajouter l'écouteur de clic sur le document
      document.addEventListener('click', this.documentClickHandler);
      
      this.isOpen = true;
    }
  
    /**
     * Ferme le menu déroulant
     */
    close() {
      if (!this.isOpen) return;
      
      // Retirer la classe active
      this.element.classList.remove('active');
      this.menuElement.classList.remove('active');
      this.triggerElement.setAttribute('aria-expanded', 'false');
      
      // Retirer l'écouteur de clic sur le document
      document.removeEventListener('click', this.documentClickHandler);
      
      this.isOpen = false;
    }
  
    /**
     * Bascule l'état du menu déroulant
     */
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  
    /**
     * Gère le clic sur un élément du menu
     * @param {Object} item - Élément cliqué
     * @param {Event} event - Événement de clic
     * @private
     */
    _onItemClick(item, event) {
      // Appeler le callback onSelect
      if (this.onSelect && typeof this.onSelect === 'function') {
        this.onSelect(item);
      }
      
      // Mettre à jour l'élément sélectionné
      this.selectedId = item.id;
      
      // Mettre à jour l'interface
      this._updateSelection();
      
      // Fermer le menu si nécessaire
      if (this.closeOnSelect) {
        this.close();
      }
      
      // Empêcher la propagation pour éviter la fermeture immédiate
      event.stopPropagation();
    }
  
    /**
     * Met à jour l'affichage de la sélection
     * @private
     */
    _updateSelection() {
      // Mettre à jour les classes des éléments du menu
      if (this.menuElement) {
        const items = this.menuElement.querySelectorAll('.dropdown-item');
        
        items.forEach(item => {
          const itemId = item.getAttribute('data-id');
          
          if (itemId === this.selectedId) {
            item.classList.add('selected');
            
            // Ajouter un indicateur de sélection s'il n'existe pas
            if (!item.querySelector('.dropdown-item-selected')) {
              const checkmark = document.createElement('span');
              checkmark.className = 'dropdown-item-selected';
              checkmark.textContent = '✓';
              item.appendChild(checkmark);
            }
          } else {
            item.classList.remove('selected');
            
            // Supprimer l'indicateur de sélection s'il existe
            const checkmark = item.querySelector('.dropdown-item-selected');
            if (checkmark) {
              checkmark.remove();
            }
          }
        });
      }
      
      // Mettre à jour le texte du déclencheur si c'est une chaîne
      if (typeof this.trigger === 'string' && this.triggerElement) {
        const selectedItem = this.items.find(item => item.id === this.selectedId);
        
        if (selectedItem) {
          const triggerText = this.triggerElement.querySelector('.dropdown-trigger-text');
          
          if (triggerText) {
            triggerText.textContent = selectedItem.text || selectedItem.id;
          }
        }
      }
    }
  
    /**
     * Gère le clic sur le document
     * @param {Event} event - Événement de clic
     * @private
     */
    _handleDocumentClick(event) {
      // Fermer le menu si le clic est à l'extérieur
      if (this.element && !this.element.contains(event.target)) {
        this.close();
      }
    }
  
    /**
     * Sélectionne un élément par son ID
     * @param {string} id - ID de l'élément à sélectionner
     */
    select(id) {
      const item = this.items.find(item => item.id === id);
      
      if (item && !item.disabled) {
        this.selectedId = id;
        this._updateSelection();
        
        // Appeler le callback onSelect
        if (this.onSelect && typeof this.onSelect === 'function') {
          this.onSelect(item);
        }
      }
    }
  
    /**
     * Met à jour les éléments du menu
     * @param {Array} items - Nouveaux éléments
     */
    updateItems(items) {
      this.items = items || [];
      
      if (this.menuElement) {
        // Vider le menu
        this.menuElement.innerHTML = '';
        
        // Ajouter les nouveaux éléments
        this.items.forEach(item => {
          const menuItem = document.createElement('div');
          menuItem.className = 'dropdown-item';
          menuItem.setAttribute('role', 'menuitem');
          menuItem.setAttribute('data-id', item.id);
          
          if (item.id === this.selectedId) {
            menuItem.classList.add('selected');
          }
          
          if (item.disabled) {
            menuItem.classList.add('disabled');
          }
          
          // Si l'élément a une icône
          if (item.icon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'dropdown-item-icon';
            
            // Utiliser le composant Button pour récupérer l'icône
            if (window.components.Button) {
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
            
            menuItem.appendChild(iconElement);
          }
          
          // Ajouter le texte
          const textElement = document.createElement('span');
          textElement.className = 'dropdown-item-text';
          textElement.textContent = item.text || item.id;
          menuItem.appendChild(textElement);
          
          // Ajouter un indicateur de sélection si nécessaire
          if (item.id === this.selectedId) {
            const checkmark = document.createElement('span');
            checkmark.className = 'dropdown-item-selected';
            checkmark.textContent = '✓';
            menuItem.appendChild(checkmark);
          }
          
          // Ajouter l'événement de clic
          if (!item.disabled) {
            menuItem.addEventListener('click', (event) => {
              this._onItemClick(item, event);
            });
          }
          
          this.menuElement.appendChild(menuItem);
        });
        
        // Si le menu est vide, ajouter un message
        if (this.items.length === 0) {
          const emptyItem = document.createElement('div');
          emptyItem.className = 'dropdown-item dropdown-item-empty';
          emptyItem.textContent = 'Aucun élément';
          this.menuElement.appendChild(emptyItem);
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
          if (this.triggerElement) {
            this.triggerElement.disabled = true;
          }
          
          // Fermer le menu s'il est ouvert
          if (this.isOpen) {
            this.close();
          }
        } else {
          this.element.classList.remove('disabled');
          if (this.triggerElement) {
            this.triggerElement.disabled = false;
          }
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
      
      document.removeEventListener('click', this.documentClickHandler);
      
      if (this.element) {
        // Supprimer les écouteurs d'événements
        const clone = this.element.cloneNode(true);
        if (this.element.parentNode) {
          this.element.parentNode.replaceChild(clone, this.element);
        }
        
        this.element = null;
        this.triggerElement = null;
        this.menuElement = null;
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Dropdown = Dropdown;