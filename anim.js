'use strict';

/* Animacje rozmowy. Wypowiedzi przelatują w dużych dymkach między stroną banku a telefonem Marty.
   - Pozytywna animacja: konsultantka banku po prośbie o kod wpisuje dane w pustym formularzu,
     tworzy kod i podaje go, a Marta sprawdza go w mObywatelu i dostaje potwierdzenie.
   - Animacja oszustwa: dzwoni oszust podający się za bank. Rozmowa jest taka sama, ale oszust nie ma
     dostępu do systemu banku, więc wymyśla kod, a mObywatel ostrzega Martę.
   Obie działają z każdej zakładki, na koniec włączają „Jeden klient” i przywracają stan początkowy.
   Korzysta z funkcji i zmiennych z app.js. */
(function () {
  const NUMER = '600 100 200', OSOBA = 'Marta Kowalska';
  const LOT_MS = 1400, POSTOJ_MS = 2400;   // dymki lecą szybko, a czyta się je, gdy stoją u odbiorcy
  const NAZWY = { bank: 'Pozytywna animacja', oszust: 'Animacja oszustwa' };
  const PODPISY = { bank: 'Konsultantka banku', oszust: 'Oszust', marta: 'Marta' };
  const przyciski = [$('#animBtn'), $('#animOszustBtn')];
  let trwa = false, przerwano = false, stop = null, warstwa = null, aktywny = null;

  // czekanie, które da się przerwać przyciskiem „Zatrzymaj animację”
  const czekaj = ms => new Promise((ok, nie) => {
    if (przerwano) return nie(new Error('stop'));
    const t = setTimeout(ok, ms);
    stop = () => { clearTimeout(t); nie(new Error('stop')); };
  });
  const pozycja = el => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, w: r.width, h: r.height }; };

  // miejsca rozmówców: dzwoniący nad formularzem banku, Marta obok telefonu
  function miejsca(szer, wys) {
    const f = pozycja($('.bform')), t = pozycja(document.querySelector('#telefon').closest('.phone-wrap'));
    const dzwoniacy = { x: f.l + szer / 2, y: Math.max(f.t - wys / 2 - 18, pozycja($('.bcontent')).t + wys / 2) };
    const marta = { x: t.l - szer / 2 - 28, y: t.t + t.h * 0.3 };
    if (innerWidth <= 900) { marta.x = t.l + t.w / 2; marta.y = t.t - wys / 2 - 12; }
    return { dzwoniacy, marta };
  }

  // dymek: kto = 'bank', 'oszust' albo 'marta'; leci od mówiącego do słuchającego
  async function dymek(kto, tresc) {
    if (przerwano) throw new Error('stop');
    const d = document.createElement('div');
    d.className = 'dymek ' + kto;
    d.innerHTML = `<small>${PODPISY[kto]}</small><span></span>`;
    d.querySelector('span').textContent = tresc;
    warstwa.append(d);
    const szer = d.offsetWidth, wys = d.offsetHeight;
    const m = miejsca(szer, wys);
    const a = kto === 'marta' ? m.marta : m.dzwoniacy, b = kto === 'marta' ? m.dzwoniacy : m.marta;
    const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 90;
    const ustaw = u => {
      const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x;
      const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
      d.style.left = x + 'px'; d.style.top = y + 'px';
    };
    ustaw(0);
    requestAnimationFrame(() => d.classList.add('on'));
    const t0 = performance.now();
    await new Promise((ok, nie) => {
      let raf, koniec = false;
      const dokoncz = () => { if (koniec) return; koniec = true; cancelAnimationFrame(raf); clearTimeout(zapas); ustaw(1); ok(); };
      const klatka = teraz => {
        const u = Math.min(1, (teraz - t0) / LOT_MS), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        ustaw(e);
        if (u < 1) raf = requestAnimationFrame(klatka); else dokoncz();
      };
      raf = requestAnimationFrame(klatka);
      const zapas = setTimeout(dokoncz, LOT_MS + 300);   // gdy przeglądarka wstrzyma klatki, dymek i tak doleci
      stop = () => { koniec = true; cancelAnimationFrame(raf); clearTimeout(zapas); nie(new Error('stop')); };
    });
    await czekaj(POSTOJ_MS);
    d.classList.remove('on');
    setTimeout(() => d.remove(), 500);
    await czekaj(400);
  }

  // konsultantka wpisuje dane w pustym formularzu
  async function wpisz(pole, tekst) {
    pole.classList.add('anim-pisze'); pole.value = '';
    for (const z of tekst) { pole.value += z; await czekaj(z === ' ' ? 60 : 120); }
    await czekaj(300);
    pole.classList.remove('anim-pisze');
  }

  // Marta stuka w „Sprawdź, kto dzwoni”, wpisuje kod i wysyła go do sprawdzenia
  async function sprawdzWTelefonie(kodTxt) {
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'otworz' });   // telefon pokazuje stuknięcie w „Sprawdź, kto dzwoni”
    await czekaj(1500);
    for (const c of kodTxt.replace(/\s/g, '')) { doTelefonu(ramka, { typ: 'wf-demo', krok: 'cyfra', c }); await czekaj(350); }
    await czekaj(600);
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'wyslij' });
    await czekaj(2600);
  }

  async function rozmowaBanku() {
    await dymek('bank', 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie Pani karty.');
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.');
    await wpisz($('#num'), NUMER);
    await wpisz($('#kto'), OSOBA);
    $('#mkBtn').classList.add('anim-klik'); await czekaj(500); $('#mkBtn').classList.remove('anim-klik');
    $('#bankForm').requestSubmit();
    await czekaj(1200);
    const kodTxt = $('#codeTxt').textContent;
    await dymek('bank', `Oczywiście. Kod to ${kodTxt}.`);
    await sprawdzWTelefonie(kodTxt);
    await dymek('marta', 'Mam potwierdzenie w mObywatelu. O co chodzi z moją kartą?');
    await czekaj(800);
  }

  async function rozmowaOszusta() {
    await dymek('oszust', 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie Pani karty.');
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.');
    await czekaj(1200);   // oszust nie ma dostępu do systemu banku, więc wymyśla kod
    const wymyslony = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
    const kodTxt = wymyslony.slice(0, 3) + ' ' + wymyslony.slice(3);
    await dymek('oszust', `Oczywiście. Kod to ${kodTxt}.`);
    await sprawdzWTelefonie(kodTxt);
    await dymek('marta', 'mObywatel ostrzega, że to może być oszustwo. Kończę rozmowę.');
    await czekaj(800);
  }

  function wyczyscBank(pustePola) {
    clearInterval(licznik); kod = null; delete proby[NUMER.replace(/\s/g, '')];
    $('#num').value = pustePola ? '' : NUMER; $('#kto').value = pustePola ? '' : OSOBA; $('#numErr').textContent = '';
    $('#codeArea').hidden = true; $('#codebox').classList.remove('expired');
    $('#mkBtn').textContent = 'Utwórz kod';
    statusBanku('', 'info', 'Kod działa raz i tylko dla numeru, pod który dzwonisz.');
  }

  async function start(rodzaj, przycisk) {
    if (trwa) { if (przycisk === aktywny) { przerwano = true; stop && stop(); } return; }
    trwa = true; przerwano = false; aktywny = przycisk;
    przycisk.querySelector('.txt').textContent = 'Zatrzymaj animację';
    przyciski.forEach(p => { if (p !== przycisk) p.disabled = true; });
    typeof zamknijPopy === 'function' && zamknijPopy();
    ustawScenariusz(1);
    document.body.classList.add('animacja');
    doTelefonu(ramka, { typ: 'wf-tryb', tryb: 'in' });
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'zamknij' });
    wyczyscBank(true);   // na początku strona banku ma puste pola
    window.scrollTo({ top: 0 });
    dopasuj();
    warstwa = document.createElement('div');
    warstwa.className = 'anim-warstwa';
    warstwa.style.height = document.documentElement.scrollHeight + 'px';
    document.body.append(warstwa);
    if (rodzaj === 'oszust') {
      const b = pozycja($('.bankside'));
      const o = document.createElement('div');
      o.className = 'anim-oszust';
      Object.assign(o.style, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px' });
      o.innerHTML = '<b>Oszust</b><small>podaje się za konsultantkę banku</small>';
      warstwa.append(o);
    }
    try { await czekaj(500); await (rodzaj === 'oszust' ? rozmowaOszusta() : rozmowaBanku()); } catch (e) { /* zatrzymano */ }
    koniec();
  }

  // po animacji: „Jeden klient”, ekran główny telefonu i formularz banku jak po wejściu na stronę
  function koniec() {
    stop = null;
    warstwa && warstwa.remove(); warstwa = null;
    document.body.classList.remove('animacja');
    document.querySelectorAll('.anim-pisze,.anim-klik').forEach(e => e.classList.remove('anim-pisze', 'anim-klik'));
    przyciski.forEach(p => { p.disabled = false; p.querySelector('.txt').textContent = NAZWY[p.dataset.rodzaj]; });
    trwa = false; aktywny = null;
    ustawTryb('in');
    ustawScenariusz(1);
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'zamknij' });
    wyczyscBank(false);
  }

  przyciski.forEach(p => p.addEventListener('click', () => start(p.dataset.rodzaj, p)));
})();
