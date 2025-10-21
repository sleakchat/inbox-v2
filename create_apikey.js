// (async function createApiKey() {
//   const v = Wized.data.v;
//   const r = Wized.data.r;
//   const i = Wized.data.i;

//   let supabase;
//   const { version, client } = await Wized.requests.getClient('supabase');
//   supabase = client;

//   await Wized.requests.waitFor('get_user_data');
//   const currentOrganization = r.get_user_data.data[0].organizations.find(o => o.id == v.activeOrganization);

//   const localStorageKey = window.location.href.includes('dashboard.sleak.chat') ? 'sb-sygpwnluwwetrkmwilea-auth-token' : 'sb-xvqjuiyrmzkhsfosfozs-auth-token';
//   const accessToken = JSON.parse(localStorage.getItem(localStorageKey)).access_token;

//   const { form, success, openButton, input, copyTrigger, apiKeyText } = {
//     form: document.querySelector('[w-el="form-create-apikey"]'),
//     success: document.querySelector('[w-el="form-create-apikey-success"]'),
//     openButton: document.querySelector('[w-el="btn-create-apikey"]'),
//     input: document.querySelector('[w-el="api-key-name"]'),
//     copyTrigger: document.querySelector('[w-el="api-key-field"]'),
//     apiKeyText: document.querySelector('[w-el="api-key-value"]')
//   };

//   openButton.addEventListener('click', () => {
//     form.reset();
//     success.style.display = 'none';
//     form.style.display = 'block';
//     window.showPopupModal('create-apikey');
//   });

//   let apiKey;

//   form.addEventListener('submit', async e => {
//     e.preventDefault();
//     e.stopPropagation();

//     const { data, error } = await supabase.rpc('create_api_key', {
//       organizationid: currentOrganization.id,
//       name_param: input.value,
//       jwt: accessToken
//     });

//     if (error) {
//       console.error('Error creating API key:', error);
//     } else {
//       apiKey = data.api_key;
//       v.apikeys.push({
//         name: data.name,
//         created_at: new Date().toISOString(),
//         id: data.id
//       });

//       apiKeyText.textContent = apiKey;
//       success.style.display = 'block';
//       form.style.display = 'none';
//     }
//   });

//   copyTrigger.addEventListener('click', () => {
//     navigator.clipboard.writeText(apiKey);
//     window.showToastNotification(`Api key gekopieerd naar klembord`, 'success');
//   });
// })();
