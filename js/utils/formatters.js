/**
 * Utilitaires de formatage pour l'application LA MAMMA
 */

const Formatters = {
    /**
     * Formate un prix avec le symbole de devise
     * @param {number} price - Prix à formater
     * @param {string} currency - Symbole de la devise
     * @param {number} decimals - Nombre de décimales
     * @returns {string} - Prix formaté
     */
    formatPrice: function(price, currency = '€', decimals = 2) {
      if (typeof price !== 'number' || isNaN(price)) {
        return '0,00 ' + currency;
      }
      
      // Arrondir le prix au nombre de décimales spécifié
      const roundedPrice = parseFloat(price.toFixed(decimals));
      
      // Formater le prix avec les bonnes séparations (format français)
      return roundedPrice.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + ' ' + currency;
    },
    
    /**
     * Formate une date selon le format spécifié
     * @param {Date|string} date - Date à formater
     * @param {string} format - Format souhaité ('short', 'medium', 'long', 'full', 'iso', 'time' ou 'day')
     * @returns {string} - Date formatée
     */
    formatDate: function(date, format = 'medium') {
      if (!date) return '';
      
      // Convertir en objet Date si nécessaire
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Vérifier que la date est valide
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      switch (format) {
        case 'short':
          // Format: 01/01/2023
          return dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        
        case 'medium':
          // Format: 1 janvier 2023
          return dateObj.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        
        case 'long':
          // Format: 1 janvier 2023 à 14:30
          return dateObj.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        
        case 'full':
          // Format: dimanche 1 janvier 2023 à 14:30:22
          return dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        
        case 'iso':
          // Format: 2023-01-01
          return dateObj.toISOString().split('T')[0];
        
        case 'time':
          // Format: 14:30
          return dateObj.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });
        
        case 'day':
          // Format: dimanche
          return dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long'
          });
        
        default:
          return dateObj.toLocaleDateString('fr-FR');
      }
    },
    
    /**
     * Formate un numéro de téléphone
     * @param {string} phoneNumber - Numéro de téléphone à formater
     * @returns {string} - Numéro de téléphone formaté
     */
    formatPhoneNumber: function(phoneNumber) {
      if (!phoneNumber) return '';
      
      // Supprimer tous les caractères non numériques
      const cleaned = ('' + phoneNumber).replace(/\D/g, '');
      
      // Si le numéro n'a pas 10 chiffres, retourner tel quel
      if (cleaned.length !== 10) {
        return phoneNumber;
      }
      
      // Formater au format XX XX XX XX XX (format français)
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    },
    
    /**
     * Tronque un texte à la longueur spécifiée
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @param {string} suffix - Suffixe à ajouter si le texte est tronqué
     * @returns {string} - Texte tronqué
     */
    truncateText: function(text, maxLength = 100, suffix = '...') {
      if (!text) return '';
      
      if (text.length <= maxLength) {
        return text;
      }
      
      // Tronquer au dernier espace pour éviter de couper un mot
      const truncated = text.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      
      if (lastSpaceIndex > 0) {
        return truncated.substring(0, lastSpaceIndex) + suffix;
      }
      
      return truncated + suffix;
    },
    
    /**
     * Formate un nombre avec séparateur de milliers
     * @param {number} number - Nombre à formater
     * @param {number} decimals - Nombre de décimales
     * @returns {string} - Nombre formaté
     */
    formatNumber: function(number, decimals = 0) {
      if (typeof number !== 'number' || isNaN(number)) {
        return '0';
      }
      
      return number.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    },
    
    /**
     * Formate une quantité avec son unité
     * @param {number} quantity - Quantité à formater
     * @param {string} unit - Unité de mesure
     * @returns {string} - Quantité formatée
     */
    formatQuantity: function(quantity, unit = '') {
      if (typeof quantity !== 'number' || isNaN(quantity)) {
        return '0' + (unit ? ' ' + unit : '');
      }
      
      // Déterminer le nombre de décimales en fonction de l'unité
      let decimals = 0;
      if (['kg', 'l'].includes(unit)) {
        decimals = 3;
      } else if (['g', 'ml', 'cl'].includes(unit)) {
        decimals = 1;
      }
      
      // Formater la quantité
      const formattedQuantity = quantity.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      
      return formattedQuantity + (unit ? ' ' + unit : '');
    },
    
    /**
     * Formate un statut avec sa couleur associée
     * @param {string} status - Code du statut
     * @param {Array} statusList - Liste des statuts avec leurs informations
     * @returns {Object} - Informations du statut formaté
     */
    formatStatus: function(status, statusList) {
      if (!status || !Array.isArray(statusList)) {
        return { id: status, name: status, color: '#CCCCCC' };
      }
      
      // Trouver le statut dans la liste
      const statusInfo = statusList.find(s => s.id === status);
      
      if (!statusInfo) {
        return { id: status, name: status, color: '#CCCCCC' };
      }
      
      return statusInfo;
    },
    
    /**
     * Convertit une chaîne en slug (URL-friendly)
     * @param {string} text - Texte à convertir
     * @returns {string} - Slug
     */
    slugify: function(text) {
      if (!text) return '';
      
      // Convertir en minuscules et remplacer les caractères spéciaux
      return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Décomposer les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^\w\s-]/g, '') // Supprimer les caractères non alphanumériques
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/--+/g, '-') // Éviter les tirets multiples
        .trim();
    },
    
    /**
     * Formate une période de temps (jours, heures, minutes)
     * @param {number} minutes - Nombre de minutes
     * @returns {string} - Période formatée
     */
    formatTimePeriod: function(minutes) {
      if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
        return '0 min';
      }
      
      if (minutes < 60) {
        return `${minutes} min`;
      }
      
      if (minutes < 1440) { // Moins de 24 heures
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
          return `${hours}h`;
        }
        
        return `${hours}h ${remainingMinutes}min`;
      }
      
      // Plus de 24 heures
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      
      if (remainingHours === 0) {
        return `${days} jour${days > 1 ? 's' : ''}`;
      }
      
      return `${days} jour${days > 1 ? 's' : ''} ${remainingHours}h`;
    },
    
    /**
     * Formate un pourcentage
     * @param {number} value - Valeur à formater en pourcentage
     * @param {number} decimals - Nombre de décimales
     * @returns {string} - Pourcentage formaté
     */
    formatPercentage: function(value, decimals = 1) {
      if (typeof value !== 'number' || isNaN(value)) {
        return '0%';
      }
      
      return value.toLocaleString('fr-FR', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    },
    
    /**
     * Formate une adresse complète
     * @param {Object} address - Objet contenant les parties de l'adresse
     * @returns {string} - Adresse formatée
     */
    formatAddress: function(address) {
      if (!address) return '';
      
      const parts = [];
      
      if (address.street) parts.push(address.street);
      if (address.postalCode || address.city) {
        const postalCity = [address.postalCode, address.city].filter(Boolean).join(' ');
        parts.push(postalCity);
      }
      if (address.country) parts.push(address.country);
      
      return parts.join(', ');
    },
    
    /**
     * Formate le nom complet d'une personne
     * @param {string} firstName - Prénom
     * @param {string} lastName - Nom de famille
     * @returns {string} - Nom complet
     */
    formatFullName: function(firstName, lastName) {
      return [firstName, lastName].filter(Boolean).join(' ');
    },
    
    /**
     * Convertit une date en temps relatif (il y a X minutes, etc.)
     * @param {Date|string} date - Date à convertir
     * @returns {string} - Temps relatif
     */
    toRelativeTime: function(date) {
      if (!date) return '';
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Vérifier que la date est valide
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffMs = now - dateObj;
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      
      if (diffSec < 60) {
        return 'à l\'instant';
      } else if (diffMin < 60) {
        return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
      } else if (diffHour < 24) {
        return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
      } else if (diffDay < 7) {
        return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
      } else {
        // Pour les dates plus anciennes, utiliser le format court
        return this.formatDate(dateObj, 'short');
      }
    }
  };
  
  // Exporter l'utilitaire
  window.utils = window.utils || {};
  window.utils.formatters = Formatters;