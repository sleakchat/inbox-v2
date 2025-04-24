console.log('inserting global js');

(function initDropdownModals() {
  const dropdownTriggers = document.querySelectorAll('[dropdown-trigger]');
  const closeTriggers = document.querySelectorAll('[dropdown-close]');
  const nestedTriggers = document.querySelectorAll('[nested-modal-trigger]');
  const nestedModals = document.querySelectorAll('[nested-modal]');

  function closeAllModals(exceptModal = null) {
    const dropdownModals = document.querySelectorAll('[dropdown-modal]');
    dropdownModals.forEach(modal => {
      if (modal !== exceptModal) {
        const origin = modal.getAttribute('transform-origin');
        if (origin) {
          modal.style.transformOrigin = origin;
          modal.style.transform = `translateY(-20px) scale(0.9)`;
        } else {
          modal.style.transform = 'translateY(-20px)';
        }
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      }
    });
  }

  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      const modal = trigger.querySelector('[dropdown-modal]');
      const isMultiStep = trigger.hasAttribute('multi-step');

      if (modal.style.display === 'flex' && !isMultiStep) {
        closeAllModals();
      } else {
        closeAllModals(modal);
        const origin = modal.getAttribute('transform-origin');
        if (origin) {
          modal.style.transformOrigin = origin;
          modal.style.transform = `translateY(-20px) scale(0.9)`;
        } else {
          modal.style.transform = 'translateY(-20px)';
        }
        modal.style.display = 'flex';
        setTimeout(() => {
          modal.style.opacity = '1';
          modal.style.transform = origin ? `translateY(0px) scale(1)` : 'translateY(0px)';
        }, 10);
      }
    });
  });

  // Global listener to close all modals when clicking outside

  nestedTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();

      // find direct child dropdown modal
      const modal = trigger.querySelector('[nested-modal]');

      // close when open, open when close
      if (modal.style.display === 'flex') {
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(10px)';
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      } else {
        modal.style.transform = 'translateY(10px)';
        modal.style.display = 'flex';
        setTimeout(() => {
          modal.style.opacity = '1';
          modal.style.transform = 'translateY(0px)';
        }, 10);
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
          setTimeout(() => {
            popup.style.transform = 'translateX(0)';
            popup.style.opacity = 1;
          }, 10);
        } else {
          popup.style.transform = 'translateY(5px)';
          popup.style.opacity = 0;
          popup.style.display = 'flex';
          setTimeout(() => {
            popup.style.transform = 'translateY(0)';
            popup.style.opacity = 1;
          }, 10);
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

(function initSkeletonLoaders() {
  window.addEventListener('DOMContentLoaded', event => {
    const skeletonElements = document.querySelectorAll('[skeleton]');

    skeletonElements.forEach(element => {
      // Create a skeleton div
      const skeletonDiv = document.createElement('div');
      skeletonDiv.classList.add('skeleton-loader');

      // Add the skeleton div to the current element
      element.style.position = 'relative';
      element.appendChild(skeletonDiv);

      // Get delay from the attribute
      let delay = element.getAttribute('skeleton');

      // If attribute value is not a number, set default delay as 2000ms
      if (isNaN(delay)) {
        delay = 2000;
      }

      setTimeout(() => {
        // Remove the skeleton loader div after delay
        const skeletonDiv = element.querySelector('.skeleton-loader');
        element.removeChild(skeletonDiv);
      }, delay);
    });
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

(function wizedDebug() {
  window.Wized = window.Wized || [];
  window.Wized.push(Wized => {
    // Log the Wized version
    // console.log(Wized.version);
    // Log the project configuration
    // console.log(Wized.config);
  });
})();
