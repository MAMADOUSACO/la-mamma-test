/**
 * Référentiel des commandes - Gestion des accès aux données
 * Fichier: modules/orders/OrderRepository.js
 * 
 * Ce référentiel fournit une interface pour accéder et manipuler les données
 * des commandes stockées dans IndexedDB. Il gère les opérations CRUD pour les
 * commandes et leurs articles associés.
 */

/**
 * Référentiel des commandes
 */
const OrderRepository = {
    /**
     * Initialise le référentiel
     * @returns {Promise<void>} Promesse résolue lorsque l'initialisation est terminée
     */
    async init() {
      // Vérifier que la connexion à la base de données est établie
      if (!window.db) {
        throw new Error('La connexion à la base de données n\'est pas disponible');
      }
      
      console.log('Référentiel des commandes initialisé');
    },
    
    /**
     * Récupère toutes les commandes
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<Array>} Liste des commandes
     */
    async getAll(filters = {}) {
      try {
        let orders = await window.db.getAll('ORDERS');
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par statut
          if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
          }
          
          // Filtre par table
          if (filters.table_number) {
            orders = orders.filter(order => order.table_number === filters.table_number);
          }
          
          // Filtre par date (début)
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            orders = orders.filter(order => new Date(order.date) >= startDate);
          }
          
          // Filtre par date (fin)
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            orders = orders.filter(order => new Date(order.date) <= endDate);
          }
        }
        
        return orders;
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        throw new Error('Impossible de récupérer les commandes');
      }
    },
    
    /**
     * Récupère une commande par son ID
     * @param {number} id - ID de la commande
     * @returns {Promise<Object>} La commande
     */
    async getById(id) {
      try {
        const order = await window.db.get('ORDERS', id);
        if (!order) {
          throw new Error(`Commande #${id} introuvable`);
        }
        return order;
      } catch (error) {
        console.error(`Erreur lors de la récupération de la commande #${id}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère les commandes actives
     * @returns {Promise<Array>} Liste des commandes actives
     */
    async getActiveOrders() {
      try {
        const activeStatuses = ['pending', 'in_progress'];
        const orders = await this.getAll();
        return orders.filter(order => activeStatuses.includes(order.status));
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes actives:', error);
        throw error;
      }
    },
    
    /**
     * Récupère les commandes pour une table
     * @param {number} tableNumber - Numéro de la table
     * @param {boolean} activeOnly - Si true, ne récupère que les commandes actives
     * @returns {Promise<Array>} Liste des commandes pour la table
     */
    async getByTable(tableNumber, activeOnly = true) {
      try {
        const filters = {
          table_number: tableNumber
        };
        
        if (activeOnly) {
          filters.status = 'in_progress';
        }
        
        return await this.getAll(filters);
      } catch (error) {
        console.error(`Erreur lors de la récupération des commandes pour la table ${tableNumber}:`, error);
        throw error;
      }
    },
    
    /**
     * Crée une nouvelle commande
     * @param {Object} orderData - Données de la commande
     * @returns {Promise<number>} ID de la nouvelle commande
     */
    async create(orderData) {
      try {
        // S'assurer que la date est définie
        if (!orderData.date) {
          orderData.date = new Date().toISOString();
        }
        
        // Statut par défaut
        if (!orderData.status) {
          orderData.status = 'pending';
        }
        
        // Vérifier les champs obligatoires
        if (!orderData.table_number) {
          throw new Error('Le numéro de table est obligatoire');
        }
        
        // Initialiser les totaux s'ils ne sont pas définis
        orderData.total_ht = orderData.total_ht || 0;
        orderData.total_ttc = orderData.total_ttc || 0;
        orderData.tva_amount = orderData.tva_amount || 0;
        
        // Créer la commande
        const orderId = await window.db.add('ORDERS', orderData);
        console.log(`Commande #${orderId} créée avec succès`);
        return orderId;
      } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        throw error;
      }
    },
    
    /**
     * Met à jour une commande existante
     * @param {Object} orderData - Données de la commande
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async update(orderData) {
      try {
        // Vérifier que l'ID est défini
        if (!orderData.id) {
          throw new Error('L\'ID de la commande est obligatoire pour la mise à jour');
        }
        
        // Vérifier que la commande existe
        const existingOrder = await this.getById(orderData.id);
        
        // Mise à jour de la commande
        await window.db.update('ORDERS', orderData);
        console.log(`Commande #${orderData.id} mise à jour avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la commande #${orderData.id}:`, error);
        throw error;
      }
    },
    
    /**
     * Met à jour le statut d'une commande
     * @param {number} orderId - ID de la commande
     * @param {string} status - Nouveau statut
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateStatus(orderId, status) {
      try {
        // Vérifier que la commande existe
        const order = await this.getById(orderId);
        
        // Vérifier que le statut est valide
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          throw new Error(`Statut de commande invalide: ${status}`);
        }
        
        // Mettre à jour le statut
        order.status = status;
        await window.db.update('ORDERS', order);
        console.log(`Statut de la commande #${orderId} mis à jour: ${status}`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Supprime une commande
     * @param {number} orderId - ID de la commande à supprimer
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async delete(orderId) {
      try {
        // Supprimer d'abord les articles associés
        await this.deleteOrderItems(orderId);
        
        // Supprimer la commande
        await window.db.delete('ORDERS', orderId);
        console.log(`Commande #${orderId} supprimée avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Récupère tous les articles d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Array>} Liste des articles de la commande
     */
    async getOrderItems(orderId) {
      try {
        // Utiliser l'index ORDER_ITEMS.order_id
        const items = await window.db.getByIndex('ORDER_ITEMS', 'order_id', orderId);
        
        // Récupérer les informations complètes des produits
        const itemsWithProducts = await Promise.all(items.map(async (item) => {
          try {
            const product = await window.db.get('PRODUCTS', item.product_id);
            return {
              ...item,
              product: product
            };
          } catch (error) {
            console.warn(`Produit introuvable pour l'article #${item.id}:`, error);
            return item;
          }
        }));
        
        return itemsWithProducts;
      } catch (error) {
        console.error(`Erreur lors de la récupération des articles de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Ajoute un article à une commande
     * @param {Object} itemData - Données de l'article
     * @returns {Promise<number>} ID du nouvel article
     */
    async addOrderItem(itemData) {
      try {
        // Vérifier les champs obligatoires
        if (!itemData.order_id) {
          throw new Error('L\'ID de commande est obligatoire');
        }
        
        if (!itemData.product_id) {
          throw new Error('L\'ID de produit est obligatoire');
        }
        
        // Définir la quantité par défaut
        itemData.quantity = itemData.quantity || 1;
        
        // Vérifier que le produit existe et récupérer son prix
        const product = await window.db.get('PRODUCTS', itemData.product_id);
        if (!product) {
          throw new Error(`Produit #${itemData.product_id} introuvable`);
        }
        
        // Utiliser le prix du produit si non spécifié
        if (!itemData.price) {
          itemData.price = product.selling_price;
        }
        
        // Ajouter l'article
        const itemId = await window.db.add('ORDER_ITEMS', itemData);
        
        // Mettre à jour les totaux de la commande
        await this.updateOrderTotals(itemData.order_id);
        
        console.log(`Article ajouté à la commande #${itemData.order_id}`);
        return itemId;
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un article à la commande:', error);
        throw error;
      }
    },
    
    /**
     * Met à jour un article de commande
     * @param {Object} itemData - Données de l'article
     * @returns {Promise<boolean>} True si la mise à jour a réussi
     */
    async updateOrderItem(itemData) {
      try {
        // Vérifier que l'ID est défini
        if (!itemData.id) {
          throw new Error('L\'ID de l\'article est obligatoire pour la mise à jour');
        }
        
        // Mettre à jour l'article
        await window.db.update('ORDER_ITEMS', itemData);
        
        // Mettre à jour les totaux de la commande
        await this.updateOrderTotals(itemData.order_id);
        
        console.log(`Article #${itemData.id} mis à jour avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'article #${itemData.id}:`, error);
        throw error;
      }
    },
    
    /**
     * Supprime un article de commande
     * @param {number} itemId - ID de l'article à supprimer
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async deleteOrderItem(itemId) {
      try {
        // Récupérer l'article pour connaître l'ID de la commande
        const item = await window.db.get('ORDER_ITEMS', itemId);
        if (!item) {
          throw new Error(`Article #${itemId} introuvable`);
        }
        
        // Supprimer l'article
        await window.db.delete('ORDER_ITEMS', itemId);
        
        // Mettre à jour les totaux de la commande
        await this.updateOrderTotals(item.order_id);
        
        console.log(`Article #${itemId} supprimé avec succès`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'article #${itemId}:`, error);
        throw error;
      }
    },
    
    /**
     * Supprime tous les articles d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async deleteOrderItems(orderId) {
      try {
        // Récupérer tous les articles de la commande
        const items = await this.getOrderItems(orderId);
        
        // Supprimer chaque article
        await Promise.all(items.map(async (item) => {
          await window.db.delete('ORDER_ITEMS', item.id);
        }));
        
        console.log(`Tous les articles de la commande #${orderId} ont été supprimés`);
        return true;
      } catch (error) {
        console.error(`Erreur lors de la suppression des articles de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Met à jour les totaux d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Object>} Nouveaux totaux de la commande
     */
    async updateOrderTotals(orderId) {
      try {
        // Récupérer la commande
        const order = await this.getById(orderId);
        
        // Récupérer tous les articles de la commande
        const items = await this.getOrderItems(orderId);
        
        // Calculer le total HT
        let totalHT = 0;
        items.forEach(item => {
          totalHT += item.price * item.quantity;
        });
        
        // Calculer la TVA et le total TTC
        // Utilisons un taux fixe pour simplifier (dans un cas réel, cela pourrait varier par produit)
        const tvaRate = 0.2; // 20% de TVA
        const tvaAmount = window.utils.calculations.calculateVAT(totalHT, tvaRate);
        const totalTTC = window.utils.calculations.calculateTTC(totalHT, tvaRate);
        
        // Mettre à jour la commande
        order.total_ht = window.utils.calculations.roundToTwoDecimals(totalHT);
        order.tva_amount = window.utils.calculations.roundToTwoDecimals(tvaAmount);
        order.total_ttc = window.utils.calculations.roundToTwoDecimals(totalTTC);
        
        await window.db.update('ORDERS', order);
        
        return {
          total_ht: order.total_ht,
          tva_amount: order.tva_amount,
          total_ttc: order.total_ttc
        };
      } catch (error) {
        console.error(`Erreur lors de la mise à jour des totaux de la commande #${orderId}:`, error);
        throw error;
      }
    },
    
    /**
     * Recherche des commandes selon des critères
     * @param {Object} criteria - Critères de recherche
     * @returns {Promise<Array>} Liste des commandes correspondant aux critères
     */
    async searchOrders(criteria) {
      try {
        // Récupérer toutes les commandes et filtrer en mémoire
        // (dans un cas réel avec beaucoup de données, cela devrait être fait avec des requêtes de base de données optimisées)
        const allOrders = await this.getAll();
        
        let filteredOrders = allOrders;
        
        // Filtrer par date
        if (criteria.dateRange) {
          const startDate = new Date(criteria.dateRange.start);
          const endDate = new Date(criteria.dateRange.end);
          
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startDate && orderDate <= endDate;
          });
        }
        
        // Filtrer par statut
        if (criteria.status) {
          filteredOrders = filteredOrders.filter(order => order.status === criteria.status);
        }
        
        // Filtrer par table
        if (criteria.tableNumber) {
          filteredOrders = filteredOrders.filter(order => order.table_number === criteria.tableNumber);
        }
        
        // Filtrer par montant minimum
        if (criteria.minAmount) {
          filteredOrders = filteredOrders.filter(order => order.total_ttc >= criteria.minAmount);
        }
        
        // Filtrer par montant maximum
        if (criteria.maxAmount) {
          filteredOrders = filteredOrders.filter(order => order.total_ttc <= criteria.maxAmount);
        }
        
        return filteredOrders;
      } catch (error) {
        console.error('Erreur lors de la recherche de commandes:', error);
        throw error;
      }
    }
  };
  
  // Exposer le référentiel dans l'espace de nommage global
  window.modules = window.modules || {};
  window.modules.orders = window.modules.orders || {};
  window.modules.orders.OrderRepository = OrderRepository;
  
  // Exporter pour les imports ES6
  export default OrderRepository;