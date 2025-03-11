/**
 * Utilitaires d'exportation pour l'application LA MAMMA
 */

const ExportUtils = {
    /**
     * Exporte des données au format CSV
     * @param {Array} data - Tableau d'objets à exporter
     * @param {Array} headers - Entêtes des colonnes [{ key: 'propertyName', label: 'Column Label' }, ...]
     * @param {Object} options - Options d'exportation
     * @returns {string} - Contenu CSV
     */
    toCSV: function(data, headers, options = {}) {
      if (!Array.isArray(data) || !Array.isArray(headers)) {
        throw new Error('Les données et les entêtes doivent être des tableaux');
      }
      
      // Options par défaut
      const defaultOptions = {
        delimiter: ';', // Délimiteur standard en français
        includeHeaders: true,
        quoteStrings: true,
        dateFormat: 'DD/MM/YYYY', // Format de date français
        decimalSeparator: ',', // Séparateur décimal français
        newLine: '\r\n', // Retour à la ligne Windows
        encoding: 'utf-8'
      };
      
      // Fusionner avec les options utilisateur
      const settings = { ...defaultOptions, ...options };
      
      // Fonction pour formatter les valeurs
      const formatValue = (value, key) => {
        if (value === null || value === undefined) return '';
        
        // Formater les dates
        if (value instanceof Date) {
          return this._formatDate(value, settings.dateFormat);
        }
        
        // Formater les nombres
        if (typeof value === 'number') {
          return String(value).replace('.', settings.decimalSeparator);
        }
        
        // Convertir les objets et tableaux en JSON
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Convertir en chaîne et échapper les guillemets
        let stringValue = String(value);
        
        // Traiter les caractères spéciaux et respecter la mise en forme CSV
        if (settings.quoteStrings) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        } else if (stringValue.includes(settings.delimiter) || stringValue.includes('\n')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      };
      
      // Générer la ligne d'entêtes
      let csv = '';
      if (settings.includeHeaders) {
        const headerLine = headers.map(header => formatValue(header.label || header.key, header.key));
        csv += headerLine.join(settings.delimiter) + settings.newLine;
      }
      
      // Générer les lignes de données
      for (const row of data) {
        const rowValues = headers.map(header => formatValue(row[header.key], header.key));
        csv += rowValues.join(settings.delimiter) + settings.newLine;
      }
      
      return csv;
    },
    
    /**
     * Exporte des données au format JSON
     * @param {*} data - Données à exporter
     * @param {boolean} pretty - Formatter le JSON pour la lisibilité
     * @returns {string} - Contenu JSON
     */
    toJSON: function(data, pretty = true) {
      try {
        return pretty 
          ? JSON.stringify(data, null, 2) 
          : JSON.stringify(data);
      } catch (error) {
        console.error('Erreur lors de l\'exportation en JSON', error);
        throw error;
      }
    },
    
    /**
     * Télécharge un fichier
     * @param {string} content - Contenu du fichier
     * @param {string} fileName - Nom du fichier
     * @param {string} mimeType - Type MIME du fichier
     */
    downloadFile: function(content, fileName, mimeType) {
      try {
        // Créer un blob avec le contenu
        const blob = new Blob([content], { type: mimeType });
        
        // Créer une URL pour le blob
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Ajouter le lien au document
        document.body.appendChild(link);
        
        // Cliquer sur le lien pour déclencher le téléchargement
        link.click();
        
        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        console.error('Erreur lors du téléchargement du fichier', error);
        throw error;
      }
    },
    
    /**
     * Exporte et télécharge des données au format CSV
     * @param {Array} data - Tableau d'objets à exporter
     * @param {Array} headers - Entêtes des colonnes
     * @param {string} fileName - Nom du fichier
     * @param {Object} options - Options d'exportation
     */
    exportAsCSV: function(data, headers, fileName = 'export.csv', options = {}) {
      try {
        const csvContent = this.toCSV(data, headers, options);
        this.downloadFile(csvContent, fileName, 'text/csv;charset=utf-8');
      } catch (error) {
        console.error('Erreur lors de l\'exportation en CSV', error);
        throw error;
      }
    },
    
    /**
     * Exporte et télécharge des données au format JSON
     * @param {*} data - Données à exporter
     * @param {string} fileName - Nom du fichier
     * @param {boolean} pretty - Formatter le JSON pour la lisibilité
     */
    exportAsJSON: function(data, fileName = 'export.json', pretty = true) {
      try {
        const jsonContent = this.toJSON(data, pretty);
        this.downloadFile(jsonContent, fileName, 'application/json;charset=utf-8');
      } catch (error) {
        console.error('Erreur lors de l\'exportation en JSON', error);
        throw error;
      }
    },
    
    /**
     * Exporte la base de données entière ou des tables spécifiques
     * @param {Array} tables - Noms des tables à exporter (toutes si non spécifié)
     * @returns {Promise<Object>} - Données exportées
     */
    exportDatabase: async function(tables = null) {
      try {
        const db = window.db;
        const dbConfig = window.DBConfig;
        
        // Déterminer les tables à exporter
        const storesToExport = tables || Object.keys(dbConfig.stores);
        
        // Exporter les données de chaque table
        const exportData = {
          version: dbConfig.version,
          date: new Date().toISOString(),
          tables: {}
        };
        
        for (const storeName of storesToExport) {
          // Vérifier que la table existe
          if (!dbConfig.stores[storeName]) {
            console.warn(`Table ${storeName} non définie dans la configuration, ignorée.`);
            continue;
          }
          
          // Récupérer toutes les données de la table
          const tableData = await db.getAll(storeName);
          
          // Ajouter les données au résultat
          exportData.tables[storeName] = tableData;
        }
        
        return exportData;
      } catch (error) {
        console.error('Erreur lors de l\'exportation de la base de données', error);
        throw error;
      }
    },
    
    /**
     * Exporte et télécharge la base de données au format JSON
     * @param {Array} tables - Noms des tables à exporter (toutes si non spécifié)
     * @param {string} fileName - Nom du fichier
     */
    exportDatabaseAsJSON: async function(tables = null, fileName = 'lamamma_backup.json') {
      try {
        const exportData = await this.exportDatabase(tables);
        this.exportAsJSON(exportData, fileName);
      } catch (error) {
        console.error('Erreur lors de l\'exportation de la base de données en JSON', error);
        throw error;
      }
    },
    
    /**
     * Exporte une table spécifique au format CSV
     * @param {string} tableName - Nom de la table
     * @param {Array} headers - Entêtes des colonnes (optionnel, autodétecté si non fourni)
     * @param {string} fileName - Nom du fichier
     * @param {Object} options - Options d'exportation
     */
    exportTableAsCSV: async function(tableName, headers = null, fileName = null, options = {}) {
      try {
        const db = window.db;
        
        // Récupérer les données de la table
        const tableData = await db.getAll(tableName);
        
        if (tableData.length === 0) {
          throw new Error(`La table ${tableName} est vide`);
        }
        
        // Autodétecter les entêtes si non fournies
        if (!headers) {
          const sampleRow = tableData[0];
          headers = Object.keys(sampleRow).map(key => ({ key, label: this._formatColumnName(key) }));
        }
        
        // Déterminer le nom de fichier par défaut
        const defaultFileName = `${tableName}_${this._formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        
        // Exporter en CSV
        this.exportAsCSV(
          tableData, 
          headers, 
          fileName || defaultFileName, 
          options
        );
      } catch (error) {
        console.error(`Erreur lors de l\'exportation de la table ${tableName} en CSV`, error);
        throw error;
      }
    },
    
    /**
     * Formate une date selon le format spécifié
     * @param {Date} date - Date à formater
     * @param {string} format - Format ('YYYY-MM-DD', 'DD/MM/YYYY', etc.)
     * @returns {string} - Date formatée
     * @private
     */
    _formatDate: function(date, format = 'DD/MM/YYYY') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Remplacer les tokens dans le format
      let result = format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
      
      // Ajouter l'heure si le format le contient
      if (format.includes('hh') || format.includes('HH')) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        result = result
          .replace('HH', hours)
          .replace('hh', hours)
          .replace('mm', minutes)
          .replace('ss', seconds);
      }
      
      return result;
    },
    
    /**
     * Formate un nom de colonne pour l'affichage
     * @param {string} columnName - Nom de la colonne
     * @returns {string} - Nom formaté
     * @private
     */
    _formatColumnName: function(columnName) {
      // Convertir snake_case en texte lisible
      return columnName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    },
    
    /**
     * Génère un rapport de commandes pour une période donnée
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @param {string} fileName - Nom du fichier
     * @returns {Promise<void>}
     */
    generateOrdersReport: async function(startDate, endDate, fileName = null) {
      try {
        const db = window.db;
        
        // Récupérer toutes les commandes
        const allOrders = await db.getAll('orders');
        
        // Filtrer par période
        const filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        if (filteredOrders.length === 0) {
          throw new Error('Aucune commande trouvée pour cette période');
        }
        
        // Enrichir les commandes avec des informations supplémentaires
        const enrichedOrders = [];
        
        for (const order of filteredOrders) {
          // Récupérer les articles de la commande
          const orderItems = await db.getByIndex('order_items', 'order_id', order.id);
          
          // Calculer le nombre d'articles
          const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
          
          // Déterminer le statut
          const statusInfo = window.DefaultsConfig.orderStatus.find(s => s.id === order.status) || {};
          
          enrichedOrders.push({
            id: order.id,
            date: order.date,
            date_formatted: this._formatDate(new Date(order.date), 'DD/MM/YYYY'),
            heure: this._formatDate(new Date(order.date), 'HH:mm'),
            table: order.table_number,
            total_ht: order.total_ht,
            tva: order.tva_amount,
            total_ttc: order.total_ttc,
            status: statusInfo.name || order.status,
            nombre_articles: itemCount,
            note: order.note || ''
          });
        }
        
        // Définir les entêtes
        const headers = [
          { key: 'id', label: 'N° commande' },
          { key: 'date_formatted', label: 'Date' },
          { key: 'heure', label: 'Heure' },
          { key: 'table', label: 'Table' },
          { key: 'nombre_articles', label: 'Nb articles' },
          { key: 'total_ht', label: 'Total HT' },
          { key: 'tva', label: 'TVA' },
          { key: 'total_ttc', label: 'Total TTC' },
          { key: 'status', label: 'Statut' },
          { key: 'note', label: 'Note' }
        ];
        
        // Déterminer le nom du fichier
        const defaultFileName = `commandes_${this._formatDate(startDate, 'YYYY-MM-DD')}_au_${this._formatDate(endDate, 'YYYY-MM-DD')}.csv`;
        
        // Exporter en CSV
        this.exportAsCSV(
          enrichedOrders,
          headers,
          fileName || defaultFileName,
          { 
            decimalSeparator: ','
          }
        );
      } catch (error) {
        console.error('Erreur lors de la génération du rapport de commandes', error);
        throw error;
      }
    },
    
    /**
     * Génère un rapport d'inventaire
     * @param {string} fileName - Nom du fichier
     * @returns {Promise<void>}
     */
    generateInventoryReport: async function(fileName = null) {
      try {
        const db = window.db;
        
        // Récupérer tous les produits
        const products = await db.getAll('products');
        
        if (products.length === 0) {
          throw new Error('Aucun produit trouvé');
        }
        
        // Enrichir les produits avec des informations supplémentaires
        const enrichedProducts = products.map(product => {
          // Déterminer la catégorie
          const categoryInfo = window.DefaultsConfig.productCategories.find(c => c.id === product.category) || {};
          
          // Déterminer l'unité
          const unitInfo = window.DefaultsConfig.units.find(u => u.id === product.unit) || {};
          
          // Déterminer le statut de stock
          let stockStatus = 'OK';
          if (product.min_stock > 0 && product.quantity <= product.min_stock) {
            stockStatus = product.quantity <= 0 ? 'RUPTURE' : 'ALERTE';
          }
          
          return {
            id: product.id,
            nom: product.name,
            categorie: categoryInfo.name || product.category,
            quantite: product.quantity,
            unite: unitInfo.name || product.unit,
            seuil_alerte: product.min_stock,
            statut_stock: stockStatus,
            prix_achat: product.purchase_price,
            prix_vente: product.selling_price,
            actif: product.is_active ? 'Oui' : 'Non',
            valeur_stock: product.quantity * product.purchase_price
          };
        });
        
        // Trier par catégorie et nom
        enrichedProducts.sort((a, b) => {
          if (a.categorie === b.categorie) {
            return a.nom.localeCompare(b.nom);
          }
          return a.categorie.localeCompare(b.categorie);
        });
        
        // Définir les entêtes
        const headers = [
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Produit' },
          { key: 'categorie', label: 'Catégorie' },
          { key: 'quantite', label: 'Quantité' },
          { key: 'unite', label: 'Unité' },
          { key: 'seuil_alerte', label: 'Seuil alerte' },
          { key: 'statut_stock', label: 'Statut stock' },
          { key: 'prix_achat', label: 'Prix achat' },
          { key: 'prix_vente', label: 'Prix vente' },
          { key: 'valeur_stock', label: 'Valeur stock' },
          { key: 'actif', label: 'Actif' }
        ];
        
        // Déterminer le nom du fichier
        const defaultFileName = `inventaire_${this._formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        
        // Exporter en CSV
        this.exportAsCSV(
          enrichedProducts,
          headers,
          fileName || defaultFileName,
          { 
            decimalSeparator: ',' 
          }
        );
      } catch (error) {
        console.error('Erreur lors de la génération du rapport d\'inventaire', error);
        throw error;
      }
    }
  };
  
  // Exporter l'utilitaire
  window.utils = window.utils || {};
  window.utils.export = ExportUtils;