let formTitle = 'Genereer een lead';
let fields = [
  { type: 'phone', label: 'Phone' },
  { type: 'email', label: 'Email' },
  { type: 'singleline', label: 'Single line' },
  { type: 'multiline', label: 'Multi line' },
  { type: 'singleselect', label: 'Single select', options: ['Option 1', 'Option 2'], displayType: 'cards' },
  { type: 'file', label: 'File' }
];

let selectedFieldIndex = -1;
let currentPopover = null;

const fieldTypeLabels = {
  phone: 'Phone',
  email: 'Email',
  singleline: 'Single line',
  multiline: 'Multi line',
  singleselect: 'Single select',
  file: 'File'
};

const fieldDefaults = {
  phone: () => ({ type: 'phone', label: 'Phone' }),
  email: () => ({ type: 'email', label: 'Email' }),
  singleline: () => ({ type: 'singleline', label: 'Single line' }),
  multiline: () => ({ type: 'multiline', label: 'Multi line' }),
  singleselect: () => ({ type: 'singleselect', label: 'Single select', options: ['Option 1', 'Option 2'], displayType: 'cards' }),
  file: () => ({ type: 'file', label: 'File' })
};

function createSettingsPopover(fieldIndex, fieldElement) {
  const field = fields[fieldIndex];

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
  fields[fieldIndex].label = newLabel;
  renderFormPreview();
}

function updateFieldOption(fieldIndex, optionIndex, newValue) {
  fields[fieldIndex].options[optionIndex] = newValue;
  renderFormPreview();
}

function addFieldOption(fieldIndex) {
  fields[fieldIndex].options.push('New option');
  renderFormPreview();
}

function removeFieldOption(fieldIndex, optionIndex) {
  fields[fieldIndex].options.splice(optionIndex, 1);
  renderFormPreview();
}

function deleteField(fieldIndex) {
  fields.splice(fieldIndex, 1);
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
      fields.splice(insertIndex, 0, fieldDefaults[type]());
      renderFormPreview();
    });
  });

  return addFieldEl;
}

