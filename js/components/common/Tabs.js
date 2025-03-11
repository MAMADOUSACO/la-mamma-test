/**
 * Composant Tabs - Système d'onglets
 * 
 * Utilisation:
 * const tabs = new Tabs({
 *   tabs: [
 *     { id: 'tab1', title: 'Premier onglet', content: 'Contenu du premier onglet' },
 *     { id: 'tab2', title: 'Deuxième onglet', content: 'Contenu du deuxième onglet' }
 *   ],
 *   activeTab: 'tab1',
 *   onChange: (tabId) => console.log(`Onglet actif: ${tabId}`)
 * });
 * container.appendChild(tabs.render());
 */

class Tabs {
    /**
     * Constructeur
     * @param {Object} options - Options des onglets
     * @param {Array} options.tabs - Liste des onglets
     * @param {string} options.activeTab - ID de l'onglet actif
     * @param {Function} options.onChange - Fonction appelée au changement d'onglet
     * @param {string} options.orientation - Orientation des onglets (horizontal, vertical)
     * @param {boolean} options.animated - Animer les transitions
     * @param {string} options.className - Classes CSS additionnelles
     * @param {string} options.id - ID du composant
     * @param {boolean} options.swipeable - Permettre le swipe sur mobile
     */
    constructor(options = {}) {
      this.tabs = options.tabs || [];
      this.activeTabId = options.activeTab || (this.tabs[0] ? this.tabs[0].id : null);
      this.onChange = options.onChange || null;
      this.orientation = options.orientation || 'horizontal';
      this.animated = options.animated !== false;
      this.className = options.className || '';
      this.id = options.id || 'tabs-' + Date.now();
      this.swipeable = options.swipeable !== false;
      
      this.element = null;
      this.tabsNavElement = null;
      this.tabsContentElement = null;
      this.tabButtons = {};
      this.tabContents = {};
      
      this.touchStartX = 0;
      this.touchEndX = 0;
    }
  
    /**
     * Rend le composant d'onglets
     * @returns {HTMLElement} - Élément conteneur des onglets
     */
    render() {
      // Créer le conteneur principal
      this.element = document.createElement('div');
      this.element.className = `tabs tabs-${this.orientation}`;
      this.element.id = this.id;
      
      if (this.className) {
        this.className.split(' ').forEach(cls => {
          if (cls) {
            this.element.classList.add(cls);
          }
        });
      }
      
      if (this.animated) {
        this.element.classList.add('tabs-animated');
      }
      
      // Créer la barre de navigation des onglets
      this.tabsNavElement = document.createElement('div');
      this.tabsNavElement.className = 'tabs-nav';
      
      // Créer le conteneur de contenu des onglets
      this.tabsContentElement = document.createElement('div');
      this.tabsContentElement.className = 'tabs-content';
      
      // Créer les onglets
      this.tabs.forEach(tab => this._createTab(tab));
      
      // Activer l'onglet initial
      this._activateTab(this.activeTabId);
      
      // Assembler le composant
      this.element.appendChild(this.tabsNavElement);
      this.element.appendChild(this.tabsContentElement);
      
      // Activer le swipe si nécessaire
      if (this.swipeable && this.orientation === 'horizontal') {
        this._enableSwipe();
      }
      
      return this.element;
    }
  
