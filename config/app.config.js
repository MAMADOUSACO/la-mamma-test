/**
 * Configuration générale de l'application LA MAMMA
 */
const AppConfig = {
    // Informations sur le restaurant
    restaurant: {
      name: "LA MAMMA",
      address: "15 Rue de la Méditerranée",
      city: "Lyon",
      postalCode: "69003",
      phone: "04 72 XX XX XX",
      email: "contact@lamamma.fr",
      openingHours: {
        monday: "Fermé",
        tuesday: "12h00-14h30, 19h00-22h30",
        wednesday: "12h00-14h30, 19h00-22h30",
        thursday: "12h00-14h30, 19h00-22h30",
        friday: "12h00-14h30, 19h00-22h30",
        saturday: "12h00-14h30, 19h00-23h00",
        sunday: "12h00-14h30, 19h00-22h00"
      }
    },
    
    // Paramètres d'affichage
    display: {
      theme: "default",
      animationsEnabled: true,
      defaultView: "dashboard",
      tableDisplayMode: "grid", // grid ou map
      orderDisplayMode: "list", // list ou cards
      currencySymbol: "€",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "HH:mm"
    },
    
    // Paramètres de sécurité
    security: {
      requireAuth: true,
      loginTimeout: 1800, // 30 minutes en secondes
      touchIdEnabled: false,
      autoLogout: true
    },
    
    // Paramètres d'exportation
    export: {
      defaultFormat: "csv", // csv, json, pdf
      includeHeaders: true,
      decimalSeparator: ","
    },
    
    // Paramètres de sauvegarde
    backup: {
      autoBackup: true,
      backupInterval: 86400, // 24 heures en secondes
      maxLocalBackups: 7,
      backupOnClose: true
    }
  };
  
  // Export de la configuration
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
  } else {
    window.AppConfig = AppConfig;
  }