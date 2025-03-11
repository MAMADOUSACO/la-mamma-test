/**
 * Point d'entrée principal de l'application LA MAMMA
 * Initialise les différents services et composants
 */

// Namespace global pour l'application
window.LaMamma = window.LaMamma || {};

// Conteneurs pour les vues, composants et modules
window.views = {};
window.components = {};
window.modules = {};

/**
 * Application principale
 */
class App {
  /**
   * Constructeur
   */
  constructor() {
    this.initialized = false;
    this.services = {};
    this.currentModule = null;
    this.loadingElement = null;
  }

  /**
   * Initialise l'application
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('Initialisation de l\'application LA MAMMA...');
      
      // Afficher l'indicateur de chargement
      this._showLoading();
      
      // Initialiser la base de données
      await this._initDatabase();
      
      // Initialiser les services
      await this._initServices();
      
      // Initialiser le routeur
      this._initRouter();
      
      // Attacher les gestionnaires d'événements globaux
      this._attachEventListeners();
      
      // Marquer comme initialisé
      this.initialized = true;
      
      console.log('Application LA MAMMA initialisée');
      
      // Masquer l'indicateur de chargement
      this._hideLoading();
      
      // Vérifier la sauvegarde automatique
      this._checkAutoBackup();
      
      // Vérifier les alertes de stock
      this._checkStockAlerts();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'application', error);
      
      // Afficher un message d'erreur
      this._showErrorMessage('Erreur lors de l\'initialisation de l\'application');
    }
  }

  /**
   * Charge un module spécifique
   * @param {string} moduleName - Nom du module à charger
   * @returns {Promise<Object>} - Module chargé
   */
  async loadModule(moduleName) {
    try {
      console.log(`Chargement du module: ${moduleName}`);
      
      // Vérifier si le module existe
      if (!window.modules[moduleName]) {
        throw new Error(`Module non trouvé: ${moduleName}`);
      }
      
      // Initialiser le module s'il ne l'est pas déjà
      const module = window.modules[moduleName];
      
      if (typeof module.init === 'function' && !module.initialized) {
        await module.init();
        module.initialized = true;
      }
      
      // Définir comme module courant
      this.currentModule = module;
      
      return module;
    } catch (error) {
      console.error(`Erreur lors du chargement du module ${moduleName}`, error);
      
      // Afficher un message d'erreur
      this._showErrorMessage(`Erreur lors du chargement du module ${moduleName}`);
      
      return null;
    }
  }

  /**
   * Initialise la base de données
   * @returns {Promise<void>}
   * @private
   */
  async _initDatabase() {
    try {
      console.log('Initialisation de la base de données...');
      
      // Attendre que la base de données soit prête
      await window.db.init();
      
      console.log('Base de données initialisée');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données', error);
      throw error;
    }
  }

  /**
   * Initialise les services
   * @returns {Promise<void>}
   * @private
   */
  async _initServices() {
    try {
      console.log('Initialisation des services...');
      
      // Stocker les références aux services
      this.services.auth = window.services.auth;
      this.services.notification = window.services.notification;
      this.services.alerts = window.services.alerts;
      this.services.analytics = window.services.analytics;
      
      // Initialiser le service d'authentification s'il ne l'est pas déjà
      if (this.services.auth && typeof this.services.auth.init === 'function') {
        await this.services.auth.init();
      }
      
      // Initialiser le service de notification s'il ne l'est pas déjà
      if (this.services.notification && typeof this.services.notification.init === 'function') {
        this.services.notification.init();
      }
      
      console.log('Services initialisés');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services', error);
      throw error;
    }
  }

  /**
   * Initialise le routeur
   * @private
   */
  _initRouter() {
    // Le routeur s'initialise automatiquement via DOMContentLoaded
    // Voir js/router.js
  }

  /**
   * Attache les gestionnaires d'événements globaux
   * @private
   */
  _attachEventListeners() {
    // Gérer les erreurs non capturées
    window.addEventListener('error', this._handleGlobalError.bind(this));
    
    // Gérer les déconnexions automatiques
    document.addEventListener('auto-logout', this._handleAutoLogout.bind(this));
    
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
    
    // Gérer l'orientation de l'écran (pour les tablettes)
    window.addEventListener('orientationchange', this._handleOrientationChange.bind(this));
    
    // Événement de perte de connexion
    window.addEventListener('online', this._handleConnectionChange.bind(this));
    window.addEventListener('offline', this._handleConnectionChange.bind(this));
  }

  /**
   * Gère les erreurs globales non capturées
   * @param {ErrorEvent} event - Événement d'erreur
   * @private
   */
  _handleGlobalError(event) {
    console.error('Erreur non capturée', event.error || event.message);
    
    // Afficher une notification si disponible
    if (this.services.notification) {
      this.services.notification.error('Une erreur inattendue s\'est produite.');
    }
  }

  /**
   * Gère les événements de déconnexion automatique
   * @param {CustomEvent} event - Événement de déconnexion
   * @private
   */
  _handleAutoLogout(event) {
    // Afficher une notification si disponible
    if (this.services.notification) {
      this.services.notification.warning(event.detail.message || 'Vous avez été déconnecté pour inactivité.');
    }
    
    // Rediriger vers la page de connexion
    if (window.router) {
      window.router.navigate('/login');
    }
  }