    /**
     * Crée un onglet
     * @param {Object} tab - Configuration de l'onglet
     * @private
     */
    _createTab(tab) {
      // Créer le bouton de l'onglet
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-controls', `tab-content-${tab.id}`);
      tabButton.id = `tab-button-${tab.id}`;
      
      // Ajouter l'icône si spécifiée
      if (tab.icon) {
        const iconElement = document.createElement('span');
        iconElement.className = 'tab-icon';
        
        // Utiliser le composant Button pour récupérer l'icône
        if (window.components.Button) {
          const tempButton = new window.components.Button({ icon: tab.icon, isIconOnly: true });
          const tempElement = tempButton.render();
          const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
          
          if (iconWrapper) {
            iconElement.innerHTML = iconWrapper.innerHTML;
          }
        } else {
          // Fallback
          iconElement.classList.add('icon', `icon-${tab.icon}`);
        }
        
        tabButton.appendChild(iconElement);
      }
      
      // Ajouter le titre
      const titleElement = document.createElement('span');
      titleElement.className = 'tab-title';
      titleElement.textContent = tab.title || tab.id;
      tabButton.appendChild(titleElement);
      
      // Ajouter la notification si spécifiée
      if (tab.notification) {
        const notificationElement = document.createElement('span');
        notificationElement.className = 'tab-notification';
        
        if (typeof tab.notification === 'number') {
          notificationElement.textContent = tab.notification > 99 ? '99+' : tab.notification;
        } else {
          notificationElement.textContent = tab.notification;
        }
        
        tabButton.appendChild(notificationElement);
      }
      
      // Attacher l'événement de clic
      tabButton.addEventListener('click', () => this.activateTab(tab.id));
      
      // Créer le contenu de l'onglet
      const tabContent = document.createElement('div');
      tabContent.className = 'tab-content';
      tabContent.id = `tab-content-${tab.id}`;
      tabContent.setAttribute('role', 'tabpanel');
      tabContent.setAttribute('aria-labelledby', `tab-button-${tab.id}`);
      
      // Ajouter le contenu
      if (typeof tab.content === 'string') {
        tabContent.innerHTML = tab.content;
      } else if (tab.content instanceof HTMLElement) {
        tabContent.appendChild(tab.content);
      }
      
      // Stocker les références
      this.tabButtons[tab.id] = tabButton;
      this.tabContents[tab.id] = tabContent;
      
      // Ajouter au DOM
      this.tabsNavElement.appendChild(tabButton);
      this.tabsContentElement.appendChild(tabContent);
    }
  
    /**
     * Active un onglet
     * @param {string} tabId - ID de l'onglet à activer
     */
    activateTab(tabId) {
      if (tabId === this.activeTabId) {
        return;
      }
      
      if (!this.tabButtons[tabId] || !this.tabContents[tabId]) {
        console.error(`Onglet introuvable: ${tabId}`);
        return;
      }
      
      this._activateTab(tabId);
      
      // Appeler le callback onChange
      if (this.onChange && typeof this.onChange === 'function') {
        this.onChange(tabId);
      }
    }
  
    /**
     * Active un onglet (implémentation interne)
     * @param {string} tabId - ID de l'onglet à activer
     * @private
     */
    _activateTab(tabId) {
      // Désactiver tous les onglets
      Object.keys(this.tabButtons).forEach(id => {
        this.tabButtons[id].classList.remove('active');
        this.tabContents[id].classList.remove('active');
      });
      
      // Activer l'onglet demandé
      this.tabButtons[tabId].classList.add('active');
      this.tabContents[tabId].classList.add('active');
      
      // Mettre à jour l'onglet actif
      this.activeTabId = tabId;
    }
  
