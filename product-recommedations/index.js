(async function () {
  const isLocalhostt = window.location.hostname === 'localhost';
  console.log('isLocalhostt', isLocalhostt);
  // if (localhost) {
  //   let v, r, i;
  // }

  function defineWizedVariables() {
    window.v = Wized.data.v;
    window.r = Wized.data.r;
    window.i = Wized.data.i;
  }
  window.initProductRecomms = async function () {
    if (isLocalhostt) {
      window.v = window.v || {};
      v = window.v;
      v.formInitialized = true;
      v.productRecommConfig = v.productRecommConfig || {
        xmlSample: {
          description: 'Afmetingen:\n A: 30.00 mm\n D: 40.00 mm\n L: 120.00 mm',
          additional_image_links: [
            'https://ab-marineservice.com/wp-content/uploads/2023/08/XL-lube-rubberlager-1.png',
            'https://ab-marineservice.com/wp-content/uploads/2023/08/71220¤0_13704_large.jpg'
          ],
          availability: 'in_stock',
          brand: 'AB Marine Service',
          condition: 'new',
          google_product_category: '3606',
          id: 'woocommerce_gpf_361081',
          image_link: 'https://ab-marineservice.com/wp-content/uploads/2023/08/XL-lube-rubberlager-1.png',
          item_group_id: '0.0',
          price: '89.95 EUR',
          product_type: 'XL Lube rubberlager',
          sale_price: '75.95 EUR',
          link: 'https://ab-marineservice.com/product/xl-lube-rubberlager-30x40x120mm-brons/',
          title: 'XL Lube rubberlager 30x40x120mm brons',
          shipping: {
            country: 'NL',
            price: '6.95 EUR'
          }
        }
      };
    } else {
      defineWizedVariables();
      v = window.v;
      v.productRecomsInitialized = true;
    }
    console.log('v.productRecommConfig', v.productRecommConfig);

    if (isLocalhostt) {
      initProductRecomms();
    }
    // JSON Tree Visualizer
    class JSONTreeVisualizer {
      constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.initIcons();
        this.init();
      }

      init() {
        this.container.innerHTML = '';
        this.renderTree(this.data, this.container);
      }

      initIcons() {
        // Embed SVG icons directly to avoid CORS issues
        this.icons = {
          object:
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-box"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
          array:
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
          string:
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-type"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
          number:
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" font-weight="bold" fill="currentColor" stroke="none">#</text></svg>',
          boolean: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/></svg>',
          null: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
        };
      }

      createSvgIcon(svgString) {
        // Create a temporary container to parse the SVG
        const temp = document.createElement('div');
        temp.innerHTML = svgString;
        const svg = temp.querySelector('svg');

        if (svg) {
          // Set consistent size
          svg.setAttribute('width', '14');
          svg.setAttribute('height', '14');
          svg.setAttribute('viewBox', '0 0 24 24');
          // Remove any classes that might interfere
          svg.removeAttribute('class');
          // Ensure stroke color inherits from parent
          svg.setAttribute('stroke', 'currentColor');
          return svg;
        }
        return null;
      }

      getTypeInfo(value) {
        if (value === null) return { type: 'null', icon: this.icons.null };
        if (value === undefined) return { type: 'null', icon: this.icons.null };
        if (typeof value === 'string') return { type: 'string', icon: this.icons.string };
        if (typeof value === 'number') return { type: 'number', icon: this.icons.number };
        if (typeof value === 'boolean') return { type: 'boolean', icon: this.icons.boolean };
        if (Array.isArray(value)) return { type: 'array', icon: this.icons.array };
        if (typeof value === 'object') return { type: 'object', icon: this.icons.object };
        return { type: 'unknown', icon: this.icons.null };
      }

      createTreeItem(key, value, isArrayIndex = false) {
        const item = document.createElement('div');
        item.className = 'tree-item';

        const itemContent = document.createElement('div');
        itemContent.className = 'tree-item-content';

        const typeInfo = this.getTypeInfo(value);
        const isExpandable = typeInfo.type === 'object' || typeInfo.type === 'array';

        // Add expand/collapse button for objects and arrays
        if (isExpandable) {
          const expandBtn = document.createElement('button');
          expandBtn.className = 'tree-expand-btn expanded';
          expandBtn.textContent = '▼';
          expandBtn.onclick = () => this.toggleExpand(expandBtn, childrenContainer);
          itemContent.appendChild(expandBtn);
        } else {
          const spacer = document.createElement('span');
          spacer.className = 'tree-expand-spacer';
          itemContent.appendChild(spacer);
        }

        // Create label container with icon and key
        const label = document.createElement('div');
        label.className = 'tree-label';

        // Add icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tree-type-icon';
        if (typeInfo.icon) {
          const svgElement = this.createSvgIcon(typeInfo.icon);
          if (svgElement) {
            iconSpan.appendChild(svgElement);
          }
        }
        label.appendChild(iconSpan);

        // Add key inside label
        const keySpan = document.createElement('span');
        keySpan.className = isArrayIndex ? 'tree-key array-index' : 'tree-key';
        keySpan.textContent = key;
        label.appendChild(keySpan);

        itemContent.appendChild(label);

        // Add value wrapper
        const valueWrapper = document.createElement('div');
        valueWrapper.className = 'tree-value-wrapper';

        // Add value or summary for expandable items
        if (!isExpandable) {
          const valueSpan = document.createElement('span');
          valueSpan.className = `tree-value ${typeInfo.type}`;
          if (typeInfo.type === 'string') {
            valueSpan.textContent = value;
          } else if (typeInfo.type === 'null' || value === undefined) {
            valueSpan.textContent = 'null';
          } else {
            valueSpan.textContent = String(value);
          }
          valueWrapper.appendChild(valueSpan);
        } else {
          // Add summary for objects/arrays
          const count = Array.isArray(value) ? value.length : Object.keys(value).length;
          const summarySpan = document.createElement('span');
          summarySpan.className = 'tree-summary';
          if (typeInfo.type === 'array') {
            summarySpan.textContent = `[${count}]`;
          } else {
            summarySpan.textContent = `{${count}}`;
          }
          valueWrapper.appendChild(summarySpan);
        }

        itemContent.appendChild(valueWrapper);
        item.appendChild(itemContent);

        // Create children container for expandable items
        let childrenContainer = null;
        if (isExpandable) {
          childrenContainer = document.createElement('div');
          childrenContainer.className = 'tree-children expanded';

          if (Array.isArray(value)) {
            value.forEach((val, index) => {
              childrenContainer.appendChild(this.createTreeItem(index, val, true));
            });
          } else {
            Object.keys(value).forEach(k => {
              childrenContainer.appendChild(this.createTreeItem(k, value[k], false));
            });
          }

          item.appendChild(childrenContainer);
        }

        return item;
      }

      toggleExpand(button, container) {
        if (container.classList.contains('expanded')) {
          container.classList.remove('expanded');
          button.classList.remove('expanded');
          button.classList.add('collapsed');
          button.textContent = '▼';
        } else {
          container.classList.add('expanded');
          button.classList.remove('collapsed');
          button.classList.add('expanded');
          button.textContent = '▼';
        }
      }

      renderTree(data, container) {
        // For the root level, render all top-level properties
        Object.keys(data).forEach(key => {
          container.appendChild(this.createTreeItem(key, data[key]));
        });
      }
    }

    new JSONTreeVisualizer('jsonTree', v.productRecommConfig);
  };
})();
