'use strict';

/* Animacje rozmowy. Wypowiedzi przelatują w dużych dymkach między stroną banku a telefonem Marty.
   - Pozytywna animacja: konsultantka banku po prośbie o kod wpisuje dane w pustym formularzu,
     tworzy kod i podaje go, a Marta sprawdza go w mObywatelu i dostaje potwierdzenie.
   - Brak nazwiska: jak wyżej, ale konsultantka zna tylko numer, więc telefon prosi o upewnienie się, do kogo dzwoni.
   - Błędne nazwisko: bank ma w kartotece inną osobę, więc telefon mówi, że bank szuka kogoś innego.
   - Animacja oszustwa: dzwoni oszust podający się za bank. Rozmowa jest taka sama, ale oszust nie ma
     dostępu do systemu banku, więc wymyśla kod, a mObywatel ostrzega Martę.
   - Man in the middle: oszust składa wniosek o konto na dane Marty i swój numer, a gdy bank oddzwania, rozmawia jednocześnie
     z bankiem i z Martą. Przekazuje Marcie prawdziwy kod z banku, ale kod wydano dla numeru oszusta.
   Wszystkie działają z każdej zakładki, na koniec włączają „Jeden klient” i przywracają stan początkowy.
   Korzysta z funkcji i zmiennych z app.js. */
