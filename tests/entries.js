// Einzeleinträge bei Zahlen-Habits: hinzufügen, bearbeiten, löschen, Migration.
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

const w = mkDom(null);
const doc = w.document;
const state = () => JSON.parse(w.localStorage.getItem('emse-habits-v1'));

// --- Zahlen-Habit anlegen ---
doc.getElementById('btn-add').click();
doc.getElementById('inp-name').value = 'Eiweiß';
doc.querySelector('#kind-seg button[data-kind="number"]').click();
doc.getElementById('inp-unit').value = 'g';
doc.getElementById('inp-goal').value = '100';
doc.getElementById('btn-save-habit').click();
const habitId = state().habits[0].id;
const card = () => [...doc.querySelectorAll('.habit-card')].find(c => c.textContent.includes('Eiweiß'));

// --- Sheet öffnen: leere Liste ---
card().querySelector('.value-btn').click();
check('sheet offen', !doc.getElementById('sheet-log').classList.contains('hidden'));
check('leere-liste-hinweis', doc.getElementById('log-entries').textContent.includes('Noch keine Einträge'));
check('summe 0', doc.getElementById('log-current-val').textContent === '0');

// --- Ersten Eintrag hinzufügen: Sheet bleibt offen ---
doc.getElementById('inp-log').value = '30';
doc.getElementById('btn-log-add').click();
check('sheet bleibt offen nach hinzufügen', !doc.getElementById('sheet-log').classList.contains('hidden'));
check('summe nach 1. eintrag = 30', doc.getElementById('log-current-val').textContent === '30');
check('eingabefeld geleert', doc.getElementById('inp-log').value === '');
check('1 zeile in der liste', doc.querySelectorAll('.entry-row').length === 1);
check('storage: 1 eintrag', state().entries[habitId][Object.keys(state().entries[habitId])[0]].length === 1);
check('storage: log = 30', Object.values(state().logs[habitId])[0] === 30);

// --- Zweiten und dritten Eintrag hinzufügen ---
doc.getElementById('inp-log').value = '50';
doc.getElementById('btn-log-add').click();
doc.getElementById('inp-log').value = '40';
doc.getElementById('btn-log-add').click();
check('summe nach 3 einträgen = 120', doc.getElementById('log-current-val').textContent === '120');
check('3 zeilen in der liste', doc.querySelectorAll('.entry-row').length === 3);
const dateKey = () => Object.keys(state().entries[habitId])[0];
check('storage: 3 einträge', state().entries[habitId][dateKey()].length === 3);

// Komma-Eingabe
doc.getElementById('inp-log').value = '12,5';
doc.getElementById('btn-log-add').click();
check('komma-eingabe korrekt (132.5)', doc.getElementById('log-current-val').textContent === '132,5');

// Ungültige Eingabe wird ignoriert (kein Crash, keine neue Zeile)
const rowsBefore = doc.querySelectorAll('.entry-row').length;
doc.getElementById('inp-log').value = 'abc';
doc.getElementById('btn-log-add').click();
check('ungültige eingabe erzeugt keine zeile', doc.querySelectorAll('.entry-row').length === rowsBefore);

// --- Karte zeigt die aktuelle Summe ---
check('karte zeigt 132,5', card().querySelector('.value-btn').textContent.includes('132,5'));

// --- Einzelnen Eintrag bearbeiten (den 50er auf 45 korrigieren) ---
const rows = () => [...doc.querySelectorAll('.entry-row')];
let target = rows().find(r => r.querySelector('.entry-val').textContent.trim() === '50');
check('50er-eintrag gefunden', target !== undefined);
target.querySelector('.entry-edit').click();
const inp = target.querySelector('.entry-val input');
check('inline-input erscheint', inp !== null);
inp.value = '45';
inp.dispatchEvent(new w.Event('blur'));
check('summe nach bearbeiten (127.5)', doc.getElementById('log-current-val').textContent === '127,5');
check('storage: bearbeiteter wert = 45', state().entries[habitId][dateKey()].some(e => e.val === 45));
check('storage: kein 50er mehr', !state().entries[habitId][dateKey()].some(e => e.val === 50));

// --- Ungültige Bearbeitung: Zeile bleibt unverändert ---
target = rows().find(r => r.querySelector('.entry-val').textContent.trim() === '45');
target.querySelector('.entry-edit').click();
const inp2 = target.querySelector('.entry-val input');
inp2.value = 'xx';
inp2.dispatchEvent(new w.Event('blur'));
check('ungültige bearbeitung: wert bleibt 45', state().entries[habitId][dateKey()].some(e => e.val === 45));
check('summe unverändert nach ungültiger bearbeitung', doc.getElementById('log-current-val').textContent === '127,5');

// --- Einzelnen Eintrag löschen (den 40er) ---
target = rows().find(r => r.querySelector('.entry-val').textContent.trim() === '40');
target.querySelector('.entry-del').click();
check('4 -> 3 zeilen nach löschen', doc.querySelectorAll('.entry-row').length === 3);
check('summe nach löschen (87.5)', doc.getElementById('log-current-val').textContent === '87,5');
check('storage: kein 40er mehr', !state().entries[habitId][dateKey()].some(e => e.val === 40));

// --- Konfetti bei Zielerreichung durch Einzeleintrag ---
// __confetti ist ein kumulativer Zähler (Hook für Tests) — Anstieg prüfen, nicht Fixwert,
// da vorherige Bearbeitungen in diesem Testlauf bereits über/unter das Ziel gependelt haben können.
const confettiBefore = w.__confetti || 0;
doc.getElementById('inp-log').value = '20';
doc.getElementById('btn-log-add').click(); // 87.5 + 20 = 107.5 >= Ziel 100
check('summe erreicht ziel (107.5)', doc.getElementById('log-current-val').textContent === '107,5');
check('konfetti bei zielerreichung', (w.__confetti || 0) > confettiBefore);

