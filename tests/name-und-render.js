// Tests: Namens-Abfrage + persönliche Briefe, ruhiges Rendern (Animations-Gating)
const { JSDOM } = require('jsdom');
const fs = require('fs');
const ROOT = "/Users/I769839/Documents/Github Repos/Emse's Habbit Tracker";
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const js = fs.readFileSync(ROOT + '/app.js', 'utf8');
let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL ' + n); } else console.log('ok   ' + n); };

const mkDom = (seed) => {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.HTMLCanvasElement.prototype.getContext = () => null;
  if (seed) dom.window.localStorage.setItem('emse-habits-v1', JSON.stringify(seed));
  dom.window.eval(js);
  return dom.window;
};
const state = (w) => JSON.parse(w.localStorage.getItem('emse-habits-v1'));

// ---- 1) Namens-Onboarding ----
let w = mkDom(null);
let doc = w.document;
doc.getElementById('btn-add').click();
doc.getElementById('inp-name').value = 'Lesen';
doc.getElementById('btn-save-habit').click();
check('namens-karte erscheint', doc.querySelector('.name-card') !== null);
doc.getElementById('inp-username').value = 'Johanna';
doc.getElementById('btn-username-save').click();
check('name gespeichert', state(w).ui.userName === 'Johanna');
check('karte nach speichern weg', doc.querySelector('.name-card') === null);
// Einstellungen zeigen den Namen
doc.getElementById('btn-settings').click();
check('settings-feld zeigt namen', doc.getElementById('inp-settings-name').value === 'Johanna');

// ---- 2) Skip-Flow: „Lieber nicht" → nie wieder fragen, Brief sagt „du" ----
w = mkDom(null);
doc = w.document;
doc.getElementById('btn-add').click();
doc.getElementById('inp-name').value = 'Lesen';
doc.getElementById('btn-save-habit').click();
doc.getElementById('btn-username-skip').click();
check('skip: karte weg', doc.querySelector('.name-card') === null);
check('skip: nameAsked persistiert', state(w).ui.nameAsked === true && !state(w).ui.userName);
// Brief-Anrede über Statistik-Nachlese prüfen geht nur mit Vorwochen-Daten — Anrede direkt via Vorwoche
// (Habit gerade erst angelegt → keine abgeschlossene Woche; stattdessen: Name über Settings setzen und wieder leeren)
doc.getElementById('btn-settings').click();
doc.getElementById('inp-settings-name').value = 'Emse';
doc.getElementById('inp-settings-name').dispatchEvent(new w.Event('change', { bubbles: true }));
check('settings: name nachträglich gesetzt', state(w).ui.userName === 'Emse');
doc.getElementById('inp-settings-name').value = '';
doc.getElementById('inp-settings-name').dispatchEvent(new w.Event('change', { bubbles: true }));
check('settings: name wieder entfernt', !state(w).ui.userName);

// ---- 3) Ruhiges Rendern: fresh nur beim View-Wechsel ----
w = mkDom(null);
doc = w.document;
doc.getElementById('btn-add').click();
doc.getElementById('inp-name').value = 'Lesen';
doc.getElementById('btn-save-habit').click();
// Nach dem Speichern (gleiche View) → kein fresh, keine Einblend-Animation
check('nach interaktion: main nicht fresh', !doc.getElementById('main').classList.contains('fresh'));
doc.querySelector('.check-btn').click();
check('nach abhaken: weiterhin ruhig', !doc.getElementById('main').classList.contains('fresh'));
// Tab-Wechsel → fresh (Animationen einmalig)
doc.querySelector('.tab[data-view="stats"]').click();
check('tab-wechsel: fresh gesetzt', doc.getElementById('main').classList.contains('fresh'));
doc.querySelector('.seg button[data-mode="month"]').click();
check('stats-intern: wieder ruhig', !doc.getElementById('main').classList.contains('fresh'));
doc.querySelector('.tab[data-view="today"]').click();
check('zurück zu heute: fresh', doc.getElementById('main').classList.contains('fresh'));

console.log(fails === 0 ? '\nALLE ROUND13-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
