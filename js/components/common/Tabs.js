/**
 * Composant Tabs - Système d'onglets
 * Fichier: js/components/common/Tabs.js
 */

class Tabs {
  /**
   * Constructeur du composant Tabs
   * @param {Object} options - Options de configuration
   * @param {Array} options.tabs - Onglets à afficher
   * @param {string} options.activeTab - ID de l'onglet actif
   * @param {string} options.position - Position des onglets (top, bottom, left, right)
   * @param {string} options.size - Taille des onglets (small, medium, large)
   * @param {boolean} options.justified - Si true, les onglets prennent toute la largeur disponible
   * @param {string} options.type - Type d'onglets (default, pills, underline)
   * @param {boolean} options.closable - Si true, les onglets peuvent être fermés
   * @param {boolean} options.scrollable - Si true, les onglets défilent horizontalement
   * @param {string} options.className - Classes CSS additionnelles
   * @param {Function} options.onTabChange - Callback lors du changement d'onglet
   * @param {Function} options.onTabClose - Callback lors de la fermeture d'un onglet
   */
  constructor(options = {}) {
    this.tabs = options.tabs || [];
    this.activeTab = options.activeTab || (this.tabs.length > 0 ? this.tabs[0].id : '');
    this.position = options.position || 'top';
    this.size = options.size || 'medium';
    this.justified = options.justified !== undefined ? options.justified : false;
    this.type = options.type || 'default';
    this.closable = options.closable !== undefined ? options.closable : false;
    this.scrollable = options.scrollable !== undefined ? options.scrollable : false;
    this.className = options.className || '';
    this.onTabChange = options.onTabChange || (() => {});
    this.onTabClose = options.onTabClose || (() => {});
    
    this.element = null;
    this.tabsContainer = null;
    this.contentsContainer = null;
    this.scrollLeftButton = null;
    this.scrollRightButton = null;
  }

  /**
   * Génère et retourne l'élément HTML du système d'onglets
   * @returns {HTMLElement} L'élément du système d'onglets
   */
  render() {
    // Créer l'élément principal
    this.element = document.createElement('div');
    
    // Construire les classes CSS
    let cssClasses = [
      'tabs-component',
      `tabs-${this.position}`,
      `tabs-${this.size}`,
      `tabs-${this.type}`
    ];
    
    if (this.justified) cssClasses.push('tabs-justified');
    if (this.scrollable) cssClasses.push('tabs-scrollable');
    if (this.className) cssClasses.push(this.className);
    
    this.element.className = cssClasses.join(' ');
    
    // Créer le conteneur des onglets
    this._createTabsContainer();
    
    // Créer le conteneur des contenus
    this._createContentsContainer();
    
    return this.element;
  }
  
  /**
   * Active un onglet par son ID
   * @param {string} tabId - ID de l'onglet à activer
   * @param {boolean} fireCallback - Si true, exécute le callback onTabChange
   * @returns {Tabs} L'instance courante pour chaînage
   */
  activateTab(tabId, fireCallback = true) {
    // Vérifier si l'onglet existe
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) return this;
    
    this.activeTab = tabId;
    
    // Mettre à jour l'affichage si l'élément existe
    if (this.tabsContainer && this.contentsContainer) {
      // Onglets
      const tabElements = this.tabsContainer.querySelectorAll('.tab-item');
      tabElements.forEach(tabElement => {
        if (tabElement.dataset.id === tabId) {
          tabElement.classList.add('active');
        } else {
          tabElement.classList.remove('active');
        }
      });
      
      // Contenus
      const contentElements = this.contentsContainer.querySelectorAll('.tab-content');
      contentElements.forEach(contentElement => {
        if (contentElement.dataset.id === tabId) {
          contentElement.classList.add('active');
        } else {
          contentElement.classList.remove('active');
        }
      });
      
      // Faire défiler jusqu'à l'onglet actif si scrollable
      if (this.scrollable) {
        const activeTabElement = this.tabsContainer.querySelector(`.tab-item[data-id="${tabId}"]`);
        if (activeTabElement) {
          this._scrollToTab(activeTabElement);
        }
      }
    }
    
    // Exécuter le callback si demandé
    if (fireCallback) {
      this.onTabChange(tabId, tab);
    }
    
