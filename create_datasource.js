let dataSourceSelectValue = 'pdf';
const addDataSourceselectBoxes = document.querySelectorAll('[multi-select="select-datasource"]');

function handleClick(event) {
  addDataSourceselectBoxes.forEach(box => {
    box.classList.remove('selected');
  });

  const element = event.currentTarget;
  element.classList.add('selected');

  dataSourceSelectValue = element.getAttribute('data-value');
}

addDataSourceselectBoxes.forEach(box => box.addEventListener('click', handleClick));

// data-sources dynamic visibility form elements
const container = document.querySelector('[w-el="popup-create-datasource"]');
const formWrapperInitial = document.querySelector("[w-el='create-datasource-initial']");
const buttonInitial = document.querySelector("[w-el='create-datasource-btn']");

const pdfForm = document.querySelector('[datasourcesform="pdf"]');
const urlForm = document.querySelector('[datasourcesform="url"]');
// const apiForm = document.querySelector('[datasourcesform="api"]');
const csvForm = document.querySelector('[datasourcesform="csv"]');
const xmlForm = document.querySelector('[datasourcesform="xml"]');
const pdf2Form = document.querySelector('[datasourcesform="pdf2"]');
const prevBtn = document.querySelectorAll('[datasource-back]');
const allAddDatasourceForms = document.querySelectorAll('[datasourcesform]');

const urlFormStart = document.querySelector('[datasourcesform="website"]');
const productFormStart = document.querySelector('[datasourceform="products"]');

buttonInitial.addEventListener(
  'click',
  function (event) {
    formWrapperInitial.style.display = 'none';

    if (dataSourceSelectValue === 'csv') {
      csvForm.style.display = 'flex';
    } else if (dataSourceSelectValue === 'pdf') {
      pdfForm.style.display = 'flex';
    } else if (dataSourceSelectValue === 'url') {
      urlFormStart.style.display = 'flex';
    } else if (dataSourceSelectValue === 'xml') {
      xmlForm.style.display = 'flex';
    } else if (dataSourceSelectValue === 'pdf2') {
      pdf2Form.style.display = 'flex';
    }
  },
  -false
);

const scrapeMethods = document.querySelectorAll('[multi-select="scrape-method"]');
const crawlElement = document.querySelector('[w-el="datasource-form-websiteurl"]');
const sitemapElement = document.querySelector('[w-el="datasource-form-sitemap"]');

// const xmlFormContainer = document.querySelector('[datasourcesformstep2="xml"]');
// const csvForm = document.querySelector('[datasourcesformstep2="csv"]');
// const productOptions = document.querySelectorAll('[multi-select="product-options"]');
// const productOptionsContainer = document.querySelector('[w-el="productioptions-selectoxes"]');

// let productOption = 'csv';
// // product options multi-select boxesChannable bestand
// productOptions.forEach(el => {
//   el.addEventListener('click', function (event) {
//     const element = event.currentTarget;
//     productOption = element.getAttribute('data-value');
//     productOptions.forEach(box => {
//       box.classList.remove('selected');
//     });
//     element.classList.add('selected');
//     if (productOption === 'xml') {
//       xmlFormContainer.style.display = 'flex';
//       csvForm.style.display = 'none';
//     } else if (productOption === 'csv') {
//       csvForm.style.display = 'flex';
//       xmlFormContainer.style.display = 'none';
//     }
//   });
// });

// const xmlForm = document.querySelector('[w-el="form-create-datasource-xml"]');
const xmlFormBtn = document.querySelector('[w-el="xml-form-btn"]');
const xmlPrevBtn = document.querySelector('[prev-btn="xmlform"]');

let xmlStep = 1;
const xmlStep1 = document.querySelector('[xmlform-step="first"]');
const xmlStep2 = document.querySelector('[xmlform-step="second"]');

