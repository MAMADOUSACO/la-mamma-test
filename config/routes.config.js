/**
 * Configuration des routes pour l'application LA MAMMA
 */
const RoutesConfig = {
    // Route par défaut
    defaultRoute: "dashboard",
    
    // Définition des routes principales
    routes: [
      {
        path: "/",
        redirect: "/dashboard"
      },
      {
        path: "/login",
        component: "Login",
        meta: {
          requiresAuth: false,
          title: "Connexion"
        }
      },
      {
        path: "/dashboard",
        component: "Dashboard",
        meta: {
          requiresAuth: true,
          title: "Tableau de bord",
          icon: "home"
        }
      },
      {
        path: "/orders",
        component: "Orders",
        meta: {
          requiresAuth: true,
          title: "Commandes",
          icon: "receipt"
        }
      },
      {
        path: "/inventory",
        component: "Inventory",
        meta: {
          requiresAuth: true,
          title: "Inventaire",
          icon: "package"
        }
      },
      {
        path: "/accounting",
        component: "Accounting",
        meta: {
          requiresAuth: true,
          title: "Comptabilité",
          icon: "euro"
        }
      },
      {
        path: "/reservations",
        component: "Reservations",
        meta: {
          requiresAuth: true,
          title: "Réservations",
          icon: "calendar"
        }
      },
      {
        path: "/analytics",
        component: "Analytics",
        meta: {
          requiresAuth: true,
          title: "Analyses",
          icon: "bar-chart"
        }
      },
      {
        path: "/settings",
        component: "Settings",
        meta: {
          requiresAuth: true,
          title: "Configuration",
          icon: "settings"
        }
      }
    ],
    
    // Sous-routes pour les sections principales
    subRoutes: {
      orders: [
        { path: "new", component: "OrderForm", title: "Nouvelle commande" },
        { path: ":id", component: "OrderDetails", title: "Détails commande" },
        { path: "history", component: "OrderHistory", title: "Historique" }
      ],
      inventory: [
        { path: "products", component: "ProductList", title: "Produits" },
        { path: "product/new", component: "ProductForm", title: "Nouveau produit" },
        { path: "product/:id", component: "ProductForm", title: "Éditer produit" },
        { path: "stock", component: "StockAdjustment", title: "Ajustement stock" },
        { path: "logs", component: "InventoryLogs", title: "Journal" }
      ],
      reservations: [
        { path: "calendar", component: "ReservationCalendar", title: "Calendrier" },
        { path: "new", component: "ReservationForm", title: "Nouvelle réservation" },
        { path: ":id", component: "ReservationDetails", title: "Détails réservation" },
        { path: "floor-plan", component: "FloorPlan", title: "Plan de salle" }
      ]
    },
    
    // Gestion d'erreurs de route
    notFound: {
      path: "*",
      component: "NotFound",
      title: "Page non trouvée"
    }
  };
  
  // Export de la configuration
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoutesConfig;
  } else {
    window.RoutesConfig = RoutesConfig;
  }