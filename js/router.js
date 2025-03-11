/**
 * Système de routage simple pour l'application LA MAMMA
 * Permet la navigation entre les différentes vues sans rechargement de page
 */

class Router {
    /**
     * Constructeur
     */
    constructor() {
      this.routes = [];
      this.currentRoute = null;
      this.defaultRoute = '/';
      this.notFoundHandler = null;
      this.beforeEachHandlers = [];
      this.afterEachHandlers = [];
      this.initialized = false;
      this.containerElement = null;
      this.activeComponent = null;
    }
  
    /**
     * Initialise le routeur
     * @param {Object} options - Options de configuration
     */
    init(options = {}) {
      if (this.initialized) {
        console.warn('Router already initialized');
        return;
      }
  
      // Configurer le routeur
      if (options.routes) {
        this.routes = options.routes;
      }
  
      if (options.defaultRoute) {
        this.defaultRoute = options.defaultRoute;
      }
  
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
  
      if (options.container) {
        this.containerElement = typeof options.container === 'string'
          ? document.querySelector(options.container)
          : options.container;
  
        if (!this.containerElement) {
          console.error(`Container element not found: ${options.container}`);
        }
      } else {
        this.containerElement = document.getElementById('app');
      }
  
      // Gérer les événements de navigation
      window.addEventListener('popstate', this._handlePopState.bind(this));
      document.addEventListener('click', this._handleClick.bind(this));
  
      // Marquer comme initialisé
      this.initialized = true;
  
      // Charger la route initiale
      this.navigate(window.location.pathname + window.location.search, { replace: true });
  
      console.log('Router initialized');
    }
  
    /**
     * Ajoute une route
     * @param {string} path - Chemin de la route
     * @param {Function|Object} component - Composant à afficher
     * @param {Object} meta - Métadonnées de la route
     * @returns {Router} - Instance du routeur (chaînage)
     */
    addRoute(path, component, meta = {}) {
      this.routes.push({
        path,
        component,
        meta
      });
  
      return this;
    }
  
    /**
     * Définit la route par défaut
     * @param {string} path - Chemin par défaut
     * @returns {Router} - Instance du routeur (chaînage)
     */
    setDefaultRoute(path) {
      this.defaultRoute = path;
      return this;
    }
  
    /**
     * Définit le gestionnaire de route non trouvée
     * @param {Function|Object} handler - Gestionnaire à utiliser
     * @returns {Router} - Instance du routeur (chaînage)
     */
    setNotFoundHandler(handler) {
      this.notFoundHandler = handler;
      return this;
    }
  
    /**
     * Ajoute un intercepteur avant chaque navigation
     * @param {Function} handler - Fonction à exécuter
     * @returns {Router} - Instance du routeur (chaînage)
     */
    beforeEach(handler) {
      if (typeof handler === 'function') {
        this.beforeEachHandlers.push(handler);
      }
      return this;
    }
  
    /**
     * Ajoute un intercepteur après chaque navigation
     * @param {Function} handler - Fonction à exécuter
     * @returns {Router} - Instance du routeur (chaînage)
     */
    afterEach(handler) {
      if (typeof handler === 'function') {
        this.afterEachHandlers.push(handler);
      }
      return this;
    }
  
    /**
     * Navigue vers une route
     * @param {string} path - Chemin de destination
     * @param {Object} options - Options de navigation
     */
    navigate(path, options = {}) {
      // Si le routeur n'est pas initialisé, le faire
      if (!this.initialized) {
        console.warn('Router not initialized, initializing now...');
        this.init();
      }
  
      console.log(`Navigating to: ${path}`);
  
      // Normaliser le chemin
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
  
      // Si c'est la même route, ne rien faire sauf si force est vrai
      if (this.currentRoute && this.currentRoute.path === path && !options.force) {
        console.log('Already on this route, not navigating');
        return;
      }
  
      // Trouver la route correspondante
      const route = this._findRoute(path);
  
      // Si aucune route n'est trouvée, utiliser le gestionnaire notFound
      if (!route) {
        console.warn(`Route not found: ${path}`);
        
        if (this.notFoundHandler) {
          this._renderComponent(this.notFoundHandler, { path });
        } else {
          console.error('No notFoundHandler defined');
        }
        
        return;
      }
  
      // Exécuter les intercepteurs beforeEach
      const shouldContinue = this._runBeforeEachHandlers(route, this.currentRoute);
      
      if (!shouldContinue) {
        console.log('Navigation cancelled by beforeEach handler');
        return;
      }
  
      // Mettre à jour l'historique du navigateur
      if (!options.silent) {
        if (options.replace) {
          window.history.replaceState({ path }, '', path);
        } else {
          window.history.pushState({ path }, '', path);
        }
      }
  
      // Mettre à jour la route courante
      this.currentRoute = route;
  
      // Rendre le composant
      this._renderComponent(route.component, route.params);
  
      // Exécuter les intercepteurs afterEach
      this._runAfterEachHandlers(route, this.currentRoute);
    }
  
