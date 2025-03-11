/**
 * Utilitaires de validation pour l'application LA MAMMA
 */

const Validation = {
    /**
     * Vérifie si une valeur est définie et non null
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur existe
     */
    exists: function(value) {
      return value !== undefined && value !== null;
    },
    
    /**
     * Vérifie si une chaîne est non vide
     * @param {string} value - Chaîne à vérifier
     * @returns {boolean} - True si la chaîne n'est pas vide
     */
    isNotEmpty: function(value) {
      return this.exists(value) && typeof value === 'string' && value.trim() !== '';
    },
    
    /**
     * Vérifie si une valeur est un nombre
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur est un nombre
     */
    isNumber: function(value) {
      return this.exists(value) && !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    /**
     * Vérifie si une valeur est un entier
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur est un entier
     */
    isInteger: function(value) {
      return this.isNumber(value) && Number.isInteger(parseFloat(value));
    },
    
    /**
     * Vérifie si une valeur est un nombre positif
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur est un nombre positif
     */
    isPositiveNumber: function(value) {
      return this.isNumber(value) && parseFloat(value) > 0;
    },
    
    /**
     * Vérifie si une valeur est un nombre non négatif (positif ou zéro)
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur est un nombre non négatif
     */
    isNonNegativeNumber: function(value) {
      return this.isNumber(value) && parseFloat(value) >= 0;
    },
    
    /**
     * Vérifie si une valeur est dans une plage donnée
     * @param {*} value - Valeur à vérifier
     * @param {number} min - Valeur minimale
     * @param {number} max - Valeur maximale
     * @returns {boolean} - True si la valeur est dans la plage
     */
    isInRange: function(value, min, max) {
      return this.isNumber(value) && parseFloat(value) >= min && parseFloat(value) <= max;
    },
    
    /**
     * Vérifie si une valeur est une date valide
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si la valeur est une date valide
     */
    isDate: function(value) {
      if (!this.exists(value)) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    
    /**
     * Vérifie si une date est dans le futur
     * @param {*} value - Date à vérifier
     * @returns {boolean} - True si la date est dans le futur
     */
    isFutureDate: function(value) {
      if (!this.isDate(value)) return false;
      const date = new Date(value);
      const now = new Date();
      return date > now;
    },
    
    /**
     * Vérifie si une date est dans le passé
     * @param {*} value - Date à vérifier
     * @returns {boolean} - True si la date est dans le passé
     */
    isPastDate: function(value) {
      if (!this.isDate(value)) return false;
      const date = new Date(value);
      const now = new Date();
      return date < now;
    },
    
    /**
     * Vérifie si une date est aujourd'hui
     * @param {*} value - Date à vérifier
     * @returns {boolean} - True si la date est aujourd'hui
     */
    isToday: function(value) {
      if (!this.isDate(value)) return false;
      const date = new Date(value);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    },
    
    /**
     * Vérifie si une chaîne correspond à un format d'heure (HH:MM)
     * @param {string} value - Chaîne à vérifier
     * @returns {boolean} - True si la chaîne est au format HH:MM
     */
    isTimeFormat: function(value) {
      if (!this.isNotEmpty(value)) return false;
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
    },
    
    /**
     * Vérifie si une chaîne est une adresse email valide
     * @param {string} value - Chaîne à vérifier
     * @returns {boolean} - True si la chaîne est une adresse email valide
     */
    isEmail: function(value) {
      if (!this.isNotEmpty(value)) return false;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value);
    },
    
    /**
     * Vérifie si une chaîne est un numéro de téléphone valide (format français)
     * @param {string} value - Chaîne à vérifier
     * @returns {boolean} - True si la chaîne est un numéro de téléphone valide
     */
    isPhoneNumber: function(value) {
      if (!this.isNotEmpty(value)) return false;
      // Format français: 10 chiffres avec ou sans espaces/points/tirets
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      return phoneRegex.test(value);
    },
    
    /**
     * Vérifie si une valeur fait partie d'une liste de valeurs autorisées
     * @param {*} value - Valeur à vérifier
     * @param {Array} allowedValues - Liste des valeurs autorisées
     * @returns {boolean} - True si la valeur est autorisée
     */
    isOneOf: function(value, allowedValues) {
      if (!this.exists(value) || !Array.isArray(allowedValues)) return false;
      return allowedValues.includes(value);
    },
    
    /**
     * Vérifie la longueur d'une chaîne
     * @param {string} value - Chaîne à vérifier
     * @param {number} min - Longueur minimale
     * @param {number} max - Longueur maximale
     * @returns {boolean} - True si la longueur est dans la plage
     */
    hasLengthBetween: function(value, min, max) {
      if (!this.isNotEmpty(value)) return false;
      const length = value.trim().length;
      return length >= min && length <= max;
    },
    
    /**
     * Vérifie si une chaîne contient uniquement des caractères alphanumériques
     * @param {string} value - Chaîne à vérifier
     * @returns {boolean} - True si la chaîne est alphanumérique
     */
    isAlphanumeric: function(value) {
      if (!this.isNotEmpty(value)) return false;
      return /^[a-zA-Z0-9]+$/.test(value);
    },
    
    /**
     * Vérifie si un objet contient toutes les propriétés requises
     * @param {Object} obj - Objet à vérifier
     * @param {Array} requiredProps - Liste des propriétés requises
     * @returns {boolean} - True si l'objet contient toutes les propriétés
     */
    hasRequiredProperties: function(obj, requiredProps) {
      if (!this.exists(obj) || !Array.isArray(requiredProps)) return false;
      return requiredProps.every(prop => prop in obj);
    },
    
    /**
     * Vérifie si une date est dans une période valide
     * @param {*} value - Date à vérifier
     * @param {Date|string} startDate - Date de début de la période
     * @param {Date|string} endDate - Date de fin de la période
     * @returns {boolean} - True si la date est dans la période
     */
    isDateInRange: function(value, startDate, endDate) {
      if (!this.isDate(value) || !this.isDate(startDate) || !this.isDate(endDate)) return false;
      const date = new Date(value);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return date >= start && date <= end;
    },
    
    /**
     * Formate et valide un numéro de téléphone
     * @param {string} value - Numéro de téléphone à formater
     * @returns {string|null} - Numéro formaté ou null si invalide
     */
    formatPhoneNumber: function(value) {
      if (!this.isNotEmpty(value)) return null;
      
      // Supprimer tous les caractères non numériques
      let cleaned = value.replace(/\D/g, '');
      
      // Gérer les numéros avec préfixe international
      if (cleaned.startsWith('33') && cleaned.length === 11) {
        cleaned = '0' + cleaned.substring(2);
      } else if (cleaned.startsWith('330') && cleaned.length === 12) {
        cleaned = '0' + cleaned.substring(3);
      }
      
      // Vérifier que nous avons 10 chiffres pour un numéro français
      if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
        return null;
      }
      
      // Formater au format XX XX XX XX XX
      return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
    },
    
    /**
     * Valide un code postal français
     * @param {string} value - Code postal à vérifier
     * @returns {boolean} - True si le code postal est valide
     */
    isPostalCode: function(value) {
      if (!this.isNotEmpty(value)) return false;
      return /^[0-9]{5}$/.test(value);
    },
    
    /**
     * Vérifie si un prix est valide
     * @param {*} value - Prix à vérifier
     * @returns {boolean} - True si le prix est valide
     */
    isValidPrice: function(value) {
      if (!this.isNumber(value)) return false;
      
      // Convertir en nombre avec 2 décimales max
      const price = parseFloat(parseFloat(value).toFixed(2));
      
      // Vérifier que le prix est positif
      return price >= 0;
    },
    
    /**
     * Valide une entrée utilisateur et renvoie un message d'erreur si nécessaire
     * @param {*} value - Valeur à valider
     * @param {Object} rules - Règles de validation à appliquer
     * @returns {string|null} - Message d'erreur ou null si valide
     */
    validateInput: function(value, rules) {
      if (rules.required && !this.exists(value)) {
        return 'Ce champ est obligatoire';
      }
      
      if (rules.notEmpty && !this.isNotEmpty(value)) {
        return 'Ce champ ne peut pas être vide';
      }
      
      if (rules.isNumber && !this.isNumber(value)) {
        return 'Veuillez entrer un nombre valide';
      }
      
      if (rules.isInteger && !this.isInteger(value)) {
        return 'Veuillez entrer un nombre entier';
      }
      
      if (rules.isPositive && !this.isPositiveNumber(value)) {
        return 'Veuillez entrer un nombre positif';
      }
      
      if (rules.min !== undefined && this.isNumber(value) && parseFloat(value) < rules.min) {
        return `La valeur doit être supérieure ou égale à ${rules.min}`;
      }
      
      if (rules.max !== undefined && this.isNumber(value) && parseFloat(value) > rules.max) {
        return `La valeur doit être inférieure ou égale à ${rules.max}`;
      }
      
      if (rules.isEmail && !this.isEmail(value)) {
        return 'Veuillez entrer une adresse email valide';
      }
      
      if (rules.isPhone && !this.isPhoneNumber(value)) {
        return 'Veuillez entrer un numéro de téléphone valide';
      }
      
      if (rules.isDate && !this.isDate(value)) {
        return 'Veuillez entrer une date valide';
      }
      
      if (rules.isFutureDate && !this.isFutureDate(value)) {
        return 'La date doit être dans le futur';
      }
      
      if (rules.isTimeFormat && !this.isTimeFormat(value)) {
        return 'Veuillez entrer une heure au format HH:MM';
      }
      
      if (rules.oneOf && !this.isOneOf(value, rules.oneOf)) {
        return `La valeur doit être l'une des suivantes: ${rules.oneOf.join(', ')}`;
      }
      
      if (rules.minLength && !this.hasLengthBetween(value, rules.minLength, Infinity)) {
        return `Le texte doit contenir au moins ${rules.minLength} caractères`;
      }
      
      if (rules.maxLength && !this.hasLengthBetween(value, 0, rules.maxLength)) {
        return `Le texte ne doit pas dépasser ${rules.maxLength} caractères`;
      }
      
      if (rules.isPostalCode && !this.isPostalCode(value)) {
        return 'Veuillez entrer un code postal valide (5 chiffres)';
      }
      
      if (rules.isValidPrice && !this.isValidPrice(value)) {
        return 'Veuillez entrer un prix valide';
      }
      
      return null; // Aucune erreur
    }
  };
  
  // Exporter l'utilitaire
  window.utils = window.utils || {};
  window.utils.validation = Validation;