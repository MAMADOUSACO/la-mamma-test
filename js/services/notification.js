/**
 * Service de notifications pour l'application LA MAMMA
 */

const NotificationService = {
    /**
     * Types de notification
     */
    types: {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error'
    },
    
    /**
     * Conteneur des notifications
     */
    container: null,
    
    /**
     * Compteur pour les IDs de notification
     */
    counter: 0,
    
    /**
     * File d'attente des notifications
     */
    queue: [],
    
    /**
     * Flag indiquant si une notification est en cours d'affichage
     */
    isDisplaying: false,
    
    /**
     * Initialise le service de notifications
     */
    init: function() {
      // Créer le conteneur de notifications s'il n'existe pas
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
        
        // Ajouter le style CSS
        this._addStyles();
      }
    },
    
    /**
     * Affiche une notification informative
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {string} - ID de la notification
     */
    info: function(message, options = {}) {
      return this.notify(message, { ...options, type: this.types.INFO });
    },
    
    /**
     * Affiche une notification de succès
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {string} - ID de la notification
     */
    success: function(message, options = {}) {
      return this.notify(message, { ...options, type: this.types.SUCCESS });
    },
    
    /**
     * Affiche une notification d'avertissement
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {string} - ID de la notification
     */
    warning: function(message, options = {}) {
      return this.notify(message, { ...options, type: this.types.WARNING });
    },
    
    /**
     * Affiche une notification d'erreur
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {string} - ID de la notification
     */
    error: function(message, options = {}) {
      return this.notify(message, { ...options, type: this.types.ERROR });
    },
    
    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {string} - ID de la notification
     */
    notify: function(message, options = {}) {
      // Initialiser le service si nécessaire
      if (!this.container) {
        this.init();
      }
      
      // Options par défaut
      const defaultOptions = {
        type: this.types.INFO,
        duration: 3000,
        closable: true,
        position: 'bottom-right',
        icon: true
      };
      
      // Fusionner avec les options utilisateur
      const settings = { ...defaultOptions, ...options };
      
      // Générer un ID unique
      const id = 'notification-' + (++this.counter);
      
      // Créer la notification
      const notification = {
        id,
        message,
        settings
      };
      
      // Ajouter à la file d'attente
      this.queue.push(notification);
      
      // Traiter la file d'attente
      this._processQueue();
      
      return id;
    },
    
    /**
     * Affiche une notification de confirmation
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de la notification
     * @returns {Promise<boolean>} - Résultat de la confirmation
     */
    confirm: function(message, options = {}) {
      return new Promise((resolve) => {
        // Options par défaut
        const defaultOptions = {
          title: 'Confirmation',
          confirmText: 'Oui',
          cancelText: 'Non',
          type: this.types.WARNING
        };
        
        // Fusionner avec les options utilisateur
        const settings = { ...defaultOptions, ...options };
        
        // Créer la boîte de dialogue
        const dialog = document.createElement('div');
        dialog.className = 'notification-dialog';
        
        // Ajouter le contenu
        dialog.innerHTML = `
          <div class="notification-dialog-content ${settings.type}">
            ${settings.title ? `<div class="notification-dialog-title">${settings.title}</div>` : ''}
            <div class="notification-dialog-message">${message}</div>
            <div class="notification-dialog-buttons">
              <button class="notification-dialog-button cancel">${settings.cancelText}</button>
              <button class="notification-dialog-button confirm">${settings.confirmText}</button>
            </div>
          </div>
        `;
        
        // Ajouter à la page
        document.body.appendChild(dialog);
        
        // Ajouter les écouteurs d'événements
        dialog.querySelector('.confirm').addEventListener('click', () => {
          document.body.removeChild(dialog);
          resolve(true);
        });
        
        dialog.querySelector('.cancel').addEventListener('click', () => {
          document.body.removeChild(dialog);
          resolve(false);
        });
        
        // Ajouter une animation d'entrée
        setTimeout(() => {
          dialog.classList.add('visible');
        }, 10);
      });
    },
    
    /**
     * Supprime une notification
     * @param {string} id - ID de la notification
     */
    dismiss: function(id) {
      const notification = document.getElementById(id);
      
      if (notification) {
        // Ajouter une classe pour l'animation de sortie
        notification.classList.add('notification-exit');
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
          
          // Marquer comme non affiché
          this.isDisplaying = false;
          
          // Traiter la file d'attente
          this._processQueue();
        }, 300);
      }
    },
    
    /**
     * Supprime toutes les notifications
     */
    dismissAll: function() {
      const notifications = document.querySelectorAll('.notification');
      
      notifications.forEach(notification => {
        this.dismiss(notification.id);
      });
      
      // Vider la file d'attente
      this.queue = [];
    },
    
    /**
     * Traite la file d'attente des notifications
     * @private
     */
    _processQueue: function() {
      // Si une notification est déjà en cours d'affichage ou si la file est vide, ne rien faire
      if (this.isDisplaying || this.queue.length === 0) {
        return;
      }
      
      // Récupérer la prochaine notification
      const notification = this.queue.shift();
      
      // Marquer comme en cours d'affichage
      this.isDisplaying = true;
      
      // Afficher la notification
      this._displayNotification(notification);
    },
    
    /**
     * Affiche une notification
     * @param {Object} notification - Notification à afficher
     * @private
     */
    _displayNotification: function(notification) {
      const { id, message, settings } = notification;
      
      // Créer l'élément de notification
      const element = document.createElement('div');
      element.id = id;
      element.className = `notification notification-${settings.type} notification-${settings.position}`;
      
      // Ajouter l'icône si demandée
      let iconHtml = '';
      if (settings.icon) {
        iconHtml = this._getIconHtml(settings.type);
      }
      
      // Ajouter le contenu
      element.innerHTML = `
        <div class="notification-content">
          ${iconHtml}
          <div class="notification-message">${message}</div>
          ${settings.closable ? '<button class="notification-close">×</button>' : ''}
        </div>
        ${settings.duration > 0 ? '<div class="notification-progress"></div>' : ''}
      `;
      
      // Ajouter au conteneur
      this.container.appendChild(element);
      
      // Ajouter une animation d'entrée
      setTimeout(() => {
        element.classList.add('notification-enter');
      }, 10);
      
      // Si la notification est fermable, ajouter l'écouteur d'événement
      if (settings.closable) {
        element.querySelector('.notification-close').addEventListener('click', () => {
          this.dismiss(id);
        });
      }
      
      // Si la notification a une durée, configurer l'auto-fermeture
      if (settings.duration > 0) {
        // Animation de la barre de progression
        const progress = element.querySelector('.notification-progress');
        progress.style.animationDuration = `${settings.duration}ms`;
        
        // Auto-fermeture après la durée spécifiée
        setTimeout(() => {
          this.dismiss(id);
        }, settings.duration);
      }
    },
    
    /**
     * Récupère le HTML de l'icône pour un type de notification
     * @param {string} type - Type de notification
     * @returns {string} - HTML de l'icône
     * @private
     */
    _getIconHtml: function(type) {
      switch (type) {
        case this.types.SUCCESS:
          return '<div class="notification-icon success"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg></div>';
        
        case this.types.WARNING:
          return '<div class="notification-icon warning"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg></div>';
        
        case this.types.ERROR:
          return '<div class="notification-icon error"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg></div>';
        
        case this.types.INFO:
        default:
          return '<div class="notification-icon info"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v8h-2zm0 10h2v2h-2z"></path></svg></div>';
      }
    },
    
    /**
     * Ajoute les styles CSS pour les notifications
     * @private
     */
    _addStyles: function() {
      if (document.getElementById('notification-styles')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification-container {
          position: fixed;
          z-index: 9999;
          width: 320px;
          max-width: 100%;
          box-sizing: border-box;
          padding: 16px;
        }
        
        /* Positions */
        .notification-container {
          bottom: 0;
          right: 0;
        }
        
        .notification {
          margin-bottom: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          background-color: white;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s, transform 0.3s;
        }
        
        .notification-enter {
          opacity: 1;
          transform: translateY(0);
        }
        
        .notification-exit {
          opacity: 0;
          transform: translateY(-20px);
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          padding: 16px;
        }
        
        .notification-icon {
          margin-right: 12px;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
        }
        
        .notification-icon svg {
          width: 100%;
          height: 100%;
        }
        
        .notification-icon.success svg {
          fill: #2ecc71;
        }
        
        .notification-icon.warning svg {
          fill: #f39c12;
        }
        
        .notification-icon.error svg {
          fill: #e74c3c;
        }
        
        .notification-icon.info svg {
          fill: #3498db;
        }
        
        .notification-message {
          flex-grow: 1;
          font-size: 16px;
          color: #333;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: #999;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          margin-left: 8px;
        }
        
        .notification-close:hover {
          color: #333;
        }
        
        .notification-progress {
          height: 4px;
          background-color: rgba(0, 0, 0, 0.1);
          width: 100%;
          position: relative;
        }
        
        .notification-progress::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.1);
          animation: notification-progress-animation linear forwards;
          transform-origin: left;
        }
        
        @keyframes notification-progress-animation {
          0% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(0);
          }
        }
        
        /* Types */
        .notification-info {
          border-left: 4px solid #3498db;
        }
        
        .notification-success {
          border-left: 4px solid #2ecc71;
        }
        
        .notification-warning {
          border-left: 4px solid #f39c12;
        }
        
        .notification-error {
          border-left: 4px solid #e74c3c;
        }
        
        /* Dialog */
        .notification-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .notification-dialog.visible {
          opacity: 1;
        }
        
        .notification-dialog-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }
        
        .notification-dialog-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        
        .notification-dialog-message {
          font-size: 16px;
          margin-bottom: 24px;
        }
        
        .notification-dialog-buttons {
          display: flex;
          justify-content: flex-end;
        }
        
        .notification-dialog-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .notification-dialog-button.cancel {
          background-color: #f1f1f1;
          color: #333;
        }
        
        .notification-dialog-button.confirm {
          background-color: #e74c3c;
          color: white;
        }
        
        /* Types for dialogs */
        .notification-dialog-content.info .notification-dialog-button.confirm {
          background-color: #3498db;
        }
        
        .notification-dialog-content.success .notification-dialog-button.confirm {
          background-color: #2ecc71;
        }
        
        .notification-dialog-content.warning .notification-dialog-button.confirm {
          background-color: #f39c12;
        }
        
        .notification-dialog-content.error .notification-dialog-button.confirm {
          background-color: #e74c3c;
        }
      `;
      
      document.head.appendChild(style);
    }
  };
  
  // Exporter le service
  window.services = window.services || {};
  window.services.notification = NotificationService;
  
  // Initialiser le service lorsque le DOM est chargé
  document.addEventListener('DOMContentLoaded', () => {
    NotificationService.init();
  });