  /**
   * Gère les raccourcis clavier globaux
   * @param {KeyboardEvent} event - Événement clavier
   * @private
   */
  _handleKeyDown(event) {
    // Exemple: Alt+N pour nouvelle commande
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      if (window.router) {
        window.router.navigate('/orders/new');
      }
    }
    
    // Exemple: Alt+H pour retour à l'accueil
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      if (window.router) {
        window.router.navigate('/dashboard');
      }
    }
    
    // Exemple: Alt+I pour inventaire
    if (event.altKey && event.key === 'i') {
      event.preventDefault();
      if (window.router) {
        window.router.navigate('/inventory');
      }
    }
    
    // Exemple: Échap pour fermer les modales
    if (event.key === 'Escape') {
      // Chercher une modale ouverte
      const openModal = document.querySelector('.modal.active');
      if (openModal) {
        const closeButton = openModal.querySelector('.modal-close');
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }

  /**
   * Gère les changements d'orientation de l'écran
   * @param {Event} event - Événement d'orientation
   * @private
   */
  _handleOrientationChange(event) {
    console.log('Changement d\'orientation détecté');
    
    // Ajouter une classe au body selon l'orientation
    if (window.orientation === 0 || window.orientation === 180) {
      // Portrait
      document.body.classList.add('portrait');
      document.body.classList.remove('landscape');
    } else {
      // Paysage
      document.body.classList.add('landscape');
      document.body.classList.remove('portrait');
    }
    
    // Déclencher un événement personnalisé
    document.dispatchEvent(new CustomEvent('app-orientation-change', {
      detail: {
        isPortrait: window.orientation === 0 || window.orientation === 180,
        isLandscape: window.orientation === 90 || window.orientation === -90
      }
    }));
  }

  /**
   * Gère les changements de connexion
   * @param {Event} event - Événement de connexion
   * @private
   */
  _handleConnectionChange(event) {
    const isOnline = navigator.onLine;
    console.log(`Statut de connexion: ${isOnline ? 'En ligne' : 'Hors ligne'}`);
    
    // Mettre à jour l'interface
    document.body.classList.toggle('offline', !isOnline);
    
    // Afficher une notification
    if (this.services.notification) {
      if (isOnline) {
        this.services.notification.success('Connexion rétablie');
      } else {
        this.services.notification.warning('Connexion perdue. L\'application continue de fonctionner en mode hors ligne.');
      }
    }
  }

  /**
   * Affiche l'indicateur de chargement
   * @private
   */
  _showLoading() {
    this.loadingElement = document.getElementById('loading-spinner');
    
    if (!this.loadingElement) {
      this.loadingElement = document.createElement('div');
      this.loadingElement.id = 'loading-spinner';
      this.loadingElement.className = 'loading-container';
      this.loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>Chargement de LA MAMMA...</p>
      `;
      document.body.appendChild(this.loadingElement);
    }
    
    this.loadingElement.style.display = 'flex';
  }

  /**
   * Masque l'indicateur de chargement
   * @private
   */
  _hideLoading() {
    if (this.loadingElement) {
      // Ajouter une transition de sortie
      this.loadingElement.style.opacity = '0';
      
      // Supprimer après la transition
      setTimeout(() => {
        if (this.loadingElement) {
          this.loadingElement.style.display = 'none';
        }
      }, 500);
    }
  }

  /**
   * Affiche un message d'erreur
   * @param {string} message - Message d'erreur
   * @private
   */
  _showErrorMessage(message) {
    if (this.services.notification) {
      this.services.notification.error(message);
    } else {
      alert(message);
    }
  }

  /**
   * Vérifie si une sauvegarde automatique est nécessaire
   * @private
   */
  async _checkAutoBackup() {
    try {
      // Vérifier si le service de sauvegarde est disponible
      if (window.utils.backup) {
        const backupNeeded = await window.utils.backup.checkAutoBackup();
        
        if (backupNeeded) {
          console.log('Sauvegarde automatique effectuée');
          
          if (this.services.notification) {
            this.services.notification.info('Une sauvegarde automatique a été effectuée');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la sauvegarde automatique', error);
    }
  }

  /**
   * Vérifie les alertes de stock
   * @private
   */
  async _checkStockAlerts() {
    try {
      // Attendre un peu pour ne pas surcharger le démarrage
      setTimeout(async () => {
        if (this.services.alerts) {
          const newAlerts = await this.services.alerts.checkAll();
          
          if (newAlerts.length > 0) {
            console.log(`${newAlerts.length} nouvelle(s) alerte(s) détectée(s)`);
            
            // Afficher une notification pour les alertes critiques
            const criticalAlerts = newAlerts.filter(alert => 
              alert.priority === 'critical' || alert.priority === 'high'
            );
            
            if (criticalAlerts.length > 0 && this.services.notification) {
              this.services.notification.warning(
                `${criticalAlerts.length} alerte(s) importante(s) nécessite(nt) votre attention`
              );
            }
          }
        }
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la vérification des alertes de stock', error);
    }
  }
}

// Créer et exporter l'instance de l'application
const app = new App();
window.LaMamma.app = app;

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Définir l'orientation initiale
  if (window.orientation !== undefined) {
    if (window.orientation === 0 || window.orientation === 180) {
      document.body.classList.add('portrait');
    } else {
      document.body.classList.add('landscape');
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas window.orientation
    if (window.innerWidth > window.innerHeight) {
      document.body.classList.add('landscape');
    } else {
      document.body.classList.add('portrait');
    }
  }
  
  // Initialiser l'application
  app.init();
});