    /**
     * Retourne à la page précédente
     */
    back() {
      window.history.back();
    }
  
    /**
     * Avance à la page suivante
     */
    forward() {
      window.history.forward();
    }
  
    /**
     * Recharge la page courante
     */
    reload() {
      this.navigate(this.currentRoute.path, { force: true });
    }
  
    /**
     * Récupère la route actuelle
     * @returns {Object|null} - Route actuelle
     */
    getCurrentRoute() {
      return this.currentRoute;
    }
  
    /**
     * Vérifie si un chemin correspond à une route active
     * @param {string} path - Chemin à vérifier
     * @returns {boolean} - True si la route est active
     */
    isActive(path) {
      if (!this.currentRoute) {
        return false;
      }
  
      // Normaliser le chemin
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
  
      // Vérifier si le chemin correspond exactement
      if (this.currentRoute.path === path) {
        return true;
      }
  
      // Vérifier si le chemin est inclus (pour les sous-routes)
      return this.currentRoute.path.startsWith(path + '/');
    }
  
    /**
     * Trouve une route correspondant à un chemin
     * @param {string} path - Chemin à rechercher
     * @returns {Object|null} - Route trouvée ou null
     * @private
     */
    _findRoute(path) {
      // Extraire le chemin sans les paramètres de requête
      const cleanPath = path.split('?')[0];
  
      // Rechercher d'abord une correspondance exacte
      for (const route of this.routes) {
        if (route.path === cleanPath) {
          return {
            ...route,
            params: this._extractQueryParams(path),
            path: cleanPath
          };
        }
      }
  
      // Rechercher ensuite les routes avec paramètres dynamiques
      for (const route of this.routes) {
        // Vérifier si la route contient des paramètres (segments avec :)
        if (route.path.includes(':')) {
          const routeSegments = route.path.split('/').filter(Boolean);
          const pathSegments = cleanPath.split('/').filter(Boolean);
  
          // Si le nombre de segments ne correspond pas, passer à la route suivante
          if (routeSegments.length !== pathSegments.length) {
            continue;
          }
  
          // Vérifier si les segments correspondent et extraire les paramètres
          const params = { ...this._extractQueryParams(path) };
          let match = true;
  
          for (let i = 0; i < routeSegments.length; i++) {
            const routeSegment = routeSegments[i];
            const pathSegment = pathSegments[i];
  
            if (routeSegment.startsWith(':')) {
              // Paramètre dynamique
              const paramName = routeSegment.substring(1);
              params[paramName] = pathSegment;
            } else if (routeSegment !== pathSegment) {
              // Segment statique qui ne correspond pas
              match = false;
              break;
            }
          }
  
          if (match) {
            return {
              ...route,
              params,
              path: cleanPath
            };
          }
        }
      }
  
      // Rechercher les redirections
      for (const route of this.routes) {
        if (route.path === cleanPath && route.redirect) {
          console.log(`Redirecting from ${cleanPath} to ${route.redirect}`);
          return this._findRoute(route.redirect);
        }
      }
  
      // Aucune route trouvée
      return null;
    }
  
    /**
     * Extrait les paramètres de requête d'une URL
     * @param {string} path - URL à analyser
     * @returns {Object} - Paramètres extraits
     * @private
     */
    _extractQueryParams(path) {
      const params = {};
      const queryString = path.split('?')[1];
  
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
      }
  