function renderFormPreview() {
  const main = document.querySelector('.form-builder-main');
  main.innerHTML = '';

  // Add form title
  const titleEl = document.createElement('h1');
  titleEl.className = 'form-title';
  titleEl.textContent = formTitle;
  main.appendChild(titleEl);

  fields.forEach((field, idx) => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'form-field-wrapper';

    // Add field controls
    const controls = document.createElement('div');
    controls.className = 'form-field-controls';
    controls.innerHTML = `
      <button class="field-control-btn" onclick="showSettingsPopover(${idx}, this.closest('.form-field-wrapper'))">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3C10.5523 3 11 3.44772 11 4V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V4C9 3.44772 9.44772 3 10 3Z" fill="currentColor"/>
          <path d="M4 3C4.55228 3 5 3.44772 5 4V16C5 16.5523 4.55228 17 4 17C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3Z" fill="currentColor"/>
          <path d="M16 3C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17C15.4477 17 15 16.5523 15 16V4C15 3.44772 15.4477 3 16 3Z" fill="currentColor"/>
        </svg>
      </button>
      <button class="field-control-btn field-add-btn" onclick="showAddFieldDropdown(${idx + 1}, this)">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="field-control-btn field-delete-btn" onclick="deleteField(${idx})">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    fieldWrapper.appendChild(controls);

    let fieldEl = '';

    switch (field.type) {
      case 'phone':
        fieldEl = `<label>${field.label}</label><input type="tel" placeholder="Enter phone" />`;
        break;
      case 'email':
        fieldEl = `<label>${field.label}</label><input type="email" placeholder="Enter email" />`;
        break;
      case 'singleline':
        fieldEl = `<label>${field.label}</label><input type="text" placeholder="Enter text" />`;
        break;
      case 'multiline':
        fieldEl = `<label>${field.label}</label><textarea placeholder="Enter text"></textarea>`;
        break;
      case 'singleselect':
        if (field.displayType === 'cards') {
          fieldEl = `
            <label>${field.label}</label>
            <div class="options-container">
              ${field.options
                .map(
                  (opt, optIdx) => `
                <div class="option-card">
                  <input type="checkbox" id="field-${idx}-opt-${optIdx}" name="field-${idx}">
                  <label for="field-${idx}-opt-${optIdx}">${opt}</label>
                </div>
              `
                )
                .join('')}
            </div>
          `;
        } else {
          fieldEl = `<label>${field.label}</label><select>${field.options.map(opt => `<option>${opt}</option>`).join('')}</select>`;
        }
        break;
      case 'file':
        fieldEl = `
          <label>${field.label}</label>
          <div class="file-upload-box" onclick="this.querySelector('input').click()">
            <i class="hgi hgi-stroke hgi-upload-04 file-upload-icon" icon-size="xlarge" icon-color="black"></i>
            Click to choose a file or drag here
            <input type="file" style="display:none" />
          </div>
        `;
        break;
      default:
        fieldEl = '';
    }

    const fieldPreview = document.createElement('div');
    fieldPreview.className = 'form-field-preview';
    if (idx === selectedFieldIndex) {
      fieldPreview.classList.add('selected');
    }
    fieldPreview.innerHTML = fieldEl;

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
    <button class="field-control-btn field-add-btn" onclick="showAddFieldDropdown(${fields.length}, this)">
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

  // File upload drag effect
  main.querySelectorAll('.file-upload-box').forEach(box => {
    box.addEventListener('dragover', e => {
      e.preventDefault();
      box.classList.add('dragover');
    });
    box.addEventListener('dragleave', e => {
      box.classList.remove('dragover');
    });
    box.addEventListener('drop', e => {
      e.preventDefault();
      box.classList.remove('dragover');
      const input = box.querySelector('input[type="file"]');
      input.files = e.dataTransfer.files;
    });
  });
}

// Function to show add field dropdown from field controls
function showAddFieldDropdown(insertIndex, buttonElement) {
  const fieldIcons = {
    phone: 'hgi-call-02',
    email: 'hgi-mail-01',
    singleline: 'hgi-text-font',
    multiline: 'hgi-menu-02',
    singleselect: 'hgi-checkmark-square-03',
    file: 'hgi-attachment'
  };

  // Remove any existing dropdown
  const existingDropdown = document.querySelector('.add-field-dropdown.visible');
  if (existingDropdown) {
    existingDropdown.remove();
    // Remove controls-active class from any field wrapper
    document.querySelectorAll('.form-field-wrapper.controls-active').forEach(wrapper => {
      wrapper.classList.remove('controls-active');
    });
  }

  // Get the field wrapper and add controls-active class
  const fieldWrapper = buttonElement.closest('.form-field-wrapper');
  if (fieldWrapper) {
    fieldWrapper.classList.add('controls-active');
  }

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'add-field-dropdown visible';
  dropdown.style.position = 'absolute';
  dropdown.style.left = '100%';
  dropdown.style.top = '0';
  dropdown.style.marginLeft = '8px';

  dropdown.innerHTML = `
    ${Object.keys(fieldTypeLabels)
      .map(
        type =>
          `<div class="add-field-option" data-type="${type}">
        <i class="hgi hgi-stroke ${fieldIcons[type]}" icon-size="small" icon-color="black"></i>
        ${fieldTypeLabels[type]}
      </div>`
      )
      .join('')}
  `;

  // Position relative to button
  buttonElement.style.position = 'relative';
  buttonElement.appendChild(dropdown);

  // Add click handlers
  dropdown.querySelectorAll('.add-field-option').forEach(option => {
    option.addEventListener('click', e => {
      e.stopPropagation();
      const type = e.target.closest('.add-field-option').getAttribute('data-type');
      fields.splice(insertIndex, 0, fieldDefaults[type]());
      renderFormPreview();
    });
  });

  // Setup global click handler to close dropdown
  function handleGlobalClick(e) {
    // Only close if clicking outside the dropdown and button
    if (!dropdown.contains(e.target) && !buttonElement.contains(e.target)) {
      dropdown.remove();
      if (fieldWrapper) {
        fieldWrapper.classList.remove('controls-active');
      }
      document.removeEventListener('click', handleGlobalClick);
    }
  }

  // Add the global click handler with a small delay to prevent immediate closing
  setTimeout(() => {
    document.addEventListener('click', handleGlobalClick);
  }, 0);
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

document.addEventListener('DOMContentLoaded', () => {
  renderFormPreview();
});
