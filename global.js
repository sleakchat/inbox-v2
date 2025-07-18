// (function initSkeletonLoaders() {
//   const skeletonElements = document.querySelectorAll('[skeleton]');
//   console.log('skeletonElements', skeletonElements);

//   skeletonElements.forEach(element => {
//     // Create a skeleton div
//     const skeletonDiv = document.createElement('div');
//     skeletonDiv.classList.add('skeleton-loader');

//     // Add the skeleton div to the current element
//     element.style.position = 'relative';
//     element.appendChild(skeletonDiv);

//     // Get delay from the attribute
//     let delay = element.getAttribute('skeleton');

//     // If attribute value is not a number, set default delay as 2000ms
//     if (isNaN(delay)) {
//       delay = 2000;
//     }

//     setTimeout(() => {
//       // Remove the skeleton loader div after delay
//       const skeletonDiv = element.querySelector('.skeleton-loader');
//       element.removeChild(skeletonDiv);
//     }, delay);
//   });
// })();

(function initDropdownModals() {
  const dropdownTriggers = document.querySelectorAll('[dropdown-trigger]');
  const closeTriggers = document.querySelectorAll('[dropdown-close]');
  const nestedTriggers = document.querySelectorAll('[nested-modal-trigger]');
  const nestedModals = document.querySelectorAll('[nested-modal]');

  window.closeAllModals = function (exceptModal = null) {
    const dropdownModals = document.querySelectorAll('[dropdown-modal]');
    dropdownModals.forEach(modal => {
      if (modal !== exceptModal) {
        const origin = modal.getAttribute('transform-origin');
        const isReverse = modal.hasAttribute('open-top');
        if (origin) {
          modal.style.transformOrigin = origin;
          modal.style.transform = isReverse ? `translateY(20px) scale(0.9)` : `translateY(-20px) scale(0.9)`;
        } else {
          modal.style.transform = isReverse ? 'translateY(20px)' : 'translateY(-20px)';
        }
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      }
    });
  };

  function closeAllNestedModals() {
    const nestedModals = document.querySelectorAll('[nested-modal]');
    nestedModals.forEach(modal => {
      if (modal.style.display === 'flex') {
        const origin = modal.getAttribute('transform-origin');
        const isReverse = modal.hasAttribute('open-top');

        if (origin) {
          modal.style.transformOrigin = origin;
        }
        modal.style.opacity = '0';
        const translateY = isReverse ? '20px' : '-20px';
        modal.style.transform = `translateY(${translateY}) scale(0.9)`;
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      }
    });
  }

  function openDropdownModal(trigger) {
    const modal = trigger.querySelector('[dropdown-modal]');
    const isMultiStep = trigger.hasAttribute('multi-step');
    const isReverse = modal.hasAttribute('open-top');

    if (modal.style.display === 'flex' && !isMultiStep) {
      closeAllModals();
    } else {
      closeAllModals(modal);
      const origin = modal.getAttribute('transform-origin');
      if (origin) {
        modal.style.transformOrigin = origin;
        modal.style.transform = isReverse ? `translateY(20px) scale(0.9)` : `translateY(-20px) scale(0.9)`;
      } else {
        modal.style.transform = isReverse ? 'translateY(20px)' : 'translateY(-20px)';
      }
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = origin ? `translateY(0px) scale(1)` : 'translateY(0px)';
      }, 10);
    }
  }

  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      openDropdownModal(trigger);
    });
  });

  window.openDropdownModalGlobal = function (dropdownId) {
    event.stopPropagation();
    console.log('openDropdownModalGlobal', dropdownId);
    const trigger = document.querySelector(`[dropdown-trigger="${dropdownId}"]`);
    console.log('trigger', trigger);
    openDropdownModal(trigger);
  };

  // Global listener to close all modals when clicking outside

  nestedTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();

      // find direct child dropdown modal
      const modal = trigger.querySelector('[nested-modal]');
      const origin = modal.getAttribute('transform-origin');
      const isReverse = modal.hasAttribute('open-top');

      // close when open, open when close
      if (modal.style.display === 'flex') {
        if (origin) {
          modal.style.transformOrigin = origin;
        }
        modal.style.opacity = '0';
        // Apply translate and scale together
        const translateY = isReverse ? '20px' : '-20px';
        modal.style.transform = `translateY(${translateY}) scale(0.9)`;
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      } else {
        if (origin) {
          modal.style.transformOrigin = origin;
        }
        // Apply translate and scale together
        const translateY = isReverse ? '20px' : '-20px';
        modal.style.transform = `translateY(${translateY}) scale(0.9)`;
        modal.style.display = 'flex';
        setTimeout(() => {
          modal.style.opacity = '1';
          modal.style.transform = 'translateY(0px) scale(1)';
        }, 10);
      }
    });
  });

  // Close nested modals when clicking inside parent modals
  document.querySelectorAll('[dropdown-modal]').forEach(parentModal => {
    parentModal.addEventListener('click', function (event) {
      // Only process if click is directly on the modal or its children (not nested modal triggers)
      if (!event.target.closest('[nested-modal-trigger]')) {
        closeAllNestedModals();
        event.stopPropagation(); // Prevent closing the parent modal
      }
    });
  });

  document.addEventListener('click', function () {
    closeAllModals();
  });

  closeTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (event) {
      closeAllModals();
    });
  });

  // Prevent clicks inside modals from reaching document
  document.querySelectorAll('[multi-step]').forEach(modal => {
    modal.addEventListener('click', function (event) {
      event.stopPropagation();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });
})();

