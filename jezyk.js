'use strict';

/* Przełącznik PL/EN. Tłumaczy mechanizm z prototypu (telefon/i18n.js) ze słownikiem i18n/en.js:
   podmienia teksty na stronie, także te dopisywane później przez app.js i anim.js.
   Telefony w ramkach dostają ten sam język przez ?lang= w adresie. */
(function () {
  const en = window.LANG === 'en';
  const btn = document.getElementById('jezykBtn');
  btn.textContent = en ? 'PL' : 'EN';
  btn.title = en ? 'Wersja polska' : 'English version';
  btn.setAttribute('aria-label', btn.title);
  btn.onclick = () => {
    const u = new URL(location.href);
    if (en) u.searchParams.delete('lang'); else u.searchParams.set('lang', 'en');
    location.href = u.href;
  };
  if (!en) return;
  document.querySelectorAll('iframe.tel-frame').forEach(f => {
    const a = f.hasAttribute('src') ? 'src' : 'data-src';
    f.setAttribute(a, f.getAttribute(a) + '&lang=en');
  });
  document.title = T(document.title);
  const opis = document.querySelector('meta[name="description"]');
  if (opis) opis.content = T(opis.content);
  window.__i18nStart();
})();
