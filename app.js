'use strict';

/* Strona pokazu: system banku po lewej, telefon po prawej.
   Telefon to aplikacja skopiowana z prototypu mobywatel.ai (folder telefon/) z dodatkiem weryfikacji.
   Strona banku i telefon rozmawiają przez postMessage. */

/* ---------- dane pokazu (fikcyjne) ---------- */
const BANK = { nazwa: 'Bank', pracownik: 'Anna Wiśniewska', rola: 'Konsultantka', infolinia: '800 100 100' };
const WAZNOSC_S = 120;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const ico = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
const hhmm = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const cyfry = s => String(s).replace(/\D/g, '');
const norm = s => String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
const fmtNum = d => d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
const fmtKod = d => d.slice(0, 3) + ' ' + d.slice(3);

let tryb = 'in';          // 'in' = użytkownik zalogowany, 'out' = aplikacja przed zalogowaniem
let kod = null;           // { kod, numer, imie, wygasa, uzyty }
let licznik = null;

/* ---------- komunikat na dole ekranu ---------- */
let toastT;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ---------- okienka z informacjami ---------- */
function zamknijPopy(oprocz) {
  $$('.pop.on').forEach(p => { if (p.id !== oprocz) p.classList.remove('on'); });
  $$('[data-pop]').forEach(b => { if (b.dataset.pop !== oprocz) b.setAttribute('aria-expanded', 'false'); });
}
$$('[data-pop]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  const p = document.getElementById(b.dataset.pop), otwarty = p.classList.contains('on');
  zamknijPopy(b.dataset.pop);
  if (otwarty) { p.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); return; }
  p.classList.add('on'); b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect(), w = p.offsetWidth;
  p.style.left = Math.max(16, Math.min(r.left - 8, innerWidth - w - 16)) + scrollX + 'px';
  p.style.top = r.bottom + 10 + scrollY + 'px';
}));
document.addEventListener('click', e => { if (!e.target.closest('.pop')) zamknijPopy(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') zamknijPopy(); });

$('#animBtn').addEventListener('click', () => toast('Animacja tego scenariusza będzie w kolejnej wersji.'));

/* ---------- strona banku ---------- */
function statusBanku(rodzaj, ikona, tekst) {
  const s = $('#bankStatus');
  s.className = 'status' + (rodzaj ? ' ' + rodzaj : '');
  s.innerHTML = ico(ikona) + '<span></span>';
  s.querySelector('span').textContent = tekst;
}
function odliczaj() {
  clearInterval(licznik);
  const tik = () => {
    if (!kod || kod.uzyty) return clearInterval(licznik);
    const zostalo = Math.max(0, Math.round((kod.wygasa - Date.now()) / 1000));
    $('#timer').textContent = 'Ważny jeszcze ' + Math.floor(zostalo / 60) + ':' + String(zostalo % 60).padStart(2, '0');
    if (!zostalo) {
      clearInterval(licznik);
      $('#codebox').classList.add('expired');
      $('#timer').textContent = 'Kod wygasł';
      statusBanku('warn', 'alert', 'Kod wygasł, zanim klient go wpisał. Utwórz nowy, jeśli rozmowa trwa.');
    }
  };
  tik(); licznik = setInterval(tik, 1000);
}
const numerZPola = () => { let d = cyfry($('#num').value); if (d.length === 11 && d.startsWith('48')) d = d.slice(2); return d; };
$('#num').addEventListener('input', () => { $('#numErr').textContent = ''; });
$('#num').addEventListener('blur', () => { const d = numerZPola(); if (d.length === 9) $('#num').value = fmtNum(d); });
$('#bankForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = numerZPola();
  if (d.length !== 9) { $('#numErr').textContent = 'Wpisz 9-cyfrowy numer telefonu.'; $('#num').focus(); return; }
  $('#num').value = fmtNum(d);
  const nowy = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  kod = { kod: nowy, numer: d, imie: $('#kto').value.trim(), wygasa: Date.now() + WAZNOSC_S * 1000, uzyty: false };
  $('#codeArea').hidden = false;
  $('#codebox').classList.remove('expired');
  $('#codeTxt').textContent = fmtKod(nowy);
  $('#mkBtn').textContent = 'Utwórz nowy kod';
  statusBanku('', 'phone', 'Podaj kod klientowi w rozmowie. Czekam, aż wpisze go w mObywatelu.');
  odliczaj();
});

/* sprawdzenie kodu: w prawdziwym wdrożeniu robi to serwer mObywatela */
function sprawdz(wpisany, numerTelefonu, imieWlasciciela) {
  if (!kod || kod.uzyty || wpisany !== kod.kod || Date.now() > kod.wygasa) return { stan: 'zly' };
  kod.uzyty = true; clearInterval(licznik);
  const godz = hhmm();
  $('#timer').textContent = 'Wykorzystany o ' + godz;
  if (kod.numer !== numerTelefonu) {
    statusBanku('bad', 'alert', 'Kod wpisano na innym numerze niż ten, pod który dzwonisz. Możliwe oszustwo, sprawa trafi do weryfikacji.');
    return { stan: 'numer', godz };
  }
  if (kod.imie && norm(kod.imie) !== norm(imieWlasciciela)) {
    statusBanku('warn', 'alert', 'Numer zgadza się, ale należy do innej osoby niż Twój klient. Zakończ rozmowę bez podawania szczegółów.');
    return { stan: 'osoba', godz, bank: BANK };
  }
  statusBanku('ok', 'check', 'Klient potwierdził rozmowę o ' + godz + '. Nie otrzymujesz żadnych jego danych.');
  return { stan: 'ok', godz, bank: BANK };
}

/* ---------- telefon w ramce ---------- */
const ramka = $('#telefon');
const doTelefonu = msg => ramka.contentWindow && ramka.contentWindow.postMessage(Object.assign({ zrodlo: 'bank' }, msg), '*');

function ustawTryb(t, zTelefonu) {
  tryb = t;
  $$('.opt').forEach(o => { const on = o.dataset.mode === t; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
  if (!zTelefonu) doTelefonu({ typ: 'wf-tryb', tryb: t });
}
$$('.opt').forEach(o => o.addEventListener('click', () => ustawTryb(o.dataset.mode)));

function pokazOsobe(m) {
  $('#telLabel').textContent = `Telefon ${m.dopelniacz} · ${m.numerTxt}`;
  $('#whoAv').textContent = (m.imie[0] + m.nazwisko[0]).toUpperCase();
  $('#whoName').textContent = m.imie + ' ' + m.nazwisko;
  $('#whoIn').textContent = (m.plec === 'K' ? 'zalogowana' : 'zalogowany') + ' w mObywatelu';
  $('#whoOut').textContent = 'aplikacja wcześniej połączona z telefonem ' + m.dopelniacz;
  const c = $('#whoCard');
  c.textContent = '';
  c.append('Numer ', Object.assign(document.createElement('b'), { textContent: m.numerTxt }),
    ` jest potwierdzony SMS-em w profilu ${m.dopelniacz}. Sprawdzenie działa w obu stanach, bo serwer zna numer przypisany do tego telefonu.`);
}

window.addEventListener('message', e => {
  if (e.source !== ramka.contentWindow) return;
  const m = e.data || {};
  if (m.zrodlo !== 'telefon') return;
  if (m.typ === 'wf-gotowy') { pokazOsobe(m); doTelefonu({ typ: 'wf-tryb', tryb }); }
  if (m.typ === 'wf-zalogowano') ustawTryb('in', true);
  if (m.typ === 'wf-sprawdz') doTelefonu({ typ: 'wf-wynik', id: m.id, wynik: sprawdz(m.kod, m.numer, m.imie) });
});

/* ---------- zegar i skalowanie telefonu ---------- */
function zegar() { $('#clock').textContent = hhmm(); }
zegar(); setInterval(zegar, 15000);

function dopasuj() {
  const top = $('.topbar').offsetHeight;
  const vw = document.documentElement.clientWidth || innerWidth;
  const s = vw <= 760
    ? Math.min(1, (Math.min(vw, 452) - 32 - 22) / 390)
    : Math.min(1, Math.max(0.55, (innerHeight - top - 110) / 844));
  const wrap = $('#phoneWrap');
  wrap.style.width = 390 * s + 'px'; wrap.style.height = 844 * s + 'px';
  $('#phone').style.transform = `scale(${s})`;
}
addEventListener('resize', dopasuj);
if ('ResizeObserver' in window) new ResizeObserver(dopasuj).observe(document.documentElement);

ustawTryb('in', true);
dopasuj();
