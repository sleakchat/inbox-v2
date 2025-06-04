const isLocalhost = window.location.hostname === 'localhost';
// if (localhost) {
//   let v, r, i;
// }

function defineWizedVariables() {
  window.v = Wized.data.v;
  window.r = Wized.data.r;
  window.i = Wized.data.i;
}
window.initFormBuilder = async function () {
  if (isLocalhost) {
    window.v = window.v || {};
    v = window.v;
    v.formInitialized = true;
    v.formBuilderConfig = v.formBuilderConfig || {
      title: 'Genereer een lead',
      on_submit: 'webhook',
      success_message: 'Retour succesvol aangemaakt',
      disable_airesponse: true,
      fields: [
        {
          id: 'field_1',
          type: 'email',
          label: 'E-mail',
          required: true,
          position: 1
        },
        {
          id: 'field_2',
          type: 'phone',
          label: 'Telefoon',
          required: true,
          position: 0
        },
        {
          id: 'field_3',
          type: 'singleline',
          label: 'Text',
          required: true,
          position: 2
        },
        {
          id: 'field_4',
          type: 'multiline',
          label: 'Meerdere regels',
          required: true,
          position: 3
        },
        {
          id: 'field_5',
          type: 'singleselect',
          label: 'Meerkeuze',
          options: ['Optie 1', 'Optie 2'],
          displayType: 'cards',
          required: true,
          position: 4
        },
        {
          id: 'field_6',
          type: 'file',
          label: 'Bestand',
          required: true,
          position: 5
        }
      ]
    };
  } else {
    defineWizedVariables();
    v = window.v;
    v.formInitialized = true;
  }

  let selectedFieldIndex = -1;
  let currentPopover = null;
  let draggedFieldIndex = null;

  const fieldTypeLabels = {
    singleline: 'Text',
    multiline: 'Meerdere regels',
    phone: 'Telefoon',
    email: 'E-mail',
    singleselect: 'Meerkeuze',
    file: 'Bestand'
  };

  const fieldDefaults = {
    phone: () => ({ type: 'phone', label: 'Telefoon', required: false }),
    email: () => ({ type: 'email', label: 'E-mail', required: false }),
    singleline: () => ({ type: 'singleline', label: 'Text', required: false }),
    multiline: () => ({ type: 'multiline', label: 'Meerdere regels', required: false }),
    singleselect: () => ({ type: 'singleselect', label: 'Meerkeuze', options: ['Optie 1', 'Optie 2'], displayType: 'cards', required: false }),
    file: () => ({ type: 'file', label: 'Bestand', required: false })
  };

  function createSettingsPopover(fieldIndex, fieldElement) {
    const field = v.formBuilderConfig.fields[fieldIndex];

    const popover = document.createElement('div');
    popover.className = 'settings-popover visible';
    popover.innerHTML = `
    <div class="settings-popover-header">
      <span class="settings-popover-title">${fieldTypeLabels[field.type]}</span>
      <button class="settings-popover-close">✕</button>
    </div>
    <div class="settings-content">
      <div class="settings-group">
        <div class="settings-item">
          <span class="settings-item-label">Label</span>
        </div>
        <input type="text" class="settings-input" value="${field.label}" onchange="updateFieldLabel(${fieldIndex}, this.value)">
      </div>
      
      ${
        field.type === 'singleselect'
          ? `
        <div class="settings-group">
          <div class="settings-group-title">Options</div>
          <div class="options-list">
            ${field.options
              .map(
                (option, idx) => `
              <div class="option-item">
                <input type="text" class="option-input" value="${option}" onchange="updateFieldOption(${fieldIndex}, ${idx}, this.value)">
                <button class="option-remove" onclick="removeFieldOption(${fieldIndex}, ${idx})">✕</button>
              </div>
            `
              )
              .join('')}
          </div>
          <button class="add-option-btn" onclick="addFieldOption(${fieldIndex})">+ Add option</button>
        </div>
      `
          : ''
      }
    </div>
  `;

    popover.querySelector('.settings-popover-close').addEventListener('click', () => {
      hideSettingsPopover();
    });

    fieldElement.appendChild(popover);
    currentPopover = popover;

    // Position popover
    const rect = fieldElement.getBoundingClientRect();
    if (rect.right + 336 > window.innerWidth) {
      // Show on left side if not enough space on right
      popover.style.left = 'auto';
      popover.style.right = 'calc(100% + 16px)';
    }
  }

  function showSettingsPopover(fieldIndex, fieldElement) {
    hideSettingsPopover();
    selectedFieldIndex = fieldIndex;
    createSettingsPopover(fieldIndex, fieldElement);
  }

  function hideSettingsPopover() {
    if (currentPopover) {
      currentPopover.remove();
      currentPopover = null;
    }
    selectedFieldIndex = -1;

    // Remove selection from all fields
    document.querySelectorAll('.form-field-preview').forEach(field => {
      field.classList.remove('selected');
    });
  }

  function updateFieldLabel(fieldIndex, newLabel) {
    v.formBuilderConfig.fields[fieldIndex].label = newLabel;
    renderFormPreview();
  }

  function updateFieldOption(fieldIndex, optionIndex, newValue) {
    v.formBuilderConfig.fields[fieldIndex].options[optionIndex] = newValue;
    renderFormPreview();
  }

  function addFieldOption(fieldIndex) {
    v.formBuilderConfig.fields[fieldIndex].options.push('Nieuwe optie');
    renderFormPreview();
  }

  function removeFieldOption(fieldIndex, optionIndex) {
    v.formBuilderConfig.fields[fieldIndex].options.splice(optionIndex, 1);
    renderFormPreview();
  }

  function deleteField(fieldIndex) {
    v.formBuilderConfig.fields.splice(fieldIndex, 1);
    hideSettingsPopover();
    renderFormPreview();
  }

  // Make functions global for onclick handlers
  window.updateFieldLabel = updateFieldLabel;
  window.updateFieldOption = updateFieldOption;
  window.addFieldOption = addFieldOption;
  window.removeFieldOption = removeFieldOption;
  window.deleteField = deleteField;

  function createAddFieldInline(insertIndex) {
    const addFieldEl = document.createElement('div');
    addFieldEl.className = 'add-field-inline';

    const fieldIcons = {
      phone: 'hgi-call-02',
      email: 'hgi-mail-01',
      singleline: 'hgi-text-font',
      multiline: 'hgi-menu-02',
      singleselect: 'hgi-checkmark-square-03',
      file: 'hgi-attachment'
    };

    addFieldEl.innerHTML = `
    <div class="add-field-trigger">+</div>
    <div class="add-field-dropdown">
      ${Object.keys(fieldTypeLabels)
        .map(
          type =>
            `<div class="add-field-option" data-type="${type}">
          <i class="hgi hgi-stroke ${fieldIcons[type]}" icon-size="small" icon-color="black"></i>
          ${fieldTypeLabels[type]}
        </div>`
        )
        .join('')}
    </div>
  `;

    const trigger = addFieldEl.querySelector('.add-field-trigger');
    const dropdown = addFieldEl.querySelector('.add-field-dropdown');

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      // Close any other open dropdowns
      document.querySelectorAll('.add-field-dropdown.visible').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('visible');
          d.closest('.add-field-inline').classList.remove('dropdown-open');
        }
      });
      dropdown.classList.toggle('visible');
      // Keep the inline field visible when dropdown is open
      if (dropdown.classList.contains('visible')) {
        addFieldEl.classList.add('dropdown-open');
      } else {
        addFieldEl.classList.remove('dropdown-open');
      }
    });

    addFieldEl.querySelectorAll('.add-field-option').forEach(option => {
      option.addEventListener('click', e => {
        e.stopPropagation();
        const type = e.target.closest('.add-field-option').getAttribute('data-type');
        v.formBuilderConfig.fields.splice(insertIndex, 0, fieldDefaults[type]());
        renderFormPreview();
      });
    });

    return addFieldEl;
  }

  window.renderFormPreview = function () {
    // Sync the closure v with window.v if it exists
    if (window.v && window.v.formBuilderConfig) {
      v = window.v;
    }

    const main = document.querySelector('.form-builder-main');
    if (!main) {
      console.error('form-builder-main element not found');
      return;
    }

    if (!v.formBuilderConfig) {
      console.error('formBuilderConfig is undefined');
      return;
    }

    if (!v.formBuilderConfig.fields) {
      console.error('formBuilderConfig.fields is undefined');
      return;
    }

    main.innerHTML = '';

    // Editable form title (Tally-style)
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'form-title-wrapper';
    titleWrapper.style.position = 'relative';
    titleWrapper.style.marginLeft = '-32px';
    titleWrapper.style.paddingLeft = '32px';

    // Title edit icon (shows on hover)
    const titleEditIcon = document.createElement('button');
    titleEditIcon.className = 'title-edit-icon';
    titleEditIcon.innerHTML = '<i class="hgi hgi-solid hgi-sharp hgi-pen-01" icon-size="micro" icon-color="black"></i>';
    titleEditIcon.style.position = 'absolute';
    titleEditIcon.style.left = '0';
    titleEditIcon.style.top = '16px';
    titleEditIcon.style.transform = 'translateY(-50%)';
    titleEditIcon.style.width = '20px';
    titleEditIcon.style.height = '20px';
    titleEditIcon.style.display = 'flex';
    titleEditIcon.style.alignItems = 'center';
    titleEditIcon.style.justifyContent = 'center';
    titleEditIcon.style.opacity = '0';
    titleEditIcon.style.transition = 'all 0.2s';
    titleEditIcon.style.color = '#a1a1aa';
    titleEditIcon.style.cursor = 'pointer';
    titleEditIcon.style.background = 'transparent';
    titleEditIcon.style.border = 'none';
    titleEditIcon.style.borderRadius = '4px';
    titleEditIcon.style.padding = '0';

    // Add hover effect
    titleEditIcon.addEventListener('mouseenter', () => {
      titleEditIcon.style.background = '#f4f4f5';
      titleEditIcon.style.color = '#B9B9B9';
      titleEditIcon.style.opacity = '0.5';
    });

    titleEditIcon.addEventListener('mouseleave', () => {
      titleEditIcon.style.background = 'transparent';
      titleEditIcon.style.color = '#a1a1aa';
    });

    // Select all text when clicking the edit icon
    titleEditIcon.addEventListener('click', e => {
      e.preventDefault();
      titleInput.focus();
      titleInput.select();
    });

    // Show/hide icon on hover
    titleWrapper.addEventListener('mouseenter', () => {
      titleEditIcon.style.opacity = '1';
    });

    titleWrapper.addEventListener('mouseleave', () => {
      titleEditIcon.style.opacity = '0';
    });

    titleWrapper.appendChild(titleEditIcon);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = v.formBuilderConfig.title || 'Naamloos formulier';
    titleInput.className = 'form-title-input';
    titleInput.setAttribute('aria-label', 'Form title');
    titleInput.setAttribute('maxlength', '80');
    titleInput.setAttribute('no-outline', 'true');
    titleInput.autocomplete = 'off';
    titleInput.spellcheck = false;
    titleInput.style.width = '100%';

    // Style to look like plain text
    titleInput.style.border = 'none';
    titleInput.style.background = 'none';
    titleInput.style.fontSize = '1.5rem';
    titleInput.style.fontWeight = '600';
    titleInput.style.color = '#18181b';
    titleInput.style.outline = 'none';
    titleInput.style.padding = '0';
    titleInput.style.margin = '0';
    titleInput.style.display = 'inline-block';
    titleInput.style.minWidth = '2ch';
    titleInput.style.maxWidth = '100%';
    titleInput.style.lineHeight = '1.2';
    titleInput.style.letterSpacing = '0';
    titleInput.style.boxShadow = 'none';
    titleInput.style.caretColor = '#18181b';
    titleInput.style.textAlign = 'left';
    titleInput.style.cursor = 'text';
    titleInput.style.marginBottom = '4px';

    // Update config and resize input
    function commitTitleEdit() {
      v.formBuilderConfig.title = titleInput.value.trim() || 'Naamloos formulier';
      titleInput.value = v.formBuilderConfig.title;
      titleInput.style.width = titleInput.value.length + 2 + 'ch';
      renderFormPreview();
    }
    titleInput.addEventListener('blur', commitTitleEdit);
    titleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleInput.blur();
      }
    });
    titleInput.addEventListener('input', () => {
      titleInput.style.width = titleInput.value.length + 2 + 'ch';
    });

    titleWrapper.appendChild(titleInput);
    main.appendChild(titleWrapper);

    console.log('Added title to main');
    console.log('Number of fields:', v.formBuilderConfig.fields.length);

    // On page load, do NOT overwrite field.label if it already exists in the config
    // Only set label if it is missing or empty
    v.formBuilderConfig.fields.forEach(field => {
      if (typeof field.label !== 'string' || field.label.trim() === '') {
        field.label = fieldTypeLabels[field.type] || 'Veld';
      }
      // Ensure required property exists
      if (typeof field.required !== 'boolean') {
        field.required = false;
      }
    });

    v.formBuilderConfig.fields.forEach((field, idx) => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'form-field-wrapper';

      // Add field controls
      const controls = document.createElement('div');
      controls.className = 'form-field-controls';
      controls.innerHTML = `
      <button class="field-control-btn field-delete-btn" onclick="deleteField(${idx})">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="field-control-btn field-add-btn" onclick="showAddFieldDropdown(${idx + 1}, this)">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="field-control-btn drag-handle" draggable="true">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="6" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="6" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="16" r="1.5" fill="currentColor"/>
        </svg>
      </button>
    `;
      fieldWrapper.appendChild(controls);

      // Make field wrapper draggable
      fieldWrapper.draggable = true;
      fieldWrapper.dataset.fieldIndex = idx;

      // Drag handle specific setup
      const dragHandle = controls.querySelector('.drag-handle');
      dragHandle.style.cursor = 'grab';

      // Track if we're dragging or just clicking
      let isDragging = false;
      let dragStarted = false;

      // Click handler for settings popover
      dragHandle.addEventListener('click', e => {
        if (!dragStarted) {
          e.stopPropagation();

          const existingPopover = dragHandle.closest('.form-field-controls').querySelector('.field-settings-popover');
          if (existingPopover) {
            closeAllDropdowns();
            return;
          }

          setTimeout(() => {
            closeAllDropdowns();

            const fieldWrapper = dragHandle.closest('.form-field-wrapper');
            if (fieldWrapper) {
              fieldWrapper.classList.add('controls-active');
            }

            const popover = document.createElement('div');
            popover.className = 'field-settings-popover';
            popover.style.position = 'absolute';
            popover.style.background = '#ffffff';
            popover.style.border = 'none';
            popover.style.borderRadius = '12px';
            popover.style.padding = '4px';
            popover.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)';
            popover.style.zIndex = '1000';
            popover.style.minWidth = '180px';
            popover.style.fontSize = '13px';
            popover.style.opacity = '0';
            popover.style.pointerEvents = 'auto';

            // Position to the left of the drag handle
            popover.style.top = '50%';
            popover.style.right = '100%';
            popover.style.marginRight = '8px';

            // Set initial transform state without transition
            popover.style.transform = 'translateY(-50%) scale(0.95) translateX(10px)';

            const option = document.createElement('div');
            option.style.display = 'flex';
            option.style.alignItems = 'center';
            option.style.padding = '6px 12px';
            option.style.cursor = 'pointer';
            option.style.borderRadius = '8px';
            option.style.transition = 'background-color 0.15s ease';
            option.style.color = '#1a1a1a';

            // Add hover effect
            option.addEventListener('mouseenter', () => {
              option.style.backgroundColor = '#f5f5f5';
            });
            option.addEventListener('mouseleave', () => {
              option.style.backgroundColor = 'transparent';
            });

            const text = document.createElement('span');
            text.textContent = 'Vereist';
            text.style.fontSize = '13px';
            text.style.fontWeight = '400';
            text.style.letterSpacing = '-0.01em';
            text.style.marginRight = 'auto';

            // Create toggle container with exact HTML structure
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'toggle-container smalltoggle';
            toggleContainer.innerHTML = `
              <input type="checkbox" id="field-required-${idx}" class="checkbox-default-small" ${field.required ? 'checked' : ''}>
              <label for="field-required-${idx}" class="toggle-label-small micro">
                <div class="checkbox-toggle-dot micro"></div>
              </label>
            `;

            const checkbox = toggleContainer.querySelector('input');
            checkbox.addEventListener('change', () => {
              v.formBuilderConfig.fields[idx].required = checkbox.checked;
            });

            // Make the entire option clickable
            option.addEventListener('click', e => {
              // Don't toggle if clicking directly on the checkbox or its label
              if (!e.target.closest('.toggle-container')) {
                checkbox.checked = !checkbox.checked;
                v.formBuilderConfig.fields[idx].required = checkbox.checked;
                // Trigger change event for any listeners
                checkbox.dispatchEvent(new Event('change'));
              }
            });

            option.appendChild(text);
            option.appendChild(toggleContainer);
            popover.appendChild(option);

            // Append to controls div
            const controls = dragHandle.closest('.form-field-controls');
            controls.appendChild(popover);

            // Enable transitions after initial state is set
            setTimeout(() => {
              popover.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
              popover.style.opacity = '1';
              popover.style.transform = 'translateY(-50%) scale(1) translateX(0)';
            }, 50);

            // Close popover when clicking outside
            setTimeout(() => {
              const closePopoverHandler = function (e) {
                // Don't close if clicking inside the popover or on the drag handle
                if (!popover.contains(e.target) && !dragHandle.contains(e.target)) {
                  closeAllDropdowns();
                  document.removeEventListener('click', closePopoverHandler);
                }
              };
              document.addEventListener('click', closePopoverHandler);

              // Store the handler on the popover element so we can remove it later
              popover._closeHandler = closePopoverHandler;
            }, 0);
          }, 150);
        }
        dragStarted = false;
      });

      // Drag events
      fieldWrapper.addEventListener('dragstart', e => {
        // Only allow dragging from the drag handle
        if (!e.target.closest('.drag-handle')) {
          e.preventDefault();
          return;
        }
        dragStarted = true;
        isDragging = true;
        draggedFieldIndex = idx;
        e.dataTransfer.effectAllowed = 'move';
        fieldWrapper.style.opacity = '0.5';
        dragHandle.style.cursor = 'grabbing';
      });

      fieldWrapper.addEventListener('dragend', e => {
        isDragging = false;
        fieldWrapper.style.opacity = '';
        dragHandle.style.cursor = 'grab';
        // Remove all drop indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
          indicator.remove();
        });
        // Reset drag started after a delay
        setTimeout(() => {
          dragStarted = false;
        }, 100);
      });

      fieldWrapper.addEventListener('dragover', e => {
        e.preventDefault();
        if (draggedFieldIndex === null || draggedFieldIndex === idx) return;

        const afterElement = getDragAfterElement(fieldWrapper, e.clientY);
        const dropIndicator = document.querySelector('.drop-indicator') || createDropIndicator();

        if (afterElement == null) {
          fieldWrapper.appendChild(dropIndicator);
        } else {
          fieldWrapper.insertBefore(dropIndicator, afterElement);
        }
      });

      fieldWrapper.addEventListener('drop', e => {
        e.preventDefault();
        if (draggedFieldIndex === null || draggedFieldIndex === idx) return;

        // Reorder the fields
        const draggedField = v.formBuilderConfig.fields[draggedFieldIndex];
        v.formBuilderConfig.fields.splice(draggedFieldIndex, 1);

        // Determine new index
        let newIndex = idx;
        if (draggedFieldIndex < idx) {
          newIndex--;
        }

        v.formBuilderConfig.fields.splice(newIndex, 0, draggedField);
        draggedFieldIndex = null;
        renderFormPreview();
      });

      // Create the field preview container
      const fieldPreview = document.createElement('div');
      fieldPreview.className = 'form-field-preview';
      if (idx === selectedFieldIndex) {
        fieldPreview.classList.add('selected');
      }

      // Inline editable label (real DOM node, styled as plain text)
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = field.label;
      labelInput.className = 'field-label-input';
      labelInput.setAttribute('aria-label', 'Field label');
      labelInput.setAttribute('maxlength', '60');
      labelInput.setAttribute('no-outline', 'true');
      labelInput.autocomplete = 'off';
      labelInput.spellcheck = false;
      labelInput.style.width = '100%';
      labelInput.style.border = 'none';
      labelInput.style.background = 'none';
      labelInput.style.fontSize = '12px';
      labelInput.style.fontWeight = '500';
      labelInput.style.color = '#7a7a7a';
      labelInput.style.outline = 'none';
      labelInput.style.padding = '0';
      labelInput.style.margin = '0 0 6px 0';
      labelInput.style.display = 'block';
      labelInput.style.minWidth = '2ch';
      labelInput.style.maxWidth = '100%';
      labelInput.style.lineHeight = '1.2';
      labelInput.style.letterSpacing = '0';
      labelInput.style.boxShadow = 'none';
      labelInput.style.caretColor = '#7a7a7a';
      labelInput.style.textAlign = 'left';
      labelInput.style.cursor = 'text';

      function commitLabelEdit() {
        v.formBuilderConfig.fields[idx].label = labelInput.value.trim() || fieldTypeLabels[field.type] || 'Veld';
        renderFormPreview();
      }
      labelInput.addEventListener('blur', commitLabelEdit);
      labelInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          labelInput.blur();
        }
      });
      labelInput.addEventListener('input', () => {
        labelInput.style.width = labelInput.value.length + 2 + 'ch';
        v.formBuilderConfig.fields[idx].label = labelInput.value;
        // Update placeholder live
        if (inputEl) inputEl.placeholder = labelInput.value;
        if (textareaEl) textareaEl.placeholder = labelInput.value;
      });

      // Append label input
      fieldPreview.appendChild(labelInput);

      // Create the actual field input/textarea/select
      let inputEl = null;
      let textareaEl = null;
      switch (field.type) {
        case 'phone':
          inputEl = document.createElement('input');
          inputEl.type = 'tel';
          inputEl.placeholder = field.label;
          inputEl.style.paddingLeft = '32px'; // Make room for icon

          // Create phone icon
          const phoneIcon = document.createElement('i');
          phoneIcon.className = 'hgi hgi-stroke hgi-call-02';
          phoneIcon.setAttribute('icon-size', 'small');
          phoneIcon.setAttribute('icon-color', 'black');
          phoneIcon.style.position = 'absolute';
          phoneIcon.style.left = '10px';
          phoneIcon.style.top = '50%';
          phoneIcon.style.transform = 'translateY(-50%)';
          phoneIcon.style.color = '#a1a1aa';
          phoneIcon.style.pointerEvents = 'none';

          // Create wrapper for input + icon
          const phoneWrapper = document.createElement('div');
          phoneWrapper.style.position = 'relative';
          phoneWrapper.appendChild(phoneIcon);
          phoneWrapper.appendChild(inputEl);
          fieldPreview.appendChild(phoneWrapper);
          break;
        case 'email':
          inputEl = document.createElement('input');
          inputEl.type = 'email';
          inputEl.placeholder = field.label;
          inputEl.style.paddingLeft = '32px'; // Make room for icon

          // Create email icon
          const emailIcon = document.createElement('i');
          emailIcon.className = 'hgi hgi-stroke hgi-mail-01';
          emailIcon.setAttribute('icon-size', 'small');
          emailIcon.setAttribute('icon-color', 'black');
          emailIcon.style.position = 'absolute';
          emailIcon.style.left = '10px';
          emailIcon.style.top = '50%';
          emailIcon.style.transform = 'translateY(-50%)';
          emailIcon.style.color = '#a1a1aa';
          emailIcon.style.pointerEvents = 'none';

          // Create wrapper for input + icon
          const emailWrapper = document.createElement('div');
          emailWrapper.style.position = 'relative';
          emailWrapper.appendChild(emailIcon);
          emailWrapper.appendChild(inputEl);
          fieldPreview.appendChild(emailWrapper);
          break;
        case 'singleline':
          inputEl = document.createElement('input');
          inputEl.type = 'text';
          inputEl.placeholder = field.label;
          fieldPreview.appendChild(inputEl);
          break;
        case 'multiline':
          textareaEl = document.createElement('textarea');
          textareaEl.placeholder = field.label;
          fieldPreview.appendChild(textareaEl);
          break;
        case 'singleselect':
          if (field.displayType === 'cards') {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';
            optionsContainer.style.position = 'relative';
            optionsContainer.style.cursor = 'pointer';
            optionsContainer.style.minHeight = '40px'; // Ensure clickable area even with few options

            // Function to add new option
            const addNewOption = () => {
              v.formBuilderConfig.fields[idx].options.push('Nieuwe optie');
              renderFormPreview();
            };

            // Add click handler to container (but not on existing options)
            optionsContainer.addEventListener('click', e => {
              // Only add if clicking directly on container, not on child elements
              if (e.target === optionsContainer) {
                addNewOption();
              }
            });

            field.options.forEach((opt, optIdx) => {
              const optionCard = document.createElement('div');
              optionCard.className = 'option-card';

              // Option indicator (A, B, C, etc.)
              const indicator = document.createElement('span');
              indicator.className = 'option-indicator';
              indicator.textContent = String.fromCharCode(65 + optIdx); // A, B, C, etc.
              indicator.style.display = 'inline-flex';
              indicator.style.alignItems = 'center';
              indicator.style.justifyContent = 'center';
              indicator.style.width = '20px';
              indicator.style.height = '20px';
              indicator.style.backgroundColor = '#e4e4e7';
              indicator.style.color = '#71717a';
              indicator.style.fontSize = '12px';
              indicator.style.fontWeight = '500';
              indicator.style.borderRadius = '4px';
              indicator.style.marginRight = '0';
              indicator.style.flexShrink = '0';
              indicator.style.cursor = 'default';
              indicator.style.transition = 'all 0.2s';

              // Delete button (hidden by default, shows on hover)
              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'option-delete-btn';
              deleteBtn.innerHTML = '×'; // × symbol
              deleteBtn.style.display = 'none';
              deleteBtn.style.alignItems = 'center';
              deleteBtn.style.justifyContent = 'center';
              deleteBtn.style.width = '20px';
              deleteBtn.style.height = '20px';
              deleteBtn.style.backgroundColor = 'transparent';
              deleteBtn.style.color = '#a1a1aa';
              deleteBtn.style.fontSize = '16px';
              deleteBtn.style.fontWeight = '400';
              deleteBtn.style.borderRadius = '4px';
              deleteBtn.style.marginRight = '8px';
              deleteBtn.style.flexShrink = '0';
              deleteBtn.style.cursor = 'pointer';
              deleteBtn.style.border = 'none';
              deleteBtn.style.padding = '0';
              deleteBtn.style.transition = 'all 0.2s';
              deleteBtn.style.position = 'absolute';
              deleteBtn.style.left = '0';

              deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                v.formBuilderConfig.fields[idx].options.splice(optIdx, 1);
                renderFormPreview();
              });

              deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.backgroundColor = '#E4E4E7';
                deleteBtn.style.color = '#a1a1aa';
              });

              deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.backgroundColor = 'transparent';
                deleteBtn.style.color = '#a1a1aa';
              });

              // Container for indicator/delete button
              const indicatorContainer = document.createElement('div');
              indicatorContainer.style.position = 'relative';
              indicatorContainer.style.width = '20px';
              indicatorContainer.style.height = '20px';
              indicatorContainer.style.marginRight = '4px';
              indicatorContainer.style.flexShrink = '0';
              indicatorContainer.appendChild(indicator);
              indicatorContainer.appendChild(deleteBtn);

              // Show/hide delete button on option card hover
              optionCard.addEventListener('mouseenter', () => {
                indicator.style.display = 'none';
                deleteBtn.style.display = 'flex';
              });

              optionCard.addEventListener('mouseleave', () => {
                indicator.style.display = 'inline-flex';
                deleteBtn.style.display = 'none';
              });

              // Inline editable option label
              const optionInput = document.createElement('input');
              optionInput.type = 'text';
              optionInput.value = opt;
              optionInput.className = 'option-label-input';
              optionInput.setAttribute('aria-label', 'Option label');
              optionInput.setAttribute('maxlength', '60');
              optionInput.setAttribute('no-outline', 'true');
              optionInput.autocomplete = 'off';
              optionInput.spellcheck = false;
              optionInput.style.border = 'none';
              optionInput.style.background = 'none';
              optionInput.style.fontSize = '14px';
              optionInput.style.fontWeight = '400';
              optionInput.style.color = opt === 'Nieuwe optie' ? '#E4E4E7' : '#0a0a0a';
              optionInput.style.outline = 'none';
              optionInput.style.padding = '0';
              optionInput.style.margin = '0';
              optionInput.style.display = 'inline-block';
              optionInput.style.minWidth = '20px';
              optionInput.style.maxWidth = '200px';
              optionInput.style.lineHeight = '1.2';
              optionInput.style.letterSpacing = '0';
              optionInput.style.boxShadow = 'none';
              optionInput.style.caretColor = '#0a0a0a';
              optionInput.style.textAlign = 'left';
              optionInput.style.cursor = 'text';
              optionInput.style.fontFamily = 'inherit';

              // Auto-resize function
              function resizeOptionInput() {
                // Create a temporary span to measure text width
                const measurer = document.createElement('span');
                measurer.style.position = 'absolute';
                measurer.style.visibility = 'hidden';
                measurer.style.height = '0';
                measurer.style.overflow = 'hidden';
                measurer.style.whiteSpace = 'pre';
                measurer.style.fontSize = optionInput.style.fontSize;
                measurer.style.fontWeight = optionInput.style.fontWeight;
                measurer.style.fontFamily = optionInput.style.fontFamily;
                measurer.style.letterSpacing = optionInput.style.letterSpacing;
                measurer.textContent = optionInput.value || 'Optie';

                document.body.appendChild(measurer);
                const width = measurer.offsetWidth;
                document.body.removeChild(measurer);

                // Set width with some padding
                optionInput.style.width = width + 8 + 'px';
              }

              // Resize on load
              resizeOptionInput();

              function commitOptionEdit() {
                v.formBuilderConfig.fields[idx].options[optIdx] = optionInput.value.trim() || 'Optie';
                // Use setTimeout to check after focus has moved
                setTimeout(() => {
                  const activeElement = document.activeElement;
                  const isOptionInput = activeElement && activeElement.classList.contains('option-label-input');
                  if (!isOptionInput) {
                    renderFormPreview();
                  }
                }, 0);
              }
              optionInput.addEventListener('blur', commitOptionEdit);
              optionInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  optionInput.blur();
                  renderFormPreview(); // Force render on Enter
                }
              });
              optionInput.addEventListener('input', () => {
                v.formBuilderConfig.fields[idx].options[optIdx] = optionInput.value;
                // Update color based on content
                optionInput.style.color = optionInput.value === 'Nieuwe optie' ? '#E4E4E7' : '#0a0a0a';
                resizeOptionInput();
              });

              // Add focus event to change color when editing
              optionInput.addEventListener('focus', () => {
                if (optionInput.value === 'Nieuwe optie') {
                  optionInput.style.color = '#0a0a0a';
                }
              });

              // Add blur event to restore grey color if still default
              optionInput.addEventListener('blur', () => {
                if (optionInput.value === 'Nieuwe optie') {
                  optionInput.style.color = '#E4E4E7';
                }
              });

              optionCard.appendChild(indicatorContainer);
              optionCard.appendChild(optionInput);
              optionsContainer.appendChild(optionCard);
            });

            // Add option button (shows on hover)
            const addOptionBtn = document.createElement('button');
            addOptionBtn.className = 'add-option-inline-btn';
            addOptionBtn.innerHTML = '+';
            addOptionBtn.style.position = 'absolute';
            addOptionBtn.style.right = '-30px';
            addOptionBtn.style.top = '50%';
            addOptionBtn.style.transform = 'translateY(-50%)';
            addOptionBtn.style.width = '20px';
            addOptionBtn.style.height = '20px';
            addOptionBtn.style.background = 'transparent';
            addOptionBtn.style.border = 'none';
            addOptionBtn.style.borderRadius = '4px';
            addOptionBtn.style.color = '#a1a1aa';
            addOptionBtn.style.fontSize = '14px';
            addOptionBtn.style.fontWeight = '400';
            addOptionBtn.style.cursor = 'pointer';
            addOptionBtn.style.display = 'none';
            addOptionBtn.style.alignItems = 'center';
            addOptionBtn.style.justifyContent = 'center';
            addOptionBtn.style.padding = '0';
            addOptionBtn.style.transition = 'all 0.2s';

            addOptionBtn.addEventListener('click', e => {
              e.stopPropagation(); // Prevent container click
              addNewOption();
            });

            addOptionBtn.addEventListener('mouseenter', () => {
              addOptionBtn.style.background = '#f4f4f5';
              addOptionBtn.style.color = '#0a0a0a';
              addOptionBtn.style.transform = 'translateY(-50%) scale(1.1)';
            });

            addOptionBtn.addEventListener('mouseleave', () => {
              addOptionBtn.style.background = 'transparent';
              addOptionBtn.style.color = '#a1a1aa';
              addOptionBtn.style.transform = 'translateY(-50%)';
            });

            // Show add button when hovering the field wrapper (not the option cards)
            fieldWrapper.addEventListener('mouseenter', () => {
              addOptionBtn.style.display = 'flex';
            });

            fieldWrapper.addEventListener('mouseleave', () => {
              addOptionBtn.style.display = 'none';
            });

            // Hide add button when hovering any option card
            field.options.forEach((opt, optIdx) => {
              const optionCards = optionsContainer.querySelectorAll('.option-card');
              if (optionCards[optIdx]) {
                optionCards[optIdx].addEventListener('mouseenter', () => {
                  addOptionBtn.style.display = 'none';
                });
                optionCards[optIdx].addEventListener('mouseleave', () => {
                  // Only show again if still hovering the field wrapper
                  if (fieldWrapper.matches(':hover')) {
                    addOptionBtn.style.display = 'flex';
                  }
                });
              }
            });

            optionsContainer.appendChild(addOptionBtn);

            fieldPreview.appendChild(optionsContainer);
          } else {
            const select = document.createElement('select');
            select.placeholder = field.label;
            field.options.forEach(opt => {
              const option = document.createElement('option');
              option.textContent = opt;
              select.appendChild(option);
            });
            fieldPreview.appendChild(select);
          }
          break;
        case 'file':
          const fileBox = document.createElement('div');
          fileBox.className = 'file-upload-box';

          // Create default content
          const defaultContent = document.createElement('div');
          defaultContent.innerHTML = `
            <i class="hgi hgi-stroke hgi-upload-04 file-upload-icon" icon-size="xlarge" icon-color="black"></i>
            Klik om een bestand te kiezen of sleep hier
          `;
          defaultContent.style.transition = 'opacity 0.2s ease';

          // Create hover warning content
          const warningContent = document.createElement('div');
          warningContent.innerHTML = `
            <i class="hgi hgi-stroke hgi-information-circle" icon-size="xlarge" icon-color="black" style="margin-bottom: 8px; display: block; color: #71717a;"></i>
            Let op: Alleen bruikbaar in widget formulier
          `;
          warningContent.style.position = 'absolute';
          warningContent.style.top = '50%';
          warningContent.style.left = '50%';
          warningContent.style.transform = 'translate(-50%, -50%)';
          warningContent.style.fontSize = '13px';
          warningContent.style.color = '#71717a';
          warningContent.style.fontWeight = '400';
          warningContent.style.opacity = '0';
          warningContent.style.transition = 'opacity 0.2s ease';
          warningContent.style.textAlign = 'center';
          warningContent.style.width = '100%';
          warningContent.style.padding = '0 20px';

          fileBox.appendChild(defaultContent);
          fileBox.appendChild(warningContent);

          // Just a visual element, no actual file input or functionality
          fileBox.style.cursor = 'pointer';
          fileBox.style.position = 'relative';

          // Add hover effects
          fileBox.addEventListener('mouseenter', () => {
            defaultContent.style.opacity = '0';
            warningContent.style.opacity = '1';
          });

          fileBox.addEventListener('mouseleave', () => {
            defaultContent.style.opacity = '1';
            warningContent.style.opacity = '0';
          });

          fieldPreview.appendChild(fileBox);
          break;
        default:
          break;
      }

      fieldWrapper.appendChild(fieldPreview);
      main.appendChild(fieldWrapper);
    });

    // Always add an empty field row at the bottom
    const emptyFieldWrapper = document.createElement('div');
    emptyFieldWrapper.className = 'form-field-wrapper empty-field-wrapper';

    // Add controls for the empty field
    const emptyControls = document.createElement('div');
    emptyControls.className = 'form-field-controls';
    emptyControls.innerHTML = `
    <button class="field-control-btn field-add-btn" onclick="showAddFieldDropdown(${v.formBuilderConfig.fields.length}, this)">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
    emptyFieldWrapper.appendChild(emptyControls);

    // Add empty field content
    const emptyFieldContent = document.createElement('div');
    emptyFieldContent.className = 'empty-field-content';
    emptyFieldWrapper.appendChild(emptyFieldContent);

    main.appendChild(emptyFieldWrapper);

    // Add static "add new field" row at the bottom
    const addFieldRow = document.createElement('div');
    addFieldRow.className = 'form-field-wrapper add-field-row';
    addFieldRow.style.marginTop = '8px';

    // Add controls for the add field row
    const addFieldControls = document.createElement('div');
    addFieldControls.className = 'form-field-controls';
    addFieldControls.style.opacity = '0';
    addFieldControls.innerHTML = `
      <div class="left-controls" style="display: flex; gap: 4px; padding-left: 7px; pointer-events: auto;">
        <button class="field-control-btn field-add-btn" onclick="showAddFieldDropdown(${v.formBuilderConfig.fields.length}, this)">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="right-controls" style="padding-right: 7px; pointer-events: auto;">
        <!-- Empty right controls for alignment -->
      </div>
    `;
    addFieldRow.appendChild(addFieldControls);

    // Create the field preview container
    const addFieldPreview = document.createElement('div');
    addFieldPreview.className = 'form-field-preview';
    addFieldPreview.style.height = '36px';
    addFieldPreview.style.display = 'flex';
    addFieldPreview.style.alignItems = 'center';
    addFieldPreview.style.justifyContent = 'center';
    addFieldPreview.style.cursor = 'pointer';
    addFieldPreview.style.transition = 'background-color 0.2s ease';
    addFieldPreview.style.borderRadius = '8px';

    // Create the content container
    const addFieldContent = document.createElement('div');
    addFieldContent.style.display = 'flex';
    addFieldContent.style.alignItems = 'center';
    addFieldContent.style.gap = '8px';
    addFieldContent.style.opacity = '0';
    addFieldContent.style.transition = 'opacity 0.2s ease';

    // Add text (without plus icon)
    const addFieldText = document.createElement('span');
    addFieldText.textContent = 'Voeg nieuw veld toe';
    addFieldText.style.fontSize = '13px';
    addFieldText.style.color = '#71717a';
    addFieldText.style.fontWeight = '400';

    addFieldContent.appendChild(addFieldText);
    addFieldPreview.appendChild(addFieldContent);

    // Add hover effects
    addFieldRow.addEventListener('mouseenter', () => {
      addFieldPreview.style.backgroundColor = '#fafafa';
      addFieldContent.style.opacity = '1';
      addFieldControls.style.opacity = '1';
    });

    addFieldRow.addEventListener('mouseleave', () => {
      addFieldPreview.style.backgroundColor = 'transparent';
      addFieldContent.style.opacity = '0';
      addFieldControls.style.opacity = '0';
    });

    // Add click handler to the preview area
    addFieldPreview.addEventListener('click', e => {
      e.stopPropagation();
      const addBtn = addFieldControls.querySelector('.field-add-btn');
      showAddFieldDropdown(v.formBuilderConfig.fields.length, addBtn);
    });

    addFieldRow.appendChild(addFieldPreview);
    main.appendChild(addFieldRow);
  };

  function closeAllDropdowns() {
    // Close any existing dropdown
    const existingDropdown = document.querySelector('.field-type-dropdown');
    if (existingDropdown) {
      existingDropdown.style.opacity = '0';
      existingDropdown.style.transform = 'translateY(-50%) scale(0.95) translateX(10px)';
      setTimeout(() => {
        existingDropdown.remove();
      }, 150);
    }
    // Close any existing settings popover
    const existingPopover = document.querySelector('.field-settings-popover');
    if (existingPopover) {
      // Remove the click handler if it exists
      if (existingPopover._closeHandler) {
        document.removeEventListener('click', existingPopover._closeHandler);
      }
      existingPopover.style.opacity = '0';
      existingPopover.style.transform = 'translateY(-50%) scale(0.95) translateX(10px)';
      setTimeout(() => {
        existingPopover.remove();
      }, 150);
    }
    // Remove controls-active class from any field wrapper
    document.querySelectorAll('.form-field-wrapper.controls-active').forEach(wrapper => {
      wrapper.classList.remove('controls-active');
    });
  }

  // Function to show add field dropdown from field controls
  function showAddFieldDropdown(insertIndex, buttonElement) {
    // If dropdown is already open and attached to this button, close it
    const existingDropdown = buttonElement.closest('.form-field-controls').querySelector('.field-type-dropdown');
    if (existingDropdown) {
      closeAllDropdowns();
      return;
    }

    // Ensure any ongoing close animations are completed
    setTimeout(() => {
      closeAllDropdowns();

      const fieldIcons = {
        phone: 'hgi-call-02',
        email: 'hgi-mail-01',
        singleline: 'hgi-text-font',
        multiline: 'hgi-menu-02',
        singleselect: 'hgi-checkmark-square-03',
        file: 'hgi-attachment'
      };

      // Get the field wrapper and add controls-active class
      const fieldWrapper = buttonElement.closest('.form-field-wrapper');
      if (fieldWrapper) {
        fieldWrapper.classList.add('controls-active');
      }

      // Create dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'field-type-dropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.display = 'block';
      dropdown.style.background = '#ffffff';
      dropdown.style.border = 'none';
      dropdown.style.borderRadius = '12px';
      dropdown.style.padding = '4px';
      dropdown.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)';
      dropdown.style.zIndex = '1000';
      dropdown.style.minWidth = '180px';
      dropdown.style.fontSize = '13px';
      dropdown.style.opacity = '0';
      dropdown.style.pointerEvents = 'auto';

      // Position to the left of the add button
      dropdown.style.top = '50%';
      dropdown.style.right = '100%';
      dropdown.style.marginRight = '8px';

      // Set initial transform state without transition
      dropdown.style.transform = 'translateY(-50%) scale(0.95) translateX(10px)';

      dropdown.innerHTML = `
        ${Object.keys(fieldTypeLabels)
          .map(
            type =>
              `<div class="field-type-option" data-type="${type}" style="display: flex; align-items: center; padding: 6px 8px; cursor: pointer; border-radius: 8px; transition: background-color 0.15s ease; color: #1a1a1a;">
            <i class="hgi hgi-stroke ${fieldIcons[type]}" icon-size="small" icon-color="black" style="margin-right: 8px; color: #000;"></i>
            <span style="font-size: 13px; font-weight: 400; letter-spacing: -0.01em; color: #1a1a1a;">${fieldTypeLabels[type]}</span>
          </div>`
          )
          .join('')}
      `;

      // Add hover effects to options
      dropdown.querySelectorAll('.field-type-option').forEach(option => {
        option.addEventListener('mouseenter', () => {
          option.style.backgroundColor = '#f5f5f5';
        });
        option.addEventListener('mouseleave', () => {
          option.style.backgroundColor = 'transparent';
        });
      });

      // Append to controls div
      const controls = buttonElement.closest('.form-field-controls');
      controls.appendChild(dropdown);

      // Enable transitions after initial state is set
      setTimeout(() => {
        dropdown.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(-50%) scale(1) translateX(0)';
      }, 50);

      // Add click handlers for closing
      dropdown.querySelectorAll('.field-type-option').forEach(option => {
        option.addEventListener('click', e => {
          e.stopPropagation();
          const type = e.target.closest('.field-type-option').getAttribute('data-type');
          v.formBuilderConfig.fields.splice(insertIndex, 0, fieldDefaults[type]());

          // Hide the dropdown with animation
          dropdown.style.opacity = '0';
          dropdown.style.transform = 'translateY(-50%) scale(0.95) translateX(10px)';
          setTimeout(() => {
            dropdown.remove();
            if (fieldWrapper) {
              fieldWrapper.classList.remove('controls-active');
            }
            renderFormPreview();
          }, 150);
        });
      });

      // Setup global click handler to close dropdown
      function handleGlobalClick(e) {
        // Only close if clicking outside the dropdown and button
        if (!dropdown.contains(e.target) && !buttonElement.contains(e.target)) {
          closeAllDropdowns();
          document.removeEventListener('click', handleGlobalClick);
        }
      }

      // Add the global click handler with a delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', handleGlobalClick);
      }, 0);
    }, 150); // Wait for any ongoing close animations
  }

  // Make showAddFieldDropdown global
  window.showAddFieldDropdown = showAddFieldDropdown;

  // Close settings popover when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.settings-popover') && !e.target.closest('.field-control-btn')) {
      hideSettingsPopover();
    }
  });

  // Global click handler for closing inline add field dropdowns
  document.addEventListener('click', e => {
    // Close any open inline add field dropdowns when clicking outside
    if (!e.target.closest('.add-field-inline')) {
      document.querySelectorAll('.add-field-inline .add-field-dropdown.visible').forEach(dropdown => {
        dropdown.classList.remove('visible');
        dropdown.closest('.add-field-inline').classList.remove('dropdown-open');
      });
    }
  });

  renderFormPreview();

  // Function to update form config and re-render
  window.updateFormBuilderConfig = function (newConfig) {
    if (!newConfig) {
      console.error('No config provided to updateFormBuilderConfig');
      return;
    }

    // Ensure we're updating the same v reference
    if (window.v) {
      window.v.formBuilderConfig = newConfig;
    }
    v.formBuilderConfig = newConfig;

    // Re-render the form
    window.renderFormPreview();
  };

  // Export the current form config as JSON
  function exportFormConfig() {
    return JSON.stringify(
      {
        ...v.formBuilderConfig,
        fields: v.formBuilderConfig.fields.map(f => ({
          ...f,
          ...(f.options ? { options: f.options } : {}),
          ...(f.displayType ? { displayType: f.displayType } : {})
        }))
      },
      null,
      2
    );
  }

  window.exportFormConfig = exportFormConfig;

  // Helper functions for drag and drop
  function createDropIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    indicator.style.height = '2px';
    indicator.style.background = '#B9B9B9';
    indicator.style.margin = '4px 0';
    indicator.style.borderRadius = '99px';
    indicator.style.transition = 'all 0.2s';
    return indicator;
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.form-field-preview:not(.dragging)')];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
};

if (isLocalhost) {
  initFormBuilder();
}
