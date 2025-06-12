(async function () {
  const isLocalhostt = window.location.hostname === 'localhost';
  let productRecommsInitialized = false;

  function defineWizedVariables() {
    window.v = Wized.data.v;
    window.r = Wized.data.r;
    window.i = Wized.data.i;
  }
  window.initProductRecomms = async function (containerId) {
    if (isLocalhostt) {
      window.v = window.v || {};
      v = window.v;
      v.formInitialized = true;
      v.productRecommConfig = v.productRecommConfig || {
        product_recommendations_mapping: {
          page_url: '',
          product_name: '',
          description: '',
          regular_price: '',
          image_url: ''
        },
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
      if (!productRecommsInitialized) {
        defineWizedVariables();
        v = window.v;
        v.productRecomsInitialized = true;
        productRecommsInitialized = true;
      }
    }

    console.log('v.productRecommConfig', v.productRecommConfig);

    // Ensure all mapping values exist (but don't reset existing values)
    const resetMappingValues = () => {
      if (!v.productRecommConfig) {
        v.productRecommConfig = {
          product_recommendations_mapping: {}
        };
      }

      if (!v.productRecommConfig.product_recommendations_mapping) {
        v.productRecommConfig.product_recommendations_mapping = {};
      }

      // Ensure all fields exist but don't overwrite existing values
      const fields = ['page_url', 'product_name', 'description', 'regular_price', 'image_url'];
      fields.forEach(field => {
        // Only set to empty string if the field doesn't exist
        if (v.productRecommConfig.product_recommendations_mapping[field] === undefined) {
          v.productRecommConfig.product_recommendations_mapping[field] = '';
        }
      });

      console.log('Mapping values:', v.productRecommConfig.product_recommendations_mapping);
    };

    // Call reset function
    resetMappingValues();

    // Create and add the mapping UI to the specified container
    createMappingUI(containerId);

    // JSON Tree Visualizer - commented out
    /* 
    class JSONTreeVisualizer {
      // All JSONTreeVisualizer code has been commented out
    }
    */

    function createMappingUI(containerId) {
      // Get the container by ID
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
      }

      // Clear any existing content in the container
      container.innerHTML = '';

      // Create mapping container
      const mappingContainer = document.createElement('div');
      mappingContainer.className = 'mapping-container';

      // Define mapping fields
      const mappingFields = [
        { label: 'Productpagina URL', id: 'page_url', icon: 'hgi-link-01' },
        { label: 'Titel', id: 'product_name', icon: 'hgi-text-font' },
        { label: 'Beschrijving', id: 'description', icon: 'hgi-menu-02' },
        { label: 'Prijs', id: 'regular_price', icon: 'hgi-dollar-circle' },
        { label: 'Afbeelding', id: 'image_url', icon: 'hgi-image-01' }
      ];

      // Get all available keys from the XML sample
      const xmlSample = v.productRecommConfig.xmlSample;
      const availableXmlKeys = [];

      // Function to recursively get all viable paths from an object
      function collectPaths(obj, parentPath = '') {
        if (!obj || typeof obj !== 'object') return;

        // Process each property
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;

          if (value !== null && typeof value === 'object') {
            // Don't add objects/arrays themselves as options, only their properties
            if (Array.isArray(value)) {
              // For arrays, add the array itself as an option (if it's not empty)
              if (value.length > 0) {
                availableXmlKeys.push(currentPath);
              }
            } else {
              // For objects, recurse but don't add the object itself
              collectPaths(value, currentPath);
            }
          } else {
            // Add primitive values (strings, numbers, etc.)
            availableXmlKeys.push(currentPath);
          }
        });
      }

      // Collect all paths
      collectPaths(xmlSample);

      // Create each mapping row
      mappingFields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'mapping-field-row';

        // Left side with icon and label
        const leftSide = document.createElement('div');
        leftSide.className = 'mapping-field-label';

        // Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const icon = document.createElement('i');
        icon.className = `hgi hgi-stroke ${field.icon}`;
        icon.setAttribute('icon-size', 'small');
        icon.setAttribute('icon-color', 'black');

        iconContainer.appendChild(icon);

        // Label
        const label = document.createElement('span');
        label.className = 'mapping-field-text';
        label.textContent = field.label;

        leftSide.appendChild(iconContainer);
        leftSide.appendChild(label);

        // Arrow icon
        const arrowContainer = document.createElement('div');
        arrowContainer.className = 'arrow-container';

        const arrowIcon = document.createElement('i');
        arrowIcon.className = 'hgi hgi-stroke hgi-arrow-right-02';
        arrowIcon.setAttribute('icon-size', 'small');
        arrowIcon.setAttribute('icon-color', 'black');

        arrowContainer.appendChild(arrowIcon);

        // Right side with custom dropdown
        const rightSide = document.createElement('div');
        rightSide.className = 'mapping-select';

        const currentMappingValue = v.productRecommConfig.product_recommendations_mapping[field.id];
        const valueExists = doesValueExistInXmlSample(currentMappingValue, xmlSample);

        console.log(`Field ${field.id}:`, {
          currentMappingValue,
          valueExists,
          isEmpty: !currentMappingValue || currentMappingValue === '',
          shouldHighlight: currentMappingValue && currentMappingValue !== '' && !valueExists
        });

        const selectButton = document.createElement('button');
        selectButton.className = 'mapping-select-button';

        // Force clean start - add empty-value class for empty values
        if (!currentMappingValue || currentMappingValue === '') {
          selectButton.classList.add('empty-value');
          selectButton.classList.remove('missing-value');
        }
        // Only add missing-value class if we have a non-empty value that doesn't exist
        else if (currentMappingValue && currentMappingValue !== '' && !valueExists) {
          selectButton.classList.remove('empty-value');
          selectButton.classList.add('missing-value');
        }

        selectButton.setAttribute('type', 'button');
        selectButton.setAttribute('aria-haspopup', 'listbox');

        const buttonText = document.createElement('span');
        buttonText.style.display = 'flex';
        buttonText.style.alignItems = 'center';
        buttonText.style.gap = '2px';
        buttonText.style.flex = '1';

        // Format the button text with arrows for nested paths or show placeholder
        if (currentMappingValue && currentMappingValue !== '') {
          formatPathWithArrows(currentMappingValue, buttonText);
        } else {
          const placeholder = document.createElement('span');
          placeholder.textContent = 'Selecteer een waarde';
          placeholder.style.color = '#9ca3af';
          placeholder.style.fontStyle = 'italic';
          buttonText.appendChild(placeholder);
        }

        // Create appropriate icon based on selection state
        const statusIcon = document.createElement('i');
        if (currentMappingValue && currentMappingValue !== '') {
          if (valueExists) {
            statusIcon.className = 'hgi hgi-solid hgi-checkmark-circle-01';
          } else {
            statusIcon.className = 'hgi hgi-solid hgi-cancel-circle';
          }
        } else {
          statusIcon.className = 'hgi hgi-stroke hgi-chevron-down';
        }
        statusIcon.setAttribute('icon-size', 'small');
        statusIcon.setAttribute(
          'icon-color',
          currentMappingValue && currentMappingValue !== '' && valueExists ? 'success' : currentMappingValue && currentMappingValue !== '' && !valueExists ? 'danger' : 'black'
        );

        selectButton.appendChild(buttonText);
        selectButton.appendChild(statusIcon);

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'mapping-dropdown';
        dropdown.setAttribute('role', 'listbox');

        // Clear selection option and separator removed

        // Add sample value preview if it exists
        if (valueExists) {
          const sampleValuePreview = document.createElement('div');
          sampleValuePreview.className = 'sample-value-preview';

          const value = getValueFromPath(currentMappingValue, xmlSample);
          let displayValue;

          // Format arrays to display without line breaks
          if (Array.isArray(value)) {
            displayValue = value.join(',');
          } else {
            displayValue = String(value);
          }

          // Truncate long values
          if (displayValue.length > 50) {
            displayValue = displayValue.substring(0, 47) + '...';
          }

          sampleValuePreview.textContent = displayValue;
          dropdown.appendChild(sampleValuePreview);
        }

        // Add options to dropdown - use all available keys from XML
        availableXmlKeys.forEach(option => {
          const optionEl = document.createElement('div');
          optionEl.className = 'mapping-dropdown-option';
          if (option === currentMappingValue) {
            optionEl.classList.add('selected');
          }
          optionEl.setAttribute('role', 'option');
          optionEl.setAttribute('data-value', option);

          // Create a container for the formatted path
          const pathContainer = document.createElement('span');
          pathContainer.style.display = 'flex';
          pathContainer.style.alignItems = 'center';
          pathContainer.style.gap = '2px';

          // Format the option text with arrows and icons for nested paths
          formatPathWithArrows(option, pathContainer);
          optionEl.appendChild(pathContainer);

          // Add preview of the actual value for this option
          const sampleValue = getValueFromPath(option, xmlSample);
          if (sampleValue !== undefined) {
            const valuePreview = document.createElement('span');
            valuePreview.className = 'option-value-preview';

            let previewText;

            // Format arrays to display without line breaks
            if (Array.isArray(sampleValue)) {
              previewText = sampleValue.join(',');
            } else {
              previewText = String(sampleValue);
            }

            // Truncate long values
            if (previewText.length > 30) {
              previewText = previewText.substring(0, 27) + '...';
            }

            valuePreview.textContent = previewText;
            optionEl.appendChild(valuePreview);
          }

          // Add a checkmark icon for the initially selected option
          if (option === currentMappingValue && option !== '') {
            const checkmarkImg = document.createElement('img');
            checkmarkImg.src = 'https://cdn.prod.website-files.com/65911e9735540c235757642f/65b56a3ca0e2af577b26dd38_check.svg';
            checkmarkImg.alt = 'Selected';
            checkmarkImg.className = 'option-checkmark';
            checkmarkImg.style.width = '16px';
            checkmarkImg.style.height = '16px';
            checkmarkImg.style.marginLeft = 'auto';
            optionEl.appendChild(checkmarkImg);
          }

          // Handle option selection
          optionEl.addEventListener('click', () => {
            // Get the original path value from the data attribute
            const optionValue = optionEl.getAttribute('data-value');

            // Update the button text with formatted path
            buttonText.innerHTML = ''; // Clear existing content

            if (optionValue && optionValue !== '') {
              formatPathWithArrows(optionValue, buttonText);
            } else {
              const placeholder = document.createElement('span');
              placeholder.textContent = 'Selecteer een waarde';
              placeholder.style.color = '#9ca3af';
              placeholder.style.fontStyle = 'italic';
              buttonText.appendChild(placeholder);
            }

            // Update the mapping in the config with the original path
            v.productRecommConfig.product_recommendations_mapping[field.id] = optionValue;

            // Check if value exists in sample
            const valueExists = doesValueExistInXmlSample(optionValue, xmlSample);
            if (optionValue && optionValue !== '') {
              if (valueExists) {
                selectButton.classList.remove('missing-value');
                selectButton.classList.remove('empty-value');
                statusIcon.className = 'hgi hgi-solid hgi-checkmark-circle-01';
                statusIcon.setAttribute('icon-color', 'success');
              } else {
                selectButton.classList.add('missing-value');
                selectButton.classList.remove('empty-value');
                statusIcon.className = 'hgi hgi-solid hgi-cancel-circle';
                statusIcon.setAttribute('icon-color', 'danger');
              }
            } else {
              // Empty selection should not show error state
              selectButton.classList.remove('missing-value');
              selectButton.classList.add('empty-value');
              statusIcon.className = 'hgi hgi-stroke hgi-chevron-down';
              statusIcon.setAttribute('icon-color', 'black');
            }

            // Update selected state
            dropdown.querySelectorAll('.mapping-dropdown-option').forEach(opt => {
              opt.classList.remove('selected');
              // Remove any existing checkmark icons
              const existingCheckmark = opt.querySelector('.option-checkmark');
              if (existingCheckmark) {
                existingCheckmark.remove();
              }
            });

            optionEl.classList.add('selected');

            // Add checkmark icon to the selected option
            if (optionValue && optionValue !== '') {
              const checkmarkImg = document.createElement('img');
              checkmarkImg.src = 'https://cdn.prod.website-files.com/65911e9735540c235757642f/65b56a3ca0e2af577b26dd38_check.svg';
              checkmarkImg.alt = 'Selected';
              checkmarkImg.className = 'option-checkmark';
              checkmarkImg.style.width = '16px';
              checkmarkImg.style.height = '16px';
              checkmarkImg.style.marginLeft = 'auto';
              optionEl.appendChild(checkmarkImg);
            }

            // Hide dropdown
            dropdown.classList.remove('visible');
            selectButton.classList.remove('active');
          });

          dropdown.appendChild(optionEl);
        });

        // Toggle dropdown visibility
        selectButton.addEventListener('click', () => {
          const isActive = selectButton.classList.contains('active');

          // Close all other dropdowns first
          document.querySelectorAll('.mapping-select-button.active').forEach(btn => {
            if (btn !== selectButton) {
              btn.classList.remove('active');
              btn.nextElementSibling.classList.remove('visible');
            }
          });

          // Toggle this dropdown
          if (isActive) {
            dropdown.classList.remove('visible');
            selectButton.classList.remove('active');
          } else {
            dropdown.classList.add('visible');
            selectButton.classList.add('active');
          }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', e => {
          if (!rightSide.contains(e.target)) {
            dropdown.classList.remove('visible');
            selectButton.classList.remove('active');
          }
        });

        rightSide.appendChild(selectButton);
        rightSide.appendChild(dropdown);

        // Assemble the row
        row.appendChild(leftSide);
        row.appendChild(arrowContainer);
        row.appendChild(rightSide);

        mappingContainer.appendChild(row);
      });

      // Add the mapping container to the specified container
      container.appendChild(mappingContainer);
    }

    // Helper function to check if a path exists in the XML sample
    function doesValueExistInXmlSample(path, xmlSample) {
      // If path is empty or just whitespace, it doesn't exist
      if (!path || path === '' || path.trim() === '') return false;

      // Check if the path resolves to a defined value
      return getValueFromPath(path, xmlSample) !== undefined;
    }

    // Helper function to get a value from a dotted path
    function getValueFromPath(path, obj) {
      // If path is empty or just whitespace, return undefined
      if (!path || path === '' || path.trim() === '') return undefined;

      const parts = path.split('.');
      let current = obj;

      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
      }

      return current;
    }

    // Function to format a path with arrows for display
    function formatPathWithArrows(path, container) {
      if (!path) return '';

      // If no container is provided, just return the text format
      if (!container) {
        return path.split('.').join(' → ');
      }

      // Clear container first
      container.innerHTML = '';

      const parts = path.split('.');

      // Create SVG for cube icon (object)
      const objectSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';

      // Create SVG for array icon
      const arraySvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';

      // Keep track of parent objects and arrays
      const objectPaths = {};
      const arrayPaths = {};

      // Find all objects and arrays in the XML sample
      const findStructures = (obj, parentPath = '') => {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach(key => {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          if (obj[key] && typeof obj[key] === 'object') {
            if (Array.isArray(obj[key])) {
              arrayPaths[currentPath] = true;
            } else {
              objectPaths[currentPath] = true;
            }
            findStructures(obj[key], currentPath);
          }
        });
      };

      // Collect object and array paths from the XML sample
      findStructures(v.productRecommConfig.xmlSample);

      parts.forEach((part, index) => {
        // If not the first part, add arrow before this part
        if (index > 0) {
          const arrow = document.createElement('span');
          arrow.className = 'option-nested-arrow';
          arrow.textContent = '→';
          container.appendChild(arrow);
        }

        // Create a wrapper for each part (icon + text)
        const partWrapper = document.createElement('span');
        partWrapper.className = 'part-wrapper';

        // Build the current path up to this part
        const currentPath = parts.slice(0, index + 1).join('.');

        // Add cube icon if this part is an object with children
        if (objectPaths[currentPath]) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'object-icon';

          // Use SVG for object icon
          const temp = document.createElement('div');
          temp.innerHTML = objectSvg;
          const svg = temp.querySelector('svg');

          if (svg) {
            // Set consistent size
            svg.setAttribute('width', '12');
            svg.setAttribute('height', '12');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('stroke', 'currentColor');
            svg.style.color = '#71717a';

            iconSpan.appendChild(svg);
          }

          partWrapper.appendChild(iconSpan);
        }
        // Add array icon if this part is an array
        else if (arrayPaths[currentPath]) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'array-icon';

          // Use SVG for array icon
          const temp = document.createElement('div');
          temp.innerHTML = arraySvg;
          const svg = temp.querySelector('svg');

          if (svg) {
            // Set consistent size
            svg.setAttribute('width', '12');
            svg.setAttribute('height', '12');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('stroke', 'currentColor');
            svg.style.color = '#71717a';

            iconSpan.appendChild(svg);
          }

          partWrapper.appendChild(iconSpan);
        }

        // Add the part text
        const textSpan = document.createElement('span');
        textSpan.textContent = part;
        partWrapper.appendChild(textSpan);

        // Add [0] index indicator for array item
        if (arrayPaths[currentPath]) {
          const indexSpan = document.createElement('span');
          indexSpan.className = 'array-index-indicator';
          indexSpan.textContent = '[0]';
          partWrapper.appendChild(indexSpan);
        }

        container.appendChild(partWrapper);
      });

      return container;
    }

    // Commented out JSON tree initialization
    /*
    window.initJsonTree = () => {
      new JSONTreeVisualizer('jsonTree', {
        xmlSample: v.productRecommConfig.xmlSample
      });
    };
    */
  };

  if (isLocalhostt) window.initProductRecomms('create-productrecomms-mapping-container');
})();
