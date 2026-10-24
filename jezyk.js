'use strict';

/* Wersja angielska. Język wybiera telefon/i18n.js: ?lang=pl albo ?lang=en w adresie, a bez tego język przeglądarki
   (polska przeglądarka: po polsku, każda inna: po angielsku). Tłumaczy słownik i18n/en.js, także teksty
   dopisywane później przez app.js i anim.js. Telefony w ramkach dostają ten sam język przez ?lang= w adresie. */
(function () {
  if (window.LANG !== 'en') return;
  document.querySelectorAll('iframe.tel-frame').forEach(f => {
    const a = f.hasAttribute('src') ? 'src' : 'data-src';
    f.setAttribute(a, f.getAttribute(a) + '&lang=en');
  });
  document.title = T(document.title);
  const opis = document.querySelector('meta[name="description"]');
  if (opis) opis.content = T(opis.content);
  window.__i18nStart();
})();