    /**
     * Active le swipe sur mobile
     * @private
     */
    _enableSwipe() {
      // Ajouter les écouteurs d'événements tactiles
      this.tabsContentElement.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      });
      
      this.tabsContentElement.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this._handleSwipe();
      });
    }
  
    /**
     * Gère le swipe
     * @private
     */
    _handleSwipe() {
      // Seuil minimal pour considérer un swipe
      const threshold = 50;
      
      // Déterminer la direction du swipe
      const diff = this.touchEndX - this.touchStartX;
      
      if (Math.abs(diff) < threshold) {
        return;
      }
      
      // Trouver l'index de l'onglet actif
      const tabIds = Object.keys(this.tabButtons);
      const currentIndex = tabIds.indexOf(this.activeTabId);
      
      if (diff > 0) {
        // Swipe vers la droite = onglet précédent
        if (currentIndex > 0) {
          this.activateTab(tabIds[currentIndex - 1]);
        }
      } else {
        // Swipe vers la gauche = onglet suivant
        if (currentIndex < tabIds.length - 1) {
          this.activateTab(tabIds[currentIndex + 1]);
        }
      }
    }
  
    /**
     * Ajoute un nouvel onglet
     * @param {Object} tab - Configuration de l'onglet
     */
    addTab(tab) {
      // Vérifier si l'ID existe déjà
      if (this.tabButtons[tab.id]) {
        console.error(`Un onglet avec l'ID ${tab.id} existe déjà`);
        return;
      }
      
      // Ajouter à la liste des onglets
      this.tabs.push(tab);
      
      // Créer l'onglet
      this._createTab(tab);
    }
  
    /**
     * Supprime un onglet
     * @param {string} tabId - ID de l'onglet à supprimer
     */
    removeTab(tabId) {
      // Vérifier si l'onglet existe
      if (!this.tabButtons[tabId]) {
        console.error(`Onglet introuvable: ${tabId}`);
        return;
      }
      
      // Supprimer les éléments du DOM
      this.tabsNavElement.removeChild(this.tabButtons[tabId]);
      this.tabsContentElement.removeChild(this.tabContents[tabId]);
      
      // Supprimer les références
      delete this.tabButtons[tabId];
      delete this.tabContents[tabId];
      
      // Mettre à jour la liste des onglets
      this.tabs = this.tabs.filter(tab => tab.id !== tabId);
      
      // Si c'était l'onglet actif, activer le premier onglet restant
      if (this.activeTabId === tabId && this.tabs.length > 0) {
        this.activateTab(this.tabs[0].id);
      }
    }
  
    /**
     * Met à jour le contenu d'un onglet
     * @param {string} tabId - ID de l'onglet
     * @param {string|HTMLElement} content - Nouveau contenu
     */
    updateTabContent(tabId, content) {
      // Vérifier si l'onglet existe
      if (!this.tabContents[tabId]) {
        console.error(`Onglet introuvable: ${tabId}`);
        return;
      }
      
      // Mettre à jour le contenu
      this.tabContents[tabId].innerHTML = '';
      
      if (typeof content === 'string') {
        this.tabContents[tabId].innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.tabContents[tabId].appendChild(content);
      }
      
      // Mettre à jour l'objet de configuration
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex !== -1) {
        this.tabs[tabIndex].content = content;
      }
    }
  
    /**
     * Met à jour la notification d'un onglet
     * @param {string} tabId - ID de l'onglet
     * @param {number|string|null} notification - Valeur de notification
     */
    updateTabNotification(tabId, notification) {
      // Vérifier si l'onglet existe
      if (!this.tabButtons[tabId]) {
        console.error(`Onglet introuvable: ${tabId}`);
        return;
      }
      
      // Trouver ou créer l'élément de notification
      let notificationElement = this.tabButtons[tabId].querySelector('.tab-notification');
      
      if (notification === null || notification === undefined) {
        // Supprimer la notification si elle existe
        if (notificationElement) {
          notificationElement.remove();
        }
      } else {
        // Créer l'élément s'il n'existe pas
        if (!notificationElement) {
          notificationElement = document.createElement('span');
          notificationElement.className = 'tab-notification';
          this.tabButtons[tabId].appendChild(notificationElement);
        }
        
        // Mettre à jour le contenu
        if (typeof notification === 'number') {
          notificationElement.textContent = notification > 99 ? '99+' : notification;
        } else {
          notificationElement.textContent = notification;
        }
      }
      
      // Mettre à jour l'objet de configuration
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex !== -1) {
        this.tabs[tabIndex].notification = notification;
      }
    }
  
    /**
     * Détruit le composant et ses écouteurs d'événements
     */
    destroy() {
      if (this.element) {
        // Supprimer les écouteurs d'événements
        Object.values(this.tabButtons).forEach(button => {
          button.replaceWith(button.cloneNode(true));
        });
        
        if (this.swipeable) {
          this.tabsContentElement.removeEventListener('touchstart', this._enableSwipe);
          this.tabsContentElement.removeEventListener('touchend', this._enableSwipe);
        }
        
        this.element = null;
        this.tabsNavElement = null;
        this.tabsContentElement = null;
        this.tabButtons = {};
        this.tabContents = {};
      }
    }
  }
  
  // Exporter le composant
  window.components = window.components || {};
  window.components.Tabs = Tabs;