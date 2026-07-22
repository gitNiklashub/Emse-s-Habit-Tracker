// Konsolidierte Kern-Suite: deckt die Hauptflows aller Features ab.
// Deterministisch durch Date-Mock (Standard: Mittwoch 15.07.2026, 12:00).
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL ' + n); } else console.log('ok   ' + n); };

const mkDom = (y, mo, d, h, seed) => {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  win.HTMLCanvasElement.prototype.getContext = () => null;
  win.confirm = () => true;
  const Real = win.Date;
  win.Date = class extends Real {
    constructor(...a) { if (a.length === 0) super(y, mo, d, h, 30, 0); else super(...a); }
    static now() { return new Real(y, mo, d, h, 30, 0).getTime(); }
  };
  if (seed) win.localStorage.setItem('emse-habits-v1', JSON.stringify(seed));
  win.eval(js);
  return win;
};

// ================= Hauptszenario: Mi 15.07.2026, 12:00 =================
const w = mkDom(2026, 6, 15, 12, null);
const doc = w.document;
const state = () => JSON.parse(w.localStorage.getItem('emse-habits-v1'));
const cards = () => [...doc.querySelectorAll('.habit-card')];
const cardOf = (n) => cards().find(c => c.textContent.includes(n));
const statOf = (n) => [...doc.querySelectorAll('.stat-card')].find(c => c.textContent.includes(n));
const addHabit = (name, setup) => {
  doc.getElementById('btn-add').click();
  doc.getElementById('inp-name').value = name;
  if (setup) setup();
  doc.getElementById('btn-save-habit').click();
};

// --- Leerzustand & Anlegen aller vier Arten ---
check('empty state mit esel', doc.querySelector('.empty-state .donkey') !== null);
addHabit('Lesen');
check('check-habit angelegt', cardOf('Lesen') !== null);
addHabit('Eiweiß', () => {
  doc.querySelector('#kind-seg button[data-kind="number"]').click();
  doc.querySelector('#direction-seg button[data-dir="min"]').click();
  doc.getElementById('inp-unit').value = 'g';
  doc.getElementById('inp-goal').value = '100';
});
addHabit('Gym', () => {
  doc.querySelector('#freq-seg button[data-freq="weekly"]').click();
  doc.getElementById('target-minus').click();
  doc.getElementById('target-minus').click(); // Ziel 1
});
addHabit('Geweint', () => doc.querySelector('#kind-seg button[data-kind="event"]').click());
addHabit('Rauchen', () => doc.querySelector('#kind-seg button[data-kind="quit"]').click());
check('alle 5 karten da', cards().length === 5);

// --- Namens-Karte (frischer Nutzer) ---
check('namens-karte da', doc.querySelector('.name-card') !== null);
doc.getElementById('inp-username').value = 'Emse';
doc.getElementById('btn-username-save').click();
check('name gespeichert', state().ui.userName === 'Emse');

// --- Ringe & Legende ---
check('3 ringe (6 kreise)', doc.querySelectorAll('.hero .rings circle').length === 6);
check('heute-legende 0/1', doc.querySelector('.hero-count').textContent === '0/1');
check('ziele-legende 0/1', doc.querySelector('.hero-goals').textContent === '0/1');
check('wochen-legende 0%', doc.querySelector('.hero-week').textContent === '0%');
check('juli: keine saison-accessoires', doc.querySelector('.hero .donkey [data-acc]') === null);

// --- Abhaken, Zahlen loggen, Ereignis, Konfetti ---
cardOf('Lesen').querySelector('.check-btn').click();
check('heute-ring 1/1', doc.querySelector('.hero-count').textContent === '1/1');
check('noch kein konfetti (eiweiß+gym offen)', !w.__confetti);
cardOf('Eiweiß').querySelector('.value-btn').click();
doc.getElementById('inp-log').value = '120';
doc.getElementById('btn-log-add').click();
check('ziele-ring 1/1', doc.querySelector('.hero-goals').textContent === '1/1');
cardOf('Gym').querySelector('.check-btn').click();
check('konfetti bei allem erledigt', w.__confetti === 1);
check('event zählt nicht im ring', doc.querySelector('.hero-count').textContent === '1/1');
// Ereignis-Habits loggen beim Anlegen bereits sich selbst (Anlegen = "ist gerade passiert")
check('ereignis beim anlegen bereits gezählt', cardOf('Geweint').textContent.includes('1×'));
cardOf('Geweint').querySelector('.value-btn').click();
doc.getElementById('event-plus').click();
doc.getElementById('btn-close-event').click();
check('ereignis nach +1 auf 2×', cardOf('Geweint').textContent.includes('2×'));
check('verzicht: 1 tag ohne', cardOf('Rauchen').querySelector('.sub').textContent.includes('1'));

// --- Ruhiges Rendern ---
check('nach interaktion nicht fresh', !doc.getElementById('main').classList.contains('fresh'));

