/**
 * Service d'authentification pour l'application LA MAMMA
 */

const AuthService = {
  /**
   * Clé de stockage de l'état d'authentification
   */
  AUTH_KEY: 'auth_state',
  
  /**
   * Timeout d'inactivité en millisecondes (30 minutes par défaut)
   */
  inactivityTimeout: 30 * 60 * 1000,
  
  /**
   * Timer pour la déconnexion automatique
   */
  autoLogoutTimer: null,
  
  /**
   * État d'authentification
   */
  authState: {
    isAuthenticated: true, // TEMPORAIREMENT MODIFIÉ POUR LE DÉVELOPPEMENT
    lastActivity: new Date(), // TEMPORAIREMENT MODIFIÉ
    userName: 'Développeur' // TEMPORAIREMENT MODIFIÉ
  },
  
  /**
   * Initialise le service d'authentification
   * @returns {Promise<void>}
   */
  init: async function() {
    try {
      console.log("Auth Service initialization - DÉVELOPPEMENT: authentification automatique");
      
      // Réinitialiser le timer d'inactivité
      this._resetInactivityTimer();
      
      // COMMENTÉ POUR LE DÉVELOPPEMENT
      /*
      // Charger les paramètres depuis la configuration
      this.inactivityTimeout = (window.AppConfig.security.loginTimeout || 30) * 1000;
      
      // Charger l'état d'authentification depuis le stockage local
      this._loadAuthState();
      
      // Vérifier si l'utilisateur est authentifié et si la session n'a pas expiré
      if (this.authState.isAuthenticated) {
        const lastActivity = new Date(this.authState.lastActivity);
        const now = new Date();
        
        if (now - lastActivity > this.inactivityTimeout) {
          // La session a expiré
          console.log('Session expirée. Déconnexion automatique.');
          this.logout();
        } else {
          // Réinitialiser le timer d'inactivité
          this._resetInactivityTimer();
          
          // Mettre à jour la dernière activité
          this._updateLastActivity();
        }
      }
      */
      
      // Ajouter des écouteurs d'événements pour détecter l'activité de l'utilisateur
      document.addEventListener('mousemove', this._handleUserActivity.bind(this));
      document.addEventListener('keydown', this._handleUserActivity.bind(this));
      document.addEventListener('touchstart', this._handleUserActivity.bind(this));
      document.addEventListener('click', this._handleUserActivity.bind(this));
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service d\'authentification', error);
    }
  },
  
  /**
   * Authentifie un utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<boolean>} - True si l'authentification a réussi
   */
  login: async function(password) {
    // TEMPORAIREMENT MODIFIÉ POUR LE DÉVELOPPEMENT - TOUJOURS SUCCÈS
    this.authState = {
      isAuthenticated: true,
      lastActivity: new Date(),
      userName: 'Développeur'
    };
    
    // Sauvegarder l'état d'authentification
    this._saveAuthState();
    
    // Configurer le timer de déconnexion automatique
    this._resetInactivityTimer();
    
    console.log('Authentification (mode développement)');
    return true;
    
    /* CODE ORIGINAL COMMENTÉ
    try {
      // Dans une application réelle, on vérifierait les identifiants auprès d'un serveur
      // Ici, on vérifie simplement le mot de passe avec celui stocké dans les paramètres
      const settingsPassword = await this._getStoredPassword();
      
      if (!settingsPassword) {
        console.error('Mot de passe non configuré');
        return false;
      }
      
      if (password === settingsPassword) {
        // Authentification réussie
        this.authState = {
          isAuthenticated: true,
          lastActivity: new Date(),
          userName: 'Propriétaire'
        };
        
        // Sauvegarder l'état d'authentification
        this._saveAuthState();
        
        // Configurer le timer de déconnexion automatique
        this._resetInactivityTimer();
        
        console.log('Authentification réussie');
        return true;
      } else {
        console.log('Échec de l\'authentification: mot de passe incorrect');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification', error);
      return false;
    }
    */
  },
  
  /**
   * Déconnecte l'utilisateur
   * @returns {boolean} - True si la déconnexion a réussi
   */
  logout: function() {
    try {
      // Réinitialiser l'état d'authentification
      this.authState = {
        isAuthenticated: true, // MODIFIÉ POUR LE DÉVELOPPEMENT - RESTE AUTHENTIFIÉ
        lastActivity: new Date(),
        userName: 'Développeur'
      };
      
      // Sauvegarder l'état d'authentification
      this._saveAuthState();
      
      // Annuler le timer de déconnexion automatique
      this._clearInactivityTimer();
      
      console.log('Déconnexion (mode développement - reste authentifié)');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
      return false;
    }
  },
  
  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} - True si l'utilisateur est authentifié
   */
  isAuthenticated: function() {
    // MODIFIÉ POUR LE DÉVELOPPEMENT
    return true; // Toujours authentifié pendant le développement
    // return this.authState.isAuthenticated; // version originale
  },
  
  /**
   * Récupère l'utilisateur actuellement authentifié
   * @returns {string|null} - Nom de l'utilisateur ou null
   */
  getCurrentUser: function() {
    return this.authState.isAuthenticated ? this.authState.userName : null;
  },
  
  /* LE CODE RESTANT RESTE INCHANGÉ */
  // Autres méthodes du service...
  
  /**
   * Change le mot de passe
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<boolean>} - True si le changement a réussi
   */
  changePassword: async function(currentPassword, newPassword) {
    // MODIFIÉ POUR LE DÉVELOPPEMENT - TOUJOURS SUCCÈS
    console.log('Changement de mot de passe (mode développement)');
    return true;
  },
  
  /**
   * Gère l'activité de l'utilisateur
   * @param {Event} event - Événement d'activité
   * @private
   */
  _handleUserActivity: function(event) {
    if (this.authState.isAuthenticated) {
      // Mettre à jour la dernière activité
      this._updateLastActivity();
      
      // Réinitialiser le timer d'inactivité
      this._resetInactivityTimer();
    }
  },
  
  /**
   * Met à jour la dernière activité
   * @private
   */
  _updateLastActivity: function() {
    this.authState.lastActivity = new Date();
    this._saveAuthState();
  },
  
  /**
   * Réinitialise le timer d'inactivité
   * @private
   */
  _resetInactivityTimer: function() {
    // Annuler le timer existant
    this._clearInactivityTimer();
    
    // Créer un nouveau timer (pas de déconnexion en développement)
    // Mais on garde le code pour éviter des erreurs
    this.autoLogoutTimer = setTimeout(() => {
      console.log('Timer d\'inactivité atteint, mais restera connecté (mode développement)');
      // Ne pas se déconnecter en mode développement
    }, this.inactivityTimeout);
  },
  
  /**
   * Annule le timer d'inactivité
   * @private
   */
  _clearInactivityTimer: function() {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }
  },
  
  /**
   * Sauvegarde l'état d'authentification
   * @private
   */
  _saveAuthState: function() {
    try {
      if (window.utils && window.utils.storage) {
        window.utils.storage.save(this.AUTH_KEY, this.authState, true); // Utiliser sessionStorage
      } else {
        console.warn("window.utils.storage n'est pas disponible, état d'authentification non sauvegardé");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état d\'authentification', error);
    }
  },
  
  /**
   * Charge l'état d'authentification
   * @private
   */
  _loadAuthState: function() {
    try {
      if (window.utils && window.utils.storage) {
        const savedState = window.utils.storage.get(this.AUTH_KEY, null, true); // Utiliser sessionStorage
        
        if (savedState) {
          this.authState = savedState;
        }
      } else {
        console.warn("window.utils.storage n'est pas disponible, impossible de charger l'état d'authentification");
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état d\'authentification', error);
    }
  }
};

// Exporter le service
window.services = window.services || {};
window.services.auth = AuthService;

// Initialiser le service
document.addEventListener('DOMContentLoaded', () => {
console.log("Service d'authentification - Initialisation automatique");
AuthService.init();
});