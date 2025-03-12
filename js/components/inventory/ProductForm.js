/**
 * Composant de formulaire de produit
 * Permet d'ajouter ou modifier un produit
 */
class ProductForm {
    /**
     * @param {Object} options - Options de configuration
     * @param {HTMLElement} options.container - Élément HTML conteneur
     * @param {Function} options.onSubmit - Callback à la soumission
     * @param {Function} options.onCancel - Callback à l'annulation
     * @param {Boolean} options.isEdit - Mode édition ou création
     */
    constructor(options) {
      this.container = options.container;
      this.onSubmit = options.onSubmit || function() {};
      this.onCancel = options.onCancel || function() {};
      this.isEdit = options.isEdit || false;
      
      this.product = null;
      this.categories = [];
      this.errors = {};
      this.formElement = null;
      this.element = null;
      
      // État de chargement
      this.loading = false;
    }
    
    /**
     * Rend le composant dans le conteneur
     * @returns {HTMLElement} Élément racine du composant
     */
    render() {
      this.element = document.createElement('div');
      this.element.className = 'product-form-component';
      
      const header = document.createElement('div');
      header.className = 'form-header';
      header.innerHTML = `<h3>${this.isEdit ? 'Modifier' : 'Ajouter'} un produit</h3>`;
      
      this.formElement = document.createElement('form');
      this.formElement.className = 'product-form';
      this.formElement.innerHTML = this._getFormTemplate();
      
      const footer = document.createElement('div');
      footer.className = 'form-footer';
      
      const cancelButton = document.createElement('button');
      cancelButton.className = 'btn btn-secondary';
      cancelButton.textContent = 'Annuler';
      cancelButton.type = 'button';
      
      const submitButton = document.createElement('button');
      submitButton.className = 'btn btn-primary';
      submitButton.textContent = this.isEdit ? 'Enregistrer' : 'Ajouter';
      submitButton.type = 'submit';
      
      footer.appendChild(cancelButton);
      footer.appendChild(submitButton);
      
      this.element.appendChild(header);
      this.element.appendChild(this.formElement);
      this.element.appendChild(footer);
      
      // Ajout au conteneur
      if (this.container) {
        this.container.appendChild(this.element);
      }
      
      // Événements
      cancelButton.addEventListener('click', () => this.onCancel());
      this.formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) {
          this.onSubmit(this.getProductData());
        }
      });
      
      return this.element;
    }
    
    /**
     * Définit les données du produit à éditer
     * @param {Object} product - Données du produit
     */
    setProduct(product) {
      this.product = product;
      
      if (this.formElement) {
        // Mettre à jour les champs du formulaire
        const fields = ['name', 'category', 'quantity', 'unit', 'min_stock', 
                        'purchase_price', 'selling_price', 'description'];
        
        fields.forEach(field => {
          const input = this.formElement.querySelector(`[name="${field}"]`);
          if (input) {
            input.value = product[field] || '';
          }
        });
        
        // Statut actif/inactif
        const activeInput = this.formElement.querySelector('[name="is_active"]');
        if (activeInput) {
          activeInput.checked = !!product.is_active;
        }
      }
    }
    
    /**
     * Définit les catégories disponibles
     * @param {Array} categories - Liste des catégories
     */
    setCategories(categories) {
      this.categories = categories || [];
      
      // Mettre à jour le select des catégories
      if (this.formElement) {
        const categorySelect = this.formElement.querySelector('[name="category"]');
        if (categorySelect) {
          // Sauvegarder la valeur actuelle
          const currentValue = categorySelect.value;
          
          // Vider les options
          categorySelect.innerHTML = '';
          
          // Option vide
          const emptyOption = document.createElement('option');
          emptyOption.value = '';
          emptyOption.textContent = 'Sélectionner une catégorie';
          categorySelect.appendChild(emptyOption);
          
          // Ajouter les catégories
          this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });
          
          // Restaurer la valeur
          categorySelect.value = currentValue;
        }
      }
    }
    
    /**
     * Valide les données du formulaire
     * @returns {Boolean} Indique si le formulaire est valide
     */
    validate() {
      const formData = new FormData(this.formElement);
      this.errors = {};
      
      // Validation des champs obligatoires
      if (!formData.get('name')) {
        this.errors.name = 'Le nom est obligatoire';
      }
      
      if (!formData.get('category')) {
        this.errors.category = 'La catégorie est obligatoire';
      }
      
      // Validation des nombres
      const numericFields = ['quantity', 'min_stock', 'purchase_price', 'selling_price'];
      numericFields.forEach(field => {
        const value = formData.get(field);
        if (value && !window.utils.validation.isNumber(value)) {
          this.errors[field] = 'Doit être un nombre valide';
        }
      });
      
      // Validation spécifique
      const quantity = parseFloat(formData.get('quantity'));
      const minStock = parseFloat(formData.get('min_stock'));
      
      if (minStock > quantity) {
        this.errors.min_stock = 'Le stock minimum ne peut pas être supérieur au stock actuel';
      }
      
      const purchasePrice = parseFloat(formData.get('purchase_price'));
      const sellingPrice = parseFloat(formData.get('selling_price'));
      
      if (sellingPrice < purchasePrice) {
        this.errors.selling_price = 'Le prix de vente doit être supérieur au prix d\'achat';
      }
      
      // Afficher les erreurs dans le formulaire
      this._showErrors();
      
      return Object.keys(this.errors).length === 0;
    }
    
    /**
     * Récupère les données du produit depuis le formulaire
     * @returns {Object} Données du produit
     */
    getProductData() {
      const formData = new FormData(this.formElement);
      
      const productData = {
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: parseFloat(formData.get('quantity')) || 0,
        unit: formData.get('unit'),
        min_stock: parseFloat(formData.get('min_stock')) || 0,
        purchase_price: parseFloat(formData.get('purchase_price')) || 0,
        selling_price: parseFloat(formData.get('selling_price')) || 0,
        description: formData.get('description') || '',
        is_active: formData.get('is_active') === 'on'
      };
      
      // En mode édition, conserver l'ID
      if (this.isEdit && this.product && this.product.id) {
        productData.id = this.product.id;
      }
      
      return productData;
    }
    
    /**
     * Définit les erreurs à afficher
     * @param {Object} errors - Erreurs par champ
     */
    setErrors(errors) {
      this.errors = errors || {};
      this._showErrors();
    }
    
    /**
     * Affiche ou masque l'état de chargement
     * @param {Boolean} show - Indique si le chargement est actif
     * @param {String} message - Message de chargement optionnel
     */
    showLoading(show, message) {
      this.loading = show;
      
      // Désactiver/activer le formulaire
      const inputs = this.formElement.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => {
        input.disabled = show;
      });
      
      // Afficher/masquer un spinner
      let spinner = this.element.querySelector('.form-spinner');
      
      if (show) {
        if (!spinner) {
          spinner = document.createElement('div');
          spinner.className = 'form-spinner';
          spinner.innerHTML = `
            <div class="spinner"></div>
            <div class="message">${message || 'Chargement...'}</div>
          `;
          this.element.appendChild(spinner);
        } else {
          spinner.querySelector('.message').textContent = message || 'Chargement...';
        }
      } else if (spinner) {
        spinner.parentNode.removeChild(spinner);
      }
    }
    
    /**
     * Nettoie les ressources utilisées par le composant
     */
    destroy() {
      // Supprimer les écouteurs d'événements
      if (this.formElement) {
        this.formElement.removeEventListener('submit', this._onSubmit);
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
     * Génère le template HTML du formulaire
     * @private
     * @returns {String} Template HTML
     */
    _getFormTemplate() {
      return `
        <div class="form-group">
          <label for="name">Nom du produit *</label>
          <input type="text" name="name" id="name" required class="form-control">
          <div class="error-message" data-field="name"></div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">Catégorie *</label>
            <select name="category" id="category" required class="form-control">
              <option value="">Sélectionner une catégorie</option>
            </select>
            <div class="error-message" data-field="category"></div>
          </div>
          
          <div class="form-group">
            <label for="is_active">Statut</label>
            <div class="toggle-switch">
              <input type="checkbox" name="is_active" id="is_active" checked>
              <label for="is_active">Produit actif</label>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="quantity">Quantité</label>
            <input type="number" name="quantity" id="quantity" step="0.01" min="0" class="form-control">
            <div class="error-message" data-field="quantity"></div>
          </div>
          
          <div class="form-group">
            <label for="unit">Unité</label>
            <select name="unit" id="unit" class="form-control">
              <option value="unit">Unité</option>
              <option value="kg">Kilogramme (kg)</option>
              <option value="g">Gramme (g)</option>
              <option value="l">Litre (l)</option>
              <option value="ml">Millilitre (ml)</option>
              <option value="box">Boîte</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="min_stock">Stock minimum</label>
            <input type="number" name="min_stock" id="min_stock" min="0" class="form-control">
            <div class="error-message" data-field="min_stock"></div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="purchase_price">Prix d'achat (€)</label>
            <input type="number" name="purchase_price" id="purchase_price" step="0.01" min="0" class="form-control">
            <div class="error-message" data-field="purchase_price"></div>
          </div>
          
          <div class="form-group">
            <label for="selling_price">Prix de vente (€) *</label>
            <input type="number" name="selling_price" id="selling_price" step="0.01" min="0" required class="form-control">
            <div class="error-message" data-field="selling_price"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea name="description" id="description" rows="3" class="form-control"></textarea>
        </div>
      `;
    }
    
    /**
     * Affiche les erreurs dans le formulaire
     * @private
     */
    _showErrors() {
      // Réinitialiser les messages d'erreur
      const errorElements = this.formElement.querySelectorAll('.error-message');
      errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('active');
      });
      
      // Réinitialiser les classes d'erreur sur les champs
      const inputElements = this.formElement.querySelectorAll('.form-control');
      inputElements.forEach(element => {
        element.classList.remove('error');
      });
      
      // Afficher les nouvelles erreurs
      Object.keys(this.errors).forEach(field => {
        const errorElement = this.formElement.querySelector(`.error-message[data-field="${field}"]`);
        const inputElement = this.formElement.querySelector(`[name="${field}"]`);
        
        if (errorElement) {
          errorElement.textContent = this.errors[field];
          errorElement.classList.add('active');
        }
        
        if (inputElement) {
          inputElement.classList.add('error');
        }
      });
    }
  }
  
  // Exposition du composant
  window.components = window.components || {};
  window.components.inventory = window.components.inventory || {};
  window.components.inventory.ProductForm = ProductForm;