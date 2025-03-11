/**
 * Utilitaires de calcul pour l'application LA MAMMA
 */

const Calculations = {
    /**
     * Calcule le montant de TVA
     * @param {number} amount - Montant HT
     * @param {number} rate - Taux de TVA en pourcentage
     * @returns {number} - Montant de TVA
     */
    calculateVAT: function(amount, rate) {
      if (typeof amount !== 'number' || typeof rate !== 'number') {
        return 0;
      }
      
      return (amount * rate) / 100;
    },
    
    /**
     * Calcule le montant TTC à partir du montant HT
     * @param {number} amountHT - Montant HT
     * @param {number} rate - Taux de TVA en pourcentage
     * @returns {number} - Montant TTC
     */
    calculateTTC: function(amountHT, rate) {
      if (typeof amountHT !== 'number' || typeof rate !== 'number') {
        return 0;
      }
      
      return amountHT * (1 + rate / 100);
    },
    
    /**
     * Calcule le montant HT à partir du montant TTC
     * @param {number} amountTTC - Montant TTC
     * @param {number} rate - Taux de TVA en pourcentage
     * @returns {number} - Montant HT
     */
    calculateHT: function(amountTTC, rate) {
      if (typeof amountTTC !== 'number' || typeof rate !== 'number') {
        return 0;
      }
      
      return amountTTC / (1 + rate / 100);
    },
    
    /**
     * Calcule la marge brute
     * @param {number} sellingPrice - Prix de vente
     * @param {number} costPrice - Prix de revient
     * @returns {number} - Marge brute
     */
    calculateMargin: function(sellingPrice, costPrice) {
      if (typeof sellingPrice !== 'number' || typeof costPrice !== 'number') {
        return 0;
      }
      
      return sellingPrice - costPrice;
    },
    
    /**
     * Calcule le taux de marge
     * @param {number} sellingPrice - Prix de vente
     * @param {number} costPrice - Prix de revient
     * @returns {number} - Taux de marge en pourcentage
     */
    calculateMarginRate: function(sellingPrice, costPrice) {
      if (typeof sellingPrice !== 'number' || typeof costPrice !== 'number' || sellingPrice === 0) {
        return 0;
      }
      
      return ((sellingPrice - costPrice) / sellingPrice) * 100;
    },
    
    /**
     * Calcule le coefficient multiplicateur
     * @param {number} sellingPrice - Prix de vente
     * @param {number} costPrice - Prix de revient
     * @returns {number} - Coefficient multiplicateur
     */
    calculateMarkupFactor: function(sellingPrice, costPrice) {
      if (typeof sellingPrice !== 'number' || typeof costPrice !== 'number' || costPrice === 0) {
        return 0;
      }
      
      return sellingPrice / costPrice;
    },
    
    /**
     * Arrondit un nombre à 2 décimales
     * @param {number} value - Valeur à arrondir
     * @returns {number} - Valeur arrondie
     */
    roundToTwoDecimals: function(value) {
      if (typeof value !== 'number') {
        return 0;
      }
      
      return Math.round(value * 100) / 100;
    },
    
    /**
     * Calcule le total d'une commande
     * @param {Array} items - Articles de la commande
     * @returns {Object} - Totaux calculés (HT, TVA, TTC)
     */
    calculateOrderTotal: function(items) {
      if (!Array.isArray(items)) {
        return { totalHT: 0, totalVAT: 0, totalTTC: 0 };
      }
      
      // Obtenir les taux de TVA
      const vatRates = window.DefaultsConfig.tva;
      
      // Calculer les totaux
      let totalHT = 0;
      let totalVAT = 0;
      
      items.forEach(item => {
        // Vérifier que les propriétés nécessaires existent
        if (typeof item.price === 'number' && typeof item.quantity === 'number') {
          const itemTotal = item.price * item.quantity;
          totalHT += itemTotal;
          
          // Calculer la TVA de l'article
          let vatRate = vatRates.standard; // Taux par défaut
          
          if (item.vatRate) {
            vatRate = item.vatRate;
          } else if (item.category) {
            // Chercher le taux de TVA correspondant à la catégorie
            const category = window.DefaultsConfig.productCategories.find(cat => cat.id === item.category);
            if (category && category.tva) {
              vatRate = vatRates[category.tva];
            }
          }
          
          totalVAT += this.calculateVAT(itemTotal, vatRate);
        }
      });
      
      const totalTTC = totalHT + totalVAT;
      
      return {
        totalHT: this.roundToTwoDecimals(totalHT),
        totalVAT: this.roundToTwoDecimals(totalVAT),
        totalTTC: this.roundToTwoDecimals(totalTTC)
      };
    },
    
    /**
     * Calcule la moyenne d'un tableau de nombres
     * @param {Array} values - Tableau de nombres
     * @returns {number} - Moyenne
     */
    calculateAverage: function(values) {
      if (!Array.isArray(values) || values.length === 0) {
        return 0;
      }
      
      const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
      
      if (validValues.length === 0) {
        return 0;
      }
      
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      return this.roundToTwoDecimals(sum / validValues.length);
    },
    
    /**
     * Calcule la médiane d'un tableau de nombres
     * @param {Array} values - Tableau de nombres
     * @returns {number} - Médiane
     */
    calculateMedian: function(values) {
      if (!Array.isArray(values) || values.length === 0) {
        return 0;
      }
      
      const validValues = values
        .filter(value => typeof value === 'number' && !isNaN(value))
        .sort((a, b) => a - b);
      
      if (validValues.length === 0) {
        return 0;
      }
      
      const mid = Math.floor(validValues.length / 2);
      
      if (validValues.length % 2 === 0) {
        return (validValues[mid - 1] + validValues[mid]) / 2;
      } else {
        return validValues[mid];
      }
    },
    
    /**
     * Calcule le pourcentage de variation entre deux valeurs
     * @param {number} oldValue - Valeur initiale
     * @param {number} newValue - Nouvelle valeur
     * @returns {number} - Pourcentage de variation
     */
    calculatePercentageChange: function(oldValue, newValue) {
      if (typeof oldValue !== 'number' || typeof newValue !== 'number' || oldValue === 0) {
        return 0;
      }
      
      return this.roundToTwoDecimals(((newValue - oldValue) / Math.abs(oldValue)) * 100);
    },
    
    /**
     * Calcule la répartition des éléments par catégorie
     * @param {Array} items - Tableau d'éléments
     * @param {string} categoryKey - Clé de la propriété de catégorie
     * @param {string} valueKey - Clé de la propriété de valeur
     * @returns {Object} - Répartition par catégorie
     */
    calculateDistribution: function(items, categoryKey, valueKey) {
      if (!Array.isArray(items) || !categoryKey) {
        return {};
      }
      
      const distribution = {};
      
      items.forEach(item => {
        const category = item[categoryKey];
        
        if (category) {
          // Si la catégorie existe déjà
          if (distribution[category]) {
            if (valueKey && typeof item[valueKey] === 'number') {
              distribution[category] += item[valueKey];
            } else {
              distribution[category]++;
            }
          } else {
            if (valueKey && typeof item[valueKey] === 'number') {
              distribution[category] = item[valueKey];
            } else {
              distribution[category] = 1;
            }
          }
        }
      });
      
      return distribution;
    },
    
    /**
     * Calcule la somme d'un tableau de nombres
     * @param {Array} values - Tableau de nombres
     * @returns {number} - Somme
     */
    calculateSum: function(values) {
      if (!Array.isArray(values)) {
        return 0;
      }
      
      const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
      
      return validValues.reduce((acc, val) => acc + val, 0);
    },
    
    /**
     * Calcule le taux d'occupation des tables
     * @param {number} tablesOccupied - Nombre de tables occupées
     * @param {number} totalTables - Nombre total de tables
     * @returns {number} - Taux d'occupation en pourcentage
     */
    calculateOccupancyRate: function(tablesOccupied, totalTables) {
      if (typeof tablesOccupied !== 'number' || typeof totalTables !== 'number' || totalTables === 0) {
        return 0;
      }
      
      return this.roundToTwoDecimals((tablesOccupied / totalTables) * 100);
    },
    
    /**
     * Calcule le ticket moyen
     * @param {number} totalRevenue - Chiffre d'affaires total
     * @param {number} orderCount - Nombre de commandes
     * @returns {number} - Ticket moyen
     */
    calculateAverageTicket: function(totalRevenue, orderCount) {
      if (typeof totalRevenue !== 'number' || typeof orderCount !== 'number' || orderCount === 0) {
        return 0;
      }
      
      return this.roundToTwoDecimals(totalRevenue / orderCount);
    },
    
    /**
     * Calcule les statistiques basiques d'un tableau de nombres
     * @param {Array} values - Tableau de nombres
     * @returns {Object} - Statistiques (min, max, sum, avg, median)
     */
    calculateStats: function(values) {
      if (!Array.isArray(values) || values.length === 0) {
        return { min: 0, max: 0, sum: 0, avg: 0, median: 0 };
      }
      
      const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
      
      if (validValues.length === 0) {
        return { min: 0, max: 0, sum: 0, avg: 0, median: 0 };
      }
      
      const min = Math.min(...validValues);
      const max = Math.max(...validValues);
      const sum = this.calculateSum(validValues);
      const avg = this.calculateAverage(validValues);
      const median = this.calculateMedian(validValues);
      
      return {
        min,
        max,
        sum,
        avg,
        median
      };
    },
    
    /**
     * Calcule la différence de temps en minutes entre deux heures
     * @param {string} time1 - Première heure au format HH:MM
     * @param {string} time2 - Deuxième heure au format HH:MM
     * @returns {number} - Différence en minutes
     */
    calculateTimeDifference: function(time1, time2) {
      if (!time1 || !time2) {
        return 0;
      }
      
      // Convertir les heures en minutes depuis minuit
      const [hours1, minutes1] = time1.split(':').map(Number);
      const [hours2, minutes2] = time2.split(':').map(Number);
      
      const totalMinutes1 = hours1 * 60 + minutes1;
      const totalMinutes2 = hours2 * 60 + minutes2;
      
      return Math.abs(totalMinutes2 - totalMinutes1);
    },
    
    /**
     * Additionne une durée à une heure
     * @param {string} time - Heure de départ au format HH:MM
     * @param {number} minutes - Minutes à ajouter
     * @returns {string} - Nouvelle heure au format HH:MM
     */
    addMinutesToTime: function(time, minutes) {
      if (!time || typeof minutes !== 'number') {
        return time;
      }
      
      // Convertir l'heure en minutes depuis minuit
      const [hours, mins] = time.split(':').map(Number);
      let totalMinutes = hours * 60 + mins + minutes;
      
      // Gérer le dépassement de 24h
      totalMinutes = totalMinutes % (24 * 60);
      
      // Reconvertir en heures et minutes
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      
      // Formater avec des zéros devant si nécessaire
      return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    },
    
    /**
     * Calcule le taux de TVA correspondant à une catégorie de produit
     * @param {string} category - Catégorie de produit
     * @returns {number} - Taux de TVA
     */
    getVATRateForCategory: function(category) {
      if (!category) {
        return window.DefaultsConfig.tva.standard;
      }
      
      const productCategories = window.DefaultsConfig.productCategories;
      const vatRates = window.DefaultsConfig.tva;
      
      // Trouver la catégorie
      const categoryInfo = productCategories.find(cat => cat.id === category);
      
      if (!categoryInfo || !categoryInfo.tva) {
        return vatRates.standard;
      }
      
      return vatRates[categoryInfo.tva] || vatRates.standard;
    }
  };
  
  // Exporter l'utilitaire
  window.utils = window.utils || {};
  window.utils.calculations = Calculations;