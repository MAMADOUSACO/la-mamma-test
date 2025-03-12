/**
 * Composant d'ajustement de stock
 * Permet d'ajouter ou de retirer des quantités du stock
 */
class StockAdjustment {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     * @param {Function} options.onSubmit - Callback à la soumission
     * @param {Function} options.onCancel - Callback à l'annulation
     */
    constructor(options) {
      this.container = options.container;
      this.onSubmit = options.onSubmit || function() {};
      this.onCancel = options.onCancel || function() {};
      
      this.product = null;
      this.type = 'add'; // 'add' ou 'remove'
      
      // Éléments DOM
      this.formElement = null;
      this.element = null;
    }
    
    /**
     * Rend le composant dans le conteneur
     * @returns {HTMLElement} Élément racine du composant
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'stock-adjustment-component';
      
      const header = document.createElement('div');
      header.className = 'adjustment-header';
      header.innerHTML = '<h3>Ajustement de stock</h3>';
      
      this.formElement = document.createElement('form');
      this.formElement.className = 'adjustment-form';
      
      const productInfo = document.createElement('div');
      productInfo.className = 'product-info';
      productInfo.innerHTML = '<p>Veuillez sélectionner un produit</p>';
      
      const typeSelector = document.createElement('div');
      typeSelector.className = 'type-selector';
      typeSelector.innerHTML = `
        <label>Type d'ajustement:</label>
        <div class="radio-group">
          <div class="radio-option">
            <input type="radio" name="adjustment-type" id="type-add" value="add" checked>
            <label for="type-add">Ajouter au stock</label>
          </div>
          <div class="radio-option">
            <input type="radio" name="adjustment-type" id="type-remove" value="remove">
            <label for="type-remove">Retirer du stock</label>
          </div>
        </div>
      `;
      
      const quantityInput = document.createElement('div');
      quantityInput.className = 'quantity-input';
      quantityInput.innerHTML = `
        <label for="adjustment-quantity">Quantité:</label>
        <input type="number" id="adjustment-quantity" name="quantity" min="0" step="0.01" class="form-control" required>
      `;
      
      const reasonInput = document.createElement('div');
      reasonInput.className = 'reason-input';
      reasonInput.innerHTML = `
        <label for="adjustment-reason">Raison:</label>
        <select id="adjustment-reason" name="reason" class="form-control" required>
          <option value="">Sélectionner une raison</option>
          <option value="purchase">Achat/Approvisionnement</option>
          <option value="sale">Vente</option>
          <option value="loss">Perte/Périmé</option>
          <option value="inventory">Inventaire</option>
          <option value="correction">Correction</option>
          <option value="other">Autre</option>
        </select>
      `;
      
      const noteInput = document.createElement('div');
      noteInput.className = 'note-input';
      noteInput.innerHTML = `
        <label for="adjustment-note">Note (optionnel):</label>
        <textarea id="adjustment-note" name="note" class="form-control" rows="2"></textarea>
      `;
      
      const footer = document.createElement('div');
      footer.className = 'adjustment-footer';
      
      const cancelButton = document.createElement('button');
      cancelButton.className = 'btn btn-secondary';
      cancelButton.textContent = 'Annuler';
      cancelButton.type = 'button';
      
      const submitButton = document.createElement('button');
      submitButton.className = 'btn btn-primary';
      submitButton.textContent = 'Valider';
      submitButton.type = 'submit';
      
      // Construction du formulaire
      this.formElement.appendChild(productInfo);
      this.formElement.appendChild(typeSelector);
      this.formElement.appendChild(quantityInput);
      this.formElement.appendChild(reasonInput);
      this.formElement.appendChild(noteInput);
      
      footer.appendChild(cancelButton);
      footer.appendChild(submitButton);
      
      // Construction du composant
      this.element.appendChild(header);
      this.element.appendChild(this.formElement);
      this.element.appendChild(footer);
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      // Événements
      cancelButton.addEventListener('click', () => this.onCancel());
      
      const typeRadios = this.formElement.querySelectorAll('[name="adjustment-type"]');
      typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.setType(e.target.value);
        });
      });
      
      this.formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) {
          this.onSubmit(this.getAdjustmentData());
        }
      });
      
      return this.element;
    }
    
    /**
     * Définit le produit à ajuster
     * @param {Object} product - Produit à ajuster
     */
    setProduct(product) {
      this.product = product;
      
      if (this.formElement) {
        const productInfo = this.formElement.querySelector('.product-info');
        if (productInfo && product) {
          productInfo.innerHTML = `
            <div class="product-details">
              <h4>${product.name}</h4>
              <div class="stock-info">
                Stock actuel: <strong>${window.utils.formatters.formatQuantity(product.quantity, product.unit)}</strong>
              </div>
            </div>
          `;
        }
      }
    }
    
