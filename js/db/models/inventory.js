/**
 * Modèle Inventory - Gestion du journal d'inventaire
 */

/**
 * Classe InventoryModel - Interface pour les opérations sur le journal d'inventaire
 */
class InventoryModel {
    constructor() {
      this.storeName = 'inventory_log';
      this.db = window.db;
      this.productModel = window.models.Product;
    }
  
    /**
     * Récupère toutes les entrées du journal d'inventaire
     * @param {Object} filters - Critères de filtrage (date, type, etc.)
     * @returns {Promise<Array>} - Liste des entrées du journal
     */
    async getAll(filters = {}) {
      try {
        let entries = await this.db.getAll(this.storeName);
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par date
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            entries = entries.filter(entry => new Date(entry.date) >= startDate);
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // Fin de journée
            entries = entries.filter(entry => new Date(entry.date) <= endDate);
          }
          
          // Filtre par type (entrée/sortie)
          if (filters.type) {
            entries = entries.filter(entry => entry.type === filters.type);
          }
          
          // Filtre par produit
          if (filters.product_id) {
            entries = entries.filter(entry => entry.product_id === filters.product_id);
          }
          
          // Filtre par raison
          if (filters.reason) {
            entries = entries.filter(entry => entry.reason.includes(filters.reason));
          }
        }
        
        // Trier par date décroissante (les plus récentes d'abord)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Enrichir les entrées avec les noms de produits
        for (const entry of entries) {
          if (entry.product_id) {
            const product = await this.productModel.getById(entry.product_id);
            if (product) {
              entry.product_name = product.name;
              entry.product_unit = product.unit;
            }
          }
        }
        
