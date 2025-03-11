/**
 * Modèle Reservation - Gestion des réservations du restaurant
 */

/**
 * Classe ReservationModel - Interface pour les opérations sur les réservations
 */
class ReservationModel {
    constructor() {
      this.storeName = 'reservations';
      this.db = window.db;
    }
  
    /**
     * Récupère toutes les réservations
     * @param {Object} filters - Critères de filtrage (date, statut, etc.)
     * @returns {Promise<Array>} - Liste des réservations
     */
    async getAll(filters = {}) {
      try {
        let reservations = await this.db.getAll(this.storeName);
        
        // Appliquer les filtres
        if (filters) {
          // Filtre par date
          if (filters.date) {
            const filterDate = new Date(filters.date);
            reservations = reservations.filter(reservation => {
              const resDate = new Date(reservation.date);
              return resDate.toDateString() === filterDate.toDateString();
            });
          }
          
          // Filtre par statut
          if (filters.status) {
            reservations = reservations.filter(reservation => reservation.status === filters.status);
          }
          
          // Filtre par nom client
          if (filters.name) {
            const nameFilter = filters.name.toLowerCase();
            reservations = reservations.filter(reservation => 
              reservation.name && reservation.name.toLowerCase().includes(nameFilter)
            );
          }
          
          // Filtre par table
          if (filters.table_id) {
            reservations = reservations.filter(reservation => reservation.table_id === filters.table_id);
          }
        }
        
        return reservations;
      } catch (error) {
        console.error('Erreur lors de la récupération des réservations', error);
        throw error;
      }
    }
  