    /**
     * Définit le type d'ajustement
     * @param {String} type - Type d'ajustement ('add' ou 'remove')
     */
    setType(type) {
      this.type = type === 'remove' ? 'remove' : 'add';
      
      if (this.formElement) {
        const reasonSelect = this.formElement.querySelector('#adjustment-reason');
        if (reasonSelect) {
          // Adapter les options de raison selon le type
          reasonSelect.innerHTML = '';
          
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = 'Sélectionner une raison';
          reasonSelect.appendChild(defaultOption);
          
          let reasons;
          if (this.type === 'add') {
            reasons = [
              { value: 'purchase', label: 'Achat/Approvisionnement' },
              { value: 'return', label: 'Retour client' },
              { value: 'inventory', label: 'Ajustement d\'inventaire' },
              { value: 'correction', label: 'Correction d\'erreur' },
              { value: 'other', label: 'Autre' }
            ];
          } else {
            reasons = [
              { value: 'sale', label: 'Vente' },
              { value: 'loss', label: 'Perte/Périmé' },
              { value: 'damage', label: 'Produit endommagé' },
              { value: 'inventory', label: 'Ajustement d\'inventaire' },
              { value: 'correction', label: 'Correction d\'erreur' },
              { value: 'other', label: 'Autre' }
            ];
          }
          
          reasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason.value;
            option.textContent = reason.label;
            reasonSelect.appendChild(option);
          });
        }
        
        // Mettre à jour le titre du formulaire
        const header = this.element.querySelector('.adjustment-header h3');
        if (header) {
          header.textContent = this.type === 'add' ? 'Ajouter au stock' : 'Retirer du stock';
        }
      }
    }
    
    /**
     * Valide les données du formulaire
     * @returns {Boolean} Indique si le formulaire est valide
     */
    validate() {
      const quantity = parseFloat(this.formElement.querySelector('#adjustment-quantity').value);
      const reason = this.formElement.querySelector('#adjustment-reason').value;
      
      let isValid = true;
      
      // Réinitialiser les erreurs
      this.formElement.querySelectorAll('.error-message').forEach(el => el.remove());
      
      // Valider la quantité
      if (isNaN(quantity) || quantity <= 0) {
        this._showError('#adjustment-quantity', 'Veuillez entrer une quantité valide supérieure à 0.');
        isValid = false;
      }
      
      // En cas de retrait, vérifier si la quantité est disponible
      if (this.type === 'remove' && this.product && quantity > this.product.quantity) {
        this._showError('#adjustment-quantity', 'Quantité insuffisante en stock.');
        isValid = false;
      }
      
      // Valider la raison
      if (!reason) {
        this._showError('#adjustment-reason', 'Veuillez sélectionner une raison.');
        isValid = false;
      }
      
      return isValid;
    }
    
    /**
     * Récupère les données d'ajustement
     * @returns {Object} Données d'ajustement
     */
    getAdjustmentData() {
      if (!this.product) return null;
      
      const quantity = parseFloat(this.formElement.querySelector('#adjustment-quantity').value);
      const reason = this.formElement.querySelector('#adjustment-reason').value;
      const note = this.formElement.querySelector('#adjustment-note').value;
      
      return {
        productId: this.product.id,
        product: this.product,
        quantity: quantity,
        type: this.type,
        reason: reason,
        note: note
      };
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Supprimer les écouteurs d'événements
      if (this.formElement) {
        this.formElement.removeEventListener('submit', this._onSubmit);
        
        const typeRadios = this.formElement.querySelectorAll('[name="adjustment-type"]');
        typeRadios.forEach(radio => {
          radio.removeEventListener('change', this._onTypeChange);
        });
      }
      
      // Supprimer les éléments DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Réinitialiser les références
      this.element = null;
      this.formElement = null;
    }
    
    // Méthodes privées
    
    /**
     * Affiche un message d'erreur à côté d'un champ
     * @private
     * @param {String} selector - Sélecteur du champ
     * @param {String} message - Message d'erreur
     */
    _showError(selector, message) {
      const input = this.formElement.querySelector(selector);
      if (!input) return;
      
      input.classList.add('error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      
      input.parentNode.appendChild(errorDiv);
    }
  }
  
  // Exposition du composant
  window.components = window.components || {};
  window.components.inventory = window.components.inventory || {};
  window.components.inventory.StockAdjustment = StockAdjustment;