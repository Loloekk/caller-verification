/* Lokalny zamiennik serwera prototypu (serwer/server.py) dla wersji statycznej.
   Przechwytuje zapytania do /api/... i odpowiada w przeglądarce, bez sieci:
   - /api/health: brak modelu, więc aplikacja działa w trybie skryptowym,
   - /api/znak/*: wymiana danych przez znak mObywatela; stan wspólny dla kart tej samej przeglądarki (localStorage),
   - /api/agent, /api/stt, /api/tts: wymagają modelu, w tej pracy niewspierane,
   - pozostałe (diagnostyka, rejestr brakujących tłumaczeń): puste odpowiedzi.
   Logika znaku przeniesiona 1:1 z serwer/server.py (zn_clean, zn_kto, beat, przekaz). */
(function () {
  const KLUCZ = 'mobZnakLokalnie';
  const teraz = () => Date.now() / 1000;
  const czytaj = () => { try { return JSON.parse(localStorage.getItem(KLUCZ)) || { devs: {}, skrz: {}, skan: {} }; } catch (e) { return { devs: {}, skrz: {}, skan: {} }; } };
  const zapisz = s => { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch (e) {} };
  const odp = (obj, status = 200) => Promise.resolve(new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));

  function czysc(s) {
    const t = teraz();
    for (const d of Object.keys(s.devs)) if (t - s.devs[d].t > 120) { delete s.devs[d]; delete s.skrz[d]; delete s.skan[d]; }
  }
  function kto(s, tok, dev) {
    const t = teraz();
    for (const [d, v] of Object.entries(s.devs)) {
      if (d === dev || t - v.t > 15) continue;
      if (v.token === tok || (v.prev === tok && t - v.tt < 60)) return [d, v];
    }
    return [null, null];
  }

  const API = {
    'GET /api/health': () => odp({ agent: false, stt: false, tts: false, provider: 'brak', model: 'brak', lokalnie: true }),
    'GET /api/znak/kto': url => {
      const tok = parseInt(url.searchParams.get('t'), 10), dev = url.searchParams.get('dev') || '';
      const s = czytaj(); const [d, v] = kto(s, isNaN(tok) ? -1 : tok, dev);
      if (!d) return odp({ dev: null });
      s.skan[d] = teraz(); zapisz(s);
      return odp({ dev: d, kind: v.kind, kto: v.kto, cel: v.cel, zakres: v.zakres });
    },
    'POST /api/znak/beat': (url, req) => {
      const dev = String(req.dev || '').slice(0, 40), tok = parseInt(req.token, 10) & 0xffff;
      if (isNaN(parseInt(req.token, 10))) return odp({ error: 'zly zeton' }, 400);
      const s = czytaj(); czysc(s); const t = teraz();
      const zajety = Object.entries(s.devs).some(([d, w]) => d !== dev && t - w.t < 15 && (tok === w.token || tok === w.prev));
      let v = s.devs[dev];
      if (!v) v = s.devs[dev] = { token: tok, prev: null, tt: t };
      else if (v.token !== tok) { v.prev = v.token; v.token = tok; v.tt = t; }
      Object.assign(v, { t, kind: req.kind === 'web' ? 'web' : 'telefon', kto: String(req.kto || '').slice(0, 80), cel: req.cel, zakres: req.zakres });
      const otrz = s.skrz[dev] || []; delete s.skrz[dev];
      const skanuje = t - (s.skan[dev] || 0) < 45;
      if (otrz.length) delete s.skan[dev];
      zapisz(s);
      return odp({ otrzymane: otrz, skanuje: skanuje && !otrz.length, zmien: zajety });
    },
    'POST /api/znak/przekaz': (url, req) => {
      const s = czytaj();
      if (!s.devs[req.to]) return odp({ ok: false, error: 'odbiorca niedostepny' }, 404);
      (s.skrz[req.to] = s.skrz[req.to] || []).push({ ok: !!req.ok, dane: req.ok ? req.dane : null, t: teraz() });
      zapisz(s);
      return odp({ ok: true });
    },
    'POST /api/i18n/brak': () => odp({ t: {} }),
    'POST /api/glos': () => odp({ ok: true }),
    'POST /api/agent': () => odp({ error: 'model AI nie jest wspierany w tej pracy' }, 503),
    'POST /api/stt': () => odp({ error: 'rozpoznawanie mowy wymaga modelu, niewspierane w tej pracy' }, 503),
    'POST /api/tts': () => odp({ error: 'synteza mowy wymaga modelu, niewspierana w tej pracy' }, 503)
  };

  const oryginalnyFetch = window.fetch.bind(window);
  window.fetch = function (wejscie, opcje = {}) {
    const adres = typeof wejscie === 'string' ? wejscie : wejscie && wejscie.url;
    if (typeof adres === 'string' && adres.startsWith('/api/')) {
      const url = new URL(adres, 'http://lokalnie');
      const metoda = (opcje.method || 'GET').toUpperCase();
      const obsluga = API[metoda + ' ' + url.pathname];
      if (!obsluga) return odp({ error: 'brak takiej funkcji w wersji statycznej' }, 404);
      let cialo = {};
      try { cialo = opcje.body && typeof opcje.body === 'string' ? JSON.parse(opcje.body) : {}; } catch (e) {}
      return obsluga(url, cialo);
    }
    return oryginalnyFetch(wejscie, opcje);
  };
})();
