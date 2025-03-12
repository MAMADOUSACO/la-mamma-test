/**
 * Vue Dashboard - Page d'accueil de l'application LA MAMMA
 * Affiche un tableau de bord avec les principales informations
 * et l'accès rapide aux fonctionnalités principales
 */

class Dashboard {
    /**
     * Constructeur
     * @param {Object} props - Propriétés de la vue
     */
    constructor(props = {}) {
      this.props = props;
      this.element = null;
      this.todayDate = new Date();
      this.dateFormatter = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Services
      this.authService = window.services.auth;
      this.alertsService = window.services.alerts;
      this.analyticsService = window.services.analytics;
      
      // État des données
      this.orders = [];
      this.reservations = [];
      this.stockAlerts = [];
      this.alertsSubscriptionId = null;
      this.quickAccessItems = [
        {
          id: 'new-order',
          title: 'Nouvelle commande',
          icon: 'shopping_cart',
          route: '/orders/new',
          color: '#E74C3C'
        },
        {
          id: 'new-reservation',
          title: 'Nouvelle réservation',
          icon: 'calendar',
          route: '/reservations/new',
          color: '#3498DB'
        },
        {
          id: 'inventory',
          title: 'Inventaire',
          icon: 'package',
          route: '/inventory',
          color: '#2ECC71'
        },
        {
          id: 'sales',
          title: 'Ventes du jour',
          icon: 'receipt',
          route: '/accounting',
          color: '#F39C12'
        }
      ];
    }
  
    /**
     * Rend la vue
     * @returns {HTMLElement} - Élément de la vue
     */
    render() {
      // Créer l'élément principal
      this.element = document.createElement('div');
      this.element.className = 'dashboard-view';
      
      // Ajouter le contenu initial avec loader
      this.element.innerHTML = `
        <div class="dashboard-header">
          <h1>Tableau de bord</h1>
          <div class="date-display">${this.dateFormatter.format(this.todayDate)}</div>
        </div>
        
        <div class="dashboard-greeting">
          <h2>Bienvenue${this.authService?.getCurrentUser() ? ', ' + this.authService.getCurrentUser() : ''}</h2>
          <p>Voici un aperçu de l'activité de votre restaurant</p>
        </div>
        
        <div class="dashboard-grid">
          <div class="dashboard-section quick-access-section">
            <h3>Accès rapide</h3>
            <div class="loading-spinner" id="quick-access-loader"></div>
            <div class="quick-access-grid" id="quick-access-container"></div>
          </div>
          
          <div class="dashboard-section today-orders-section">
            <h3>Commandes du jour</h3>
            <div class="loading-spinner" id="orders-loader"></div>
            <div class="orders-container" id="orders-container"></div>
          </div>
          
          <div class="dashboard-section today-reservations-section">
            <h3>Réservations du jour</h3>
            <div class="loading-spinner" id="reservations-loader"></div>
            <div class="reservations-container" id="reservations-container"></div>
          </div>
          
          <div class="dashboard-section alerts-section">
            <h3>Alertes</h3>
            <div class="loading-spinner" id="alerts-loader"></div>
            <div class="alerts-container" id="alerts-container"></div>
          </div>
        </div>
      `;
      
      // Charger les données après le rendu
      setTimeout(() => {
        this._loadData();
        this._renderQuickAccess();
        this._subscribeToAlerts();
      }, 100);
      
      return this.element;
    }
  
    /**
     * Charge les données pour le tableau de bord
     * @private
     */
    async _loadData() {
      try {
        // Charger les commandes du jour
        await this._loadTodayOrders();
        
        // Charger les réservations du jour
        await this._loadTodayReservations();
        
        // Charger les alertes
        await this._loadAlerts();
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord', error);
        
        if (window.services.notification) {
          window.services.notification.error('Erreur lors du chargement des données');
        }
      }
    }
  
    /**
     * Charge les commandes du jour
     * @private
     */
    async _loadTodayOrders() {
      try {
        const db = window.db;
        const orders = await db.getAll('orders');
        
        // Filtrer pour ne garder que les commandes d'aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.orders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= today && orderDate < tomorrow;
        });
        
