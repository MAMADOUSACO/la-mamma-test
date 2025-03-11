/**
 * Valeurs par défaut pour l'application LA MAMMA
 */
const DefaultsConfig = {
    // TVA en vigueur
    tva: {
      standard: 20, // 20%
      reduced: 10,  // 10%
      special: 5.5  // 5.5%
    },
    
    // Catégories de produits
    productCategories: [
      { id: "starters", name: "Entrées", tva: "reduced" },
      { id: "pizzas", name: "Pizzas", tva: "reduced" },
      { id: "pastas", name: "Pâtes", tva: "reduced" },
      { id: "mains", name: "Plats principaux", tva: "reduced" },
      { id: "sides", name: "Accompagnements", tva: "reduced" },
      { id: "desserts", name: "Desserts", tva: "reduced" },
      { id: "soft_drinks", name: "Boissons sans alcool", tva: "reduced" },
      { id: "alcoholic_drinks", name: "Boissons alcoolisées", tva: "standard" },
      { id: "coffee", name: "Cafés et thés", tva: "reduced" },
      { id: "supplies", name: "Fournitures", tva: "standard" }
    ],
    
    // Types d'unités pour l'inventaire
    units: [
      { id: "kg", name: "Kilogramme" },
      { id: "g", name: "Gramme" },
      { id: "l", name: "Litre" },
      { id: "cl", name: "Centilitre" },
      { id: "ml", name: "Millilitre" },
      { id: "unit", name: "Unité" },
      { id: "pack", name: "Pack" },
      { id: "box", name: "Boîte" }
    ],
    
    // Statuts des commandes
    orderStatus: [
      { id: "pending", name: "En attente", color: "#F39C12" },
      { id: "in_progress", name: "En préparation", color: "#3498DB" },
      { id: "ready", name: "Prêt à servir", color: "#2ECC71" },
      { id: "served", name: "Servi", color: "#9B59B6" },
      { id: "completed", name: "Terminé", color: "#27AE60" },
      { id: "cancelled", name: "Annulé", color: "#E74C3C" }
    ],
    
    // Statuts des réservations
    reservationStatus: [
      { id: "pending", name: "En attente", color: "#F39C12" },
      { id: "confirmed", name: "Confirmée", color: "#2ECC71" },
      { id: "seated", name: "Installés", color: "#3498DB" },
      { id: "completed", name: "Terminée", color: "#27AE60" },
      { id: "cancelled", name: "Annulée", color: "#E74C3C" },
      { id: "no_show", name: "Non présenté", color: "#95A5A6" }
    ],
    
    // Statuts des tables
    tableStatus: [
      { id: "available", name: "Disponible", color: "#2ECC71" },
      { id: "occupied", name: "Occupée", color: "#E74C3C" },
      { id: "reserved", name: "Réservée", color: "#F39C12" },
      { id: "maintenance", name: "Maintenance", color: "#95A5A6" }
    ],
    
    // Capacités de tables standard
    tableCapacities: [2, 4, 6, 8, 10],
    
    // Formes de tables disponibles
    tableShapes: [
      { id: "round", name: "Ronde" },
      { id: "square", name: "Carrée" },
      { id: "rectangle", name: "Rectangulaire" }
    ],
    
    // Périodes pour les rapports
    reportPeriods: [
      { id: "day", name: "Jour" },
      { id: "week", name: "Semaine" },
      { id: "month", name: "Mois" },
      { id: "quarter", name: "Trimestre" },
      { id: "year", name: "Année" },
      { id: "custom", name: "Personnalisé" }
    ],
    
    // Valeurs par défaut pour les nouveaux produits
    defaultProduct: {
      is_active: true,
      min_stock: 10,
      category: "mains"
    },
    
    // Nombre de tables à afficher par défaut
    defaultTableCount: 15
  };
  
  // Export de la configuration
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DefaultsConfig;
  } else {
    window.DefaultsConfig = DefaultsConfig;
  }