(function initPopupModals() {
  window.showPopupModal = async function (modalValue) {
    document.querySelectorAll('[popupmodal]').forEach(popup => {
      if (popup.getAttribute('popupmodal') === modalValue) {
        if (modalValue == 'edit-kb-topic' || modalValue == 'create-kb-topic' || popup.hasAttribute('sidebar')) {
          popup.style.transform = 'translateX(20px)';
          popup.style.opacity = 0;
          popup.style.display = 'flex';
          requestAnimationFrame(() => {
            popup.style.transform = 'translateX(0)';
            popup.style.opacity = 1;
          });
        } else {
          popup.style.transform = 'translateY(5px)';
          popup.style.opacity = 0;
          popup.style.display = 'flex';
          requestAnimationFrame(() => {
            popup.style.transform = 'translateY(0)';
            popup.style.opacity = 1;
          });
        }
      }
    });
  };

  document.querySelectorAll('[openmodal]').forEach(trigger => {
    trigger.addEventListener('click', function () {
      const modalValue = this.getAttribute('openmodal');
      window.showPopupModal(modalValue);
    });
  });

  window.closePopupModal = function (modalValue = null) {
    const modal = document.querySelector(`[popupmodal="${modalValue}"]`);
    modal.style.display = 'none';
  };
  window.closeAllPopupModals = function () {
    document.querySelectorAll('[popupmodal]').forEach(modal => {
      modal.style.display = 'none';
    });
  };

  document.querySelectorAll('[popupmodal-closetrigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('close-only-current')) {
        const closestElement = btn.closest('[popupmodal]');
        modalValue = closestElement.getAttribute('popupmodal');
        window.closePopupModal(modalValue);
      } else {
        window.closeAllPopupModals();
      }
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      window.closeAllPopupModals();
    }
  });
})();

(function initToastParams() {
  window.addEventListener('load', function () {
    var currentUrl = window.location.href;
    if (currentUrl.includes('?tn=')) {
      var url = new URL(currentUrl);
      url.searchParams.delete('tn');
      window.history.replaceState({}, document.title, url.toString());
    }
  });
})();

// Create tooltip container
(function createTooltipContainer() {
  const container = document.createElement('div');
  container.id = 'tooltip-container';
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;
  document.body.appendChild(container);
})();