// --- Mood via Statistik (12 Uhr → keine karte auf heute) ---
check('keine mood-karte mittags', doc.querySelector('.mood-card') === null);
doc.querySelector('.tab[data-view="stats"]').click();
check('streak-card in stats', doc.querySelector('.streak-card') !== null);
const moodStat = statOf('Stimmung');
[...moodStat.querySelectorAll('.day-cell')].find(c => c.classList.contains('today')).click();
doc.querySelectorAll('#mood-sheet-row button')[4].click();
doc.getElementById('btn-close-mood').click();
doc.querySelector('.tab[data-view="today"]').click();
check('mood-badge im hero', doc.querySelector('.hero-mood')?.textContent === '🥰');

// --- Statistik: Woche/Monat/Jahr + Chart ---
doc.querySelector('.tab[data-view="stats"]').click();
const eiStat = statOf('Eiweiß');
const gl = eiStat.querySelector('.goal-line');
check('ziellinie mit headroom', parseFloat(gl.style.bottom) > 70 && parseFloat(gl.style.bottom) < 90);
doc.querySelector('.seg button[data-mode="month"]').click();
check('monatsgrid da', statOf('Lesen').querySelector('.month-grid') !== null);
doc.querySelector('.seg button[data-mode="year"]').click();
check('jahres-heatmap (>=365 zellen)', statOf('Lesen').querySelectorAll('.yh-cell').length >= 365);
check('rekord im jahres-header', statOf('Lesen').querySelector('.val').textContent.includes('Rekord'));

// --- Verzicht rückwirkend (Vorwoche, vor Anlegedatum) ---
doc.querySelector('.seg button[data-mode="week"]').click();
doc.querySelector('.period-nav .p-prev').click();
const quitStat = statOf('Rauchen');
check('quit-karte in vorwoche sichtbar', quitStat !== null);
quitStat.querySelectorAll('.day-cell')[0].click(); // Rückfall Mo Vorwoche
check('serie ab rückfall (9 tage)', statOf('Rauchen').querySelector('.val').textContent.includes('9'));

// --- Wochenbrief nachlesen + Anrede ---
const lb = doc.querySelector('.letter-btn');
check('brief-button in vorwoche', lb !== null);
lb.click();
check('brief mit persönlicher anrede', doc.getElementById('letter-content').textContent.includes('Hallo Emse'));
check('motivation vorhanden', doc.querySelector('#letter-content .letter-motivation') !== null);
doc.getElementById('btn-close-letter').click();

// --- Album ---
doc.getElementById('btn-settings').click();
doc.getElementById('btn-album').click();
check('album offen', !doc.getElementById('sheet-album').classList.contains('hidden'));
check('album: rekord-serie da', doc.querySelector('.album-record') !== null);
doc.getElementById('btn-close-album').click();
doc.getElementById('btn-close-settings').click();

// --- Pause & Sortieren (Einstellungen offen) ---
doc.getElementById('btn-pause-today').click();
check('pause gesetzt', state().pauses['2026-07-15'] === 1);
doc.getElementById('btn-pause-today').click();
check('sortier-liste da', doc.querySelectorAll('.sort-row').length === 5);

// Album-Test mit eigenständigem Fixture: abgeschlossene Vorwoche garantiert Briefliste
const albumSeed = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2026-06-01' }],
  logs: { a1: { '2026-07-06': 1, '2026-07-07': 1, '2026-07-08': 1 } },
  pauses: {}, ui: { seenVersion: 99 }, moods: {},
};
const wAlbum = mkDom(2026, 6, 15, 12, albumSeed);
wAlbum.document.getElementById('btn-settings').click();
wAlbum.document.getElementById('btn-album').click();
check('album: briefliste bei abgeschlossener woche', wAlbum.document.querySelector('.album-letter-row') !== null);

// ================= Zeit-Szenarien =================
// Eigenständiges Basis-Fixture (frisch, ohne den ganzen Zustand des Hauptszenarios)
const decSeed = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2026-11-01' }],
  logs: {}, pauses: {}, ui: { seenVersion: 99 }, moods: {},
};
// Nacht: Schlafmütze
const wn = mkDom(2026, 6, 15, 23, decSeed);
check('nachts: schlafmütze', wn.document.querySelector('.hero .donkey [data-acc="nightcap"]') !== null);
// Dezember: Weihnachtsmütze
const wd = mkDom(2026, 11, 15, 12, decSeed);
check('dezember: weihnachtsmütze', wd.document.querySelector('.hero .donkey [data-acc="santa"]') !== null);
// Goldene Woche: Vorwoche perfekt → Montag Umschlag golden + Krönchen
const goldSeed = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-11-01' }],
  logs: { a1: { '2026-12-07':1,'2026-12-08':1,'2026-12-09':1,'2026-12-10':1,'2026-12-11':1,'2026-12-12':1,'2026-12-13':1 } },
  pauses: {}, ui: { seenVersion: 99, userName: 'Emse', nameAsked: true }, moods: {},
};
const wg = mkDom(2026, 11, 14, 12, goldSeed);
const env = wg.document.querySelector('.envelope-card');
check('goldener umschlag', env !== null && env.classList.contains('golden'));
check('krönchen der folgewoche', wg.document.querySelector('.hero .donkey [data-acc="crown"]') !== null);
env.click();
check('goldener brief', wg.document.getElementById('letter-content').classList.contains('letter-golden'));

console.log(fails === 0 ? '\nALLE SMOKE-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
