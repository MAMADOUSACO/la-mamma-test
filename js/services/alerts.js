/**
 * Service d'alertes pour l'application LA MAMMA
 * Gère les alertes système (stocks bas, réservations imminentes, etc.)
 */

const AlertService = {
    /**
     * Types d'alertes
     */
    types: {
      INVENTORY: 'inventory',
      RESERVATION: 'reservation',
      ORDER: 'order',
      SYSTEM: 'system'
    },
    
    /**
     * Niveaux de priorité
     */
    priorities: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    },
    
    /**
     * Liste des alertes actives
     */
    alerts: [],
    
    /**
     * Écouteurs d'événements
     */
    listeners: [],
    
    /**
     * Timer pour la vérification périodique
     */
    checkTimer: null,
    
    /**
     * Intervalle de vérification en millisecondes (5 minutes)
     */
    checkInterval: 5 * 60 * 1000,
    
    /**
     * Initialise le service d'alertes
     */
    init: async function() {
      try {
        console.log('Initialisation du service d\'alertes...');
        
        // Charger les alertes depuis le stockage local
        this._loadAlerts();
        
        // Lancer la vérification périodique
        this._startPeriodicCheck();
        
        // Effectuer une première vérification
        await this.checkAll();
        
        console.log('Service d\'alertes initialisé');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du service d\'alertes', error);
      }
    },
    
    /**
     * Vérifie toutes les alertes potentielles
     * @returns {Promise<Array>} - Liste des nouvelles alertes
     */
    checkAll: async function() {
      try {
        console.log('Vérification de toutes les alertes...');
        
        // Récupérer les modèles
        const productModel = window.models.Product;
        const reservationModel = window.models.Reservation;
        
        // Liste des nouvelles alertes
        const newAlerts = [];
        
        // Vérifier les stocks bas
        const lowStockAlerts = await this._checkLowStock(productModel);
        newAlerts.push(...lowStockAlerts);
        
        // Vérifier les réservations imminentes
        const reservationAlerts = await this._checkUpcomingReservations(reservationModel);
        newAlerts.push(...reservationAlerts);
        
        // Ajouter les nouvelles alertes à la liste
        if (newAlerts.length > 0) {
          this._addAlerts(newAlerts);
        }
        
        console.log(`Vérification terminée: ${newAlerts.length} nouvelle(s) alerte(s)`);
        
        return newAlerts;
      } catch (error) {
        console.error('Erreur lors de la vérification des alertes', error);
        return [];
      }
    },
    
    /**
     * Récupère toutes les alertes actives
     * @param {Object} filters - Filtres (type, priorité, etc.)
     * @returns {Array} - Liste des alertes filtrées
     */
    getAlerts: function(filters = {}) {
      // Clone la liste des alertes
      let filteredAlerts = [...this.alerts];
      
      // Appliquer les filtres
      if (filters.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
      }
      
      if (filters.priority) {
        filteredAlerts = filteredAlerts.filter(alert => alert.priority === filters.priority);
      }
      
      if (filters.minPriority) {
        const priorities = Object.values(this.priorities);
        const minIndex = priorities.indexOf(filters.minPriority);
        
        if (minIndex >= 0) {
          filteredAlerts = filteredAlerts.filter(alert => {
            const alertPriorityIndex = priorities.indexOf(alert.priority);
            return alertPriorityIndex >= minIndex;
          });
        }
      }
      
      if (filters.read !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.read === filters.read);
      }
      
      if (filters.dismissed !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.dismissed === filters.dismissed);
      }
      
      // Trier par date (plus récent d'abord) et priorité
      filteredAlerts.sort((a, b) => {
        // Priorité plus haute d'abord
        const priorities = Object.values(this.priorities);
        const priorityIndexA = priorities.indexOf(a.priority);
        const priorityIndexB = priorities.indexOf(b.priority);
        
        if (priorityIndexA !== priorityIndexB) {
          return priorityIndexB - priorityIndexA;
        }
        
        // Sinon, plus récent d'abord
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      return filteredAlerts;
    },
    
    /**
     * Récupère le nombre d'alertes non lues
     * @param {string} type - Type d'alerte (optionnel)
     * @returns {number} - Nombre d'alertes non lues
     */
    getUnreadCount: function(type = null) {
      if (type) {
        return this.alerts.filter(alert => alert.type === type && !alert.read && !alert.dismissed).length;
      } else {
        return this.alerts.filter(alert => !alert.read && !alert.dismissed).length;
      }
    },
    
    /**
     * Ajoute une alerte
     * @param {Object} alert - Alerte à ajouter
     * @returns {string} - ID de l'alerte
     */
    addAlert: function(alert) {
      // Générer un ID unique
      const id = 'alert-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      // Valider les champs requis
      if (!alert.type || !alert.message || !alert.priority) {
        throw new Error('Type, message et priorité sont requis pour l\'alerte');
      }
      
      // Créer l'objet alerte
      const newAlert = {
        id,
        timestamp: new Date().toISOString(),
        read: false,
        dismissed: false,
        ...alert
      };
      
      // Ajouter à la liste
      this.alerts.unshift(newAlert);
      
      // Sauvegarder les alertes
      this._saveAlerts();
      
      // Notifier les écouteurs
      this._notifyListeners('add', newAlert);
      
      // Afficher une notification si l'alerte est importante
      if (newAlert.priority === this.priorities.HIGH || newAlert.priority === this.priorities.CRITICAL) {
        this._showNotification(newAlert);
      }
      
      return id;
    },
    
    /**
     * Marque une alerte comme lue
     * @param {string} id - ID de l'alerte
     * @returns {boolean} - True si l'opération a réussi
     */
    markAsRead: function(id) {
      const alert = this.alerts.find(a => a.id === id);
      
      if (!alert) {
        return false;
      }
      
      alert.read = true;
      
      // Sauvegarder les alertes
      this._saveAlerts();
      
      // Notifier les écouteurs
      this._notifyListeners('update', alert);
      
      return true;
    },
    
    /**
     * Marque toutes les alertes comme lues
     * @param {string} type - Type d'alerte (optionnel)
     * @returns {number} - Nombre d'alertes marquées comme lues
     */
    markAllAsRead: function(type = null) {
      let count = 0;
      
      this.alerts.forEach(alert => {
        if (!alert.read && !alert.dismissed && (type === null || alert.type === type)) {
          alert.read = true;
          count++;
        }
      });
      
      if (count > 0) {
        // Sauvegarder les alertes
        this._saveAlerts();
        
        // Notifier les écouteurs
        this._notifyListeners('update-all');
      }
      
      return count;
    },
    
    /**
     * Supprime une alerte
     * @param {string} id - ID de l'alerte
     * @returns {boolean} - True si l'opération a réussi
     */
    dismissAlert: function(id) {
      const alert = this.alerts.find(a => a.id === id);
      
      if (!alert) {
        return false;
      }
      
      alert.dismissed = true;
      
      // Sauvegarder les alertes
      this._saveAlerts();
      
      // Notifier les écouteurs
      this._notifyListeners('dismiss', alert);
      
      return true;
    },
    
    /**
     * Supprime toutes les alertes
     * @param {string} type - Type d'alerte (optionnel)
     * @returns {number} - Nombre d'alertes supprimées
     */
    dismissAll: function(type = null) {
      let count = 0;
      
      this.alerts.forEach(alert => {
        if (!alert.dismissed && (type === null || alert.type === type)) {
          alert.dismissed = true;
          count++;
        }
      });
      
      if (count > 0) {
        // Sauvegarder les alertes
        this._saveAlerts();
        
        // Notifier les écouteurs
        this._notifyListeners('dismiss-all');
      }
      
      return count;
    },
    
    /**
     * Supprime définitivement les alertes marquées comme supprimées
     * @param {number} olderThan - Supprimer les alertes plus anciennes que X jours (optionnel)
     * @returns {number} - Nombre d'alertes supprimées
     */
    purgeAlerts: function(olderThan = null) {
      const initialCount = this.alerts.length;
      
      if (olderThan !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThan);
        
        this.alerts = this.alerts.filter(alert => {
          const alertDate = new Date(alert.timestamp);
          return alertDate >= cutoffDate || !alert.dismissed;
        });
      } else {
        this.alerts = this.alerts.filter(alert => !alert.dismissed);
      }
      
      const deletedCount = initialCount - this.alerts.length;
      
      if (deletedCount > 0) {
        // Sauvegarder les alertes
        this._saveAlerts();
        
        // Notifier les écouteurs
        this._notifyListeners('purge');
      }
      
      return deletedCount;
    },
    
    /**
     * S'abonne aux événements d'alerte
     * @param {Function} callback - Fonction de rappel
     * @returns {number} - ID de l'écouteur
     */
    subscribe: function(callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      this.listeners.push(callback);
      return this.listeners.length - 1;
    },
    
    /**
     * Se désabonne des événements d'alerte
     * @param {number} id - ID de l'écouteur
     * @returns {boolean} - True si l'opération a réussi
     */
    unsubscribe: function(id) {
      if (id < 0 || id >= this.listeners.length) {
        return false;
      }
      
      this.listeners[id] = null;
      return true;
    },
    
    /**
     * Vérifie les produits avec stock bas
     * @param {Object} productModel - Modèle de produit
     * @returns {Promise<Array>} - Liste des alertes de stock bas
     * @private
     */
    _checkLowStock: async function(productModel) {
      try {
        // Récupérer les produits avec stock bas
        const lowStockProducts = await productModel.checkLowStock();
        
        // Créer les alertes
        const alerts = [];
        
        for (const product of lowStockProducts) {
          // Déterminer la priorité en fonction du niveau de stock
          let priority = this.priorities.MEDIUM;
          
          if (product.quantity <= 0) {
            priority = this.priorities.CRITICAL;
          } else if (product.quantity <= product.min_stock / 2) {
            priority = this.priorities.HIGH;
          }
          
          // Vérifier si une alerte similaire existe déjà
          const existingAlert = this.alerts.find(alert => 
            alert.type === this.types.INVENTORY && 
            alert.data && 
            alert.data.product_id === product.id &&
            !alert.dismissed
          );
          
          // Si une alerte similaire existe, la mettre à jour si nécessaire
          if (existingAlert) {
            if (existingAlert.priority !== priority || existingAlert.data.quantity !== product.quantity) {
              existingAlert.priority = priority;
              existingAlert.data.quantity = product.quantity;
              existingAlert.message = `Stock bas: ${product.name} (${product.quantity} ${product.unit} restant)`;
              existingAlert.timestamp = new Date().toISOString();
              existingAlert.read = false;
              
              // Ajouter à la liste des alertes modifiées
              alerts.push({...existingAlert, updated: true});
            }
          } else {
            // Créer une nouvelle alerte
            alerts.push({
              type: this.types.INVENTORY,
              title: 'Alerte de stock',
              message: `Stock bas: ${product.name} (${product.quantity} ${product.unit} restant)`,
              priority,
              data: {
                product_id: product.id,
                product_name: product.name,
                quantity: product.quantity,
                min_stock: product.min_stock,
                unit: product.unit
              }
            });
          }
        }
        
        return alerts.filter(alert => !alert.updated);
      } catch (error) {
        console.error('Erreur lors de la vérification des stocks bas', error);
        return [];
      }
    },
    
    /**
     * Vérifie les réservations imminentes
     * @param {Object} reservationModel - Modèle de réservation
     * @returns {Promise<Array>} - Liste des alertes de réservation
     * @private
     */
    _checkUpcomingReservations: async function(reservationModel) {
      try {
        // Récupérer les réservations pour aujourd'hui
        const today = new Date();
        const reservations = await reservationModel.getByDate(today);
        
        // Filtrer les réservations confirmées et imminentes
        const upcomingReservations = reservations.filter(reservation => {
          if (reservation.status !== 'confirmed') {
            return false;
          }
          
          // Calculer l'heure de la réservation
          const [hours, minutes] = reservation.time.split(':').map(Number);
          const reservationTime = new Date(today);
          reservationTime.setHours(hours, minutes, 0, 0);
          
          // Différence en minutes
          const diffMinutes = (reservationTime - today) / (1000 * 60);
          
          // Réservation dans moins de 2 heures et pas encore passée
          return diffMinutes >= 0 && diffMinutes <= 120;
        });
        
        // Créer les alertes
        const alerts = [];
        
        for (const reservation of upcomingReservations) {
          // Déterminer la priorité en fonction du temps restant
          const [hours, minutes] = reservation.time.split(':').map(Number);
          const reservationTime = new Date(today);
          reservationTime.setHours(hours, minutes, 0, 0);
          
          // Différence en minutes
          const diffMinutes = (reservationTime - today) / (1000 * 60);
          let priority = this.priorities.LOW;
          
          if (diffMinutes <= 30) {
            priority = this.priorities.HIGH;
          } else if (diffMinutes <= 60) {
            priority = this.priorities.MEDIUM;
          }
          
          // Vérifier si une alerte similaire existe déjà
          const existingAlert = this.alerts.find(alert => 
            alert.type === this.types.RESERVATION && 
            alert.data && 
            alert.data.reservation_id === reservation.id &&
            !alert.dismissed
          );
          
          if (!existingAlert) {
            // Créer une nouvelle alerte
            alerts.push({
              type: this.types.RESERVATION,
              title: 'Réservation imminente',
              message: `Réservation à ${reservation.time} - ${reservation.name} (${reservation.covers} pers.)`,
              priority,
              data: {
                reservation_id: reservation.id,
                customer_name: reservation.name,
                time: reservation.time,
                covers: reservation.covers,
                table_id: reservation.table_id
              }
            });
          }
        }
        
        return alerts;
      } catch (error) {
        console.error('Erreur lors de la vérification des réservations imminentes', error);
        return [];
      }
    },
    
    /**
     * Démarre la vérification périodique des alertes
     * @private
     */
    _startPeriodicCheck: function() {
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
      }
      
      this.checkTimer = setInterval(() => {
        this.checkAll();
      }, this.checkInterval);
      
      console.log(`Vérification périodique démarrée (intervalle: ${this.checkInterval / 1000}s)`);
    },
    
    /**
     * Arrête la vérification périodique des alertes
     * @private
     */
    _stopPeriodicCheck: function() {
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
        this.checkTimer = null;
        console.log('Vérification périodique arrêtée');
      }
    },
    
    /**
     * Notifie les écouteurs d'un événement
     * @param {string} event - Type d'événement
     * @param {Object} data - Données de l'événement
     * @private
     */
    _notifyListeners: function(event, data = null) {
      this.listeners.forEach(callback => {
        if (typeof callback === 'function') {
          try {
            callback(event, data);
          } catch (error) {
            console.error('Erreur dans un écouteur d\'alertes', error);
          }
        }
      });
    },
    
    /**
     * Affiche une notification pour une alerte
     * @param {Object} alert - Alerte à notifier
     * @private
     */
    _showNotification: function(alert) {
      // Utiliser le service de notification
      const notificationService = window.services.notification;
      
      if (!notificationService) {
        console.warn('Service de notification non disponible');
        return;
      }
      
      // Déterminer le type de notification
      let notificationType = notificationService.types.INFO;
      
      if (alert.priority === this.priorities.CRITICAL) {
        notificationType = notificationService.types.ERROR;
      } else if (alert.priority === this.priorities.HIGH) {
        notificationType = notificationService.types.WARNING;
      }
      
      // Afficher la notification
      notificationService.notify(alert.message, {
        title: alert.title,
        type: notificationType,
        duration: 5000,
        closable: true
      });
    },
    
    /**
     * Ajoute des alertes à la liste
     * @param {Array} alerts - Liste d'alertes à ajouter
     * @private
     */
    _addAlerts: function(alerts) {
      if (!Array.isArray(alerts) || alerts.length === 0) {
        return;
      }
      
      // Ajouter chaque alerte
      alerts.forEach(alert => {
        this.addAlert(alert);
      });
    },
    
    /**
     * Sauvegarde les alertes dans le stockage local
     * @private
     */
    _saveAlerts: function() {
      try {
        // Limiter le nombre d'alertes sauvegardées
        const alertsToSave = this.alerts.slice(0, 100);
        
        // Utiliser le service de stockage
        window.utils.storage.save('alerts', alertsToSave);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des alertes', error);
      }
    },
    
    /**
     * Charge les alertes depuis le stockage local
     * @private
     */
    _loadAlerts: function() {
      try {
        // Utiliser le service de stockage
        const savedAlerts = window.utils.storage.get('alerts', []);
        
        if (Array.isArray(savedAlerts)) {
          this.alerts = savedAlerts;
          console.log(`${savedAlerts.length} alerte(s) chargée(s) depuis le stockage local`);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des alertes', error);
        this.alerts = [];
      }
    }
  };
  
  // Exporter le service
  window.services = window.services || {};
  window.services.alerts = AlertService;
  
  // Initialiser le service lorsque le DOM est chargé
  document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu pour permettre aux autres services de s'initialiser
    setTimeout(() => {
      AlertService.init();
    }, 1000);
  });