/**
 * Modèle Table - Gestion des tables du restaurant
 */

/**
 * Classe TableModel - Interface pour les opérations sur les tables
 */
class TableModel {
    constructor() {
      this.storeName = 'tables';
      this.db = window.db;
    }
  
    /**
     * Récupère toutes les tables
     * @param {Object} filters - Critères de filtrage (statut, capacité, etc.)
     * @returns {Promise<Array>} - Liste des tables
     */
    async getAll(filters = {}) {
      try {
        let tables = await this.db.getAll(this.storeName);
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par statut
          if (filters.status) {
            tables = tables.filter(table => table.status === filters.status);
          }
          
          // Filtre par capacité minimale
          if (filters.minCapacity) {
            tables = tables.filter(table => table.capacity >= filters.minCapacity);
          }
          
          // Filtre par capacité maximale
          if (filters.maxCapacity) {
            tables = tables.filter(table => table.capacity <= filters.maxCapacity);
          }
          
          // Filtre par forme
          if (filters.shape) {
            tables = tables.filter(table => table.shape === filters.shape);
          }
        }
        
        // Trier par numéro de table
        return tables.sort((a, b) => a.number - b.number);
      } catch (error) {
        console.error('Erreur lors de la récupération des tables', error);
        throw error;
      }
    }
  
    /**
     * Récupère une table par son ID
     * @param {number} id - ID de la table
     * @returns {Promise<Object>} - La table demandée
     */
    async getById(id) {
      try {
        return await this.db.get(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la récupération de la table #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère une table par son numéro
     * @param {number} number - Numéro de la table
     * @returns {Promise<Object>} - La table demandée
     */
    async getByNumber(number) {
      try {
        const tables = await this.db.getByIndex(this.storeName, 'number', number);
        return tables && tables.length > 0 ? tables[0] : null;
      } catch (error) {
        console.error(`Erreur lors de la récupération de la table #${number}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les tables par statut
     * @param {string} status - Statut des tables
     * @returns {Promise<Array>} - Liste des tables avec ce statut
     */
    async getByStatus(status) {
      try {
        return await this.db.getByIndex(this.storeName, 'status', status);
      } catch (error) {
        console.error(`Erreur lors de la récupération des tables avec statut ${status}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les tables par capacité
     * @param {number} capacity - Capacité minimale des tables
     * @returns {Promise<Array>} - Liste des tables avec une capacité supérieure ou égale
     */
    async getByCapacity(capacity) {
      try {
        const tables = await this.db.getAll(this.storeName);
        return tables.filter(table => table.capacity >= capacity);
      } catch (error) {
        console.error(`Erreur lors de la récupération des tables avec capacité >= ${capacity}`, error);
        throw error;
      }
    }
  
    /**
     * Crée une nouvelle table
     * @param {Object} tableData - Données de la table
     * @returns {Promise<number>} - ID de la table créée
     */
    async create(tableData) {
      try {
        // Valider les données
        this._validateTable(tableData);
        
        // Vérifier que le numéro de table n'existe pas déjà
        const existingTable = await this.getByNumber(tableData.number);
        if (existingTable) {
          throw new Error(`Une table avec le numéro ${tableData.number} existe déjà`);
        }
        
        // Définir le statut par défaut si non fourni
        if (!tableData.status) {
          tableData.status = 'available';
        }
        
        // Créer la table
        return await this.db.add(this.storeName, tableData);
      } catch (error) {
        console.error('Erreur lors de la création de la table', error);
        throw error;
      }
    }
  
    /**
     * Met à jour une table existante
     * @param {Object} tableData - Données de la table avec ID
     * @returns {Promise<number>} - ID de la table mise à jour
     */
    async update(tableData) {
      try {
        // Vérification de l'existence de l'ID
        if (!tableData.id) {
          throw new Error('ID manquant pour la mise à jour de la table');
        }
        
        // Récupérer la table existante
        const existingTable = await this.getById(tableData.id);
        if (!existingTable) {
          throw new Error(`Table #${tableData.id} introuvable`);
        }
        
        // Valider les données
        this._validateTable(tableData);
        
        // Si le numéro a changé, vérifier qu'il n'est pas déjà utilisé
        if (tableData.number !== existingTable.number) {
          const tableWithSameNumber = await this.getByNumber(tableData.number);
          if (tableWithSameNumber && tableWithSameNumber.id !== tableData.id) {
            throw new Error(`Une table avec le numéro ${tableData.number} existe déjà`);
          }
        }
        
        return await this.db.update(this.storeName, tableData);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la table #${tableData.id}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour le statut d'une table
     * @param {number} id - ID de la table
     * @param {string} status - Nouveau statut
     * @returns {Promise<Object>} - Table mise à jour
     */
    async updateStatus(id, status) {
      try {
        const table = await this.getById(id);
        if (!table) {
          throw new Error(`Table #${id} introuvable`);
        }
        
        // Vérifier la validité du statut
        const validStatuses = window.DefaultsConfig.tableStatus.map(s => s.id);
        if (!validStatuses.includes(status)) {
          throw new Error(`Statut invalide: ${status}`);
        }
        
        // Mettre à jour le statut
        table.status = status;
        
        await this.db.update(this.storeName, table);
        return table;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la table #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour la position d'une table sur le plan
     * @param {number} id - ID de la table
     * @param {number} positionX - Coordonnée X
     * @param {number} positionY - Coordonnée Y
     * @returns {Promise<Object>} - Table mise à jour
     */
    async updatePosition(id, positionX, positionY) {
      try {
        const table = await this.getById(id);
        if (!table) {
          throw new Error(`Table #${id} introuvable`);
        }
        
        // Mettre à jour les coordonnées
        table.position_x = positionX;
        table.position_y = positionY;
        
        await this.db.update(this.storeName, table);
        return table;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la position de la table #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Supprime une table
     * @param {number} id - ID de la table
     * @returns {Promise<void>}
     */
    async delete(id) {
      try {
        // Vérifier si la table existe
        const table = await this.getById(id);
        if (!table) {
          throw new Error(`Table #${id} introuvable`);
        }
        
        // Vérifier si la table est utilisée dans des réservations
        const reservations = await this._checkTableUsageInReservations(id);
        if (reservations > 0) {
          throw new Error(`Impossible de supprimer la table car elle est utilisée dans ${reservations} réservation(s)`);
        }
        
        // Vérifier si la table est utilisée dans des commandes actives
        const orders = await this._checkTableUsageInOrders(id, table.number);
        if (orders > 0) {
          throw new Error(`Impossible de supprimer la table car elle est utilisée dans ${orders} commande(s) active(s)`);
        }
        
        // Supprimer la table
        await this.db.delete(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la suppression de la table #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les réservations futures pour une table
     * @param {number} id - ID de la table
     * @returns {Promise<Array>} - Liste des réservations
     */
    async getReservations(id) {
      try {
        // Récupérer toutes les réservations pour cette table
        const reservations = await this.db.getByIndex('reservations', 'table_id', id);
        
        // Filtrer pour ne garder que les réservations futures
        const now = new Date();
        return reservations.filter(reservation => {
          const resDate = new Date(reservation.date);
          
          // Si la date est dans le futur
          if (resDate > now) {
            return true;
          }
          
          // Si c'est aujourd'hui, vérifier l'heure
          if (resDate.toDateString() === now.toDateString()) {
            const [hours, minutes] = reservation.time.split(':').map(Number);
            const resTime = new Date();
            resTime.setHours(hours, minutes, 0, 0);
            
            return resTime > now;
          }
          
          return false;
        });
      } catch (error) {
        console.error(`Erreur lors de la récupération des réservations pour la table #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Vérifie le nombre de réservations utilisant une table
     * @param {number} tableId - ID de la table
     * @returns {Promise<number>} - Nombre de réservations
     * @private
     */
    async _checkTableUsageInReservations(tableId) {
      try {
        const reservations = await this.db.getByIndex('reservations', 'table_id', tableId);
        
        // Filtrer pour ne garder que les réservations actives (non annulées, non terminées)
        const activeReservations = reservations.filter(
          res => res.status !== 'cancelled' && res.status !== 'completed' && res.status !== 'no_show'
        );
        
        return activeReservations.length;
      } catch (error) {
        console.error(`Erreur lors de la vérification des réservations pour la table #${tableId}`, error);
        return 0; // En cas d'erreur, supposer qu'il n'y a pas de réservations
      }
    }
  
    /**
     * Vérifie le nombre de commandes actives utilisant une table
     * @param {number} tableId - ID de la table
     * @param {number} tableNumber - Numéro de la table
     * @returns {Promise<number>} - Nombre de commandes
     * @private
     */
    async _checkTableUsageInOrders(tableId, tableNumber) {
      try {
        const orders = await this.db.getByIndex('orders', 'table_number', tableNumber);
        
        // Filtrer pour ne garder que les commandes actives
        const activeOrders = orders.filter(
          order => order.status !== 'completed' && order.status !== 'cancelled'
        );
        
        return activeOrders.length;
      } catch (error) {
        console.error(`Erreur lors de la vérification des commandes pour la table #${tableId}`, error);
        return 0; // En cas d'erreur, supposer qu'il n'y a pas de commandes
      }
    }
  
    /**
     * Valide les données d'une table
     * @param {Object} table - Table à valider
     * @private
     * @throws {Error} Si la validation échoue
     */
    _validateTable(table) {
      // Vérification des champs obligatoires
      if (!table.number) {
        throw new Error('Le numéro de table est obligatoire');
      }
      
      if (!table.capacity || table.capacity <= 0) {
        throw new Error('La capacité doit être un nombre positif');
      }
      
      // Vérifier que la forme est valide si spécifiée
      if (table.shape) {
        const validShapes = window.DefaultsConfig.tableShapes.map(s => s.id);
        if (!validShapes.includes(table.shape)) {
          throw new Error(`Forme invalide: ${table.shape}`);
        }
      }
      
      // Vérifier que le statut est valide si spécifié
      if (table.status) {
        const validStatuses = window.DefaultsConfig.tableStatus.map(s => s.id);
        if (!validStatuses.includes(table.status)) {
          throw new Error(`Statut invalide: ${table.status}`);
        }
      }
      
      // Vérifier que les coordonnées sont spécifiées si on gère un plan de salle
      if ((table.position_x === undefined || table.position_y === undefined) && table.position_x !== 0 && table.position_y !== 0) {
        table.position_x = 0;
        table.position_y = 0;
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.Table = new TableModel();