    /**
     * Récupère une réservation par son ID
     * @param {number} id - ID de la réservation
     * @returns {Promise<Object>} - La réservation demandée
     */
    async getById(id) {
      try {
        return await this.db.get(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la récupération de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les réservations d'une date spécifique
     * @param {Date|string} date - Date des réservations
     * @returns {Promise<Array>} - Liste des réservations pour cette date
     */
    async getByDate(date) {
      try {
        const targetDate = new Date(date);
        const dateString = targetDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Récupérer toutes les réservations
        const allReservations = await this.db.getAll(this.storeName);
        
        // Filtrer par date
        return allReservations.filter(reservation => {
          const resDate = new Date(reservation.date);
          const resDateString = resDate.toISOString().split('T')[0];
          return resDateString === dateString;
        });
      } catch (error) {
        console.error(`Erreur lors de la récupération des réservations pour la date ${date}`, error);
        throw error;
      }
    }
  
    /**
     * Crée une nouvelle réservation
     * @param {Object} reservationData - Données de la réservation
     * @returns {Promise<number>} - ID de la réservation créée
     */
    async create(reservationData) {
      try {
        // Valider les données
        this._validateReservation(reservationData);
        
        // S'assurer que le format de date est correct
        if (reservationData.date && typeof reservationData.date === 'string') {
          reservationData.date = new Date(reservationData.date);
        }
        
        // Vérifier la disponibilité de la table
        if (reservationData.table_id) {
          const isAvailable = await this._checkTableAvailability(
            reservationData.table_id, 
            reservationData.date, 
            reservationData.time, 
            null
          );
          
          if (!isAvailable) {
            throw new Error(`La table n'est pas disponible à cette date et heure`);
          }
          
          // Mettre à jour le statut de la table si la réservation est pour aujourd'hui
          await this._updateTableStatusIfNeeded(reservationData);
        }
        
        // Définir le statut par défaut si non fourni
        if (!reservationData.status) {
          reservationData.status = 'confirmed';
        }
        
        // Créer la réservation
        return await this.db.add(this.storeName, reservationData);
      } catch (error) {
        console.error('Erreur lors de la création de la réservation', error);
        throw error;
      }
    }
  
    /**
     * Met à jour une réservation existante
     * @param {Object} reservationData - Données de la réservation avec ID
     * @returns {Promise<number>} - ID de la réservation mise à jour
     */
    async update(reservationData) {
      try {
        // Vérification de l'existence de l'ID
        if (!reservationData.id) {
          throw new Error('ID manquant pour la mise à jour de la réservation');
        }
        
        // Récupérer la réservation existante
        const existingReservation = await this.getById(reservationData.id);
        if (!existingReservation) {
          throw new Error(`Réservation #${reservationData.id} introuvable`);
        }
        
        // Valider les données
        this._validateReservation(reservationData);
        
        // S'assurer que le format de date est correct
        if (reservationData.date && typeof reservationData.date === 'string') {
          reservationData.date = new Date(reservationData.date);
        }
        
        // Si la table, la date ou l'heure a changé, vérifier la disponibilité
        if (
          reservationData.table_id !== existingReservation.table_id ||
          reservationData.date.toString() !== existingReservation.date.toString() ||
          reservationData.time !== existingReservation.time
        ) {
          const isAvailable = await this._checkTableAvailability(
            reservationData.table_id, 
            reservationData.date, 
            reservationData.time, 
            reservationData.id
          );
          
          if (!isAvailable) {
            throw new Error(`La table n'est pas disponible à cette date et heure`);
          }
        }
        
        // Si le statut a changé
        if (reservationData.status !== existingReservation.status) {
          // Libérer la table si la réservation est annulée ou terminée
          if (
            (reservationData.status === 'cancelled' || reservationData.status === 'completed' || reservationData.status === 'no_show') &&
            existingReservation.status !== 'cancelled' && existingReservation.status !== 'completed' && existingReservation.status !== 'no_show'
          ) {
            await this._updateTableStatus(existingReservation.table_id, 'available');
          }
          // Marquer la table comme réservée si le statut passe à confirmé
          else if (
            reservationData.status === 'confirmed' &&
            (existingReservation.status === 'cancelled' || existingReservation.status === 'completed' || existingReservation.status === 'no_show')
          ) {
            await this._updateTableStatusIfNeeded(reservationData);
          }
          // Marquer la table comme occupée si les clients sont installés
          else if (reservationData.status === 'seated') {
            await this._updateTableStatus(reservationData.table_id, 'occupied');
          }
        }
        
        return await this.db.update(this.storeName, reservationData);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la réservation #${reservationData.id}`, error);
        throw error;
      }
    }
  
    /**
     * Met à jour le statut d'une réservation
     * @param {number} id - ID de la réservation
     * @param {string} status - Nouveau statut
     * @returns {Promise<Object>} - Réservation mise à jour
     */
    async updateStatus(id, status) {
      try {
        const reservation = await this.getById(id);
        if (!reservation) {
          throw new Error(`Réservation #${id} introuvable`);
        }
        
        // Vérifier la validité du statut
        const validStatuses = window.DefaultsConfig.reservationStatus.map(s => s.id);
        if (!validStatuses.includes(status)) {
          throw new Error(`Statut invalide: ${status}`);
        }
        
        // Créer un objet de mise à jour avec seulement le statut modifié
        const updatedReservation = {
          ...reservation,
          status
        };
        
        return await this.update(updatedReservation);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Annule une réservation
     * @param {number} id - ID de la réservation
     * @returns {Promise<Object>} - Réservation annulée
     */
    async cancel(id) {
      try {
        return await this.updateStatus(id, 'cancelled');
      } catch (error) {
        console.error(`Erreur lors de l'annulation de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Marque une réservation comme client installé
     * @param {number} id - ID de la réservation
     * @returns {Promise<Object>} - Réservation mise à jour
     */
    async markAsSeated(id) {
      try {
        return await this.updateStatus(id, 'seated');
      } catch (error) {
        console.error(`Erreur lors du marquage comme installé de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Marque une réservation comme terminée
     * @param {number} id - ID de la réservation
     * @returns {Promise<Object>} - Réservation mise à jour
     */
    async complete(id) {
      try {
        return await this.updateStatus(id, 'completed');
      } catch (error) {
        console.error(`Erreur lors du marquage comme terminé de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Marque une réservation comme no-show (client non présenté)
     * @param {number} id - ID de la réservation
     * @returns {Promise<Object>} - Réservation mise à jour
     */
    async markAsNoShow(id) {
      try {
        return await this.updateStatus(id, 'no_show');
      } catch (error) {
        console.error(`Erreur lors du marquage comme non présenté de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Récupère les réservations pour une table spécifique
     * @param {number} tableId - ID de la table
     * @param {Date} date - Date optionnelle pour filtrer
     * @returns {Promise<Array>} - Liste des réservations
     */
    async getByTable(tableId, date = null) {
      try {
        let reservations = await this.db.getByIndex(this.storeName, 'table_id', tableId);
        
        // Filtrer par date si fournie
        if (date) {
          const targetDate = new Date(date);
          reservations = reservations.filter(reservation => {
            const resDate = new Date(reservation.date);
            return resDate.toDateString() === targetDate.toDateString();
          });
        }
        
        return reservations;
      } catch (error) {
        console.error(`Erreur lors de la récupération des réservations pour la table #${tableId}`, error);
        throw error;
      }
    }
  
    /**
     * Supprime une réservation
     * @param {number} id - ID de la réservation
     * @returns {Promise<void>}
     */
    async delete(id) {
      try {
        // Récupérer la réservation pour connaître la table
        const reservation = await this.getById(id);
        if (!reservation) {
          throw new Error(`Réservation #${id} introuvable`);
        }
        
        // Vérifier si la réservation est active et pour aujourd'hui
        if (
          reservation.table_id &&
          (reservation.status === 'confirmed' || reservation.status === 'pending') &&
          this._isToday(reservation.date)
        ) {
          // Libérer la table si elle était réservée pour cette réservation
          await this._updateTableStatus(reservation.table_id, 'available');
        }
        
        // Supprimer la réservation
        await this.db.delete(this.storeName, id);
      } catch (error) {
        console.error(`Erreur lors de la suppression de la réservation #${id}`, error);
        throw error;
      }
    }
  
    /**
     * Recherche les tables disponibles pour une réservation
     * @param {Date|string} date - Date de la réservation
     * @param {string} time - Heure de la réservation (format HH:MM)
     * @param {number} covers - Nombre de couverts
     * @returns {Promise<Array>} - Liste des tables disponibles
     */
    async findAvailableTables(date, time, covers) {
      try {
        // Convertir la date si nécessaire
        const resDate = new Date(date);
        
        // Récupérer toutes les tables
        const tables = await this.db.getAll('tables');
        
        // Filtrer les tables ayant une capacité suffisante
        const suitableTables = tables.filter(table => table.capacity >= covers);
        
        // Pour chaque table, vérifier sa disponibilité à la date et heure spécifiées
        const availableTables = [];
        for (const table of suitableTables) {
          const isAvailable = await this._checkTableAvailability(table.id, resDate, time);
          if (isAvailable) {
            availableTables.push(table);
          }
        }
        
        // Trier les tables par capacité (de la plus proche à la plus grande)
        return availableTables.sort((a, b) => a.capacity - b.capacity);
      } catch (error) {
        console.error(`Erreur lors de la recherche de tables disponibles`, error);
        throw error;
      }
    }
  
    /**
     * Vérifie si une table est disponible à une date et heure spécifiques
     * @param {number} tableId - ID de la table
     * @param {Date|string} date - Date de la réservation
     * @param {string} time - Heure de la réservation (format HH:MM)
     * @param {number|null} excludeReservationId - ID de réservation à exclure (pour mises à jour)
     * @returns {Promise<boolean>} - True si la table est disponible
     * @private
     */
    async _checkTableAvailability(tableId, date, time, excludeReservationId = null) {
      // Convertir la date si nécessaire
      const resDate = new Date(date);
      const dateString = resDate.toISOString().split('T')[0];
      
      // Valider le format de l'heure
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
        throw new Error(`Format d'heure invalide: ${time}. Utilisez le format HH:MM.`);
      }
      
      // Récupérer la table pour vérifier son existence
      const table = await this.db.get('tables', tableId);
      if (!table) {
        throw new Error(`Table #${tableId} introuvable`);
      }
      
      // Si la table est en maintenance, elle n'est pas disponible
      if (table.status === 'maintenance') {
        return false;
      }
      
      // Récupérer toutes les réservations pour cette table et cette date
      const reservations = await this.getByTable(tableId, resDate);
      
      // Exclure la réservation spécifiée (pour les mises à jour)
      const relevantReservations = reservations.filter(res => 
        res.id !== excludeReservationId &&
        (res.status === 'confirmed' || res.status === 'pending' || res.status === 'seated')
      );
      
      if (relevantReservations.length === 0) {
        return true; // Aucune réservation, la table est disponible
      }
      
      // Convertir l'heure demandée en minutes depuis minuit
      const [hours, minutes] = time.split(':').map(Number);
      const requestedTimeInMinutes = hours * 60 + minutes;
      
      // Durée moyenne d'un service (2 heures = 120 minutes)
      const serviceDuration = 120;
      
      // Vérifier chaque réservation existante
      for (const res of relevantReservations) {
        // Convertir l'heure de la réservation existante en minutes
        const [resHours, resMinutes] = res.time.split(':').map(Number);
        const resTimeInMinutes = resHours * 60 + resMinutes;
        
        // Calculer la fin du service pour cette réservation
        const resEndTimeInMinutes = resTimeInMinutes + serviceDuration;
        
        // Calculer la fin du service pour la nouvelle réservation
        const requestedEndTimeInMinutes = requestedTimeInMinutes + serviceDuration;
        
        // Vérifier si les périodes se chevauchent
        if (
          (requestedTimeInMinutes >= resTimeInMinutes && requestedTimeInMinutes < resEndTimeInMinutes) ||
          (resTimeInMinutes >= requestedTimeInMinutes && resTimeInMinutes < requestedEndTimeInMinutes)
        ) {
          return false; // Chevauchement détecté, la table n'est pas disponible
        }
      }
      
      return true; // Aucun chevauchement, la table est disponible
    }
  
    /**
     * Met à jour le statut d'une table si nécessaire en fonction de la réservation
     * @param {Object} reservation - Données de la réservation
     * @returns {Promise<void>}
     * @private
     */
    async _updateTableStatusIfNeeded(reservation) {
      // Ne mettre à jour que si la réservation est pour aujourd'hui et confirmée
      if (
        reservation.table_id &&
        (reservation.status === 'confirmed' || reservation.status === 'pending') &&
        this._isToday(reservation.date)
      ) {
        // Vérifier si l'heure de la réservation est proche (dans les 2 heures à venir)
        if (this._isTimeNearby(reservation.time, 120)) {
          await this._updateTableStatus(reservation.table_id, 'reserved');
        }
      }
    }
  
    /**
     * Met à jour le statut d'une table
     * @param {number} tableId - ID de la table
     * @param {string} status - Nouveau statut
     * @returns {Promise<void>}
     * @private
     */
    async _updateTableStatus(tableId, status) {
      try {
        // Récupérer la table
        const table = await this.db.get('tables', tableId);
        if (!table) {
          console.warn(`Table #${tableId} introuvable`);
          return;
        }
        
        // Mettre à jour le statut
        table.status = status;
        await this.db.update('tables', table);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la table #${tableId}`, error);
        // Ne pas propager l'erreur pour éviter de bloquer les opérations principales
      }
    }
  
    /**
     * Vérifie si la date correspond à aujourd'hui
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si la date est aujourd'hui
     * @private
     */
    _isToday(date) {
      const today = new Date();
      const checkDate = new Date(date);
      
      return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
      );
    }
  
    /**
     * Vérifie si une heure est proche de l'heure actuelle
     * @param {string} time - Heure au format HH:MM
     * @param {number} minutesThreshold - Seuil en minutes
     * @returns {boolean} - True si l'heure est proche
     * @private
     */
    _isTimeNearby(time, minutesThreshold) {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      
      // Créer une date avec l'heure spécifiée pour aujourd'hui
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      
      // Calculer la différence en minutes
      const diffMs = timeDate - now;
      const diffMinutes = diffMs / (1000 * 60);
      
      // L'heure est proche si elle est dans l'intervalle spécifié
      return diffMinutes >= -minutesThreshold && diffMinutes <= minutesThreshold;
    }
  
    /**
     * Valide les données d'une réservation
     * @param {Object} reservation - Réservation à valider
     * @private
     * @throws {Error} Si la validation échoue
     */
    _validateReservation(reservation) {
      // Vérification des champs obligatoires
      if (!reservation.date) {
        throw new Error('La date de réservation est obligatoire');
      }
      
      if (!reservation.time) {
        throw new Error('L\'heure de réservation est obligatoire');
      }
      
      if (!reservation.name || reservation.name.trim() === '') {
        throw new Error('Le nom du client est obligatoire');
      }
      
      if (!reservation.covers || reservation.covers <= 0) {
        throw new Error('Le nombre de couverts doit être positif');
      }
      
      if (!reservation.table_id) {
        throw new Error('La table est obligatoire');
      }
      
      // Valider le format de l'heure
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(reservation.time)) {
        throw new Error(`Format d'heure invalide: ${reservation.time}. Utilisez le format HH:MM.`);
      }
      
      // Vérifier que le statut est valide s'il est spécifié
      if (reservation.status) {
        const validStatuses = window.DefaultsConfig.reservationStatus.map(s => s.id);
        if (!validStatuses.includes(reservation.status)) {
          throw new Error(`Statut invalide: ${reservation.status}`);
        }
      }
    }
  }
  
  // Exporter le modèle
  window.models = window.models || {};
  window.models.Reservation = new ReservationModel();