// --- Leeren: alle Einträge des Tages weg ---
doc.getElementById('btn-log-clear').click();
check('nach leeren: 0', doc.getElementById('log-current-val').textContent === '0');
check('nach leeren: leere-liste-hinweis wieder da', doc.getElementById('log-entries').textContent.includes('Noch keine Einträge'));
check('storage: log-eintrag für den tag entfernt', !state().logs[habitId] || Object.keys(state().logs[habitId]).length === 0);
check('storage: entries für den tag entfernt', !state().entries[habitId] || !state().entries[habitId][dateKey()]);

// --- Fertig-Button schließt das Sheet ---
doc.getElementById('inp-log').value = '10';
doc.getElementById('btn-log-add').click();
doc.getElementById('btn-log-done').click();
check('sheet nach fertig geschlossen', doc.getElementById('sheet-log').classList.contains('hidden'));
check('karte zeigt 10 nach schließen', card().querySelector('.value-btn').textContent.includes('10'));

// --- Statistik: Klick auf einen Balken/Zelle öffnet weiterhin dasselbe Sheet mit Liste ---
doc.querySelector('.tab[data-view="stats"]').click();
const eiStat = [...doc.querySelectorAll('.stat-card')].find(c => c.textContent.includes('Eiweiß'));
// gezielt den heutigen Balken nehmen — der erste .bar:not(.future) ist Montag, nicht heute
const todayBar = [...eiStat.querySelectorAll('.bar:not(.future)')].find((b) => b.title.includes('10 g'));
check('balken vorhanden', todayBar !== undefined);
todayBar.click();
check('sheet über statistik-balken geöffnet', !doc.getElementById('sheet-log').classList.contains('hidden'));
check('liste zeigt den bestehenden eintrag (10)', doc.querySelector('.entry-row .entry-val').textContent.trim() === '10');
doc.getElementById('btn-log-done').click();
doc.querySelector('.tab[data-view="today"]').click();

// ================= Migration: alte reine Summe ohne state.entries =================
// Log-Datum bewusst dynamisch auf "heute" gesetzt (nicht fix), damit die Karten-
// anzeige (die für den heutigen Tag rendert) den Alt-Wert unabhängig vom
// tatsächlichen Testlauf-Datum zeigt.
const todayIso = (() => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
})();
const oldSeed = {
  version: 1,
  habits: [{ id: 'b1', name: 'Wasser', emoji: '💧', color: 'blue', kind: 'number', unit: 'ml',
    goal: 2000, direction: 'min', freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6],
    createdAt: '2026-01-01' }],
  logs: { b1: { [todayIso]: 1500 } },
  pauses: {}, ui: { seenVersion: 99 }, moods: {},
  // bewusst kein "entries" Feld -> simuliert Alt-Daten vor diesem Feature
};
const w2 = mkDom(oldSeed);
const doc2 = w2.document;
const state2 = () => JSON.parse(w2.localStorage.getItem('emse-habits-v1'));
// migrate() mutiert state nur im Speicher und persistiert erst beim nächsten
// save() — vor dem ersten echten save()-Aufruf (unten, per addLogEntry) sagt
// localStorage also noch nichts über den migrierten Zustand aus. Deshalb hier
// nur DOM-sichtbares Verhalten prüfen (das liest den In-Memory-State direkt).
check('migration: kein crash beim laden', doc2.querySelector('.habit-card') !== null);
check('migration: alte summe bleibt erhalten', doc2.querySelector('.value-btn').textContent.includes('1500'));
const wCard = () => [...doc2.querySelectorAll('.habit-card')].find(c => c.textContent.includes('Wasser'));
wCard().querySelector('.value-btn').click();
check('migration: liste für alten tag leer (keine erfundenen einträge)',
  doc2.getElementById('log-entries').textContent.includes('Noch keine Einträge'));
check('migration: summe im sheet trotzdem sichtbar', doc2.getElementById('log-current-val').textContent === '1500');
// Neuer Eintrag auf einem Alt-Tag summiert korrekt zur bestehenden Summe dazu
// — dieser addLogEntry-Aufruf löst den ersten echten save() aus, danach ist
// der migrierte Zustand (inkl. state.entries) auch in localStorage sichtbar.
doc2.getElementById('inp-log').value = '250';
doc2.getElementById('btn-log-add').click();
check('migration: neuer eintrag addiert sich zur alten summe (1750)',
  doc2.getElementById('log-current-val').textContent === '1750');
check('migration: state.entries jetzt persistiert und existent', typeof state2().entries === 'object');
// Die alte Tagessumme wird beim ersten neuen Eintrag als eigener "geerbter"
// Posten übernommen, damit sie nicht verloren geht -> 2 Zeilen: 1500 (alt) + 250 (neu)
check('migration: alter posten (1500) als zeile übernommen',
  state2().entries['b1'][todayIso].some((e) => e.val === 1500 && e.legacy === true));
check('migration: neuer posten (250) zusätzlich vorhanden',
  state2().entries['b1'][todayIso].some((e) => e.val === 250 && !e.legacy));
check('migration: liste zeigt jetzt 2 zeilen (alt + neu)',
  doc2.querySelectorAll('.entry-row').length === 2);

console.log(fails === 0 ? '\nALLE ENTRIES-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
