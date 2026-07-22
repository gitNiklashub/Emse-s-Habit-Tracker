// Tests: wählbares Maskottchen (Esel/Otter) — Umschalten, Persistenz, Texte, SVG
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL ' + n); } else console.log('ok   ' + n); };

const mkDom = (seed) => {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  win.HTMLCanvasElement.prototype.getContext = () => null;
  win.confirm = () => true;
  if (seed) win.localStorage.setItem('emse-habits-v1', JSON.stringify(seed));
  win.eval(js);
  return win;
};
const state = (w) => JSON.parse(w.localStorage.getItem('emse-habits-v1'));

// ---- 1) Default ist der Esel (Empty-State zeigt ihn schon) ----
let w = mkDom(null);
let doc = w.document;
check('default: donkey-svg (kein otter)', doc.querySelector('.donkey') !== null &&
  !doc.querySelector('.donkey').classList.contains('otter'));

// Habit anlegen, um über den Namens-Skip hinaus zu kommen und den Hero konsistent zu halten
doc.getElementById('btn-add').click();
doc.getElementById('inp-name').value = 'Lesen';
doc.getElementById('btn-save-habit').click();
doc.getElementById('btn-username-skip').click();

// ---- 2) Umschalten in den Einstellungen ----
doc.getElementById('btn-settings').click();
check('picker: esel aktiv markiert', doc.querySelector('.mascot-choice[data-mascot="donkey"]').classList.contains('active'));
check('picker: otter-vorschau ist otter-svg', doc.getElementById('mascot-preview-otter').querySelector('.otter') !== null);
doc.querySelector('.mascot-choice[data-mascot="otter"]').click();
check('nach klick: otter aktiv markiert', doc.querySelector('.mascot-choice[data-mascot="otter"]').classList.contains('active'));
check('state persistiert otter', state(w).ui.mascot === 'otter');
doc.getElementById('btn-close-settings').click();

// ---- 3) Hero zeigt jetzt den Otter ----
check('hero: otter-svg (klasse otter)', doc.querySelector('.hero .donkey.otter') !== null);
check('streichel-aria-label sagt otter', doc.querySelector('.donkey-tap').getAttribute('aria-label') === 'Otter streicheln');

// ---- 4) Otter-Sprüche im Toast (Streicheln → Herzaugen-Spruch aus dem Otter-Pool) ----
doc.querySelector('.donkey-tap').click();
const toastText = doc.querySelector('.bubble-toast').textContent;
const otterPets = ['kitzelt', 'Kraulen', 'bitte', 'Lieblingsmensch', 'Muscheln'];
check('streichel-spruch aus otter-pool', otterPets.some(k => toastText.includes(k)));
check('kein "Möhren" im otter-spruch', !toastText.includes('Möhren'));

// ---- 5) Zurück zu Esel: alles kippt zurück ----
doc.getElementById('btn-settings').click();
doc.querySelector('.mascot-choice[data-mascot="donkey"]').click();
doc.getElementById('btn-close-settings').click();
check('zurück: donkey ohne otter-klasse', !doc.querySelector('.hero .donkey').classList.contains('otter'));
check('zurück: state auf donkey', state(w).ui.mascot === 'donkey');
check('aria-label wieder Esel', doc.querySelector('.donkey-tap').getAttribute('aria-label') === 'Esel streicheln');

// ---- 6) Otter-Wochenbrief: eigener Wortschatz, Signatur, Titel ----
const otterSeed = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-06-01' }],
  logs: { a1: { '2026-07-06':1,'2026-07-07':1,'2026-07-08':1 } },
  pauses: {}, ui: { seenVersion: 99, mascot: 'otter', userName: 'Test' }, moods: {},
};
const wo = mkDom(otterSeed);
wo.document.querySelector('.tab[data-view="stats"]').click();
wo.document.querySelector('.period-nav .p-prev').click();
wo.document.querySelector('.letter-btn').click(); // Nachlesen (fromEnvelope=false) -> "Schließen"
const letterText = wo.document.getElementById('letter-content').textContent;
check('otter-brief: titel "Post vom Otter"', letterText.includes('Post vom Otter'));
check('otter-brief: signatur "Dein Otter"', letterText.includes('Dein Otter'));
check('otter-brief: kein "Trab"/"Möhre" im text', !letterText.includes('Trab') && !letterText.includes('Möhre'));
check('nachlese-button sagt Schließen', wo.document.getElementById('btn-close-letter').textContent === 'Schließen');
wo.document.getElementById('btn-close-letter').click();
// Umschlag antippen (fromEnvelope=true) -> "Danke, Otter!"
const wEnv = wo.document.querySelector('.envelope-card');
if (wEnv) {
  wEnv.click();
  check('otter umschlag-button: "Danke, Otter!"',
    wo.document.getElementById('btn-close-letter').textContent.includes('Danke, Otter'));
} else {
  check('otter umschlag-button: "Danke, Otter!" (kein umschlag zu dieser uhrzeit, übersprungen)', true);
}

// ---- 7) Mood-Reaktion otter-spezifisch (über die Statistik gesetzt, uhrzeit-unabhängig) ----
const moodOtterSeed = { ...otterSeed, logs: { a1: {} } };
const wm = mkDom(moodOtterSeed);
wm.document.querySelector('.tab[data-view="stats"]').click();
const moodStatWm = [...wm.document.querySelectorAll('.stat-card')].find(c => c.textContent.includes('Stimmung'));
const todayCellWm = [...moodStatWm.querySelectorAll('.day-cell')].find(c => c.classList.contains('today'));
todayCellWm.click();
wm.document.querySelectorAll('#mood-sheet-row button')[4].click();
const savedMoodOtter = state(wm).moods[Object.keys(state(wm).moods)[0]];
check('otter mood im state gespeichert (5)', savedMoodOtter === 5);
wm.document.getElementById('btn-close-mood').click();
wm.document.querySelector('.tab[data-view="today"]').click();
check('otter mood-badge im hero', wm.document.querySelector('.hero-mood')?.textContent === '🥰');

console.log(fails === 0 ? '\nALLE MASCOT-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
