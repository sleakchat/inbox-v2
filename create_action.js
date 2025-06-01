(async function () {
  // select boxes start
  Wized.data.v.selectedAction = 'handoff';
  function handleClick(event) {
    const element = event.currentTarget;
    Wized.data.v.selectedAction = element.getAttribute('data-value');
    addDataSourceselectBoxes.forEach(box => {
      box.classList.remove('selected');
    });
    element.classList.add('selected');
  }
  const addDataSourceselectBoxes = document.querySelectorAll('[multi-select="select-action"]');
  addDataSourceselectBoxes.forEach(box => box.addEventListener('click', handleClick));

  // order status api templates
  const selectOrderStatusTemplatButton = document.querySelector('[w-el="create-orderstatustemplate-btn"]');
  selectOrderStatusTemplatButton.style.display = 'none';
  function handleOrderApiTemplateClick(event) {
    if (!Wized.data.v.selectedOrdersApiTemplate) selectOrderStatusTemplatButton.style.display = 'flex';
    const element = event.currentTarget;
    Wized.data.v.selectedOrdersApiTemplate = element.getAttribute('data-value');
    orderApiTemplateSelectBoxes.forEach(box => {
      box.classList.remove('selected');
    });
    element.classList.add('selected');
  }
  const orderApiTemplateSelectBoxes = document.querySelectorAll('[multi-select="select-orderstatustemplate"]');
  orderApiTemplateSelectBoxes.forEach(box => box.addEventListener('click', handleOrderApiTemplateClick));

  const authConfig = {
    shopify: [
      { name: 'api_key', label: 'API Key', type: 'text', required: true },
      { name: 'access_token', label: 'Access Token', type: 'text', required: true }
    ],
    woocommerce: [
      { name: 'base_url', label: 'Base URL', type: 'text', required: true },
      { name: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
      { name: 'consumer_secret', label: 'Consumer Secret', type: 'text', required: true }
    ],
    lightspeed: [
      { name: 'client_id', label: 'Client ID', type: 'text', required: true },
      { name: 'client_secret', label: 'Client Secret', type: 'text', required: true },
      { name: 'access_token', label: 'Access Token', type: 'text', required: true }
    ],
    magento: [{ name: 'bearer_token', label: 'Bearer Token', type: 'text', required: true }],
    myparcel: [{ name: 'api_key', label: 'API Key', type: 'text', required: true }],
    sendcloud: [
      { name: 'api_key', label: 'API Key', type: 'text', required: true },
      { name: 'api_secret', label: 'API Secret', type: 'text', required: true }
    ],
    picqer: [{ name: 'api_key', label: 'API Key', type: 'text', required: true }]
  };

  function cleanupDynamicAuthInputs() {
    const wrapper = document.querySelector('[w-el="create-template-form-inputs-wrapper"]');
    if (!wrapper) return;
    wrapper.querySelectorAll('[data-dynamic-auth="true"]').forEach(el => el.remove());
  }

  function renderAuthInputsForTemplate(templateKey) {
    cleanupDynamicAuthInputs();
    const wrapper = document.querySelector('[w-el="create-template-form-inputs-wrapper"]');
    const config = authConfig[templateKey];
    if (!config || !wrapper) return;
    config.forEach(field => {
      const template = document.querySelector('[w-el="order-status-form-dynamic-template"]');
      if (!template) return;
      const clone = template.cloneNode(true);
      clone.setAttribute('data-dynamic-auth', 'true');
      // Set label
      const label = clone.querySelector('.text-block-322');
      if (label) label.textContent = field.label;
      // Set input attributes
      const input = clone.querySelector('.auth-form-input');
      if (input) {
        input.setAttribute('name', field.name);
        input.setAttribute('type', field.type);
        input.required = field.required;
        input.value = '';
      }
      // Set icon class
      const iconDiv = clone.querySelector('.auth-form-input-icon i');
      if (iconDiv) {
        if (field.name === 'base_url') {
          iconDiv.className = 'hgi hgi-stroke hgi-link-02';
        } else if (field.name.includes('key') || field.name.includes('secret') || field.name.includes('token') || field.name.includes('password') || field.name.includes('credential')) {
          iconDiv.className = 'hgi hgi-stroke hgi-lock-password';
        }
      }
      wrapper.appendChild(clone);
    });
  }

  selectOrderStatusTemplatButton.addEventListener('click', function (event) {
    document.querySelector(`[actions-container="order-status-1"]`).style.display = 'none';
    document.querySelector(`[actions-container="order-status-2"]`).style.display = 'flex';
    // Render dynamic auth inputs for the selected template
    // Normalize template key to match config keys (lowercase, no spaces)
    let templateKey = Wized.data.v.selectedOrdersApiTemplate;
    if (templateKey) templateKey = templateKey.toLowerCase().replace(/\s+/g, '');
    renderAuthInputsForTemplate(templateKey);
  });

  const actionContainerInitial = document.querySelector('[actions-container="initial"]');
  const actionsContainers = document.querySelectorAll('[actions-container]');
  const buttonInitial = document.querySelector("[w-el='create-action-btn']");
  console.log('buttonInitial', buttonInitial);
  console.log('actionContainerInitial', actionContainerInitial);

  // const pdfForm = document.querySelector('[datasourcesform="pdf"]');
  // const urlForm = document.querySelector('[datasourcesform="url"]');
  // // const apiForm = document.querySelector('[datasourcesform="api"]');
  // const csvForm = document.querySelector('[datasourcesform="csv"]');
  // const xmlForm = document.querySelector('[datasourcesform="xml"]');
  // const pdf2Form = document.querySelector('[datasourcesform="pdf2"]');
  const prevBtn = document.querySelectorAll('[action-back]');
  // const allAddDatasourceForms = document.querySelectorAll('[datasourcesform]');

  // const urlFormStart = document.querySelector('[datasourcesform="website"]');
  // const productFormStart = document.querySelector('[datasourceform="products"]');

  buttonInitial.addEventListener(
    'click',
    function (event) {
      console.log('click');
      actionContainerInitial.style.display = 'none';

      actionsContainers.forEach(container => {
        container.style.display = 'none';
      });
      if (Wized.data.v.selectedAction === 'order-status') {
        document.querySelector(`[actions-container="order-status-1"]`).style.display = 'block';
      }
      document.querySelector(`[actions-container="${Wized.data.v.selectedAction}"]`).style.display = 'flex';
    },
    -false
  );

  // const scrapeMethods = document.querySelectorAll('[multi-select="scrape-method"]');
  // const crawlElement = document.querySelector('[w-el="datasource-form-websiteurl"]');
  // const sitemapElement = document.querySelector('[w-el="datasource-form-sitemap"]');

  // // const xmlFormContainer = document.querySelector('[datasourcesformstep2="xml"]');
  // // const csvForm = document.querySelector('[datasourcesformstep2="csv"]');
  // // const productOptions = document.querySelectorAll('[multi-select="product-options"]');
  // // const productOptionsContainer = document.querySelector('[w-el="productioptions-selectoxes"]');

  // // let productOption = 'csv';
  // // // product options multi-select boxes
  // // productOptions.forEach(el => {
  // //   el.addEventListener('click', function (event) {
  // //     const element = event.currentTarget;
  // //     productOption = element.getAttribute('data-value');
  // //     productOptions.forEach(box => {
  // //       box.classList.remove('selected');
  // //     });
  // //     element.classList.add('selected');
  // //     if (productOption === 'xml') {
  // //       xmlFormContainer.style.display = 'flex';
  // //       csvForm.style.display = 'none';
  // //     } else if (productOption === 'csv') {
  // //       csvForm.style.display = 'flex';
  // //       xmlFormContainer.style.display = 'none';
  // //     }
  // //   });
  // // });

  // // const xmlForm = document.querySelector('[w-el="form-create-datasource-xml"]');
  // const xmlFormBtn = document.querySelector('[w-el="xml-form-btn"]');
  // const xmlPrevBtn = document.querySelector('[prev-btn="xmlform"]');

  // let xmlStep = 1;
  // const xmlStep1 = document.querySelector('[xmlform-step="first"]');
  // const xmlStep2 = document.querySelector('[xmlform-step="second"]');

  // xmlFormBtn.addEventListener('click', function (event) {
  //   if (xmlStep === 1) {
  //     event.preventDefault();
  //     document.querySelectorAll('[xmlform="step1input"]').forEach(input => {
  //       if (input.value === '') {
  //         alert('Voer alle velden in om verder ge gaan');
  //         return;
  //       } else {
  //         input.classList.remove('alert');
  //         productOptionsContainer.style.display = 'none';
  //         xmlStep1.style.display = 'none';
  //         xmlStep2.style.display = 'flex';
  //         xmlStep++;
  //       }
  //     });
  //   }
  // });

  // xmlForm.addEventListener('submit', function (event) {
  //   event.preventDefault();
  //   xmlStep1.style.display = 'flex';
  //   xmlStep2.style.display = 'none';
  //   xmlStep = 1;
  //   productOption = 'csv';
  // });

  // xmlPrevBtn.addEventListener('click', function (event) {
  //   event.preventDefault();
  //   if (xmlStep === 2) {
  //     productOptionsContainer.style.display = 'block';
  //     xmlStep1.style.display = 'flex';
  //     xmlStep2.style.display = 'none';
  //     xmlStep--;
  //   } else {
  //     xmlForm.style.display = 'none';
  //     formWrapperInitial.style.display = 'flex';
  //     productOptionsContainer.style.display = 'block';
  //     xmlStep = 1;
  //   }
  // });

  // // crawl/sitemap multi-select boxes
  // scrapeMethods.forEach(el => {
  //   el.addEventListener('click', function (event) {
  //     const element = event.currentTarget;
  //     const scrapeMethodValue = element.getAttribute('data-value');
  //     scrapeMethods.forEach(box => {
  //       box.classList.remove('selected');
  //     });
  //     element.classList.add('selected');
  //     if (scrapeMethodValue === 'crawl') {
  //       sitemapElement.style.display = 'none';
  //       crawlElement.style.display = 'flex';
  //     } else if (scrapeMethodValue === 'sitemap') {
  //       crawlElement.style.display = 'none';
  //       sitemapElement.style.display = 'flex';
  //     }
  //   });
  // });

  // urlFormStart.addEventListener('submit', function (event) {
  //   event.preventDefault();
  //   urlFormStart.style.display = 'none';
  //   urlForm.style.display = 'flex';
  // });

  prevBtn.forEach(prevBtns => {
    prevBtns.addEventListener('click', function (event) {
      // check attrvalue
      if (event.currentTarget.getAttribute('action-back') === 'order-status') {
        document.querySelector(`[actions-container="order-status-1"]`).style.display = 'flex';
        document.querySelector(`[actions-container="order-status-2"]`).style.display = 'none';
        return;
      } else {
        actionsContainers.forEach(form => {
          form.style.display = 'none';
        });
        actionContainerInitial.style.display = 'flex';
      }
    });
  });

  // Global cleanup for actions logic
  window.resetActionFormState = function () {
    window.closeAllPopupModals();

    const actionsContainers = document.querySelectorAll('[actions-container]');
    actionsContainers.forEach(container => {
      container.style.display = 'none';
    });

    const actionContainerInitial = document.querySelector('[actions-container="initial"]');
    if (actionContainerInitial) actionContainerInitial.style.display = 'flex';

    const authInputsWrapper = document.querySelector('[w-el="create-template-form-inputs-wrapper"]');
    if (authInputsWrapper) {
      authInputsWrapper.querySelectorAll('[data-dynamic-auth="true"]').forEach(el => el.remove());
    }

    if (Wized && Wized.data && Wized.data.v) {
      Wized.data.v.selectedAction = '';
      Wized.data.v.selectedOrdersApiTemplate = '';
    }

    const addDataSourceselectBoxes = document.querySelectorAll('[multi-select="select-action"]');
    addDataSourceselectBoxes.forEach(box => box.classList.remove('selected'));
    const orderApiTemplateSelectBoxes = document.querySelectorAll('[multi-select="select-orderstatustemplate"]');
    orderApiTemplateSelectBoxes.forEach(box => box.classList.remove('selected'));

    if (addDataSourceselectBoxes.length > 0) {
      addDataSourceselectBoxes[0].classList.add('selected');
    }
  };

  window.resetActionFormInputs = function () {
    const container = document.querySelector('[w-el="popup-create-action"]');
    const allFormElements = container.querySelectorAll('form');
    allFormElements.forEach(form => {
      form.reset();
    });
  };
})();