        // Trier par date (les plus récentes d'abord)
        this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Rendre les commandes
        this._renderTodayOrders();
      } catch (error) {
        console.error('Erreur lors du chargement des commandes du jour', error);
        throw error;
      }
    }
  
    /**
     * Charge les réservations du jour
     * @private
     */
    async _loadTodayReservations() {
      try {
        const db = window.db;
        const reservations = await db.getAll('reservations');
        
        // Filtrer pour ne garder que les réservations d'aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.reservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.date);
          return reservationDate >= today && reservationDate < tomorrow;
        });
        
        // Trier par heure
        this.reservations.sort((a, b) => {
          return a.time.localeCompare(b.time);
        });
        
        // Rendre les réservations
        this._renderTodayReservations();
      } catch (error) {
        console.error('Erreur lors du chargement des réservations du jour', error);
        throw error;
      }
    }
  
    /**
     * Charge les alertes
     * @private
     */
    async _loadAlerts() {
      try {
        // Vérifier que le service d'alertes est disponible
        if (!this.alertsService) {
          throw new Error('Service d\'alertes non disponible');
        }
        
        // Récupérer les alertes d'inventaire prioritaires
        this.stockAlerts = this.alertsService.getAlerts({
          type: this.alertsService.types.INVENTORY,
          minPriority: this.alertsService.priorities.MEDIUM,
          dismissed: false
        });
        
        // Rendre les alertes
        this._renderAlerts();
      } catch (error) {
        console.error('Erreur lors du chargement des alertes', error);
        throw error;
      }
    }
  
    /**
     * S'abonne aux événements d'alertes
     * @private
     */
    _subscribeToAlerts() {
      if (this.alertsService) {
        this.alertsSubscriptionId = this.alertsService.subscribe((event, data) => {
          // Recharger les alertes si nécessaire
          if (['add', 'update', 'dismiss', 'update-all', 'dismiss-all'].includes(event)) {
            this._loadAlerts();
          }
        });
      }
    }
  
    /**
     * Rend les tuiles d'accès rapide
     * @private
     */
    _renderQuickAccess() {
      const container = this.element.querySelector('#quick-access-container');
      const loader = this.element.querySelector('#quick-access-loader');
      
      if (!container) return;
      
      // Vider le conteneur
      container.innerHTML = '';
      
      // Créer les tuiles d'accès rapide
      this.quickAccessItems.forEach(item => {
        const tile = document.createElement('div');
        tile.className = 'quick-access-tile';
        tile.setAttribute('data-route', item.route);
        
        // Icône
        let iconHtml = '';
        
        // Utiliser le composant Button pour récupérer l'icône
        if (window.components.Button) {
          const tempButton = new window.components.Button({ icon: item.icon, isIconOnly: true });
          const tempElement = tempButton.render();
          const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
          
          if (iconWrapper) {
            iconHtml = iconWrapper.innerHTML;
          }
        }
        
        tile.innerHTML = `
          <div class="quick-access-icon" style="background-color: ${item.color}">
            ${iconHtml}
          </div>
          <div class="quick-access-title">${item.title}</div>
        `;
        
        // Ajouter l'événement de clic
        tile.addEventListener('click', () => {
          if (window.router) {
            window.router.navigate(item.route);
          }
        });
        
        container.appendChild(tile);
      });
      
      // Masquer le loader
      if (loader) {
        loader.style.display = 'none';
      }
    }
  
    /**
     * Rend les commandes du jour
     * @private
     */
    _renderTodayOrders() {
      const container = this.element.querySelector('#orders-container');
      const loader = this.element.querySelector('#orders-loader');
      
      if (!container) return;
      
      // Vider le conteneur
      container.innerHTML = '';
      
      if (this.orders.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune commande pour aujourd\'hui</div>';
      } else {
        // Créer un résumé des commandes
        const activeOrders = this.orders.filter(order => 
          ['pending', 'in_progress', 'ready', 'served'].includes(order.status)
        );
        
        const totalRevenue = this.orders
          .filter(order => order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.total_ttc, 0);
        
        const summary = document.createElement('div');
        summary.className = 'orders-summary';
        summary.innerHTML = `
          <div class="summary-item">
            <div class="summary-value">${this.orders.length}</div>
            <div class="summary-label">Total</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${activeOrders.length}</div>
            <div class="summary-label">En cours</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${window.utils.formatters.formatPrice(totalRevenue)}</div>
            <div class="summary-label">CA</div>
          </div>
        `;
        
        container.appendChild(summary);
        
        // Liste des dernières commandes
        const ordersList = document.createElement('div');
        ordersList.className = 'orders-list';
        
        // Afficher seulement les 5 dernières commandes
        const recentOrders = this.orders.slice(0, 5);
        
        recentOrders.forEach(order => {
          const orderStatus = window.DefaultsConfig.orderStatus.find(s => s.id === order.status) || {};
          
          const orderItem = document.createElement('div');
          orderItem.className = 'order-item';
          orderItem.setAttribute('data-id', order.id);
          orderItem.innerHTML = `
            <div class="order-header">
              <div class="order-table">Table ${order.table_number}</div>
              <div class="order-time">${new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="order-footer">
              <div class="order-status" style="color: ${orderStatus.color || '#999'}">${orderStatus.name || order.status}</div>
              <div class="order-total">${window.utils.formatters.formatPrice(order.total_ttc)}</div>
            </div>
          `;
          
          // Ajouter l'événement de clic
          orderItem.addEventListener('click', () => {
            if (window.router) {
              window.router.navigate(`/orders/${order.id}`);
            }
          });
          
          ordersList.appendChild(orderItem);
        });
        
        container.appendChild(ordersList);
        
        // Bouton pour voir toutes les commandes
        if (this.orders.length > 5) {
          const viewAllButton = document.createElement('button');
          viewAllButton.className = 'view-all-button';
          viewAllButton.textContent = 'Voir toutes les commandes';
          
          viewAllButton.addEventListener('click', () => {
            if (window.router) {
              window.router.navigate('/orders');
            }
          });
          
          container.appendChild(viewAllButton);
        }
      }
      
      // Masquer le loader
      if (loader) {
        loader.style.display = 'none';
      }
    }
  
    /**
     * Rend les réservations du jour
     * @private
     */
    _renderTodayReservations() {
      const container = this.element.querySelector('#reservations-container');
      const loader = this.element.querySelector('#reservations-loader');
      
      if (!container) return;
      
      // Vider le conteneur
      container.innerHTML = '';
      
      if (this.reservations.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune réservation pour aujourd\'hui</div>';
      } else {
        // Filtrer les réservations à venir et passées
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        
        const upcomingReservations = this.reservations.filter(reservation => 
          reservation.time >= currentTimeString && 
          ['confirmed', 'pending'].includes(reservation.status)
        );
        
        const pastReservations = this.reservations.filter(reservation => 
          reservation.time < currentTimeString || 
          ['seated', 'completed', 'cancelled', 'no_show'].includes(reservation.status)
        );
        
        // Créer un résumé des réservations
        const totalCovers = this.reservations
          .filter(reservation => reservation.status !== 'cancelled' && reservation.status !== 'no_show')
          .reduce((sum, reservation) => sum + reservation.covers, 0);
        
        const summary = document.createElement('div');
        summary.className = 'reservations-summary';
        summary.innerHTML = `
          <div class="summary-item">
            <div class="summary-value">${this.reservations.length}</div>
            <div class="summary-label">Total</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${upcomingReservations.length}</div>
            <div class="summary-label">À venir</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalCovers}</div>
            <div class="summary-label">Couverts</div>
          </div>
        `;
        
        container.appendChild(summary);
        
        // Liste des prochaines réservations
        const reservationsList = document.createElement('div');
        reservationsList.className = 'reservations-list';
        
        // Afficher les prochaines réservations (maximum 5)
        const displayReservations = upcomingReservations.length > 0 
          ? upcomingReservations.slice(0, 5) 
          : pastReservations.slice(-5).reverse();
        
        displayReservations.forEach(reservation => {
          const reservationStatus = window.DefaultsConfig.reservationStatus.find(s => s.id === reservation.status) || {};
          
          const reservationItem = document.createElement('div');
          reservationItem.className = 'reservation-item';
          reservationItem.setAttribute('data-id', reservation.id);
          reservationItem.innerHTML = `
            <div class="reservation-header">
              <div class="reservation-time">${reservation.time}</div>
              <div class="reservation-covers">${reservation.covers} pers.</div>
            </div>
            <div class="reservation-name">${reservation.name}</div>
            <div class="reservation-footer">
              <div class="reservation-status" style="color: ${reservationStatus.color || '#999'}">${reservationStatus.name || reservation.status}</div>
              <div class="reservation-table">Table ${reservation.table_id}</div>
            </div>
          `;
          
          // Ajouter l'événement de clic
          reservationItem.addEventListener('click', () => {
            if (window.router) {
              window.router.navigate(`/reservations/${reservation.id}`);
            }
          });
          
          reservationsList.appendChild(reservationItem);
        });
        
        container.appendChild(reservationsList);
        
        // Bouton pour voir toutes les réservations
        if (this.reservations.length > 5) {
          const viewAllButton = document.createElement('button');
          viewAllButton.className = 'view-all-button';
          viewAllButton.textContent = 'Voir toutes les réservations';
          
          viewAllButton.addEventListener('click', () => {
            if (window.router) {
              window.router.navigate('/reservations');
            }
          });
          
          container.appendChild(viewAllButton);
        }
      }
      
      // Masquer le loader
      if (loader) {
        loader.style.display = 'none';
      }
    }
  
    /**
     * Rend les alertes
     * @private
     */
    _renderAlerts() {
      const container = this.element.querySelector('#alerts-container');
      const loader = this.element.querySelector('#alerts-loader');
      
      if (!container) return;
      
      // Vider le conteneur
      container.innerHTML = '';
      
      if (this.stockAlerts.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune alerte importante</div>';
      } else {
        // Liste des alertes
        const alertsList = document.createElement('div');
        alertsList.className = 'alerts-list';
        
        // Limiter à 5 alertes
        const displayAlerts = this.stockAlerts.slice(0, 5);
        
        displayAlerts.forEach(alert => {
          // Déterminer l'icône en fonction du type
          let icon = 'warning';
          
          if (alert.priority === this.alertsService.priorities.CRITICAL) {
            icon = 'error';
          }
          
          const alertItem = document.createElement('div');
          alertItem.className = `alert-item alert-${alert.priority}`;
          alertItem.setAttribute('data-id', alert.id);
          
          // Icône
          let iconHtml = '';
          
          // Utiliser le composant Button pour récupérer l'icône
          if (window.components.Button) {
            const tempButton = new window.components.Button({ icon, isIconOnly: true });
            const tempElement = tempButton.render();
            const iconWrapper = tempElement.querySelector('.btn-icon-wrapper');
            
            if (iconWrapper) {
              iconHtml = iconWrapper.innerHTML;
            }
          }
          
          alertItem.innerHTML = `
            <div class="alert-icon">${iconHtml}</div>
            <div class="alert-content">
              <div class="alert-message">${alert.message}</div>
              <div class="alert-time">${window.utils.formatters.toRelativeTime(alert.timestamp)}</div>
            </div>
          `;
          
          // Ajouter l'événement de clic
          alertItem.addEventListener('click', () => {
            if (alert.type === this.alertsService.types.INVENTORY && alert.data && alert.data.product_id) {
              // Naviguer vers le produit concerné
              if (window.router) {
                window.router.navigate(`/inventory/product/${alert.data.product_id}`);
              }
            }
            
            // Marquer l'alerte comme lue
            this.alertsService.markAsRead(alert.id);
          });
          
          alertsList.appendChild(alertItem);
        });
        
        container.appendChild(alertsList);
        
        // Bouton pour voir toutes les alertes
        if (this.stockAlerts.length > 5) {
          const viewAllButton = document.createElement('button');
          viewAllButton.className = 'view-all-button';
          viewAllButton.textContent = 'Voir toutes les alertes';
          
          viewAllButton.addEventListener('click', () => {
            // Ouvrir le panneau d'alertes (à implémenter)
            if (window.router) {
              window.router.navigate('/settings'); // Ou une page dédiée aux alertes
            }
          });
          
          container.appendChild(viewAllButton);
        }
      }
      
      // Masquer le loader
      if (loader) {
        loader.style.display = 'none';
      }
    }
  
    /**
     * Détruit la vue et nettoie les écouteurs d'événements
     */
    destroy() {
      // Se désabonner des alertes
      if (this.alertsService && this.alertsSubscriptionId !== null) {
        this.alertsService.unsubscribe(this.alertsSubscriptionId);
      }
      
      // Supprimer les écouteurs d'événements de clic
      if (this.element) {
        const clickables = this.element.querySelectorAll('[data-route], .order-item, .reservation-item, .alert-item, .view-all-button');
        
        clickables.forEach(element => {
          const clone = element.cloneNode(true);
          if (element.parentNode) {
            element.parentNode.replaceChild(clone, element);
          }
        });
        
        this.element = null;
      }
    }
  }
  
  // Exporter la vue
  window.views = window.views || {};
  window.views.Dashboard = Dashboard; // Pour Dashboard.js
  window.views.Login = Login; // Pour Login.js