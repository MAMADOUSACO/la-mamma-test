/**
 * Configuration de la base de données IndexedDB pour LA MAMMA
 */
const DBConfig = {
    // Paramètres de la base de données
    name: "lamamma_db",
    version: 1,
    
    // Définition des object stores (tables)
    stores: {
      products: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "name", keyPath: "name", unique: false },
          { name: "category", keyPath: "category", unique: false },
          { name: "is_active", keyPath: "is_active", unique: false }
        ]
      },
      orders: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "date", keyPath: "date", unique: false },
          { name: "table_number", keyPath: "table_number", unique: false },
          { name: "status", keyPath: "status", unique: false }
        ]
      },
      order_items: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "order_id", keyPath: "order_id", unique: false },
          { name: "product_id", keyPath: "product_id", unique: false }
        ]
      },
      inventory_log: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "product_id", keyPath: "product_id", unique: false },
          { name: "date", keyPath: "date", unique: false },
          { name: "type", keyPath: "type", unique: false }
        ]
      },
      reservations: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "date", keyPath: "date", unique: false },
          { name: "name", keyPath: "name", unique: false },
          { name: "status", keyPath: "status", unique: false },
          { name: "table_id", keyPath: "table_id", unique: false }
        ]
      },
      tables: {
        keyPath: "id",
        autoIncrement: true,
        indexes: [
          { name: "number", keyPath: "number", unique: true },
          { name: "status", keyPath: "status", unique: false },
          { name: "capacity", keyPath: "capacity", unique: false }
        ]
      },
      settings: {
        keyPath: "id",
        autoIncrement: false,
        indexes: [
          { name: "category", keyPath: "category", unique: false }
        ]
      }
    },
    
    // Paramètres de migration
    migration: {
      logMigrations: true,
      failOnError: false
    }
  };
  
  // Export de la configuration
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DBConfig;
  } else {
    window.DBConfig = DBConfig;
  }