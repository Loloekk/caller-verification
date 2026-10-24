'use strict';

/* Animacja rozmowy: konsultantka banku dzwoni do Marty, a ich wypowiedzi przelatują w dużych dymkach
   między stroną banku a telefonem. Po prośbie o kod konsultantka wpisuje dane w pustym formularzu,
   tworzy kod i podaje go, a Marta sprawdza go w mObywatelu.
   Działa z każdej zakładki, na koniec włącza „Jeden klient” i przywraca stan początkowy.
   Korzysta z funkcji i zmiennych z app.js. */
(function () {
  const NUMER = '600 100 200', OSOBA = 'Marta Kowalska';
  const LOT_MS = 1400, POSTOJ_MS = 2400;   // dymki lecą szybko, a czyta się je, gdy stoją u odbiorcy
  let trwa = false, przerwano = false, stop = null, warstwa = null;
  const btn = $('#animBtn'), btnTxt = btn.querySelector('.txt');

  // czekanie, które da się przerwać przyciskiem „Zatrzymaj animację”
  const czekaj = ms => new Promise((ok, nie) => {
    if (przerwano) return nie(new Error('stop'));
    const t = setTimeout(ok, ms);
    stop = () => { clearTimeout(t); nie(new Error('stop')); };
  });
  const pozycja = el => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, w: r.width, h: r.height }; };

  // miejsca rozmówców: konsultantka nad formularzem banku, Marta obok telefonu
  function miejsca(szer, wys) {
    const f = pozycja($('.bform')), t = pozycja(document.querySelector('#telefon').closest('.phone-wrap'));
    const bank = { x: f.l + szer / 2, y: Math.max(f.t - wys / 2 - 18, pozycja($('.bcontent')).t + wys / 2) };
    const marta = { x: t.l - szer / 2 - 28, y: t.t + t.h * 0.3 };
    if (innerWidth <= 900) { marta.x = t.l + t.w / 2; marta.y = t.t - wys / 2 - 12; }
    return { bank, marta };
  }

  // dymek: kto = 'bank' albo 'marta'; leci od mówiącego do słuchającego
  async function dymek(kto, tresc) {
    const d = document.createElement('div');
    d.className = 'dymek ' + kto;
    d.innerHTML = `<small>${kto === 'bank' ? 'Konsultantka banku' : 'Marta'}</small><span></span>`;
    d.querySelector('span').textContent = tresc;
    if (przerwano) throw new Error('stop');
    warstwa.append(d);
    const szer = d.offsetWidth, wys = d.offsetHeight;
    const m = miejsca(szer, wys);
    const a = kto === 'bank' ? m.bank : m.marta, b = kto === 'bank' ? m.marta : m.bank;
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

  async function rozmowa() {
    await dymek('bank', 'Dzień dobry, Anna Wiśniewska z banku. Dzwonię w sprawie Pani karty.');
    await dymek('marta', 'Poproszę kod do zweryfikowania banku.');

    await wpisz($('#num'), NUMER);
    await wpisz($('#kto'), OSOBA);
    $('#mkBtn').classList.add('anim-klik'); await czekaj(500); $('#mkBtn').classList.remove('anim-klik');
    $('#bankForm').requestSubmit();
    await czekaj(1200);
    const kodTxt = $('#codeTxt').textContent;

    await dymek('bank', `Oczywiście. Kod to ${kodTxt}.`);

    doTelefonu(ramka, { typ: 'wf-demo', krok: 'otworz' });
    await czekaj(1000);
    for (const c of kodTxt.replace(/\s/g, '')) { doTelefonu(ramka, { typ: 'wf-demo', krok: 'cyfra', c }); await czekaj(350); }
    await czekaj(600);
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'wyslij' });
    await czekaj(2600);

    await dymek('marta', 'Mam potwierdzenie w mObywatelu. O co chodzi z moją kartą?');
    await czekaj(800);
  }

  async function start() {
    if (trwa) { przerwano = true; stop && stop(); return; }
    trwa = true; przerwano = false;
    btnTxt.textContent = 'Zatrzymaj animację';
    typeof zamknijPopy === 'function' && zamknijPopy();
    ustawScenariusz(1);
    document.body.classList.add('animacja');
    doTelefonu(ramka, { typ: 'wf-tryb', tryb: 'in' });
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'zamknij' });
    // na początku strona banku ma puste pola
    clearInterval(licznik); kod = null; delete proby[NUMER.replace(/\s/g, '')];
    $('#num').value = ''; $('#kto').value = ''; $('#numErr').textContent = '';
    $('#codeArea').hidden = true; $('#mkBtn').textContent = 'Utwórz kod';
    statusBanku('', 'info', 'Kod działa raz i tylko dla numeru, pod który dzwonisz.');
    window.scrollTo({ top: 0 });
    dopasuj();
    warstwa = document.createElement('div');
    warstwa.className = 'anim-warstwa';
    warstwa.style.height = document.documentElement.scrollHeight + 'px';
    document.body.append(warstwa);
    try { await czekaj(500); await rozmowa(); } catch (e) { /* zatrzymano */ }
    koniec();
  }

  // po animacji: „Jeden klient”, pusty wynik w telefonie i formularz banku jak po wejściu na stronę
  function koniec() {
    stop = null;
    warstwa && warstwa.remove(); warstwa = null;
    document.body.classList.remove('animacja');
    document.querySelectorAll('.anim-pisze,.anim-klik').forEach(e => e.classList.remove('anim-pisze', 'anim-klik'));
    btnTxt.textContent = 'Pokaż animację';
    trwa = false;
    ustawTryb('in');
    ustawScenariusz(1);
    doTelefonu(ramka, { typ: 'wf-demo', krok: 'zamknij' });
    clearInterval(licznik); kod = null; delete proby[NUMER.replace(/\s/g, '')];
    $('#num').value = NUMER; $('#kto').value = OSOBA; $('#numErr').textContent = '';
    $('#codeArea').hidden = true; $('#codebox').classList.remove('expired');
    $('#mkBtn').textContent = 'Utwórz kod';
    statusBanku('', 'info', 'Kod działa raz i tylko dla numeru, pod który dzwonisz.');
  }

  btn.addEventListener('click', start);
})();
