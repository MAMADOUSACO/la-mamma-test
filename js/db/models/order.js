/**
 * Modèle Order - Gestion des commandes du restaurant
 */

/**
 * Classe OrderModel - Interface pour les opérations sur les commandes
 */
class OrderModel {
    constructor() {
      this.storeName = 'orders';
      this.itemsStoreName = 'order_items';
      this.db = window.db;
      this.productModel = window.models.Product;
    }
  
    /**
     * Récupère toutes les commandes
     * @param {Object} filters - Critères de filtrage (date, statut, etc.)
     * @returns {Promise<Array>} - Liste des commandes
     */
    async getAll(filters = {}) {
      try {
        let orders = await this.db.getAll(this.storeName);
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par date
          if (filters.date) {
            const filterDate = new Date(filters.date);
            orders = orders.filter(order => {
              const orderDate = new Date(order.date);
              return orderDate.toDateString() === filterDate.toDateString();
            });
          }
          
          // Filtre par statut
          if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
          }
          
          // Filtre par numéro de table
          if (filters.table_number) {
            orders = orders.filter(order => order.table_number === filters.table_number);
          }
        }
        
        return orders;
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes', error);
        throw error;
      }
    }
  
    /**
     * Récupère une commande par son ID, avec ses articles
     * @param {number} id - ID de la commande
     * @returns {Promise<Object>} - La commande avec ses articles
     */
    async getById(id) {
      try {
        // Récupérer la commande
        const order = await this.db.get(this.storeName, id);
        if (!order) {
          return null;
        }
        
        // Récupérer les articles de la commande
        order.items = await this.getOrderItems(id);
        
        return order;
      } catch (error) {
        console.error(`Erreur lors de la récupération de la commande #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les articles d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Array>} - Liste des articles
     */
    async getOrderItems(orderId) {
      try {
        const items = await this.db.getByIndex(this.itemsStoreName, 'order_id', orderId);
        
        // Enrichir avec les informations des produits
        for (const item of items) {
          if (item.product_id) {
            const product = await this.productModel.getById(item.product_id);
            if (product) {
              item.product_name = product.name;
              item.product_category = product.category;
            }
          }
        }
        
        return items;
      } catch (error) {
        console.error(`Erreur lors de la récupération des articles de la commande #${orderId}`, error);
        throw error;
      }
    }
  
    /**
     * Crée une nouvelle commande
     * @param {Object} orderData - Données de la commande
     * @param {Array} items - Articles de la commande
     * @returns {Promise<number>} - ID de la commande créée
     */
    async create(orderData, items = []) {
      try {
        // Calculer les totaux si non fournis
        if (!orderData.total_ht || !orderData.total_ttc || !orderData.tva_amount) {
          const calculatedTotals = await this._calculateTotals(items);
          orderData.total_ht = calculatedTotals.totalHT;
          orderData.total_ttc = calculatedTotals.totalTTC;
          orderData.tva_amount = calculatedTotals.tvaAmount;
        }
        
        // Ajouter la date si non fournie
        if (!orderData.date) {
          orderData.date = new Date();
        }
        
        // Définir le statut par défaut si non fourni
        if (!orderData.status) {
          orderData.status = 'pending';
        }
        
        // Créer la commande
        const orderId = await this.db.add(this.storeName, orderData);
        
        // Ajouter les articles s'il y en a
        if (items && items.length > 0) {
          await this.addItems(orderId, items);
        }
        
        // Mettre à jour le statut de la table
        if (orderData.table_number) {
          await this._updateTableStatus(orderData.table_number, 'occupied');
        }
        
        return orderId;
      } catch (error) {
        console.error('Erreur lors de la création de la commande', error);
        throw error;
      }
    }
  
    /**
     * Ajoute des articles à une commande
     * @param {number} orderId - ID de la commande
     * @param {Array} items - Articles à ajouter
     * @returns {Promise<Array>} - IDs des articles ajoutés
     */
    async addItems(orderId, items) {
      try {
        const itemIds = [];
        
        // Parcourir les articles
        for (const item of items) {
          // Ajouter l'ID de la commande
          item.order_id = orderId;
          
          // Ajouter l'article
          const itemId = await this.db.add(this.itemsStoreName, item);
          itemIds.push(itemId);
          
          // Mettre à jour le stock si c'est un produit d'inventaire
          if (item.product_id) {
            const product = await this.productModel.getById(item.product_id);
            
            // Si c'est un produit géré en stock (unité différente de 'unit' ou produit d'inventaire)
            if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
              await this.productModel.updateQuantity(
                item.product_id,
                -item.quantity,
                `Commande #${orderId}`
              );
            }
          }
        }
        
        // Mettre à jour les totaux de la commande
        await this.updateTotals(orderId);
        
        return itemIds;
      } catch (error) {
        console.error(`Erreur lors de l'ajout d'articles à la commande #${orderId}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour une commande existante
     * @param {Object} orderData - Données de la commande avec ID
     * @returns {Promise<number>} - ID de la commande mise à jour
     */
    async update(orderData) {
      try {
        // Vérification de l'existence de l'ID
        if (!orderData.id) {
          throw new Error('ID manquant pour la mise à jour de la commande');
        }
        
        // Récupérer la commande existante pour vérification
        const existingOrder = await this.db.get(this.storeName, orderData.id);
        if (!existingOrder) {
          throw new Error(`Commande #${orderData.id} introuvable`);
        }
        
        // Si le numéro de table a changé, mettre à jour les statuts des tables
        if (orderData.table_number !== existingOrder.table_number) {
          // Libérer l'ancienne table
          if (existingOrder.table_number) {
            await this._updateTableStatus(existingOrder.table_number, 'available');
          }
          
          // Occuper la nouvelle table
          if (orderData.table_number) {
            await this._updateTableStatus(orderData.table_number, 'occupied');
          }
        }
        
        // Si le statut a changé à 'completed' ou 'cancelled', libérer la table
        if (
          (orderData.status === 'completed' || orderData.status === 'cancelled') &&
          existingOrder.status !== 'completed' && existingOrder.status !== 'cancelled' &&
          orderData.table_number
        ) {
          await this._updateTableStatus(orderData.table_number, 'available');
        }
        
        return await this.db.update(this.storeName, orderData);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la commande #${orderData.id}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour le statut d'une commande
     * @param {number} id - ID de la commande
     * @param {string} status - Nouveau statut
     * @returns {Promise<Object>} - Commande mise à jour
     */
    async updateStatus(id, status) {
      try {
        const order = await this.db.get(this.storeName, id);
        if (!order) {
          throw new Error(`Commande #${id} introuvable`);
        }
        
        // Vérifier la validité du statut
        const validStatuses = window.DefaultsConfig.orderStatus.map(s => s.id);
        if (!validStatuses.includes(status)) {
          throw new Error(`Statut invalide: ${status}`);
        }
        
        // Mettre à jour le statut
        order.status = status;
        
        // Si la commande est terminée ou annulée, libérer la table
        if ((status === 'completed' || status === 'cancelled') && order.table_number) {
          await this._updateTableStatus(order.table_number, 'available');
        }
        
        await this.db.update(this.storeName, order);
        return order;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la commande #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Supprime un article d'une commande
     * @param {number} orderId - ID de la commande
     * @param {number} itemId - ID de l'article
     * @returns {Promise<void>}
     */
    async removeItem(orderId, itemId) {
      try {
        // Récupérer l'article
        const item = await this.db.get(this.itemsStoreName, itemId);
        if (!item || item.order_id !== orderId) {
          throw new Error(`Article #${itemId} introuvable dans la commande #${orderId}`);
        }
        
        // Supprimer l'article
        await this.db.delete(this.itemsStoreName, itemId);
        
        // Restituer le stock si nécessaire
        if (item.product_id) {
          const product = await this.productModel.getById(item.product_id);
          
          // Si c'est un produit géré en stock
          if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
            await this.productModel.updateQuantity(
              item.product_id,
              item.quantity, // Quantité positive pour restituer le stock
              `Annulation article dans commande #${orderId}`
            );
          }
        }
        
        // Mettre à jour les totaux de la commande
        await this.updateTotals(orderId);
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'article #${itemId} de la commande #${orderId}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour les totaux d'une commande basé sur ses articles
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Object>} - Commande mise à jour
     */
    async updateTotals(orderId) {
      try {
        // Récupérer la commande
        const order = await this.db.get(this.storeName, orderId);
        if (!order) {
          throw new Error(`Commande #${orderId} introuvable`);
        }
        
        // Récupérer les articles
        const items = await this.getOrderItems(orderId);
        
        // Calculer les totaux
        const totals = await this._calculateTotals(items);
        
        // Mettre à jour la commande
        order.total_ht = totals.totalHT;
        order.total_ttc = totals.totalTTC;
        order.tva_amount = totals.tvaAmount;
        
        await this.db.update(this.storeName, order);
        return order;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour des totaux de la commande #${orderId}`, error);
        throw error;
      }
    }
  
    /**
     * Annule une commande
     * @param {number} id - ID de la commande
     * @returns {Promise<Object>} - Commande annulée
     */
    async cancel(id) {
      try {
        // Mettre à jour le statut
        const order = await this.updateStatus(id, 'cancelled');
        
        // Récupérer les articles
        const items = await this.getOrderItems(id);
        
        // Restituer le stock pour chaque article
        for (const item of items) {
          if (item.product_id) {
            const product = await this.productModel.getById(item.product_id);
            
            // Si c'est un produit géré en stock
            if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
              await this.productModel.updateQuantity(
                item.product_id,
                item.quantity,
                `Annulation commande #${id}`
              );
            }
          }
        }
        
        return order;
      } catch (error) {
        console.error(`Erreur lors de l'annulation de la commande #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les commandes pour une table spécifique
     * @param {number} tableNumber - Numéro de la table
     * @param {boolean} activeOnly - Si true, ne récupère que les commandes actives
     * @returns {Promise<Array>} - Liste des commandes
     */
    async getByTable(tableNumber, activeOnly = true) {
      try {
        let orders = await this.db.getByIndex(this.storeName, 'table_number', tableNumber);
        
        // Filtrer les commandes actives si demandé
        if (activeOnly) {
          const activeStatuses = ['pending', 'in_progress', 'ready', 'served'];
          orders = orders.filter(order => activeStatuses.includes(order.status));
        }
        
        return orders;
      } catch (error) {
        console.error(`Erreur lors de la récupération des commandes pour la table ${tableNumber}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les commandes par date
     * @param {Date} date - Date des commandes
     * @returns {Promise<Array>} - Liste des commandes
     */
    async getByDate(date) {
      try {
        const allOrders = await this.db.getAll(this.storeName);
        const targetDate = new Date(date);
        
        // Filtrer par date
        return allOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.toDateString() === targetDate.toDateString();
        });
      } catch (error) {
        console.error(`Erreur lors de la récupération des commandes par date ${date}`, error);
        throw error;
      }
    }
  
    /**
     * Calcule les totaux d'une commande à partir de ses articles
     * @param {Array} items - Articles de la commande
     * @returns {Promise<Object>} - Totaux calculés
     * @private
     */
    async _calculateTotals(items) {
      // Taux de TVA
      const tvaSources = window.DefaultsConfig.tva;
      const productCategories = window.DefaultsConfig.productCategories;
      
      let totalHT = 0;
      let totalTTC = 0;
      let tvaAmount = 0;
      
      for (const item of items) {
        // Prix HT de l'article
        const itemTotal = item.price * item.quantity;
        totalHT += itemTotal;
        
        // Calculer la TVA
        let tvaRate = tvaSources.standard; // Taux par défaut
        
        // Si on a les informations sur la catégorie du produit
        if (item.product_id) {
          const product = await this.productModel.getById(item.product_id);
          if (product) {
            // Trouver la catégorie du produit
            const category = productCategories.find(cat => cat.id === product.category);
            if (category && category.tva) {
              // Appliquer le taux de TVA correspondant à la catégorie
              tvaRate = tvaSources[category.tva] || tvaSources.standard;
            }
          }
        }
        
        // Calculer le montant de TVA pour cet article
        const itemTVA = itemTotal * (tvaRate / 100);
        tvaAmount += itemTVA;
      }
      
      // Calculer le total TTC
      totalTTC = totalHT + tvaAmount;
      
      // Arrondir les valeurs à 2 décimales
      totalHT = Math.round(totalHT * 100) / 100;
      totalTTC = Math.round(totalTTC * 100) / 100;
      tvaAmount = Math.round(tvaAmount * 100) / 100;
      
      return {
        totalHT,
        totalTTC,
        tvaAmount
      };
    }
  
    /**
     * Met à jour le statut d'une table
     * @param {number} tableNumber - Numéro de la table
     * @param {string} status - Nouveau statut
     * @returns {Promise<void>}
     * @private
     */
    async _updateTableStatus(tableNumber, status) {
      try {
        // Récupérer la table par son numéro
        const tables = await this.db.getByIndex('tables', 'number', tableNumber);
        if (!tables || tables.length === 0) {
          console.warn(`Table ${tableNumber} introuvable`);
          return;
        }
        
        const table = tables[0];
        
        // Vérifier le statut actuel si la table est réservée
        if (table.status === 'reserved' && status === 'available') {
          // Vérifier s'il y a une réservation active pour cette table
          const reservations = await this.db.getByIndex('reservations', 'table_id', table.id);
          const now = new Date();
          
          // Filtrer les réservations actuelles
          const activeReservation = reservations.find(res => {
            const resDate = new Date(res.date);
            const resTime = res.time.split(':');
            
            resDate.setHours(parseInt(resTime[0], 10), parseInt(resTime[1], 10));
            
            // Calculer fin de réservation (2h après début)
            const endTime = new Date(resDate);
            endTime.setHours(endTime.getHours() + 2);
            
            return resDate <= now && now <= endTime && 
                   (res.status === 'confirmed' || res.status === 'seated');
          });
          
          if (activeReservation) {
            // Ne pas changer le statut de la table si elle est réservée et la réservation est active
            console.log(`Table ${tableNumber} est réservée, statut non modifié`);
            return;
          }
        }
        
        // Mettre à jour le statut
        table.status = status;
        await this.db.update('tables', table);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la table ${tableNumber}`, error);
        // Ne pas propager l'erreur pour éviter de bloquer les opérations principales
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.Order = new OrderModel();