    return this;
  }
  
  /**
   * Ajoute un nouvel onglet
   * @param {Object} tab - Données de l'onglet à ajouter
   * @param {boolean} activate - Si true, active l'onglet après ajout
   * @returns {Tabs} L'instance courante pour chaînage
   */
  addTab(tab, activate = true) {
    // Vérifier si l'ID est unique
    const exists = this.tabs.some(t => t.id === tab.id);
    if (exists) return this;
    
    // Ajouter l'onglet aux données
    this.tabs.push(tab);
    
    // Ajouter l'onglet à l'interface si elle existe
    if (this.tabsContainer && this.contentsContainer) {
      // Créer l'élément onglet
      const tabElement = this._createTabElement(tab);
      this.tabsContainer.querySelector('.tabs-list').appendChild(tabElement);
      
      // Créer l'élément contenu
      const contentElement = this._createContentElement(tab);
      this.contentsContainer.appendChild(contentElement);
      
      // Mettre à jour les boutons de défilement si nécessaire
      if (this.scrollable) {
        this._updateScrollButtons();
      }
    }
    
    // Activer l'onglet si demandé
    if (activate) {
      this.activateTab(tab.id);
    }
    
    return this;
  }
  
  /**
   * Supprime un onglet par son ID
   * @param {string} tabId - ID de l'onglet à supprimer
   * @returns {Tabs} L'instance courante pour chaînage
   */
  removeTab(tabId) {
    // Vérifier si l'onglet existe
    const index = this.tabs.findIndex(tab => tab.id === tabId);
    if (index === -1) return this;
    
    // Déterminer l'onglet à activer après suppression
    let nextActiveTab = null;
    if (this.activeTab === tabId && this.tabs.length > 1) {
      nextActiveTab = this.tabs[index + 1] || this.tabs[index - 1];
    }
    
    // Supprimer l'onglet des données
    this.tabs.splice(index, 1);
    
    // Supprimer l'onglet de l'interface si elle existe
    if (this.tabsContainer && this.contentsContainer) {
      // Supprimer l'élément onglet
      const tabElement = this.tabsContainer.querySelector(`.tab-item[data-id="${tabId}"]`);
      if (tabElement) {
        tabElement.parentNode.removeChild(tabElement);
      }
      
      // Supprimer l'élément contenu
      const contentElement = this.contentsContainer.querySelector(`.tab-content[data-id="${tabId}"]`);
      if (contentElement) {
        this.contentsContainer.removeChild(contentElement);
      }
      
      // Mettre à jour les boutons de défilement si nécessaire
      if (this.scrollable) {
        this._updateScrollButtons();
      }
    }
    
    // Activer le nouvel onglet si nécessaire
    if (nextActiveTab) {
      this.activateTab(nextActiveTab.id);
    }
    
    return this;
  }
  
  /**
   * Met à jour le contenu d'un onglet
   * @param {string} tabId - ID de l'onglet à mettre à jour
   * @param {string|HTMLElement} content - Nouveau contenu
   * @returns {Tabs} L'instance courante pour chaînage
   */
  updateTabContent(tabId, content) {
    // Vérifier si l'onglet existe
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) return this;
    
    // Mettre à jour les données
    tab.content = content;
    
    // Mettre à jour l'interface si elle existe
    if (this.contentsContainer) {
      const contentElement = this.contentsContainer.querySelector(`.tab-content[data-id="${tabId}"]`);
      if (contentElement) {
        // Vider le contenu actuel
        contentElement.innerHTML = '';
        
        // Ajouter le nouveau contenu
        if (content instanceof HTMLElement) {
          contentElement.appendChild(content);
        } else if (typeof content === 'string') {
          contentElement.innerHTML = content;
        }
      }
    }
    
    return this;
  }
  
  /**
   * Met à jour la notification d'un onglet
   * @param {string} tabId - ID de l'onglet
   * @param {string|number} notification - Contenu de la notification (null pour masquer)
   * @returns {Tabs} L'instance courante pour chaînage
   */
  updateTabNotification(tabId, notification) {
    // Vérifier si l'onglet existe
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) return this;
    
    // Mettre à jour les données
    tab.notification = notification;
    
    // Mettre à jour l'interface si elle existe
    if (this.tabsContainer) {
      const tabElement = this.tabsContainer.querySelector(`.tab-item[data-id="${tabId}"]`);
      if (tabElement) {
        let badge = tabElement.querySelector('.tab-notification');
        
        if (notification) {
          // Créer ou mettre à jour le badge
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-notification';
            tabElement.appendChild(badge);
          }
          badge.textContent = notification;
        } else if (badge) {
          // Supprimer le badge
          tabElement.removeChild(badge);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Nettoie les ressources utilisées par le composant
   */
  destroy() {
    // Nettoyer les écouteurs d'événements
    if (this.tabsContainer) {
      const tabElements = this.tabsContainer.querySelectorAll('.tab-item');
      tabElements.forEach(tabElement => {
        tabElement.removeEventListener('click', tabElement._clickHandler);
        
        const closeButton = tabElement.querySelector('.tab-close');
        if (closeButton) {
          closeButton.removeEventListener('click', closeButton._clickHandler);
        }
      });
      
      if (this.scrollLeftButton) {
        this.scrollLeftButton.removeEventListener('click', this._handleScrollLeft);
      }
      
      if (this.scrollRightButton) {
        this.scrollRightButton.removeEventListener('click', this._handleScrollRight);
      }
    }
    
    // Supprimer l'élément du DOM s'il est attaché
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Réinitialiser les références
    this.element = null;
    this.tabsContainer = null;
    this.contentsContainer = null;
    this.scrollLeftButton = null;
    this.scrollRightButton = null;
  }
  
  /* Méthodes privées */
  
  /**
   * Crée le conteneur des onglets
   * @private
   */
  _createTabsContainer() {
    this.tabsContainer = document.createElement('div');
    this.tabsContainer.className = 'tabs-header';
    
    // Ajouter les boutons de défilement si nécessaire
    if (this.scrollable) {
      // Bouton de défilement gauche
      this.scrollLeftButton = document.createElement('button');
      this.scrollLeftButton.type = 'button';
      this.scrollLeftButton.className = 'tabs-scroll-button tabs-scroll-left';
      this.scrollLeftButton.innerHTML = '<span class="arrow-left"></span>';
      this.scrollLeftButton._handleScrollLeft = this._handleScrollLeft.bind(this);
      this.scrollLeftButton.addEventListener('click', this.scrollLeftButton._handleScrollLeft);
      this.scrollLeftButton.disabled = true; // Désactivé au début
      this.tabsContainer.appendChild(this.scrollLeftButton);
    }
    
    // Créer la liste des onglets
    const tabsList = document.createElement('div');
    tabsList.className = 'tabs-list';
    
    // Ajouter chaque onglet
    this.tabs.forEach(tab => {
      const tabElement = this._createTabElement(tab);
      tabsList.appendChild(tabElement);
    });
    
    this.tabsContainer.appendChild(tabsList);
    
    // Ajouter le bouton de défilement droit si nécessaire
    if (this.scrollable) {
      this.scrollRightButton = document.createElement('button');
      this.scrollRightButton.type = 'button';
      this.scrollRightButton.className = 'tabs-scroll-button tabs-scroll-right';
      this.scrollRightButton.innerHTML = '<span class="arrow-right"></span>';
      this.scrollRightButton._handleScrollRight = this._handleScrollRight.bind(this);
      this.scrollRightButton.addEventListener('click', this.scrollRightButton._handleScrollRight);
      this.tabsContainer.appendChild(this.scrollRightButton);
    }
    
    // Ajouter au composant principal
    this.element.appendChild(this.tabsContainer);
    
    // Mettre à jour les boutons de défilement après rendu
    if (this.scrollable) {
      // Utiliser setTimeout pour s'assurer que les dimensions sont calculées
      setTimeout(() => {
        this._updateScrollButtons();
      }, 0);
    }
  }
  
  /**
   * Crée le conteneur des contenus
   * @private
   */
  _createContentsContainer() {
    this.contentsContainer = document.createElement('div');
    this.contentsContainer.className = 'tabs-contents';
    
    // Ajouter chaque contenu
    this.tabs.forEach(tab => {
      const contentElement = this._createContentElement(tab);
      this.contentsContainer.appendChild(contentElement);
    });
    
    // Ajouter au composant principal
    this.element.appendChild(this.contentsContainer);
  }
  
  /**
   * Crée l'élément HTML d'un onglet
   * @param {Object} tab - Données de l'onglet
   * @returns {HTMLElement} L'élément de l'onglet
   * @private
   */
  _createTabElement(tab) {
    const tabElement = document.createElement('div');
    tabElement.className = `tab-item ${this.activeTab === tab.id ? 'active' : ''}`;
    tabElement.dataset.id = tab.id;
    
    // Icône si présente
    if (tab.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `tab-icon ${tab.icon}`;
      tabElement.appendChild(iconElement);
    }
    
    // Libellé
    const labelElement = document.createElement('span');
    labelElement.className = 'tab-label';
    labelElement.textContent = tab.label || 'Onglet';
    tabElement.appendChild(labelElement);
    
    // Notification si présente
    if (tab.notification) {
      const notificationElement = document.createElement('span');
      notificationElement.className = 'tab-notification';
      notificationElement.textContent = tab.notification;
      tabElement.appendChild(notificationElement);
    }
    
    // Bouton de fermeture si l'onglet est fermable
    if ((this.closable && tab.closable !== false) || tab.closable === true) {
      const closeButton = document.createElement('span');
      closeButton.className = 'tab-close';
      closeButton.innerHTML = '&times;';
      closeButton._clickHandler = (e) => {
        e.stopPropagation();
        this._handleTabClose(tab.id);
      };
      closeButton.addEventListener('click', closeButton._clickHandler);
      tabElement.appendChild(closeButton);
    }
    
    // Gestionnaire de clic sur l'onglet
    tabElement._clickHandler = () => {
      this.activateTab(tab.id);
    };
    tabElement.addEventListener('click', tabElement._clickHandler);
    
    return tabElement;
  }
  
  /**
   * Crée l'élément HTML du contenu d'un onglet
   * @param {Object} tab - Données de l'onglet
   * @returns {HTMLElement} L'élément du contenu
   * @private
   */
  _createContentElement(tab) {
    const contentElement = document.createElement('div');
    contentElement.className = `tab-content ${this.activeTab === tab.id ? 'active' : ''}`;
    contentElement.dataset.id = tab.id;
    
    // Ajouter le contenu
    if (tab.content instanceof HTMLElement) {
      contentElement.appendChild(tab.content);
    } else if (typeof tab.content === 'string') {
      contentElement.innerHTML = tab.content;
    }
    
    return contentElement;
  }
  
  /**
   * Gère la fermeture d'un onglet
   * @param {string} tabId - ID de l'onglet à fermer
   * @private
   */
  _handleTabClose(tabId) {
    // Exécuter le callback
    const shouldClose = this.onTabClose(tabId);
    
    // Fermer l'onglet si le callback ne retourne pas false
    if (shouldClose !== false) {
      this.removeTab(tabId);
    }
  }
  
  /**
   * Gère le défilement vers la gauche
   * @private
   */
  _handleScrollLeft() {
    if (!this.tabsContainer) return;
    
    const tabsList = this.tabsContainer.querySelector('.tabs-list');
    const scrollAmount = tabsList.clientWidth * 0.5; // Défiler de 50% de la largeur visible
    tabsList.scrollLeft -= scrollAmount;
    
    // Mettre à jour les boutons de défilement
    setTimeout(() => {
      this._updateScrollButtons();
    }, 100);
  }
  
  /**
   * Gère le défilement vers la droite
   * @private
   */
  _handleScrollRight() {
    if (!this.tabsContainer) return;
    
    const tabsList = this.tabsContainer.querySelector('.tabs-list');
    const scrollAmount = tabsList.clientWidth * 0.5; // Défiler de 50% de la largeur visible
    tabsList.scrollLeft += scrollAmount;
    
    // Mettre à jour les boutons de défilement
    setTimeout(() => {
      this._updateScrollButtons();
    }, 100);
  }
  
  /**
   * Met à jour l'état des boutons de défilement
   * @private
   */
  _updateScrollButtons() {
    if (!this.scrollable || !this.tabsContainer) return;
    
    const tabsList = this.tabsContainer.querySelector('.tabs-list');
    
    // Calculer si le défilement est possible
    const canScrollLeft = tabsList.scrollLeft > 0;
    const canScrollRight = tabsList.scrollLeft < (tabsList.scrollWidth - tabsList.clientWidth);
    
    // Mettre à jour l'état des boutons
    this.scrollLeftButton.disabled = !canScrollLeft;
    this.scrollRightButton.disabled = !canScrollRight;
  }
  
  /**
   * Fait défiler jusqu'à un onglet spécifique
   * @param {HTMLElement} tabElement - Élément de l'onglet
   * @private
   */
  _scrollToTab(tabElement) {
    if (!this.scrollable || !this.tabsContainer) return;
    
    const tabsList = this.tabsContainer.querySelector('.tabs-list');
    
    // Obtenir la position de l'onglet
    const tabRect = tabElement.getBoundingClientRect();
    const tabsListRect = tabsList.getBoundingClientRect();
    
    // Vérifier si l'onglet est visible
    const isVisible = (tabRect.left >= tabsListRect.left) && 
                      (tabRect.right <= tabsListRect.right);
    
    if (!isVisible) {
      // Calculer la position de défilement
      if (tabRect.left < tabsListRect.left) {
        // Onglet à gauche de la zone visible
        tabsList.scrollLeft += (tabRect.left - tabsListRect.left);
      } else {
        // Onglet à droite de la zone visible
        tabsList.scrollLeft += (tabRect.right - tabsListRect.right);
      }
      
      // Mettre à jour les boutons de défilement
      setTimeout(() => {
        this._updateScrollButtons();
      }, 100);
    }
  }
}

// Exposer le composant dans l'espace de nommage global
window.components = window.components || {};
window.components.Tabs = Tabs;