xmlFormBtn.addEventListener('click', function (event) {
  if (xmlStep === 1) {
    event.preventDefault();
    document.querySelectorAll('[xmlform="step1input"]').forEach(input => {
      if (input.value === '') {
        alert('Voer alle velden in om verder ge gaan');
        return;
      } else {
        input.classList.remove('alert');
        // productOptionsContainer.style.display = 'none';
        xmlStep1.style.display = 'none';
        xmlStep2.style.display = 'flex';
        xmlStep++;
      }
    });
  }
});

xmlForm.addEventListener('submit', function (event) {
  event.preventDefault();
  xmlStep1.style.display = 'flex';
  xmlStep2.style.display = 'none';
  xmlStep = 1;
  productOption = 'csv';
});

xmlPrevBtn.addEventListener('click', function (event) {
  event.preventDefault();
  if (xmlStep === 2) {
    // productOptionsContainer.style.display = 'block';
    xmlStep1.style.display = 'flex';
    xmlStep2.style.display = 'none';
    xmlStep--;
  } else {
    xmlForm.style.display = 'none';
    formWrapperInitial.style.display = 'flex';
    // productOptionsContainer.style.display = 'block';
    xmlStep = 1;
  }
});

// crawl/sitemap multi-select boxes
scrapeMethods.forEach(el => {
  el.addEventListener('click', function (event) {
    const element = event.currentTarget;
    const scrapeMethodValue = element.getAttribute('data-value');
    scrapeMethods.forEach(box => {
      box.classList.remove('selected');
    });
    element.classList.add('selected');
    if (scrapeMethodValue === 'crawl') {
      sitemapElement.style.display = 'none';
      crawlElement.style.display = 'flex';
    } else if (scrapeMethodValue === 'sitemap') {
      crawlElement.style.display = 'none';
      sitemapElement.style.display = 'flex';
    }
  });
});

urlFormStart.addEventListener('submit', function (event) {
  event.preventDefault();
  urlFormStart.style.display = 'none';
  urlForm.style.display = 'flex';
});

prevBtn.forEach(prevBtns => {
  prevBtns.addEventListener('click', function (event) {
    allAddDatasourceForms.forEach(form => {
      form.style.display = 'none';
    });
    // productFormStart.style.display = 'none';
    formWrapperInitial.style.display = 'flex';
  });
});

// cleanup
window.resetDatasourceFormState = function () {
  window.closeAllPopupModals();

  container.style.display = 'none';
  // reset create forms
  const allForms = document.querySelectorAll('.datasources-formblock');
  // const formWrapperInitial = document.getElementById("create-datasource-form");
  const formWrapperInitial = document.querySelector("[w-el='create-datasource-initial']");
  allForms.forEach(form => {
    form.style.display = 'none';
  });
  formWrapperInitial.style.display = 'flex';

  allAddDatasourceForms.forEach(form => (form.style.display = 'none'));
  formWrapperInitial.style.display = 'flex';
  // productFormStart.style.display = 'none';
  urlFormStart.style.display = 'none';
  xmlStep1.style.display = 'flex';
  xmlStep2.style.display = 'none';
  // xmlFormContainer.style.display = 'none';
  csvForm.style.display = 'none';
  // productOptionsContainer.style.display = 'block';

  addDataSourceselectBoxes.forEach(option => option.classList.remove('selected'));
  scrapeMethods.forEach(method => method.classList.remove('selected'));
  // productOptions.forEach(option => option.classList.remove('selected'));

  xmlStep = 1;
  productOption = 'csv';
  dataSourceSelectValue = 'pdf';

  // add default selected class to start state checkboxes
  addDataSourceselectBoxes[0].classList.add('selected');
  scrapeMethods[0].classList.add('selected');
  // productOptions[0].classList.add('selected');
};

window.resetDatasourceFormInputs = function () {
  const allFormElements = container.querySelectorAll('form');
  allFormElements.forEach(form => {
    form.reset();
  });
};