(function initTooltips() {
  const tooltipMap = new WeakMap(); // Store tooltip elements by their triggers
  let currentHoveredTrigger = null;

  function createTooltipElement(trigger) {
    const content = trigger.getAttribute('tooltiptrigger');
    const direction = trigger.getAttribute('tooltip-direction') || 'bottom';
    const theme = trigger.getAttribute('tooltip-theme');

    const tooltip = document.createElement('div');
    tooltip.className = `tooltip-element ${theme ? 'theme-' + theme : ''} direction-${direction}`;
    tooltip.textContent = content;
    tooltip.style.cssText = `
      position: fixed;
      opacity: 0;
      padding: 7px 9px;
      background: #333;
      color: white;
      border: 1px solid #545454;
      border-radius: 6px;
      font-family: system-ui;
      font-size: 10px;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s, transform 0.2s;
      transition-delay: var(--tooltip-delay, 0.1s);
    `;

    if (theme === 'light') {
      tooltip.style.background = 'white';
      tooltip.style.color = '#333';
      tooltip.style.borderColor = '#e5e5e5';
      tooltip.style.boxShadow = '0 0 3px 0 rgba(0, 0, 0, 0.1)';
    }

    // Set initial transform based on direction
    if (direction === 'top') {
      tooltip.style.transform = 'translate(-50%, calc(-100% + 3px))';
    } else if (direction === 'bottom') {
      tooltip.style.transform = 'translate(-50%, -3px)';
    } else if (direction === 'left') {
      tooltip.style.transform = 'translate(calc(-100% + 3px), -50%)';
    } else if (direction === 'right') {
      tooltip.style.transform = 'translate(-3px, -50%)';
    }

    return tooltip;
  }

  // Check if element or any of its parents are hidden
  const isElementVisible = element => {
    if (!document.body.contains(element)) return false;

    let current = element;
    while (current && current !== document.body) {
      // Check if element or parent is display:none directly through style
      if (current.style.display === 'none') return false;

      // Check computed style for all visibility properties
      const style = window.getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.visibility === 'collapse' || parseFloat(style.opacity) === 0) {
        return false;
      }

      // Check if parent exists and is connected to document
      current = current.parentElement;
      if (!current || !current.isConnected) return false;
    }
    return true;
  };

  function hideTooltip(trigger, tooltip) {
    tooltip.style.opacity = '0';
    const direction = trigger.getAttribute('tooltip-direction') || 'bottom';

    if (direction === 'top') {
      tooltip.style.transform = 'translate(-50%, calc(-100% + 3px))';
    } else if (direction === 'bottom') {
      tooltip.style.transform = 'translate(-50%, -3px)';
    } else if (direction === 'left') {
      tooltip.style.transform = 'translate(calc(-100% + 3px), -50%)';
    } else if (direction === 'right') {
      tooltip.style.transform = 'translate(-3px, -50%)';
    }
  }

  function updateTooltipPosition(trigger, tooltip) {
    if (!isElementVisible(trigger)) {
      hideTooltip(trigger, tooltip);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const direction = trigger.getAttribute('tooltip-direction') || 'bottom';
    const offset = parseInt(trigger.getAttribute('tooltip-offset') || '0', 10);

    const x = rect.left + rect.width / 2;
    const y = direction === 'top' ? rect.top - offset : direction === 'bottom' ? rect.bottom + offset : rect.top + rect.height / 2;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;

    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      if (direction === 'top') {
        tooltip.style.transform = 'translate(-50%, -100%)';
      } else if (direction === 'bottom') {
        tooltip.style.transform = 'translate(-50%, 0)';
      } else if (direction === 'left') {
        tooltip.style.transform = 'translate(-100%, -50%)';
      } else if (direction === 'right') {
        tooltip.style.transform = 'translate(0, -50%)';
      }
    });
  }

  // Handle scroll events
  window.addEventListener(
    'scroll',
    () => {
      // If no hover or hovered trigger is not visible anymore, hide all tooltips
      if (!currentHoveredTrigger || !isElementVisible(currentHoveredTrigger)) {
        currentHoveredTrigger = null; // Reset since element might be gone
        document.querySelectorAll('[tooltiptrigger]').forEach(trigger => {
          const tooltip = tooltipMap.get(trigger);
          if (tooltip) {
            hideTooltip(trigger, tooltip);
          }
        });
      }
    },
    { passive: true }
  );

  // Create all tooltips once
  document.querySelectorAll('[tooltiptrigger]').forEach(trigger => {
    const tooltip = createTooltipElement(trigger);
    const container = document.getElementById('tooltip-container');
    container.appendChild(tooltip);
    tooltipMap.set(trigger, tooltip);

    // Update position on hover
    trigger.addEventListener('mouseenter', () => {
      currentHoveredTrigger = trigger;
      if (isElementVisible(trigger)) {
        updateTooltipPosition(trigger, tooltip);
      }
    });

    // Hide tooltip on mouse leave
    trigger.addEventListener('mouseleave', () => {
      currentHoveredTrigger = null;
      hideTooltip(trigger, tooltip);
    });
  });

  window.hideAllTooltips = function () {
    document.querySelectorAll('.tooltip-element').forEach(tooltip => {
      tooltip.style.opacity = '0';
      const direction = tooltip.classList.contains('direction-top')
        ? 'top'
        : tooltip.classList.contains('direction-left')
        ? 'left'
        : tooltip.classList.contains('direction-right')
        ? 'right'
        : 'bottom';

      if (direction === 'top') {
        tooltip.style.transform = 'translate(-50%, calc(-100% - 3px))';
      } else if (direction === 'bottom') {
        tooltip.style.transform = 'translate(-50%, 3px)';
      } else if (direction === 'left') {
        tooltip.style.transform = 'translate(calc(-100% - 3px), -50%)';
      } else {
        tooltip.style.transform = 'translate(3px, -50%)';
      }
    });
  };

  // Global function to initialize tooltips for dynamically added elements
  window.initTooltip = function (trigger) {
    if (!tooltipMap.has(trigger)) {
      const tooltip = createTooltipElement(trigger);
      const container = document.getElementById('tooltip-container');
      container.appendChild(tooltip);
      tooltipMap.set(trigger, tooltip);

      trigger.addEventListener('mouseenter', () => {
        currentHoveredTrigger = trigger;
        if (isElementVisible(trigger)) {
          updateTooltipPosition(trigger, tooltip);
        }
      });

      trigger.addEventListener('mouseleave', () => {
        currentHoveredTrigger = null;
        hideTooltip(trigger, tooltip);
      });
    }
  };
})();

// (function wizedDebug() {
//   window.Wized = window.Wized || [];
//   window.Wized.push(Wized => {
//     // Log the Wized version
//     console.log(Wized.version);
//     // Log the project configuration
//     console.log(Wized.config);
//   });
// })();