        return entries;
      } catch (error) {
        console.error('Erreur lors de la récupération des entrées du journal d\'inventaire', error);
        throw error;
      }
    }
  
    /**
     * Récupère une entrée du journal par son ID
     * @param {number} id - ID de l'entrée
     * @returns {Promise<Object>} - L'entrée demandée
     */
    async getById(id) {
      try {
        const entry = await this.db.get(this.storeName, id);
        
        if (entry && entry.product_id) {
          const product = await this.productModel.getById(entry.product_id);
          if (product) {
            entry.product_name = product.name;
            entry.product_unit = product.unit;
          }
        }
        
        return entry;
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'entrée de journal #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Ajoute une entrée au journal d'inventaire et met à jour le stock du produit
     * @param {Object} entryData - Données de l'entrée
     * @returns {Promise<number>} - ID de l'entrée créée
     */
    async addEntry(entryData) {
      try {
        // Valider les données
        this._validateEntry(entryData);
        
        // Ajouter la date si non fournie
        if (!entryData.date) {
          entryData.date = new Date();
        }
        
        // Calculer le changement de quantité pour la mise à jour du stock
        let quantityChange = entryData.quantity;
        if (entryData.type === 'exit') {
          quantityChange = -entryData.quantity;
        }
        
        // Mettre à jour le stock du produit
        await this.productModel.updateQuantity(
          entryData.product_id,
          quantityChange,
          entryData.reason
        );
        
        // Ajouter l'entrée au journal
        return await this.db.add(this.storeName, entryData);
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'une entrée au journal d\'inventaire', error);
        throw error;
      }
    }
  
    /**
     * Ajoute une entrée de stock (approvisionnement)
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité à ajouter
     * @param {string} reference - Référence (facture fournisseur, etc.)
     * @param {string} note - Note utilisateur
     * @returns {Promise<number>} - ID de l'entrée créée
     */
    async addStockEntry(productId, quantity, reference = '', note = '') {
      try {
        return await this.addEntry({
          product_id: productId,
          quantity: Math.abs(quantity), // S'assurer que la quantité est positive
          type: 'entry',
          reason: 'Approvisionnement',
          reference,
          user_note: note
        });
      } catch (error) {
        console.error(`Erreur lors de l'ajout d'un approvisionnement pour le produit #${productId}`, error);
        throw error;
      }
    }
  
    /**
     * Ajoute une sortie de stock (diminution manuelle)
     * @param {number} productId - ID du produit
     * @param {number} quantity - Quantité à retirer
     * @param {string} reason - Raison de la sortie
     * @param {string} note - Note utilisateur
     * @returns {Promise<number>} - ID de l'entrée créée
     */
    async addStockExit(productId, quantity, reason = 'Sortie manuelle', note = '') {
      try {
        return await this.addEntry({
          product_id: productId,
          quantity: Math.abs(quantity), // S'assurer que la quantité est positive
          type: 'exit',
          reason,
          reference: '',
          user_note: note
        });
      } catch (error) {
        console.error(`Erreur lors de l'ajout d'une sortie pour le produit #${productId}`, error);
        throw error;
      }
    }
  
    /**
     * Effectue un inventaire complet (ajustement des stocks)
     * @param {Array} inventoryData - Liste des produits avec leurs quantités réelles
     * @param {string} note - Note sur l'inventaire
     * @returns {Promise<Array>} - Liste des IDs des entrées créées
     */
    async performInventory(inventoryData, note = '') {
      try {
        const entryIds = [];
        
        for (const item of inventoryData) {
          // Récupérer le produit actuel
          const product = await this.productModel.getById(item.product_id);
          if (!product) {
            console.warn(`Produit #${item.product_id} introuvable, ignoré dans l'inventaire`);
            continue;
          }
          
          // Calculer la différence entre le stock actuel et le stock réel
          const difference = item.real_quantity - product.quantity;
          
          // Si la différence est significative, créer une entrée d'ajustement
          if (difference !== 0) {
            const entryType = difference > 0 ? 'entry' : 'exit';
            const entryData = {
              product_id: item.product_id,
              quantity: Math.abs(difference),
              type: entryType,
              reason: 'Ajustement inventaire',
              reference: '',
              user_note: note
            };
            
            const entryId = await this.addEntry(entryData);
            entryIds.push(entryId);
          }
        }
        
        return entryIds;
      } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'inventaire', error);
        throw error;
      }
    }
  
    /**
     * Récupère l'historique des mouvements pour un produit
     * @param {number} productId - ID du produit
     * @param {Object} filters - Critères de filtrage (date, type, etc.)
     * @returns {Promise<Array>} - Liste des mouvements
     */
    async getProductHistory(productId, filters = {}) {
      try {
        // Ajouter le filtre de produit
        filters.product_id = productId;
        
        return await this.getAll(filters);
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique du produit #${productId}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les statistiques d'inventaire
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {Promise<Object>} - Statistiques d'inventaire
     */
    async getInventoryStats(startDate, endDate) {
      try {
        // Récupérer toutes les entrées dans la période
        const entries = await this.getAll({
          startDate,
          endDate
        });
        
        // Initialiser les statistiques
        const stats = {
          totalEntries: entries.filter(e => e.type === 'entry').length,
          totalExits: entries.filter(e => e.type === 'exit').length,
          totalEntriesValue: 0,
          totalExitsValue: 0,
          productMovements: {},
          topProducts: {
            entries: [],
            exits: []
          },
          reasonBreakdown: {
            entries: {},
            exits: {}
          }
        };
        
        // Parcourir les entrées pour calculer les statistiques
        for (const entry of entries) {
          // Récupérer le produit
          const product = await this.productModel.getById(entry.product_id);
          if (!product) continue;
          
          // Calculer la valeur
          const value = entry.quantity * product.purchase_price;
          
          // Mettre à jour les totaux
          if (entry.type === 'entry') {
            stats.totalEntriesValue += value;
            
            // Mettre à jour la répartition par raison
            stats.reasonBreakdown.entries[entry.reason] = 
              (stats.reasonBreakdown.entries[entry.reason] || 0) + value;
          } else {
            stats.totalExitsValue += value;
            
            // Mettre à jour la répartition par raison
            stats.reasonBreakdown.exits[entry.reason] = 
              (stats.reasonBreakdown.exits[entry.reason] || 0) + value;
          }
          
          // Mettre à jour les mouvements par produit
          if (!stats.productMovements[entry.product_id]) {
            stats.productMovements[entry.product_id] = {
              id: entry.product_id,
              name: product.name,
              unit: product.unit,
              entries: 0,
              exits: 0,
              entriesValue: 0,
              exitsValue: 0
            };
          }
          
          if (entry.type === 'entry') {
            stats.productMovements[entry.product_id].entries += entry.quantity;
            stats.productMovements[entry.product_id].entriesValue += value;
          } else {
            stats.productMovements[entry.product_id].exits += entry.quantity;
            stats.productMovements[entry.product_id].exitsValue += value;
          }
        }
        
        // Convertir les mouvements par produit en tableau
        const productMovementsArray = Object.values(stats.productMovements);
        
        // Calculer les top produits en entrées et sorties
        stats.topProducts.entries = [...productMovementsArray]
          .sort((a, b) => b.entriesValue - a.entriesValue)
          .slice(0, 5);
        
        stats.topProducts.exits = [...productMovementsArray]
          .sort((a, b) => b.exitsValue - a.exitsValue)
          .slice(0, 5);
        
        return stats;
      } catch (error) {
        console.error('Erreur lors du calcul des statistiques d\'inventaire', error);
        throw error;
      }
    }
  
    /**
     * Valide les données d'une entrée d'inventaire
     * @param {Object} entry - Entrée à valider
     * @private
     * @throws {Error} Si la validation échoue
     */
    _validateEntry(entry) {
      // Vérification des champs obligatoires
      if (!entry.product_id) {
        throw new Error('L\'ID du produit est obligatoire');
      }
      
      if (!entry.quantity || entry.quantity <= 0) {
        throw new Error('La quantité doit être un nombre positif');
      }
      
      if (!entry.type) {
        throw new Error('Le type de mouvement est obligatoire');
      }
      
      if (!entry.reason) {
        throw new Error('La raison du mouvement est obligatoire');
      }
      
      // Vérifier que le type est valide
      if (entry.type !== 'entry' && entry.type !== 'exit') {
        throw new Error(`Type de mouvement invalide: ${entry.type}. Utilisez 'entry' ou 'exit'.`);
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.Inventory = new InventoryModel();