(function () {
  const NUMER = '600 100 200', OSOBA = 'Marta Kowalska', NUMER_OSZUSTA = '512 300 400';
  const LOT_MS = 1400, POSTOJ_MS = 2400;   // dymki lecą szybko, a czyta się je, gdy stoją u odbiorcy
  const KONIEC_MS = 6000;                  // ostatni dymek i wynik w telefonie zostają na ekranie przed powrotem do stanu początkowego
  const NAZWY = { bank: 'Pozytywna animacja', beznazwiska: 'Brak nazwiska', zlenazwisko: 'Błędne nazwisko', oszust: 'Animacja oszustwa', mitm: 'Man in the middle' };
  const PODPISY = { bank: 'Konsultantka banku', oszust: 'Oszust', marta: 'Marta', wniosek: 'Oszust · wniosek o założenie konta' };
  const przyciski = [$('#animBtn'), $('#animBezBtn'), $('#animZleBtn'), $('#animOszustBtn'), $('#animMitmBtn')];
  let trwa = false, przerwano = false, stop = null, warstwa = null, aktywny = null, posrednik = null;

  // czekanie, które da się przerwać przyciskiem „Zatrzymaj animację”
  const czekaj = ms => new Promise((ok, nie) => {
    if (przerwano) return nie(new Error('stop'));
    const t = setTimeout(ok, ms);
    stop = () => { clearTimeout(t); nie(new Error('stop')); };
  });
  const pozycja = el => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, w: r.width, h: r.height }; };

  // miejsca rozmówców: dzwoniący nad formularzem banku, Marta obok telefonu,
  // a w man in the middle oszust nad swoim telefonem pośrodku i Marta na swoim telefonie
  function miejsca(szer, wys) {
    const f = pozycja($('.bform')), t = pozycja(telefonMarty());
    const dzwoniacy = { x: f.l + szer / 2, y: Math.max(f.t - wys / 2 - 18, pozycja($('.bcontent')).t + wys / 2) };
    const marta = { x: t.l - szer / 2 - 28, y: t.t + t.h * 0.3 };
    if (innerWidth <= 900) { marta.x = t.l + t.w / 2; marta.y = t.t - wys / 2 - 12; }
    if (!posrednik) return { dzwoniacy, marta };
    const p = pozycja(posrednik);
    return { dzwoniacy, marta: { x: t.l + t.w / 2, y: t.t + t.h * 0.3 }, posrednik: { x: p.l + p.w / 2, y: p.t - wys / 2 - 14 } };
  }
  const telefonMarty = () => document.querySelector('#telefon').closest('.phone-wrap');

  // telefon oszusta pośrodku: między stroną banku a telefonem Marty, a na wąskim ekranie nad telefonem Marty
  function telefonOszusta() {
    const b = pozycja($('.bankside')), t = pozycja(telefonMarty());
    const o = document.createElement('div');
    o.className = 'anim-mitm';
    o.innerHTML = `<svg class="i"><use href="#i-alert"/></svg><b>Oszust</b><small>rozmawia z bankiem i z Martą naraz</small><span class="nr">${NUMER_OSZUSTA}</span>`;
    const wide = innerWidth > 900;
    Object.assign(o.style, { left: (wide ? (b.l + b.w + t.l) / 2 : t.l + t.w / 2) + 'px', top: (wide ? t.t + t.h * 0.6 : t.t - 210) + 'px' });
    warstwa.append(o);
    return o;
  }

  // dymek: kto = 'bank', 'oszust' albo 'marta'; leci od mówiącego do słuchającego.
  // trasa = [skąd, dokąd] spośród miejsc; domyślnie między dzwoniącym a Martą.
  // Ostatni dymek rozmowy zostaje na ekranie aż do końca animacji.
  async function dymek(kto, tresc, trasa, ostatni) {
    if (przerwano) throw new Error('stop');
    const d = document.createElement('div');
    d.className = 'dymek ' + kto;
    d.innerHTML = `<small>${PODPISY[kto]}</small><span></span>`;
    d.querySelector('span').textContent = tresc;
    warstwa.append(d);
    const szer = d.offsetWidth, wys = d.offsetHeight;
    const m = miejsca(szer, wys);
    const [skad, dokad] = trasa || (kto === 'marta' ? ['marta', 'dzwoniacy'] : ['dzwoniacy', 'marta']);
    const a = m[skad], b = m[dokad];
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
    if (ostatni) return;
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

  // wariant: 'ok' (bank zna klienta), 'bez' (bank zna tylko numer, pole nazwiska zostaje puste),
  // 'zle' (bank ma w kartotece inną osobę, np. poprzedniego właściciela numeru)
  const INNA_OSOBA = 'Jan Nowak';
  const ROZMOWA = {
    ok: { start: 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie Pani karty.', nazwisko: OSOBA,
          koniec: 'Mam potwierdzenie w mObywatelu. O co chodzi z moją kartą?' },
    bez: { start: 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie zgłoszenia z tego numeru.', nazwisko: '',
           koniec: 'mObywatel potwierdza, że to bank, ale nie zna Pani mojego nazwiska. Do kogo Pani dzwoni?' },
    zle: { start: 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie karty.', nazwisko: INNA_OSOBA,
           koniec: 'mObywatel mówi, że szuka Pani innej osoby. To pomyłka, ten numer należy teraz do mnie.' }
  };
  async function rozmowaBanku(wariant) {
    const r = ROZMOWA[wariant];
    await dymek('bank', r.start);
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.');
    await wpisz($('#num'), NUMER);
    if (r.nazwisko) await wpisz($('#kto'), r.nazwisko);
    $('#mkBtn').classList.add('anim-klik'); await czekaj(500); $('#mkBtn').classList.remove('anim-klik');
    $('#bankForm').requestSubmit();
    await czekaj(1200);
    const kodTxt = $('#codeTxt').textContent;
    await dymek('bank', `Oczywiście. Kod to ${kodTxt}.`);
    await sprawdzWTelefonie(kodTxt);
    await dymek('marta', r.koniec, null, true);
  }

  async function rozmowaOszusta() {
    await dymek('oszust', 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie Pani karty.');
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.');
    await czekaj(1200);   // oszust nie ma dostępu do systemu banku, więc wymyśla kod
    const wymyslony = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
    const kodTxt = wymyslony.slice(0, 3) + ' ' + wymyslony.slice(3);
    await dymek('oszust', `Oczywiście. Kod to ${kodTxt}.`);
    await sprawdzWTelefonie(kodTxt);
    await dymek('marta', 'mObywatel ostrzega, że to może być oszustwo. Kończę rozmowę.', null, true);
  }

  // oszust składa wniosek o konto na dane Marty i swój numer, a gdy bank oddzwania, dzwoni do Marty jako bank,
  // podaje się za bank w innej sprawie, bo Marta nie składała wniosku, i przekazuje jej kod z banku
  async function rozmowaPosrednika() {
    const doBanku = ['posrednik', 'dzwoniacy'], doMarty = ['posrednik', 'marta'];
    await dymek('wniosek', `Imię i nazwisko: ${OSOBA}\nTelefon: ${NUMER_OSZUSTA}`, doBanku);
    await dymek('bank', 'Dzień dobry, Anna Wiśniewska z banku. Chciałabym się z Panią skontaktować w związku z założeniem konta.', ['dzwoniacy', 'posrednik']);
    await dymek('oszust', 'Dzień dobry, Anna Wiśniewska z banku. Widzimy podejrzaną transakcję na Pani koncie. Muszę potwierdzić Pani tożsamość.', doMarty);
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.', ['marta', 'posrednik']);
    await dymek('oszust', 'Poproszę kod do zweryfikowania banku.', doBanku);
    await wpisz($('#num'), NUMER_OSZUSTA);   // bank tworzy kod dla numeru, z którym rozmawia, czyli numeru oszusta
    await wpisz($('#kto'), OSOBA);
    $('#mkBtn').classList.add('anim-klik'); await czekaj(500); $('#mkBtn').classList.remove('anim-klik');
    $('#bankForm').requestSubmit();
    await czekaj(1200);
    const kodTxt = $('#codeTxt').textContent;
    await dymek('bank', `Oczywiście. Kod to ${kodTxt}.`, ['dzwoniacy', 'posrednik']);
    await dymek('oszust', `Oczywiście. Kod to ${kodTxt}.`, doMarty);
    await sprawdzWTelefonie(kodTxt);
    await dymek('marta', 'mObywatel ostrzega, że bank wydał ten kod dla innego numeru niż mój. Kończę rozmowę.', ['marta', 'posrednik'], true);
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
    przycisk.querySelector('.txt').textContent = 'Zatrzymaj';   // krótki napis, żeby pasek nie zwijał przycisków do ikon
    przycisk.classList.add('gra'); przycisk.title = 'Zatrzymaj animację'; przycisk.setAttribute('aria-label', 'Zatrzymaj animację');
    przyciski.forEach(p => { if (p !== przycisk) p.disabled = true; });
    dopasujPasek();
    typeof zamknijPopy === 'function' && zamknijPopy();
    ustawScenariusz(1);
    document.body.classList.add('animacja');
    document.body.classList.toggle('mitm', rodzaj === 'mitm');
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
    if (rodzaj === 'mitm') posrednik = telefonOszusta();
    try {
      await czekaj(500);
      if (rodzaj === 'oszust') await rozmowaOszusta();
      else if (rodzaj === 'mitm') await rozmowaPosrednika();
      else await rozmowaBanku({ beznazwiska: 'bez', zlenazwisko: 'zle' }[rodzaj] || 'ok');
      await czekaj(KONIEC_MS);
    } catch (e) { /* zatrzymano */ }
    koniec();
  }

  // po animacji: „Jeden klient”, ekran główny telefonu i formularz banku jak po wejściu na stronę
  function koniec() {
    stop = null;
    warstwa && warstwa.remove(); warstwa = null; posrednik = null;
    document.body.classList.remove('animacja', 'mitm');
    document.querySelectorAll('.anim-pisze,.anim-klik').forEach(e => e.classList.remove('anim-pisze', 'anim-klik'));
    przyciski.forEach(p => {
      const n = NAZWY[p.dataset.rodzaj];
      p.disabled = false; p.classList.remove('gra');
      p.querySelector('.txt').textContent = n; p.title = n; p.setAttribute('aria-label', n);
    });
    dopasujPasek();
    trwa = false; aktywny = null;
    ustawTryb('in');
    ustawScenariusz(1);
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'zamknij' });
    wyczyscBank(false);
  }

  przyciski.forEach(p => p.addEventListener('click', () => start(p.dataset.rodzaj, p)));
})();
