/**
 * Modèle OrderItem - Gestion des articles de commande
 */

/**
 * Classe OrderItemModel - Interface pour les opérations sur les articles de commande
 */
class OrderItemModel {
    constructor() {
      this.storeName = 'order_items';
      this.db = window.db;
      this.productModel = window.models.Product;
    }
  
    /**
     * Récupère tous les articles de commande
     * @param {Object} filters - Critères de filtrage (order_id, product_id, etc.)
     * @returns {Promise<Array>} - Liste des articles
     */
    async getAll(filters = {}) {
      try {
        let items = await this.db.getAll(this.storeName);
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par commande
          if (filters.order_id) {
            items = items.filter(item => item.order_id === filters.order_id);
          }
          
          // Filtre par produit
          if (filters.product_id) {
            items = items.filter(item => item.product_id === filters.product_id);
          }
        }
        
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
        console.error('Erreur lors de la récupération des articles de commande', error);
        throw error;
      }
    }
  
    /**
     * Récupère un article par son ID
     * @param {number} id - ID de l'article
     * @returns {Promise<Object>} - L'article demandé
     */
    async getById(id) {
      try {
        const item = await this.db.get(this.storeName, id);
        
        // Enrichir avec les informations du produit
        if (item && item.product_id) {
          const product = await this.productModel.getById(item.product_id);
          if (product) {
            item.product_name = product.name;
            item.product_category = product.category;
          }
        }
        
        return item;
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'article #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les articles d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Array>} - Liste des articles de la commande
     */
    async getByOrderId(orderId) {
      try {
        const items = await this.db.getByIndex(this.storeName, 'order_id', orderId);
        
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
     * Ajoute un nouvel article
     * @param {Object} itemData - Données de l'article
     * @returns {Promise<number>} - ID de l'article créé
     */
    async add(itemData) {
      try {
        // Valider les données
        this._validateItem(itemData);
        
        // Si le prix n'est pas fourni, le récupérer depuis le produit
        if (!itemData.price && itemData.product_id) {
          const product = await this.productModel.getById(itemData.product_id);
          if (product) {
            itemData.price = product.selling_price;
          }
        }
        
        // Créer l'article
        const itemId = await this.db.add(this.storeName, itemData);
        
        // Mettre à jour le stock si nécessaire
        if (itemData.product_id) {
          const product = await this.productModel.getById(itemData.product_id);
          
          // Si c'est un produit géré en stock (unité différente de 'unit' ou produit d'inventaire)
          if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
            await this.productModel.updateQuantity(
              itemData.product_id,
              -itemData.quantity,
              `Commande #${itemData.order_id}`
            );
          }
        }
        
        return itemId;
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un article', error);
        throw error;
      }
    }
  
    /**
     * Met à jour un article existant
     * @param {Object} itemData - Données de l'article avec ID
     * @returns {Promise<number>} - ID de l'article mis à jour
     */
    async update(itemData) {
      try {
        // Vérification de l'existence de l'ID
        if (!itemData.id) {
          throw new Error('ID manquant pour la mise à jour de l\'article');
        }
        
        // Récupérer l'article existant
        const existingItem = await this.getById(itemData.id);
        if (!existingItem) {
          throw new Error(`Article #${itemData.id} introuvable`);
        }
        
        // Valider les données
        this._validateItem(itemData);
        
        // Si la quantité a changé, mettre à jour le stock
        if (itemData.quantity !== existingItem.quantity && itemData.product_id) {
          const quantityDiff = itemData.quantity - existingItem.quantity;
          const product = await this.productModel.getById(itemData.product_id);
          
          // Si c'est un produit géré en stock
          if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
            await this.productModel.updateQuantity(
              itemData.product_id,
              -quantityDiff, // Négatif car une augmentation de quantité dans la commande diminue le stock
              `Modification article dans commande #${itemData.order_id}`
            );
          }
        }
        
        return await this.db.update(this.storeName, itemData);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'article #${itemData.id}`, error);
        throw error;
      }
    }
  
    /**
     * Supprime un article
     * @param {number} id - ID de l'article
     * @returns {Promise<void>}
     */
    async delete(id) {
      try {
        // Récupérer l'article pour connaître le produit et la quantité
        const item = await this.getById(id);
        if (!item) {
          throw new Error(`Article #${id} introuvable`);
        }
        
        // Mettre à jour le stock si nécessaire
        if (item.product_id) {
          const product = await this.productModel.getById(item.product_id);
          
          // Si c'est un produit géré en stock
          if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
            await this.productModel.updateQuantity(
              item.product_id,
              item.quantity, // Positif car on restitue le stock
              `Suppression article dans commande #${item.order_id}`
            );
          }
        }
        
        // Supprimer l'article
        await this.db.delete(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'article #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour la quantité d'un article
     * @param {number} id - ID de l'article
     * @param {number} quantity - Nouvelle quantité
     * @returns {Promise<Object>} - Article mis à jour
     */
    async updateQuantity(id, quantity) {
      try {
        const item = await this.getById(id);
        if (!item) {
          throw new Error(`Article #${id} introuvable`);
        }
        
        // Calculer la différence de quantité
        const quantityDiff = quantity - item.quantity;
        
        // Mettre à jour l'article
        item.quantity = quantity;
        
        // Mettre à jour le stock si nécessaire
        if (quantityDiff !== 0 && item.product_id) {
          const product = await this.productModel.getById(item.product_id);
          
          // Si c'est un produit géré en stock
          if (product && (product.unit !== 'unit' || product.category === 'supplies')) {
            await this.productModel.updateQuantity(
              item.product_id,
              -quantityDiff, // Négatif car une augmentation de quantité dans la commande diminue le stock
              `Modification quantité article dans commande #${item.order_id}`
            );
          }
        }
        
        await this.db.update(this.storeName, item);
        return item;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la quantité de l'article #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les statistiques des articles les plus commandés
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @param {number} limit - Nombre maximum d'articles à retourner
     * @returns {Promise<Array>} - Statistiques des articles
     */
    async getMostOrderedItems(startDate, endDate, limit = 10) {
      try {
        // Récupérer tous les articles
        const allItems = await this.getAll();
        
        // Récupérer toutes les commandes pour filtrer par date
        const allOrders = await this.db.getAll('orders');
        
        // Filtrer les commandes par date
        const filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        // Récupérer les IDs des commandes filtrées
        const orderIds = filteredOrders.map(order => order.id);
        
        // Filtrer les articles par commandes
        const filteredItems = allItems.filter(item => orderIds.includes(item.order_id));
        
        // Agréger les articles par produit
        const productStats = {};
        
        for (const item of filteredItems) {
          if (item.product_id) {
            if (!productStats[item.product_id]) {
              productStats[item.product_id] = {
                product_id: item.product_id,
                product_name: item.product_name || `Produit #${item.product_id}`,
                product_category: item.product_category || '',
                total_quantity: 0,
                total_revenue: 0,
                order_count: 0
              };
            }
            
            productStats[item.product_id].total_quantity += item.quantity;
            productStats[item.product_id].total_revenue += item.price * item.quantity;
            productStats[item.product_id].order_count++;
          }
        }
        
        // Convertir en tableau et trier par quantité
        const sortedStats = Object.values(productStats)
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, limit);
        
        return sortedStats;
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques d\'articles', error);
        throw error;
      }
    }
  
    /**
     * Valide les données d'un article
     * @param {Object} item - Article à valider
     * @private
     * @throws {Error} Si la validation échoue
     */
    _validateItem(item) {
      // Vérification des champs obligatoires
      if (!item.order_id) {
        throw new Error('L\'ID de commande est obligatoire');
      }
      
      if (!item.product_id) {
        throw new Error('L\'ID de produit est obligatoire');
      }
      
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('La quantité doit être un nombre positif');
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        throw new Error('Le prix doit être un nombre positif ou nul');
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.OrderItem = new OrderItemModel();