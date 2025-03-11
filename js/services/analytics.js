/**
 * Service d'analyses pour l'application LA MAMMA
 * Fournit des fonctionnalités d'analyse de données et de statistiques
 */

const AnalyticsService = {
    /**
     * Périodes d'analyse
     */
    periods: {
      DAY: 'day',
      WEEK: 'week',
      MONTH: 'month',
      QUARTER: 'quarter',
      YEAR: 'year',
      CUSTOM: 'custom'
    },
    
    /**
     * Types de rapports
     */
    reportTypes: {
      SALES: 'sales',
      PRODUCTS: 'products',
      INVENTORY: 'inventory',
      RESERVATIONS: 'reservations',
      TABLES: 'tables',
      OVERVIEW: 'overview'
    },
    
    /**
     * Couleurs pour les graphiques
     */
    colors: [
      '#E74C3C', // Rouge primaire
      '#2ECC71', // Vert secondaire
      '#3498DB', // Bleu
      '#F1C40F', // Jaune
      '#9B59B6', // Violet
      '#1ABC9C', // Turquoise
      '#F39C12', // Orange
      '#34495E', // Gris foncé
      '#E67E22', // Orange foncé
      '#27AE60'  // Vert foncé
    ],
    
    /**
     * Cache pour les résultats d'analyse
     */
    _cache: {},
    
    /**
     * Expiration du cache en millisecondes (30 minutes)
     */
    _cacheExpiration: 30 * 60 * 1000,
    
    /**
     * Initialise le service d'analyses
     */
    init: function() {
      console.log('Initialisation du service d\'analyses...');
      console.log('Service d\'analyses initialisé');
    },
    
    /**
     * Génère un rapport de ventes
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} - Données du rapport
     */
    getSalesReport: async function(period = this.periods.MONTH, startDate = null, endDate = null, options = {}) {
      try {
        // Déterminer les dates d'analyse
        const { start, end } = this._getDateRange(period, startDate, endDate);
        
        // Vérifier le cache
        const cacheKey = `sales_${period}_${start.toISOString()}_${end.toISOString()}_${JSON.stringify(options)}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les commandes pour la période
        const db = window.db;
        const orders = await db.getAll('orders');
        
        // Filtrer les commandes par période
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= start && orderDate <= end;
        });
        
        // Calculer les statistiques de vente
        const stats = this._calculateSalesStats(filteredOrders);
        
        // Grouper les ventes par jour/semaine/mois selon la période
        const groupedSales = this._groupSalesByPeriod(filteredOrders, period);
        
        // Calculer les tendances
        const trends = this._calculateTrends(groupedSales);
        
        // Résultat final
        const result = {
          period,
          startDate: start,
          endDate: end,
          stats,
          data: groupedSales,
          trends
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport de ventes', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport sur les produits
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} - Données du rapport
     */
    getProductsReport: async function(period = this.periods.MONTH, startDate = null, endDate = null, options = {}) {
      try {
        // Déterminer les dates d'analyse
        const { start, end } = this._getDateRange(period, startDate, endDate);
        
        // Vérifier le cache
        const cacheKey = `products_${period}_${start.toISOString()}_${end.toISOString()}_${JSON.stringify(options)}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les commandes pour la période
        const db = window.db;
        const orders = await db.getAll('orders');
        
        // Filtrer les commandes par période
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= start && orderDate <= end && order.status !== 'cancelled';
        });
        
        // Récupérer les articles de commande
        const orderItems = await this._getOrderItemsForOrders(filteredOrders.map(order => order.id));
        
        // Récupérer les produits
        const products = await db.getAll('products');
        
        // Calculer les statistiques par produit
        const productStats = await this._calculateProductStats(orderItems, products);
        
        // Top produits par ventes, revenus et marge
        const topProducts = this._getTopProducts(productStats, options.limit || 10);
        
        // Répartition par catégorie
        const categorySplit = this._calculateCategorySplit(productStats);
        
        // Résultat final
        const result = {
          period,
          startDate: start,
          endDate: end,
          productStats,
          topProducts,
          categorySplit
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport sur les produits', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport d'inventaire
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} - Données du rapport
     */
    getInventoryReport: async function(options = {}) {
      try {
        // Vérifier le cache
        const cacheKey = `inventory_${JSON.stringify(options)}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les produits
        const db = window.db;
        const products = await db.getAll('products');
        
        // Récupérer le journal d'inventaire
        const inventoryLogs = await db.getAll('inventory_log');
        
        // Analyser les données d'inventaire
        const inventoryData = this._analyzeInventoryData(products, inventoryLogs);
        
        // Alertes de stock
        const stockAlerts = products.filter(product => {
          return product.is_active && product.min_stock > 0 && product.quantity <= product.min_stock;
        }).map(product => ({
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          min_stock: product.min_stock,
          unit: product.unit,
          status: product.quantity <= 0 ? 'out_of_stock' : 'low_stock'
        }));
        
        // Produits inactifs
        const inactiveProducts = products.filter(product => !product.is_active).length;
        
        // Valeur totale du stock
        const stockValue = products.reduce((total, product) => {
          return total + (product.quantity * product.purchase_price);
        }, 0);
        
        // Résultat final
        const result = {
          date: new Date(),
          totalProducts: products.length,
          activeProducts: products.filter(product => product.is_active).length,
          inactiveProducts,
          stockAlerts,
          stockValue,
          inventoryData
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport d\'inventaire', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport de réservations
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} - Données du rapport
     */
    getReservationsReport: async function(period = this.periods.MONTH, startDate = null, endDate = null, options = {}) {
      try {
        // Déterminer les dates d'analyse
        const { start, end } = this._getDateRange(period, startDate, endDate);
        
        // Vérifier le cache
        const cacheKey = `reservations_${period}_${start.toISOString()}_${end.toISOString()}_${JSON.stringify(options)}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les réservations
        const db = window.db;
        const reservations = await db.getAll('reservations');
        
        // Filtrer les réservations par période
        const filteredReservations = reservations.filter(reservation => {
          const resDate = new Date(reservation.date);
          return resDate >= start && resDate <= end;
        });
        
        // Analyser les données de réservation
        const stats = this._analyzeReservationData(filteredReservations);
        
        // Grouper les réservations par jour/semaine/mois selon la période
        const groupedReservations = this._groupReservationsByPeriod(filteredReservations, period);
        
        // Résultat final
        const result = {
          period,
          startDate: start,
          endDate: end,
          stats,
          data: groupedReservations
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport de réservations', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport d'occupation des tables
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<Object>} - Données du rapport
     */
    getTablesReport: async function(period = this.periods.MONTH, startDate = null, endDate = null, options = {}) {
      try {
        // Déterminer les dates d'analyse
        const { start, end } = this._getDateRange(period, startDate, endDate);
        
        // Vérifier le cache
        const cacheKey = `tables_${period}_${start.toISOString()}_${end.toISOString()}_${JSON.stringify(options)}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les tables
        const db = window.db;
        const tables = await db.getAll('tables');
        
        // Récupérer les commandes pour la période
        const orders = await db.getAll('orders');
        
        // Filtrer les commandes par période
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= start && orderDate <= end && order.status !== 'cancelled';
        });
        
        // Analyser l'utilisation des tables
        const tableUsage = this._analyzeTableUsage(tables, filteredOrders);
        
        // Résultat final
        const result = {
          period,
          startDate: start,
          endDate: end,
          tableUsage
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport d\'occupation des tables', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport global
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @returns {Promise<Object>} - Données du rapport
     */
    getOverviewReport: async function(period = this.periods.MONTH, startDate = null, endDate = null) {
      try {
        // Déterminer les dates d'analyse
        const { start, end } = this._getDateRange(period, startDate, endDate);
        
        // Vérifier le cache
        const cacheKey = `overview_${period}_${start.toISOString()}_${end.toISOString()}`;
        const cachedData = this._getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
        
        // Récupérer les rapports spécifiques
        const salesReport = await this.getSalesReport(period, start, end);
        const productsReport = await this.getProductsReport(period, start, end, { limit: 5 });
        const reservationsReport = await this.getReservationsReport(period, start, end);
        
        // Créer une période précédente pour les comparaisons
        const previousPeriod = this._getPreviousPeriod(period, start, end);
        const previousSalesReport = await this.getSalesReport(
          this.periods.CUSTOM, 
          previousPeriod.start, 
          previousPeriod.end
        );
        
        // Calculer les évolutions
        const evolution = {
          revenue: this._calculateEvolution(
            salesReport.stats.totalRevenue,
            previousSalesReport.stats.totalRevenue
          ),
          orderCount: this._calculateEvolution(
            salesReport.stats.orderCount,
            previousSalesReport.stats.orderCount
          ),
          averageTicket: this._calculateEvolution(
            salesReport.stats.averageTicket,
            previousSalesReport.stats.averageTicket
          ),
          reservationCount: this._calculateEvolution(
            reservationsReport.stats.totalReservations,
            0 // Pas de comparaison pour l'instant
          )
        };
        
        // Résultat final
        const result = {
          period,
          startDate: start,
          endDate: end,
          previousPeriod: previousPeriod,
          sales: salesReport,
          products: productsReport,
          reservations: reservationsReport,
          evolution
        };
        
        // Mettre en cache le résultat
        this._setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport global', error);
        throw error;
      }
    },
    
    /**
     * Efface le cache
     * @param {string} type - Type de rapport (ou null pour tout effacer)
     */
    clearCache: function(type = null) {
      if (type) {
        // Effacer uniquement le cache du type spécifié
        Object.keys(this._cache).forEach(key => {
          if (key.startsWith(type)) {
            delete this._cache[key];
          }
        });
      } else {
        // Effacer tout le cache
        this._cache = {};
      }
      
      console.log(`Cache ${type ? 'pour ' + type : ''} effacé`);
    },
    
    /**
     * Détermine la plage de dates pour une période donnée
     * @param {string} period - Période d'analyse
     * @param {Date} startDate - Date de début (pour période personnalisée)
     * @param {Date} endDate - Date de fin (pour période personnalisée)
     * @returns {Object} - Dates de début et fin
     * @private
     */
    _getDateRange: function(period, startDate, endDate) {
      const now = new Date();
      let start, end;
      
      // Date de fin par défaut = aujourd'hui à 23:59:59
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      
      switch (period) {
        case this.periods.DAY:
          // Aujourd'hui
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
          
        case this.periods.WEEK:
          // Cette semaine (lundi-dimanche)
          start = new Date(now);
          start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Lundi
          start.setHours(0, 0, 0, 0);
          break;
          
        case this.periods.MONTH:
          // Ce mois-ci
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
          
        case this.periods.QUARTER:
          // Ce trimestre
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          break;
          
        case this.periods.YEAR:
          // Cette année
          start = new Date(now.getFullYear(), 0, 1);
          break;
          
        case this.periods.CUSTOM:
          // Période personnalisée
          if (!startDate || !endDate) {
            throw new Error('Les dates de début et de fin sont requises pour une période personnalisée');
          }
          
          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          break;
          
        default:
          throw new Error(`Période non reconnue: ${period}`);
      }
      
      return { start, end };
    },
    
    /**
     * Obtient la période précédente
     * @param {string} period - Période actuelle
     * @param {Date} start - Date de début actuelle
     * @param {Date} end - Date de fin actuelle
     * @returns {Object} - Période précédente
     * @private
     */
    _getPreviousPeriod: function(period, start, end) {
      const currentStart = new Date(start);
      const currentEnd = new Date(end);
      let previousStart, previousEnd;
      
      switch (period) {
        case this.periods.DAY:
          // Jour précédent
          previousStart = new Date(currentStart);
          previousStart.setDate(previousStart.getDate() - 1);
          previousEnd = new Date(previousStart);
          previousEnd.setHours(23, 59, 59, 999);
          break;
          
        case this.periods.WEEK:
          // Semaine précédente
          previousStart = new Date(currentStart);
          previousStart.setDate(previousStart.getDate() - 7);
          previousEnd = new Date(previousStart);
          previousEnd.setDate(previousEnd.getDate() + 6);
          previousEnd.setHours(23, 59, 59, 999);
          break;
          
        case this.periods.MONTH:
          // Mois précédent
          previousStart = new Date(currentStart);
          previousStart.setMonth(previousStart.getMonth() - 1);
          previousEnd = new Date(previousStart.getFullYear(), previousStart.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
          
        case this.periods.QUARTER:
          // Trimestre précédent
          previousStart = new Date(currentStart);
          previousStart.setMonth(previousStart.getMonth() - 3);
          previousEnd = new Date(previousStart.getFullYear(), previousStart.getMonth() + 3, 0, 23, 59, 59, 999);
          break;
          
        case this.periods.YEAR:
          // Année précédente
          previousStart = new Date(currentStart);
          previousStart.setFullYear(previousStart.getFullYear() - 1);
          previousEnd = new Date(previousStart.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
          
        case this.periods.CUSTOM:
          // Période personnalisée (même durée que la période actuelle)
          const duration = currentEnd - currentStart;
          previousEnd = new Date(currentStart);
          previousEnd.setTime(previousEnd.getTime() - 1); // 1ms avant la période actuelle
          previousStart = new Date(previousEnd);
          previousStart.setTime(previousStart.getTime() - duration);
          break;
          
        default:
          throw new Error(`Période non reconnue: ${period}`);
      }
      
      return { start: previousStart, end: previousEnd };
    },
    
    /**
     * Calcule les statistiques de vente
     * @param {Array} orders - Liste des commandes
     * @returns {Object} - Statistiques de vente
     * @private
     */
    _calculateSalesStats: function(orders) {
      // Filtrer les commandes annulées
      const validOrders = orders.filter(order => order.status !== 'cancelled');
      
      // Calculer les totaux
      const totalRevenue = validOrders.reduce((sum, order) => sum + order.total_ttc, 0);
      const totalRevenueHT = validOrders.reduce((sum, order) => sum + order.total_ht, 0);
      const totalTVA = validOrders.reduce((sum, order) => sum + order.tva_amount, 0);
      const orderCount = validOrders.length;
      
      // Calculer le ticket moyen
      const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
      
      // Trouver les valeurs min/max
      const ordersByDate = {};
      
      validOrders.forEach(order => {
        const orderDate = new Date(order.date).toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!ordersByDate[orderDate]) {
          ordersByDate[orderDate] = {
            totalRevenue: 0,
            orderCount: 0
          };
        }
        
        ordersByDate[orderDate].totalRevenue += order.total_ttc;
        ordersByDate[orderDate].orderCount++;
      });
      
      // Convertir en tableau pour trouver min/max
      const dailyStats = Object.entries(ordersByDate).map(([date, stats]) => ({
        date,
        totalRevenue: stats.totalRevenue,
        orderCount: stats.orderCount,
        averageTicket: stats.totalRevenue / stats.orderCount
      }));
      
      // Trouver le meilleur et le pire jour
      const bestDay = dailyStats.length > 0 
        ? dailyStats.reduce((best, day) => day.totalRevenue > best.totalRevenue ? day : best, dailyStats[0])
        : null;
      
      const worstDay = dailyStats.length > 0 
        ? dailyStats.reduce((worst, day) => day.totalRevenue < worst.totalRevenue ? day : worst, dailyStats[0])
        : null;
      
      return {
        totalRevenue,
        totalRevenueHT,
        totalTVA,
        orderCount,
        averageTicket,
        bestDay,
        worstDay,
        dailyStats
      };
    },
    
    /**
     * Groupe les ventes par période
     * @param {Array} orders - Liste des commandes
     * @param {string} period - Période d'analyse
     * @returns {Array} - Ventes groupées
     * @private
     */
    _groupSalesByPeriod: function(orders, period) {
      // Filtrer les commandes annulées
      const validOrders = orders.filter(order => order.status !== 'cancelled');
      
      // Déterminer la fonction de regroupement selon la période
      let groupingFunction;
      
      switch (period) {
        case this.periods.DAY:
          // Grouper par heure
          groupingFunction = (date) => {
            return date.getHours();
          };
          break;
          
        case this.periods.WEEK:
          // Grouper par jour de la semaine
          groupingFunction = (date) => {
            return date.getDay();
          };
          break;
          
        case this.periods.MONTH:
          // Grouper par jour du mois
          groupingFunction = (date) => {
            return date.getDate();
          };
          break;
          
        case this.periods.QUARTER:
        case this.periods.YEAR:
          // Grouper par mois
          groupingFunction = (date) => {
            return date.getMonth();
          };
          break;
          
        case this.periods.CUSTOM:
          // Déterminer automatiquement le meilleur groupement
          // Si la période est inférieure à 7 jours, grouper par jour
          // Sinon, grouper par semaine
          groupingFunction = (date) => {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          };
          break;
          
        default:
          throw new Error(`Période non reconnue: ${period}`);
      }
      
      // Grouper les commandes
      const groupedData = {};
      
      validOrders.forEach(order => {
        const orderDate = new Date(order.date);
        const group = groupingFunction(orderDate);
        
        if (!groupedData[group]) {
          groupedData[group] = {
            group,
            totalRevenue: 0,
            totalRevenueHT: 0,
            totalTVA: 0,
            orderCount: 0
          };
        }
        
        groupedData[group].totalRevenue += order.total_ttc;
        groupedData[group].totalRevenueHT += order.total_ht;
        groupedData[group].totalTVA += order.tva_amount;
        groupedData[group].orderCount++;
      });
      
      // Convertir en tableau et trier
      let result = Object.values(groupedData);
      
      // Ajouter des labels selon la période
      result = result.map(item => {
        let label = '';
        
        switch (period) {
          case this.periods.DAY:
            label = `${item.group}h`;
            break;
            
          case this.periods.WEEK:
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            label = days[item.group];
            break;
            
          case this.periods.MONTH:
            label = `${item.group}`;
            break;
            
          case this.periods.QUARTER:
          case this.periods.YEAR:
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            label = months[item.group];
            break;
            
          case this.periods.CUSTOM:
            // Format: DD/MM
            const parts = item.group.split('-');
            label = `${parts[2]}/${parts[1]}`;
            break;
        }
        
        return {
          ...item,
          label
        };
      });
      
      // Trier selon la période
      result.sort((a, b) => {
        if (period === this.periods.CUSTOM) {
          return a.group.localeCompare(b.group);
        } else {
          return a.group - b.group;
        }
      });
      
      return result;
    },
    
    /**
     * Calcule les tendances à partir des données groupées
     * @param {Array} groupedData - Données groupées
     * @returns {Object} - Tendances
     * @private
     */
    _calculateTrends: function(groupedData) {
      if (!groupedData || groupedData.length < 2) {
        return {
          slope: 0,
          direction: 'stable'
        };
      }
      
      // Calculer la tendance linéaire (pente)
      const n = groupedData.length;
      const sumX = groupedData.reduce((sum, _, i) => sum + i, 0);
      const sumY = groupedData.reduce((sum, item) => sum + item.totalRevenue, 0);
      const sumXY = groupedData.reduce((sum, item, i) => sum + (i * item.totalRevenue), 0);
      const sumX2 = groupedData.reduce((sum, _, i) => sum + (i * i), 0);
      
      // Pente de la droite de régression
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      // Déterminer la direction
      let direction = 'stable';
      
      if (slope > 0.05 * (sumY / n)) {
        direction = 'up';
      } else if (slope < -0.05 * (sumY / n)) {
        direction = 'down';
      }
      
      // Calculer l'écart-type
      const mean = sumY / n;
      const variance = groupedData.reduce((sum, item) => sum + Math.pow(item.totalRevenue - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      
      return {
        slope,
        direction,
        mean,
        stdDev
      };
    },
    
    /**
     * Récupère les articles de commande pour une liste de commandes
     * @param {Array} orderIds - Liste des IDs de commande
     * @returns {Promise<Array>} - Articles de commande
     * @private
     */
    async _getOrderItemsForOrders(orderIds) {
      try {
        const db = window.db;
        const allOrderItems = await db.getAll('order_items');
        
        // Filtrer par commandes
        return allOrderItems.filter(item => orderIds.includes(item.order_id));
      } catch (error) {
        console.error('Erreur lors de la récupération des articles de commande', error);
        return [];
      }
    },
    
    /**
     * Calcule les statistiques par produit
     * @param {Array} orderItems - Articles de commande
     * @param {Array} products - Liste des produits
     * @returns {Object} - Statistiques par produit
     * @private
     */
    async _calculateProductStats(orderItems, products) {
      try {
        const stats = {};
        
        // Initialiser les statistiques pour chaque produit
        products.forEach(product => {
          stats[product.id] = {
            id: product.id,
            name: product.name,
            category: product.category,
            quantity: 0,
            revenue: 0,
            cost: 0,
            margin: 0,
            purchase_price: product.purchase_price,
            selling_price: product.selling_price
          };
        });
        
        // Calculer les statistiques pour les articles commandés
        orderItems.forEach(item => {
          if (stats[item.product_id]) {
            stats[item.product_id].quantity += item.quantity;
            stats[item.product_id].revenue += item.price * item.quantity;
            stats[item.product_id].cost += stats[item.product_id].purchase_price * item.quantity;
          }
        });
        
        // Calculer les marges
        Object.values(stats).forEach(product => {
          product.margin = product.revenue - product.cost;
        });
        
        return stats;
      } catch (error) {
        console.error('Erreur lors du calcul des statistiques par produit', error);
        return {};
      }
    },
    
    /**
     * Récupère les meilleurs produits
     * @param {Object} productStats - Statistiques par produit
     * @param {number} limit - Nombre de produits à récupérer
     * @returns {Object} - Meilleurs produits
     * @private
     */
    _getTopProducts: function(productStats, limit) {
      // Convertir en tableau
      const products = Object.values(productStats);
      
      // Filtrer les produits qui ont été commandés
      const orderedProducts = products.filter(product => product.quantity > 0);
      
      // Trier par quantité
      const byQuantity = [...orderedProducts]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
      
      // Trier par revenu
      const byRevenue = [...orderedProducts]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
      
      // Trier par marge
      const byMargin = [...orderedProducts]
        .sort((a, b) => b.margin - a.margin)
        .slice(0, limit);
      
      return {
        byQuantity,
        byRevenue,
        byMargin
      };
    },
    
    /**
     * Calcule la répartition par catégorie
     * @param {Object} productStats - Statistiques par produit
     * @returns {Array} - Répartition par catégorie
     * @private
     */
    _calculateCategorySplit: function(productStats) {
      const categories = {};
      
      // Regrouper par catégorie
      Object.values(productStats).forEach(product => {
        if (!categories[product.category]) {
          categories[product.category] = {
            category: product.category,
            quantity: 0,
            revenue: 0,
            cost: 0,
            margin: 0
          };
        }
        
        categories[product.category].quantity += product.quantity;
        categories[product.category].revenue += product.revenue;
        categories[product.category].cost += product.cost;
        categories[product.category].margin += product.margin;
      });
      
      // Convertir en tableau
      const result = Object.values(categories);
      
      // Ajouter les noms de catégorie
      const categoryConfig = window.DefaultsConfig.productCategories;
      
      result.forEach(item => {
        const categoryInfo = categoryConfig.find(c => c.id === item.category);
        item.name = categoryInfo ? categoryInfo.name : item.category;
      });
      
      // Trier par revenu
      result.sort((a, b) => b.revenue - a.revenue);
      
      return result;
    },
    
    /**
     * Analyse les données d'inventaire
     * @param {Array} products - Liste des produits
     * @param {Array} inventoryLogs - Journal d'inventaire
     * @returns {Object} - Données d'analyse
     * @private
     */
    _analyzeInventoryData: function(products, inventoryLogs) {
      // Catégoriser les produits
      const categories = {};
      const productsByCategory = {};
      
      // Récupérer les informations de catégorie
      const categoryConfig = window.DefaultsConfig.productCategories;
      
      categoryConfig.forEach(category => {
        categories[category.id] = {
          id: category.id,
          name: category.name,
          productCount: 0,
          stockValue: 0,
          lowStockCount: 0
        };
        
        productsByCategory[category.id] = [];
      });
      
      // Compter les produits par catégorie
      products.forEach(product => {
        if (categories[product.category]) {
          categories[product.category].productCount++;
          categories[product.category].stockValue += product.quantity * product.purchase_price;
          
          if (product.min_stock > 0 && product.quantity <= product.min_stock) {
            categories[product.category].lowStockCount++;
          }
          
          productsByCategory[product.category].push(product);
        }
      });
      
      // Analyser les mouvements de stock des 30 derniers jours
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLogs = inventoryLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= thirtyDaysAgo;
      });
      
      // Grouper les mouvements par jour
      const movementsByDay = {};
      
      recentLogs.forEach(log => {
        const date = new Date(log.date).toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!movementsByDay[date]) {
          movementsByDay[date] = {
            date,
            entries: 0,
            exits: 0,
            entriesValue: 0,
            exitsValue: 0
          };
        }
        
        // Trouver le produit
        const product = products.find(p => p.id === log.product_id);
        
        if (product) {
          const value = log.quantity * product.purchase_price;
          
          if (log.type === 'entry') {
            movementsByDay[date].entries++;
            movementsByDay[date].entriesValue += value;
          } else {
            movementsByDay[date].exits++;
            movementsByDay[date].exitsValue += value;
          }
        }
      });
      
      // Convertir en tableau et trier
      const movements = Object.values(movementsByDay);
      movements.sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        categories: Object.values(categories),
        movements
      };
    },
    
    /**
     * Analyse les données de réservation
     * @param {Array} reservations - Liste des réservations
     * @returns {Object} - Statistiques
     * @private
     */
    _analyzeReservationData: function(reservations) {
      // Filtrer les réservations annulées et no-show
      const validReservations = reservations.filter(reservation => 
        reservation.status !== 'cancelled' && reservation.status !== 'no_show'
      );
      
      // Calculer les totaux
      const totalReservations = validReservations.length;
      const totalCovers = validReservations.reduce((sum, reservation) => sum + reservation.covers, 0);
      const averageCovers = totalReservations > 0 ? totalCovers / totalReservations : 0;
      
      // Calculer les statistiques par jour de la semaine
      const dayOfWeekStats = {};
      
      validReservations.forEach(reservation => {
        const date = new Date(reservation.date);
        const dayOfWeek = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        
        if (!dayOfWeekStats[dayOfWeek]) {
          dayOfWeekStats[dayOfWeek] = {
            day: dayOfWeek,
            reservations: 0,
            covers: 0
          };
        }
        
        dayOfWeekStats[dayOfWeek].reservations++;
        dayOfWeekStats[dayOfWeek].covers += reservation.covers;
      });
      
      // Convertir en tableau et ajouter les noms des jours
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      const byDayOfWeek = Object.values(dayOfWeekStats).map(stat => ({
        ...stat,
        name: days[stat.day],
        averageCovers: stat.reservations > 0 ? stat.covers / stat.reservations : 0
      }));
      
      // Trier par jour de la semaine
      byDayOfWeek.sort((a, b) => a.day - b.day);
      
      // Calculer les statistiques par heure
      const hourStats = {};
      
      validReservations.forEach(reservation => {
        const hour = reservation.time.split(':')[0];
        
        if (!hourStats[hour]) {
          hourStats[hour] = {
            hour,
            reservations: 0,
            covers: 0
          };
        }
        
        hourStats[hour].reservations++;
        hourStats[hour].covers += reservation.covers;
      });
      
      // Convertir en tableau
      const byHour = Object.values(hourStats).map(stat => ({
        ...stat,
        averageCovers: stat.reservations > 0 ? stat.covers / stat.reservations : 0
      }));
      
      // Trier par heure
      byHour.sort((a, b) => a.hour - b.hour);
      
      return {
        totalReservations,
        totalCovers,
        averageCovers,
        byDayOfWeek,
        byHour
      };
    },
    
    /**
     * Groupe les réservations par période
     * @param {Array} reservations - Liste des réservations
     * @param {string} period - Période d'analyse
     * @returns {Array} - Réservations groupées
     * @private
     */
    _groupReservationsByPeriod: function(reservations, period) {
      // Filtrer les réservations annulées et no-show
      const validReservations = reservations.filter(reservation => 
        reservation.status !== 'cancelled' && reservation.status !== 'no_show'
      );
      
      // Déterminer la fonction de regroupement selon la période
      let groupingFunction;
      
      switch (period) {
        case this.periods.DAY:
          // Grouper par heure
          groupingFunction = (reservation) => {
            return reservation.time.split(':')[0];
          };
          break;
          
        case this.periods.WEEK:
          // Grouper par jour de la semaine
          groupingFunction = (reservation) => {
            const date = new Date(reservation.date);
            return date.getDay();
          };
          break;
          
        case this.periods.MONTH:
          // Grouper par jour du mois
          groupingFunction = (reservation) => {
            const date = new Date(reservation.date);
            return date.getDate();
          };
          break;
          
        case this.periods.QUARTER:
        case this.periods.YEAR:
          // Grouper par mois
          groupingFunction = (reservation) => {
            const date = new Date(reservation.date);
            return date.getMonth();
          };
          break;
          
        case this.periods.CUSTOM:
          // Grouper par jour
          groupingFunction = (reservation) => {
            return new Date(reservation.date).toISOString().split('T')[0]; // YYYY-MM-DD
          };
          break;
          
        default:
          throw new Error(`Période non reconnue: ${period}`);
      }
      
      // Grouper les réservations
      const groupedData = {};
      
      validReservations.forEach(reservation => {
        const group = groupingFunction(reservation);
        
        if (!groupedData[group]) {
          groupedData[group] = {
            group,
            reservations: 0,
            covers: 0
          };
        }
        
        groupedData[group].reservations++;
        groupedData[group].covers += reservation.covers;
      });
      
      // Convertir en tableau et trier
      let result = Object.values(groupedData);
      
      // Ajouter des labels selon la période
      result = result.map(item => {
        let label = '';
        
        switch (period) {
          case this.periods.DAY:
            label = `${item.group}h`;
            break;
            
          case this.periods.WEEK:
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            label = days[item.group];
            break;
            
          case this.periods.MONTH:
            label = `${item.group}`;
            break;
            
          case this.periods.QUARTER:
          case this.periods.YEAR:
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            label = months[item.group];
            break;
            
          case this.periods.CUSTOM:
            // Format: DD/MM
            const parts = item.group.split('-');
            label = `${parts[2]}/${parts[1]}`;
            break;
        }
        
        return {
          ...item,
          label
        };
      });
      
      // Trier selon la période
      result.sort((a, b) => {
        if (period === this.periods.CUSTOM) {
          return a.group.localeCompare(b.group);
        } else {
          return a.group - b.group;
        }
      });
      
      return result;
    },
    
    /**
     * Analyse l'utilisation des tables
     * @param {Array} tables - Liste des tables
     * @param {Array} orders - Liste des commandes
     * @returns {Object} - Statistiques d'utilisation des tables
     * @private
     */
    _analyzeTableUsage: function(tables, orders) {
      // Initialiser les statistiques pour chaque table
      const tableStats = {};
      
      tables.forEach(table => {
        tableStats[table.number] = {
          id: table.id,
          number: table.number,
          capacity: table.capacity,
          orderCount: 0,
          revenue: 0,
          averageRevenue: 0
        };
      });
      
      // Compter les commandes et revenus par table
      orders.forEach(order => {
        if (tableStats[order.table_number]) {
          tableStats[order.table_number].orderCount++;
          tableStats[order.table_number].revenue += order.total_ttc;
        }
      });
      
      // Calculer les moyennes
      Object.values(tableStats).forEach(table => {
        table.averageRevenue = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
      });
      
      // Convertir en tableau
      const statsList = Object.values(tableStats);
      
      // Calculer les métriques globales
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_ttc, 0);
      
      // Trouver les tables les plus et moins utilisées
      const mostUsedTable = statsList.reduce((most, table) => 
        table.orderCount > most.orderCount ? table : most, 
        { orderCount: 0 }
      );
      
      const leastUsedTable = statsList.reduce((least, table) => 
        table.orderCount < least.orderCount || least.orderCount === 0 ? table : least, 
        { orderCount: Number.MAX_SAFE_INTEGER }
      );
      
      // Trouver les tables les plus et moins rentables
      const mostProfitableTable = statsList.reduce((most, table) => 
        table.revenue > most.revenue ? table : most, 
        { revenue: 0 }
      );
      
      const leastProfitableTable = statsList.reduce((least, table) => 
        table.revenue < least.revenue || least.revenue === 0 ? table : least, 
        { revenue: Number.MAX_SAFE_INTEGER }
      );
      
      return {
        tables: statsList,
        totalOrders,
        totalRevenue,
        mostUsedTable,
        leastUsedTable,
        mostProfitableTable,
        leastProfitableTable
      };
    },
    
    /**
     * Calcule l'évolution entre deux valeurs
     * @param {number} current - Valeur actuelle
     * @param {number} previous - Valeur précédente
     * @returns {Object} - Évolution
     * @private
     */
    _calculateEvolution: function(current, previous) {
      if (previous === 0) {
        return {
          absolute: current,
          percentage: 100,
          direction: current >= 0 ? 'up' : 'down'
        };
      }
      
      const absolute = current - previous;
      const percentage = (absolute / Math.abs(previous)) * 100;
      
      return {
        absolute,
        percentage,
        direction: percentage >= 0 ? 'up' : 'down'
      };
    },
    
    /**
     * Récupère une valeur du cache
     * @param {string} key - Clé du cache
     * @returns {*} - Valeur du cache ou null
     * @private
     */
    _getFromCache: function(key) {
      const cached = this._cache[key];
      
      if (cached && Date.now() - cached.timestamp < this._cacheExpiration) {
        return cached.data;
      }
      
      return null;
    },
    
    /**
     * Met en cache une valeur
     * @param {string} key - Clé du cache
     * @param {*} data - Données à mettre en cache
     * @private
     */
    _setCache: function(key, data) {
      this._cache[key] = {
        timestamp: Date.now(),
        data
      };
    }
  };
  
  // Exporter le service
  window.services = window.services || {};
  window.services.analytics = AnalyticsService;
  
  // Initialiser le service
  AnalyticsService.init();