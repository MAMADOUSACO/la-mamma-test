/**
 * Composant Footer - Pied de page de l'application
 * Fichier: js/components/layout/Footer.js
 */

class Footer {
    /**
     * Constructeur du composant Footer
     * @param {Object} options - Options de configuration
     * @param {string} options.copyright - Texte de copyright
     * @param {string} options.version - Version de l'application
     * @param {Array} options.links - Liens à afficher dans le footer
     * @param {boolean} options.showVersion - Afficher ou non la version
     * @param {boolean} options.fixed - Si true, le footer est fixé en bas de l'écran
     */
    constructor(options = {}) {
      this.copyright = options.copyright || '© 2025 LA MAMMA';
      this.version = options.version || 'v1.0';
      this.links = options.links || [];
      this.showVersion = options.showVersion !== undefined ? options.showVersion : true;
      this.fixed = options.fixed !== undefined ? options.fixed : false;
      
      this.element = null;
    }
  
    /**
     * Génère et retourne l'élément HTML du footer
     * @returns {HTMLElement} L'élément du footer
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('footer');
      this.element.className = `app-footer ${this.fixed ? 'fixed' : ''}`;
      
      // Créer le conteneur du contenu
      const container = document.createElement('div');
      container.className = 'footer-container';
      
      // Section copyright
      const copyrightSection = document.createElement('div');
      copyrightSection.className = 'footer-copyright';
      copyrightSection.textContent = this.copyright;
      
      // Section version (si activée)
      if (this.showVersion) {
        const versionSection = document.createElement('div');
        versionSection.className = 'footer-version';
        versionSection.textContent = this.version;
        container.appendChild(versionSection);
      }
      
      // Section liens (si présents)
      if (this.links.length > 0) {
        const linksSection = document.createElement('div');
        linksSection.className = 'footer-links';
        
        // Créer la liste des liens
        const linksList = document.createElement('ul');
        
        this.links.forEach((link, index) => {
          const linkItem = document.createElement('li');
          
          const linkElement = document.createElement('a');
          linkElement.href = link.url || '#';
          linkElement.textContent = link.label;
          
          if (link.onClick) {
            linkElement._clickHandler = (e) => {
              e.preventDefault();
              link.onClick();
            };
            linkElement.addEventListener('click', linkElement._clickHandler);
          }
          
          linkItem.appendChild(linkElement);
          linksList.appendChild(linkItem);
          
          // Ajouter un séparateur sauf pour le dernier élément
          if (index < this.links.length - 1) {
            const separator = document.createElement('li');
            separator.className = 'separator';
            separator.textContent = '|';
            linksList.appendChild(separator);
          }
        });
        
        linksSection.appendChild(linksList);
        container.appendChild(linksSection);
      }
      
      // Ajouter la section copyright
      container.appendChild(copyrightSection);
      
      // Assembler les éléments
      this.element.appendChild(container);
      
      // Ajouter au document pour les calculs de taille si fixe
      if (this.fixed) {
        document.body.style.paddingBottom = '50px'; // Hauteur approximative du footer
      }
      
      return this.element;
    }
    
    /**
     * Met à jour le texte de copyright
     * @param {string} copyright - Nouveau texte de copyright
     */
    setCopyright(copyright) {
      this.copyright = copyright;
      
      if (this.element) {
        const copyrightElement = this.element.querySelector('.footer-copyright');
        if (copyrightElement) {
          copyrightElement.textContent = copyright;
        }
      }
    }
    
    /**
     * Met à jour la version affichée
     * @param {string} version - Nouvelle version
     */
    setVersion(version) {
      this.version = version;
      
      if (this.element) {
        const versionElement = this.element.querySelector('.footer-version');
        if (versionElement) {
          versionElement.textContent = version;
        }
      }
    }
    
    /**
     * Met à jour les liens du footer
     * @param {Array} links - Nouveaux liens
     */
    setLinks(links) {
      this.links = links || [];
      
      // Nécessite un re-rendu complet car la structure des liens change
      if (this.element && this.element.parentNode) {
        const parent = this.element.parentNode;
        parent.removeChild(this.element);
        parent.appendChild(this.render());
      }
    }
    
    /**
     * Affiche ou masque la version
     * @param {boolean} show - Afficher ou masquer
     */
    toggleVersion(show) {
      this.showVersion = show;
      
      if (this.element) {
        const versionElement = this.element.querySelector('.footer-version');
        
        if (show && !versionElement) {
          // Créer l'élément version s'il n'existe pas
          const newVersionElement = document.createElement('div');
          newVersionElement.className = 'footer-version';
          newVersionElement.textContent = this.version;
          
          const container = this.element.querySelector('.footer-container');
          container.insertBefore(newVersionElement, container.firstChild);
        } else if (!show && versionElement) {
          // Supprimer l'élément version s'il existe
          versionElement.parentNode.removeChild(versionElement);
        }
      }
    }
    
    /**
     * Affiche ou masque le footer
     * @param {boolean} visible - Afficher ou masquer
     */
    setVisible(visible) {
      if (this.element) {
        this.element.style.display = visible ? 'block' : 'none';
        
        // Ajuster le padding du document si le footer est fixe
        if (this.fixed) {
          document.body.style.paddingBottom = visible ? '50px' : '0';
        }
      }
    }
    
    /**
     * Modifie l'état fixe/relatif du footer
     * @param {boolean} fixed - Si true, le footer est fixé en bas
     */
    setFixed(fixed) {
      this.fixed = fixed;
      
      if (this.element) {
        if (fixed) {
          this.element.classList.add('fixed');
          document.body.style.paddingBottom = '50px';
        } else {
          this.element.classList.remove('fixed');
          document.body.style.paddingBottom = '0';
        }
      }
    }
    
    /**
     * Ajoute un lien au footer
     * @param {Object} link - Lien à ajouter
     */
    addLink(link) {
      this.links.push(link);
      this.setLinks(this.links);
    }
    
    /**
     * Supprime un lien du footer
     * @param {string} label - Libellé du lien à supprimer
     */
    removeLink(label) {
      this.links = this.links.filter(link => link.label !== label);
      this.setLinks(this.links);
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Nettoyer les écouteurs d'événements des liens
      if (this.element) {
        const linkElements = this.element.querySelectorAll('.footer-links a');
        linkElements.forEach(link => {
          if (link._clickHandler) {
            link.removeEventListener('click', link._clickHandler);
          }
        });
      }
      
      // Supprimer l'élément du DOM s'il est attaché
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser le padding du document si le footer est fixe
      if (this.fixed) {
        document.body.style.paddingBottom = '0';
      }
      
      // Réinitialiser les références
      this.element = null;
    }
  }
  
  // Exposer le composant dans l'espace de nommage global
  window.components = window.components || {};
  window.components.Footer = Footer;