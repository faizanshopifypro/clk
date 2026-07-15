class SearchVehicle extends HTMLElement {
    constructor() {
      super();
      this.style.pointerEvents = 'none';
      this.productGrid = null;
      this.facetsMenu = null;
      this.sortingMenu = null;
    }
  
    connectedCallback() {
      this.productGrid = this.querySelector('#js-product-grid');
      this.facetsMenu = this.querySelector('facets-menu');
      this.sortingMenu = this.querySelector('sorting-menu');
      this.mobileFacetsMenu = this.querySelector('#mobile-facets-menu');
      this.mobileDrawer = this.querySelector('#mobile-filters-drawer');
      this.mobileRefineBtn = this.querySelector('.mobile-refine-btn');
  
      this.setupATCResetListeners();
      this.setupMobileDrawer();

      this.render();
      this.style.pointerEvents = 'auto';
  
      this.addEventListener('filters-changed', () => {
        this.render();
        this.closeMobileDrawer();
      });
    }

    renderSkeleton(count = 8) {
        if (!this.productGrid) return;
        const skeletonHTML = Array.from({ length: count }).map(() => `
          <div class="product-grid-item skeleton">
            <div class="product-link">
              <div class="skeleton-image"></div>
            </div>
            <div class="product-info">
              <div class="skeleton-text skeleton-price"></div>
              <div class="skeleton-text skeleton-title"></div>
              <div class="skeleton-text skeleton-vendor"></div>
              <div class="skeleton-text skeleton-input"></div>
              <div class="skeleton-text skeleton-button"></div>
            </div>
          </div>
        `).join('');
        this.productGrid.innerHTML = skeletonHTML;
    }
  
    render() {
      let query = window.location.search;
  
      if (!query) {
        this.classList.add('empty');
        this.innerHTML = '<p>No search query provided.</p>';
        return;
      }

      this.renderSkeleton(8);
  
      this.getProducts(query).then(products => {
        const results = products.results || [];
        const facets = products.facets || [];
        const sorting = products.sorting || {};
  
        if (facets.length > 0) {
          if (this.facetsMenu) {
            this.facetsMenu.setFacets(facets);
          }
          if (this.mobileFacetsMenu) {
            this.mobileFacetsMenu.setFacets(facets);
          }
        }
  
        if (this.sortingMenu) {
          const productCount = products.total || results.length;
          this.sortingMenu.setSorting(sorting, productCount);
        }
  
        if (results.length === 0) {
          this.classList.add('empty');
          this.innerHTML = '<p>No products found.</p>';
          return;
        }

        this.productGrid.innerHTML = results.map(product => `
          <div class="product-grid-item ${product.variant.availableForSale === false ? 'sold-out' : ''}"
            data-id="${product.variant.id}"
            data-available="${product.variant.availableForSale}"
            data-quantity="${product.variant.inventoryQuantity}"
            data-five-qty="${product.fiveQty}"
            data-ten-qty="${product.tenQty}"
          >
            <a href="${product.url}" class="product-link">
              <img src="${product.featuredMedia != null ? product.featuredMedia : 'https://placehold.co/250x250'}" alt="${product.title}" class="product-image" />
              <span class="sold-out-badge">Sold out</span>
            </a>
            <div class="product-info">
              <div class="product-price-wrapper">
                <span class="product-price">$${Number(product.variant.price).toFixed(2)}</span>
              </div>
              <h4 class="product-title">${product.title}</h4>
              <div class="product-vendor-wrapper">
                <span class="product-vendor">${product.vendor}</span>
              </div>
              <div class="input-wrapper">
                ${(() => {
                  const inventory = product.variant.inventoryQuantity;
                  const isAvailable = product.variant.availableForSale;

                  // Case 1 — Out of stock
                  if (!isAvailable || inventory <= 0) {
                    return `
                      <input type="number"
                        class="quantity-input"
                        value="0"
                        disabled
                      />
                    `;
                  }

                  // Case 2 — tenQty tag
                  if (product.tenQty) {
                    const disabled = inventory < 10;
                    return `
                      <input type="number"
                        class="quantity-input"
                        value="10"
                        min="10"
                        step="10"
                        max="${inventory}"
                        ${disabled ? 'disabled' : ''}
                      />
                    `;
                  }

                  // Case 3 — fiveQty tag
                  if (product.fiveQty) {
                    const disabled = inventory < 5;
                    return `
                      <input type="number"
                        class="quantity-input"
                        value="5"
                        min="5"
                        step="5"
                        max="${inventory}"
                        ${disabled ? 'disabled' : ''}
                      />
                    `;
                  }

                  // Case 4 — Normal product
                  return `
                    <input type="number"
                      class="quantity-input"
                      min="1"
                      max="${inventory}"
                      value="1"
                    />
                  `;
                })()}
              </div>
              <div class="button-wrapper">
                <span id="js-error" class="msg-error"></span>
                <button type="button" class="js-atc button-primary" ${product.variant.availableForSale === false ? 'disabled' : ''}>
                  ${product.variant.availableForSale === false ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        `).join('');
  
        this.attachATCListeners();
      }).catch(error => {
        this.classList.add('empty');
        this.innerHTML = `<p>Error loading products: ${error.message}</p>`;
      });
  
    }

    setupATCResetListeners() {
        document.addEventListener('addToCartFlyout:complete', () => {
          this.resetATCButtons();
        });
      
        document.addEventListener('addToCartFlyout:error', () => {
          this.resetATCButtons();
        });
    }

    setupMobileDrawer() {
      if (!this.mobileRefineBtn || !this.mobileDrawer) return;

      this.mobileRefineBtn.addEventListener('click', () => {
        this.openMobileDrawer();
      });

      const closeBtn = this.mobileDrawer.querySelector('.drawer-close-btn');
      const overlay = this.mobileDrawer.querySelector('.drawer-overlay');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeMobileDrawer();
        });
      }

      if (overlay) {
        overlay.addEventListener('click', () => {
          this.closeMobileDrawer();
        });
      }

      this.mobileDrawer.addEventListener('transitionend', (e) => {
        if (e.target === this.mobileDrawer) {
          if (!this.mobileDrawer.classList.contains('active')) {
            document.body.style.overflow = '';
          }
        }
      });
    }

    openMobileDrawer() {
      if (this.mobileDrawer) {
        document.body.style.overflow = 'hidden';
        this.mobileDrawer.offsetHeight;
        this.mobileDrawer.classList.add('active');
      }
    }

    closeMobileDrawer() {
      if (this.mobileDrawer) {
        this.mobileDrawer.classList.remove('active');
        setTimeout(() => {
          if (!this.mobileDrawer.classList.contains('active')) {
            document.body.style.overflow = '';
          }
        }, 300);
      }
    }
      
    resetATCButtons() {
        const loadingBtns = this.querySelectorAll('.js-atc.loading');
      
        loadingBtns.forEach(btn => {
          btn.classList.remove('loading');
          btn.disabled = false;
          btn.innerHTML = 'Add to Cart';
        });
    }
  
    attachATCListeners() {
      const atcButtons = this.productGrid.querySelectorAll('.js-atc');
  
      atcButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const productItem = btn.closest('.product-grid-item');
          const variantId = parseInt(productItem.dataset.id, 10);
          const quantityInput = productItem.querySelector('.quantity-input');
          const quantity = parseInt(quantityInput.value, 10);
          const errorMsg = productItem.querySelector('#js-error');
  
          if (errorMsg) errorMsg.textContent = '';
  
          if (quantity === 0) {
            errorMsg.textContent = 'Quantity must be greater than 0';
            return;
          }

          // ✅ Read from dataset
          const isTenQty = productItem.dataset.tenQty === 'true';
          const isFiveQty = productItem.dataset.fiveQty === 'true';

          if (isTenQty && quantity % 10 !== 0) {
            errorMsg.textContent = 'Quantity must be in multiples of 10';
            return;
          }

          if (isFiveQty && quantity % 5 !== 0) {
            errorMsg.textContent = 'Quantity must be in multiples of 5';
            return;
          }
  
  
          btn.disabled = true;
          btn.classList.add('loading');
          btn.innerHTML = `<span class="loader"></span>`;

          const formData = [
            { name: 'id', value: variantId },
            { name: 'quantity', value: quantity }
          ];

          const options = {
            atcButton: btn,
            settings: {
              moneyFormat: window.Shopify.money_format
            }
          }

          new AddToCartFlyout(formData, options);  
        });
      });
    }
  
    async getProducts(query) {
      query = query.startsWith('?') ? query.substring(1) : query;
      const response = await fetch(`https://srv1076007.hstgr.cloud/api/search?${query}`);
      // const response = await fetch(`http://localhost:8000/api/search?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
  
      return await response.json();
    }
  }
  
  customElements.define('search-vehicle', SearchVehicle);
  
  class FacetsMenu extends HTMLElement {
    constructor() {
      super();
      this.facets = [];
      this.activeFilters = this.getActiveFilters();
  
      this.crossIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>`;
    }
  
    connectedCallback() {
      this.render();
      this.attachEventListeners();
    }
  
    getActiveFilters() {
      const params = new URLSearchParams(window.location.search);
      const filters = {};
  
      for (const [key, value] of params.entries()) {
        if (key !== 'q' && key !== 'sort') {
          if (!filters[key]) filters[key] = [];
          filters[key].push(value);
        }
      }
  
      return filters;
    }
  
    setFacets(facets) {
      this.facets = facets;
      this.activeFilters = this.getActiveFilters();
      this.render();
      this.attachEventListeners();
    }
  
    render() {
      this.activeFilters = this.getActiveFilters();
      const filterKeys = Object.keys(this.activeFilters);
  
      this.innerHTML = `
        <div class="facets-menu">
  
          ${filterKeys.length > 0 ? `
            <div class="breadcrumbs">
              <div class="breadcrumbs-header">
                <span class="breadcrumbs-title">REFINE BY</span>
                <button class="clear-all-btn">Clear All</button>
              </div>
              ${filterKeys.map(key =>
                this.activeFilters[key].map(value => `
                  <span class="breadcrumb-chip" data-field="${key}" data-value="${value}">
                    <span class="breadcrumb-label">
                      <span class="key">${key}</span>: <span class="value">${value}</span>
                    </span>
                    <button class="remove-btn">
                      ${this.crossIcon}
                    </button>
                  </span>
                `).join('')
              ).join('')}
            </div>
          ` : ''}
  
          <div class="facets-list">
            ${this.facets.map((facet, index) => this.renderFacet(facet, index)).join('')}
          </div>
        </div>
      `;
  
      this.attachEventListeners();
    }
  
    renderFacet(facet, index) {
      const isOpen = true;
      const activeValues = this.activeFilters[facet.field] || [];
  
      return `
        <div class="facet-accordion ${isOpen ? 'active' : ''}">
          <button class="facet-header" data-facet="${facet.field}">
            <svg class="facet-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>${facet.label}</span>
          </button>
          <div class="facet-content" style="${isOpen ? '' : 'display: none;'}">
            ${facet.values.map(value => `
              <label class="facet-option">
                <input
                  type="checkbox"
                  name="${facet.field}"
                  value="${value}"
                  ${activeValues.includes(value) ? 'checked' : ''}
                />
                <span class="facet-label">${value}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }
  
   attachEventListeners() {
    this.querySelectorAll('.facet-header').forEach(header => {
      header.replaceWith(header.cloneNode(true));
    });
  
    this.querySelectorAll('.facet-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const accordion = e.currentTarget.closest('.facet-accordion');
        const content = accordion.querySelector('.facet-content');
        const isActive = accordion.classList.contains('active');
  
        if (isActive) {
          accordion.classList.remove('active');
          content.style.display = 'none';
        } else {
          accordion.classList.add('active');
          content.style.display = 'block';
        }
      });
    });
  
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.replaceWith(checkbox.cloneNode(true));
    });
  
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleFilterChange(e.target.name, e.target.value, e.target.checked);
      });
    });
  
    this.querySelectorAll('.remove-btn').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
  
    this.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chip = e.currentTarget.closest('.breadcrumb-chip');
        const field = chip.dataset.field;
        const value = chip.dataset.value;
        this.handleFilterChange(field, value, false);
      });
    });
  
    const clearAllBtn = this.querySelector('.clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.replaceWith(clearAllBtn.cloneNode(true));
      const newBtn = this.querySelector('.clear-all-btn');
      newBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }
  
  
    handleFilterChange(field, value, isChecked) {
      const params = new URLSearchParams(window.location.search);
  
      if (isChecked) {
        params.append(field, value);
      } else {
        const values = params.getAll(field);
        params.delete(field);
        values.filter(v => v !== value).forEach(v => params.append(field, v));
      }
  
      this.updateURL(params);
    }
  
    clearAllFilters() {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q');
      const newParams = new URLSearchParams();
      if (query) newParams.set('q', query);
      this.updateURL(newParams);
    }
  
    updateURL(params) {
      const newURL = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newURL);
  
      this.dispatchEvent(new CustomEvent('filters-changed', {
        bubbles: true,
        detail: { params: params.toString() }
      }));
  
      this.render();
    }
}
  
customElements.define('facets-menu', FacetsMenu);
  
class SortingMenu extends HTMLElement {
    constructor() {
      super();
      this.sorting = null;
    }
  
    connectedCallback() {
      this.render();
    }
  
    setSorting(sorting, productCount = 0) {
      this.sorting = sorting;
      this.count = productCount;
      this.render();
    }
  
    render() {
      if (!this.sorting || !this.sorting.options || this.sorting.options.length === 0) {
        this.innerHTML = '';
        return;
      }
  
      const params = new URLSearchParams(window.location.search);
      const selected = params.get('sort') || this.sorting.selected || '';
  
      this.innerHTML = `
        <div class="sorting-wrapper">
          <label for="sortSelect">Sort By:</label>
          <select id="sortSelect">
            <option value="">Default</option>
            ${this.sorting.options.map(opt => `
              <option value="${opt.value}" ${opt.value === selected ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
        <span class="products-count">
          ${this.count.toLocaleString()} Product${this.count !== 1 ? 's' : ''}
        </span>
      `;
  
      this.querySelector('#sortSelect').addEventListener('change', (e) => {
        this.handleSortChange(e.target.value);
      });
    }
  
    handleSortChange(value) {
      const params = new URLSearchParams(window.location.search);
  
      if (value) {
        params.set('sort', value);
      } else {
        params.delete('sort');
      }
  
      const newURL = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newURL);
  
      this.dispatchEvent(new CustomEvent('filters-changed', {
        bubbles: true,
        detail: { params: params.toString() }
      }));
    }
}
  
customElements.define('sorting-menu', SortingMenu);
  