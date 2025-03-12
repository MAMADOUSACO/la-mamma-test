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
      isAuthenticated: false,
      lastActivity: null,
      userName: null
    },
    
    /**
     * Initialise le service d'authentification
     * @returns {Promise<void>}
     */
    init: async function() {
      try {
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
    },
    
    /**
     * Déconnecte l'utilisateur
     * @returns {boolean} - True si la déconnexion a réussi
     */
    logout: function() {
      try {
        // Réinitialiser l'état d'authentification
        this.authState = {
          isAuthenticated: false,
          lastActivity: null,
          userName: null
        };
        
        // Sauvegarder l'état d'authentification
        this._saveAuthState();
        
        // Annuler le timer de déconnexion automatique
        this._clearInactivityTimer();
        
        console.log('Déconnexion réussie');
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
      return this.authState.isAuthenticated;
    },
    
    /**
     * Récupère l'utilisateur actuellement authentifié
     * @returns {string|null} - Nom de l'utilisateur ou null
     */
    getCurrentUser: function() {
      return this.authState.isAuthenticated ? this.authState.userName : null;
    },
    
    /**
     * Change le mot de passe
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<boolean>} - True si le changement a réussi
     */
    changePassword: async function(currentPassword, newPassword) {
      try {
        // Vérifier le mot de passe actuel
        const settingsPassword = await this._getStoredPassword();
        
        if (currentPassword !== settingsPassword) {
          console.log('Échec du changement de mot de passe: mot de passe actuel incorrect');
          return false;
        }
        
        // Mettre à jour le mot de passe
        await this._updateStoredPassword(newPassword);
        
        console.log('Changement de mot de passe réussi');
        return true;
      } catch (error) {
        console.error('Erreur lors du changement de mot de passe', error);
        return false;
      }
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
      
      // Si la déconnexion automatique est activée
      if (window.AppConfig.security.autoLogout) {
        // Créer un nouveau timer
        this.autoLogoutTimer = setTimeout(() => {
          console.log('Déconnexion automatique pour inactivité');
          this.logout();
          
          // Afficher un message à l'utilisateur (via un événement)
          if (typeof CustomEvent === 'function') {
            const event = new CustomEvent('auto-logout', {
              detail: { message: 'Vous avez été déconnecté pour inactivité' }
            });
            document.dispatchEvent(event);
          }
        }, this.inactivityTimeout);
      }
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
        window.utils.storage.save(this.AUTH_KEY, this.authState, true); // Utiliser sessionStorage
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
        const savedState = window.utils.storage.get(this.AUTH_KEY, null, true); // Utiliser sessionStorage
        
        if (savedState) {
          this.authState = savedState;
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état d\'authentification', error);
      }
    },
    
    /**
     * Récupère le mot de passe stocké
     * @returns {Promise<string>} - Mot de passe stocké
     * @private
     */
    _getStoredPassword: async function() {
      try {
        // Dans une application réelle, on utiliserait une API sécurisée
        // Ici, on récupère le mot de passe depuis les paramètres
        const db = window.db;
        
        // Attendre que la base de données soit initialisée
        await db.init();
        
        // Récupérer les paramètres de sécurité
        const securitySettings = await db.get('settings', 'security_settings');
        
        if (securitySettings && securitySettings.value && securitySettings.value.password) {
          return securitySettings.value.password;
        }
        
        // Si aucun mot de passe n'est configuré, utiliser le mot de passe par défaut
        return '1234';
      } catch (error) {
        console.error('Erreur lors de la récupération du mot de passe stocké', error);
        return null;
      }
    },
    
    /**
     * Met à jour le mot de passe stocké
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<boolean>} - True si la mise à jour a réussi
     * @private
     */
    _updateStoredPassword: async function(newPassword) {
      try {
        // Dans une application réelle, on utiliserait une API sécurisée
        // Ici, on met à jour le mot de passe dans les paramètres
        const db = window.db;
        
        // Attendre que la base de données soit initialisée
        await db.init();
        
        // Récupérer les paramètres de sécurité
        let securitySettings = await db.get('settings', 'security_settings');
        
        if (!securitySettings) {
          // Créer les paramètres s'ils n'existent pas
          securitySettings = {
            id: 'security_settings',
            category: 'security',
            name: 'Paramètres de sécurité',
            value: {
              password: newPassword,
              requireLogin: true,
              autoLogout: true,
              autoLogoutDelay: 30
            }
          };
        } else {
          // Mettre à jour le mot de passe
          securitySettings.value.password = newPassword;
        }
        
        // Sauvegarder les paramètres
        await db.update('settings', securitySettings);
        
        return true;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe stocké', error);
        return false;
      }
    }
  };
  
  // Exporter le service
  window.services = window.services || {};
  window.services.auth = AuthService;
  
  // Initialiser le service
  document.addEventListener('DOMContentLoaded', () => {
    AuthService.init();
  });