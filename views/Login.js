/**
 * Vue Login - Page de connexion à l'application LA MAMMA
 * Permet à l'utilisateur de s'authentifier pour accéder au système
 */

class Login {
    /**
     * Constructeur
     * @param {Object} props - Propriétés de la vue
     */
    constructor(props = {}) {
      this.props = props;
      this.element = null;
      
      // Service d'authentification
      this.authService = window.services.auth;
      
      // État du formulaire
      this.isLoading = false;
      this.errorMessage = '';
      this.password = '';
    }
  
    /**
     * Rend la vue
     * @returns {HTMLElement} - Élément de la vue
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'login-view';
      
      // Ajouter le contenu
      this.element.innerHTML = `
        <div class="login-container">
          <div class="login-logo">
            <h1>LA MAMMA</h1>
            <p class="subtitle">Gestion Restaurant</p>
          </div>
          
          <form id="login-form" class="login-form">
            <div class="form-header">
              <h2>Connexion</h2>
            </div>
            
            <div class="form-content">
              <div class="form-group">
                <label for="password">Mot de passe</label>
                <div class="password-input-container">
                  <input type="password" id="password" class="form-control" required>
                  <button type="button" class="toggle-password" tabindex="-1">
                    <i class="icon-eye"></i>
                  </button>
                </div>
              </div>
              
              <div id="error-message" class="error-message"></div>
            </div>
            
            <div class="form-footer">
              <button type="submit" class="btn btn-primary login-btn">
                <span class="btn-text">Connexion</span>
                <span class="btn-loader" style="display: none;">
                  <div class="spinner-small"></div>
                </span>
              </button>
            </div>
          </form>
          
          <div class="login-footer">
            <p>&copy; ${new Date().getFullYear()} LA MAMMA. Tous droits réservés.</p>
          </div>
        </div>
      `;
      
      // Ajouter les écouteurs d'événements
      this._setupEventListeners();
      
      return this.element;
    }
  
    /**
     * Configure les écouteurs d'événements
     * @private
     */
    _setupEventListeners() {
      // Formulaire de connexion
      const form = this.element.querySelector('#login-form');
      if (form) {
        form.addEventListener('submit', this._handleSubmit.bind(this));
      }
      
      // Bouton de bascule de visibilité du mot de passe
      const toggleButton = this.element.querySelector('.toggle-password');
      if (toggleButton) {
        toggleButton.addEventListener('click', this._togglePasswordVisibility.bind(this));
      }
      
      // Champ de mot de passe
      const passwordInput = this.element.querySelector('#password');
      if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
          this.password = e.target.value;
        });
        
        // Donner le focus au champ de mot de passe
        setTimeout(() => {
          passwordInput.focus();
        }, 100);
      }
    }
  
    /**
     * Gère la soumission du formulaire
     * @param {Event} event - Événement de soumission
     * @private
     */
    async _handleSubmit(event) {
      event.preventDefault();
      
      if (this.isLoading) return;
      
      // Vérifier que le mot de passe est saisi
      if (!this.password) {
        this._showError('Veuillez saisir le mot de passe');
        return;
      }
      
      // Mettre à jour l'état de chargement
      this._setLoading(true);
      
      try {
        // Tentative de connexion
        const success = await this.authService.login(this.password);
        
        if (success) {
          // Connexion réussie, rediriger vers le tableau de bord
          if (window.router) {
            window.router.navigate('/dashboard');
          }
        } else {
          // Échec de connexion
          this._showError('Mot de passe incorrect');
        }
      } catch (error) {
        console.error('Erreur lors de la tentative de connexion', error);
        this._showError('Une erreur est survenue lors de la connexion');
      } finally {
        // Réinitialiser l'état de chargement
        this._setLoading(false);
      }
    }
  
    /**
     * Bascule la visibilité du mot de passe
     * @private
     */
    _togglePasswordVisibility() {
      const passwordInput = this.element.querySelector('#password');
      const toggleButton = this.element.querySelector('.toggle-password i');
      
      if (passwordInput && toggleButton) {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          toggleButton.className = 'icon-eye-off';
        } else {
          passwordInput.type = 'password';
          toggleButton.className = 'icon-eye';
        }
      }
    }
  
    /**
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur
     * @private
     */
    _showError(message) {
      this.errorMessage = message;
      
      const errorElement = this.element.querySelector('#error-message');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
      }
    }
  
    /**
     * Définit l'état de chargement
     * @param {boolean} isLoading - Indique si le chargement est en cours
     * @private
     */
    _setLoading(isLoading) {
      this.isLoading = isLoading;
      
      const loginBtn = this.element.querySelector('.login-btn');
      const btnText = this.element.querySelector('.btn-text');
      const btnLoader = this.element.querySelector('.btn-loader');
      
      if (loginBtn && btnText && btnLoader) {
        loginBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline-block';
        btnLoader.style.display = isLoading ? 'inline-block' : 'none';
      }
    }
  
    /**
     * Détruit la vue et nettoie les écouteurs d'événements
     */
    destroy() {
      // Formulaire de connexion
      const form = this.element?.querySelector('#login-form');
      if (form) {
        form.removeEventListener('submit', this._handleSubmit.bind(this));
      }
      
      // Bouton de bascule de visibilité du mot de passe
      const toggleButton = this.element?.querySelector('.toggle-password');
      if (toggleButton) {
        toggleButton.removeEventListener('click', this._togglePasswordVisibility.bind(this));
      }
      
      // Champ de mot de passe
      const passwordInput = this.element?.querySelector('#password');
      if (passwordInput) {
        passwordInput.removeEventListener('input', () => {});
      }
      
      // Supprimer l'élément du DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      this.element = null;
    }
  }
  
  // Exporter la vue
  window.views = window.views || {};
  window.views.Login = Login;