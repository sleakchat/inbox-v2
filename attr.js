(function () {
  const cookieName = 'slk_attribution';
  const existing = Cookies.get(cookieName);
  let data = existing ? JSON.parse(existing) : {};

  const sanitizeUrl = url => {
    return url.replace(/^https?:\/\/(www\.)?/, '');
  };

  const params = {};
  window.location.search
    .slice(1)
    .split('&')
    .forEach(p => {
      const [k, v] = p.split('=');
      if (k && v) params[k] = decodeURIComponent(v);
    });

  const currentUrl = sanitizeUrl(window.location.href);
  const ts = new Date().toISOString();

  if (!data.landing_page) {
    data.landing_page = {
      url: currentUrl,
      params,
      ts
    };
  }

  if (Object.keys(params).length > 0) {
    data.param_pages = data.param_pages || [];
    const last = data.param_pages[data.param_pages.length - 1];

    const isDuplicate = last && last.url === currentUrl && JSON.stringify(last.params) === JSON.stringify(params);

    const isLandingPage = data.landing_page.url === currentUrl;

    if (!isDuplicate && !isLandingPage) {
      data.param_pages.push({
        url: currentUrl,
        params,
        ts
      });
    }
  }

  Cookies.set(cookieName, JSON.stringify(data), {
    expires: 90,
    path: '/',
    sameSite: 'Lax',
    domain: window.location.hostname.includes('sleak.chat') ? '.sleak.chat' : undefined,
    secure: true
  });

  //   console.log(JSON.stringify(data, null, 2));
})();

// old logic
// // session_source cookie handling
// function getCookieValue(name) {
//     var nameEQ = name + "=";
//     var ca = document.cookie.split(';');
//     for(var i = 0; i < ca.length; i++) {
//         var c = ca[i].trim(); // Trim leading spaces
//         if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length); // return value if present
//     }
//     return null; // return if not present
// }

// function setRootDomainCookie(name, value, days) {
//     if (getCookieValue(name) === null) {  // check if present
//         var expires = "";
//         if (days) {
//             var date = new Date();
//             date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
//             expires = "; expires=" + date.toUTCString();
//         }
//         document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.sleak.chat; Secure; SameSite=Lax";
//     } else {
//         return
//     }
// }

// setRootDomainCookie('slk_landing_page_url', window.location.href, 7);