      return params;
    }
  
    /**
     * Gère les changements d'état de l'historique
     * @param {Event} event - Événement popstate
     * @private
     */
    _handlePopState(event) {
      const path = window.location.pathname + window.location.search;
      this.navigate(path, { silent: true });
    }
  
    /**
     * Gère les clics sur les liens
     * @param {Event} event - Événement click
     * @private
     */
    _handleClick(event) {
      // Trouver le lien cliqué
      let target = event.target;
      
      while (target && target.tagName !== 'A') {
        target = target.parentNode;
        if (!target || target === document.body) {
          return;
        }
      }
  
      // Ignorer les liens spéciaux
      if (
        !target.href ||                             // Pas de lien
        target.target === '_blank' ||               // Nouvelle fenêtre
        target.hasAttribute('download') ||          // Téléchargement
        target.getAttribute('rel') === 'external' || // Lien externe
        (target.href.indexOf('mailto:') === 0) ||   // Lien email
        (target.href.indexOf('tel:') === 0) ||      // Lien téléphone
        target.getAttribute('router-ignore')        // Ignore explicite
      ) {
        return;
      }
  
      // Ignorer les liens vers d'autres domaines
      const targetUrl = new URL(target.href);
      const currentUrl = new URL(window.location.href);
  
      if (targetUrl.origin !== currentUrl.origin) {
        return;
      }
  
      // Empêcher le comportement par défaut du navigateur
      event.preventDefault();
  
      // Naviguer vers le lien
      const path = targetUrl.pathname + targetUrl.search;
      this.navigate(path);
    }
  
    /**
     * Exécute les intercepteurs beforeEach
     * @param {Object} to - Route de destination
     * @param {Object} from - Route de départ
     * @returns {boolean} - True si la navigation doit continuer
     * @private
     */
    _runBeforeEachHandlers(to, from) {
      for (const handler of this.beforeEachHandlers) {
        try {
          const result = handler(to, from);
          
          // Si le gestionnaire retourne false explicitement, annuler la navigation
          if (result === false) {
            return false;
          }
          
          // Si le gestionnaire retourne une route, rediriger vers celle-ci
          if (typeof result === 'string') {
            this.navigate(result);
            return false;
          }
        } catch (error) {
          console.error('Error in beforeEach handler:', error);
        }
      }
      
      return true;
    }
  
    /**
     * Exécute les intercepteurs afterEach
     * @param {Object} to - Route de destination
     * @param {Object} from - Route de départ
     * @private
     */
    _runAfterEachHandlers(to, from) {
      for (const handler of this.afterEachHandlers) {
        try {
          handler(to, from);
        } catch (error) {
          console.error('Error in afterEach handler:', error);
        }
      }
    }
  
    /**
     * Rend un composant dans le conteneur
     * @param {Function|Object} component - Composant à rendre
     * @param {Object} props - Propriétés à passer au composant
     * @private
     */
    _renderComponent(component, props) {
      if (!this.containerElement) {
        console.error('No container element defined');
        return;
      }
  
      // Nettoyer le composant actif si nécessaire
      if (this.activeComponent && typeof this.activeComponent.destroy === 'function') {
        try {
          this.activeComponent.destroy();
        } catch (error) {
          console.error('Error destroying component:', error);
        }
      }
  
      // Vider le conteneur
      this.containerElement.innerHTML = '';
  
      // Si le composant est une fonction, l'instancier
      if (typeof component === 'function') {
        try {
          this.activeComponent = new component(props);
        } catch (error) {
          console.error('Error instantiating component:', error);
          return;
        }
      } else {
        this.activeComponent = component;
      }
  
      // Rendre le composant
      if (this.activeComponent) {
        try {
          if (typeof this.activeComponent.render === 'function') {
            const rendered = this.activeComponent.render(props);
            
            if (rendered instanceof HTMLElement) {
              this.containerElement.appendChild(rendered);
            } else if (typeof rendered === 'string') {
              this.containerElement.innerHTML = rendered;
            }
          } else if (typeof this.activeComponent === 'string') {
            this.containerElement.innerHTML = this.activeComponent;
          }
        } catch (error) {
          console.error('Error rendering component:', error);
        }
      }
    }
  }
  
  // Créer une instance du routeur
  const router = new Router();
  
  // Exporter le router
  window.router = router;
  
  // Si le routage est configuré dans l'application, initialiser automatiquement
  document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si une configuration de routes existe
    if (window.RoutesConfig) {
      // Créer les routes à partir de la configuration
      const routes = [];
      
      // Ajouter les routes principales
      window.RoutesConfig.routes.forEach(routeConfig => {
        const route = {
          path: routeConfig.path,
          component: null,
          meta: routeConfig.meta || {}
        };
        
        // Gérer les redirections
        if (routeConfig.redirect) {
          route.redirect = routeConfig.redirect;
        } else if (routeConfig.component) {
          // Charger le composant dynamiquement
          try {
            route.component = window.views[routeConfig.component];
          } catch (error) {
            console.error(`Error loading component ${routeConfig.component}:`, error);
          }
        }
        
        routes.push(route);
      });
      
      // Ajouter la route 404
      if (window.RoutesConfig.notFound) {
        routes.push({
          path: '*',
          component: window.views[window.RoutesConfig.notFound.component],
          meta: window.RoutesConfig.notFound.meta || {}
        });
      }
      
      // Initialiser le routeur
      router.init({
        routes,
        defaultRoute: window.RoutesConfig.defaultRoute || '/',
        container: '#app'
      });
      
      // Ajouter la vérification d'authentification
      router.beforeEach((to, from) => {
        if (to.meta && to.meta.requiresAuth) {
          // Vérifier si l'utilisateur est authentifié
          const authService = window.services.auth;
          
          if (authService && !authService.isAuthenticated()) {
            console.log('Authentication required, redirecting to login');
            return '/login';
          }
        }
        
        return true;
      });
      
      // Ajouter la mise à jour du titre
      router.afterEach((to) => {
        if (to.meta && to.meta.title) {
          document.title = to.meta.title + ' - LA MAMMA';
        } else {
          document.title = 'LA MAMMA';
        }
      });
      
      console.log('Router initialized from configuration');
    }
  });
  
  // Ajouter une fonction de commodité pour créer des composants
  window.createComponent = function(options) {
    if (!options) {
      return null;
    }
    
    return {
      render: options.render || function() {},
      destroy: options.destroy || function() {},
      ...options
    };
  };