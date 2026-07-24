// Jahres-Heatmap: startet bei der tatsächlichen ersten Aktivität statt immer
// am 1. Januar — verhindert lange Leerspalten vor den ersten Daten.
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

const yearGrid = (doc, habitName) => {
  const card = [...doc.querySelectorAll('.stat-card')].find(c => c.textContent.includes(habitName));
  return card ? card.querySelectorAll('.yh-cell') : null;
};

// ---- 1) Habit erst im Juli angelegt -> Heatmap startet bei Juli, nicht Januar ----
const seed1 = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-07-01' }],
  logs: { a1: { '2026-07-01': 1, '2026-07-02': 1 } },
  pauses: {}, ui: { seenVersion: 99 }, moods: {}, entries: {},
};
let w = mkDom(2026, 6, 15, 12, seed1);
let doc = w.document;
doc.querySelector('.tab[data-view="stats"]').click();
doc.querySelector('.seg button[data-mode="year"]').click();
let cells = yearGrid(doc, 'Lesen');
check('heatmap vorhanden', cells !== null);
check('deutlich weniger als 196 zellen (kein leerraum jan-jun)', cells.length < 200);
// Void-Zellen VOR dem ersten Datenpunkt zählen (Wochen-Randtage der Startwoche) —
// Void-Zellen NACH "heute" (Rest des Jahres, noch nicht erreicht) sind separat normal.
const firstDataIdx = [...cells].findIndex(c => !c.classList.contains('void'));
const voidBeforeStart = [...cells].slice(0, firstDataIdx).filter(c => c.classList.contains('void')).length;
check('kaum void-zellen vor dem start (<=6, wochen-randtage)', voidBeforeStart <= 6);
check('erste nicht-void-zelle ist der 1. juli', cells[firstDataIdx].title.includes('1. Juli'));

// ---- 2) Rückwirkend nachgetragener Wert vor dem Anlegedatum -> Grid startet dort ----
const seed2 = {
  version: 1,
  habits: [{ id: 'b1', name: 'Eiweiß', emoji: '🍗', color: 'blue', kind: 'number', unit: 'g', goal: 100,
    direction: 'min', freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-07-10' }],
  logs: { b1: { '2026-05-15': 80, '2026-07-10': 120 } },
  pauses: {}, ui: { seenVersion: 99 }, moods: {}, entries: {},
};
w = mkDom(2026, 6, 15, 12, seed2);
doc = w.document;
doc.querySelector('.tab[data-view="stats"]').click();
doc.querySelector('.seg button[data-mode="year"]').click();
cells = yearGrid(doc, 'Eiweiß');
check('rückwirkender eintrag: erste zelle ist 15. mai (nicht 10. juli)',
  [...cells].find(c => !c.classList.contains('void')).title.includes('15. Mai'));
check('mai-zelle eingefärbt', [...cells].find(c => c.title && c.title.includes('15. Mai')).style.background !== '');

// ---- 3) Verzicht-Habit: bestehende quitStart-Logik bleibt unverändert (Regression) ----
const seed3 = {
  version: 1,
  habits: [{ id: 'c1', name: 'Rauchen', emoji: '🚬', color: 'peach', kind: 'quit', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, createdAt: '2026-07-10' }],
  logs: { c1: { '2026-07-05': 1 } }, // Rückfall vor dem Anlegedatum nachgetragen
  pauses: {}, ui: { seenVersion: 99 }, moods: {}, entries: {},
};
w = mkDom(2026, 6, 15, 12, seed3);
doc = w.document;
doc.querySelector('.tab[data-view="stats"]').click();
doc.querySelector('.seg button[data-mode="year"]').click();
cells = yearGrid(doc, 'Rauchen');
check('quit: heatmap startet weiterhin bei quitStart (5. juli)',
  [...cells].find(c => !c.classList.contains('void')).title.includes('5. Juli'));

// ---- 4) Habit ohne jegliche Logs -> nur Anlegedatum als Start, kein Crash ----
const seed4 = {
  version: 1,
  habits: [{ id: 'd1', name: 'Yoga', emoji: '🧘', color: 'green', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-07-12' }],
  logs: {}, pauses: {}, ui: { seenVersion: 99 }, moods: {}, entries: {},
};
w = mkDom(2026, 6, 15, 12, seed4);
doc = w.document;
doc.querySelector('.tab[data-view="stats"]').click();
doc.querySelector('.seg button[data-mode="year"]').click();
cells = yearGrid(doc, 'Yoga');
check('kein crash ohne logs', cells !== null && cells.length > 0);
check('start bleibt anlegedatum ohne rückwirkende einträge',
  [...cells].find(c => !c.classList.contains('void')).title.includes('12. Juli'));

// ---- 5) Vorjahres-Aktivität darf den Grid-Start nicht vor den 1. Januar des betrachteten Jahres ziehen ----
const seed5 = {
  version: 1,
  habits: [{ id: 'e1', name: 'Laufen', emoji: '🏃', color: 'yellow', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2025-11-01' }],
  logs: { e1: { '2025-11-05': 1, '2026-01-10': 1 } },
  pauses: {}, ui: { seenVersion: 99 }, moods: {}, entries: {},
};
w = mkDom(2026, 6, 15, 12, seed5);
doc = w.document;
doc.querySelector('.tab[data-view="stats"]').click();
doc.querySelector('.seg button[data-mode="year"]').click(); // aktuelles Jahr 2026
cells = yearGrid(doc, 'Laufen');
const firstNonVoid = [...cells].find(c => !c.classList.contains('void'));
check('2026-ansicht beginnt nicht vor dem 1.1.2026 trotz 2025er-aktivität',
  firstNonVoid.title.includes('Jan') || firstNonVoid.title.includes('1.'));

console.log(fails === 0 ? '\nALLE YEAR-HEATMAP-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
