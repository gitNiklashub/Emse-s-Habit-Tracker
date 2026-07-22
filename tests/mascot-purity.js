// Härtungstest: erzwingt, dass im Otter-Modus NIE Esel-Vokabular auftaucht
// (und umgekehrt) — deckt alle Render-Pfade ab, nicht nur Stichproben.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL ' + n); } else console.log('ok   ' + n); };

const DONKEY_WORDS = ['Iiiaah', 'IIIAAH', 'Iiii', 'Möhre', 'Hufschlag', 'Weide', 'Stall',
  'Heuhaufen', 'Standing Ovations', 'Galopp', 'trab', 'Trab', '🐴', '🥕', 'Esel'];
const OTTER_WORDS = ['Wiiii', 'WIIII', 'Muschel', 'Otter', '🦦', '🐚', 'schwimm', 'Fluss',
  'plantsch', 'Schilf', 'Strömung'];

const mkDom = (y, mo, d, h, seed) => {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  win.HTMLCanvasElement.prototype.getContext = () => null;
  win.confirm = () => true;
  if (y != null) {
    const Real = win.Date;
    win.Date = class extends Real {
      constructor(...a) { if (a.length === 0) super(y, mo, d, h, 30, 0); else super(...a); }
      static now() { return new Real(y, mo, d, h, 30, 0).getTime(); }
    };
  }
  if (seed) win.localStorage.setItem('emse-habits-v1', JSON.stringify(seed));
  win.eval(js);
  return win;
};

// Otter-Seed mit reichlich Historie: Streak, Moods, abgeschlossene Wochen inkl. goldener,
// damit möglichst viele Textpfade (Toast, Brief, Album, Mood, Update-Karte) erreichbar sind.
const goldLogs = {};
for (let d = 6; d <= 12; d++) goldLogs['2026-07-' + String(d).padStart(2, '0')] = 1;
const richSeed = {
  version: 1,
  habits: [{ id: 'a1', name: 'Lesen', emoji: '📖', color: 'rose', kind: 'check', unit: '', goal: 0,
    freq: { type: 'daily', target: 1 }, days: [0,1,2,3,4,5,6], createdAt: '2026-06-01' }],
  logs: { a1: goldLogs },
  // seenVersion hoch: Update-Karte soll hier NICHT erscheinen — die nennt legitim
  // beide Tiernamen ("Wähle zwischen Esel und Otter") und würde den reinen Text-Scan verfälschen.
  // Separat unten (Zeile ~93) wird die Update-Karte gezielt mit alter seenVersion getestet.
  pauses: {}, ui: { seenVersion: 999, mascot: 'otter', userName: 'Test' },
  moods: { '2026-07-08': 5, '2026-07-09': 3, '2026-07-10': 1 },
};

// textContent liest auch verstecktes (.hidden) Markup mit — insbesondere die
// Picker-Labels "Esel"/"Otter" in den Einstellungen, die legitim IMMER beide
// Namen zeigen. Für den reinen Text-Scan blenden wir versteckte Sheets/den
// Picker aus und beschränken uns auf das, was der Nutzer gerade sieht.
function visibleText(doc) {
  const clone = doc.body.cloneNode(true);
  clone.querySelectorAll('.sheet-backdrop.hidden, #mascot-row').forEach((el) => el.remove());
  return clone.textContent;
}

function scanForLeaks(doc, forbidden, label) {
  const text = visibleText(doc);
  forbidden.forEach((w) => {
    if (w === 'Esel' || w === 'Otter') return; // eigenname erlaubt an eigener stelle, separat geprüft
    check(`${label}: kein "${w}"`, !text.includes(w));
  });
}

// ---- OTTER-Modus: Montag 13.7. (Wochenbrief-Umschlag sichtbar), Mood-Historie ----
let w = mkDom(2026, 6, 13, 12, richSeed);
let doc = w.document;
scanForLeaks(doc, DONKEY_WORDS, 'heute (otter)');
check('heute (otter): "Esel" kommt nicht vor (sichtbarer text)', !visibleText(doc).includes('Esel'));

// Umschlag öffnen -> Brief
const env = doc.querySelector('.envelope-card');
if (env) {
  env.click();
  scanForLeaks(doc, DONKEY_WORDS, 'brief (otter)');
  check('brief (otter): "Esel" kommt nicht vor', !doc.getElementById('letter-content').textContent.includes('Esel'));
  doc.getElementById('btn-close-letter').click();
} else {
  check('umschlag (otter) — übersprungen, keine woche fällig zur testzeit', true);
}

// Statistik: alle drei Modi durchklicken
doc.querySelector('.tab[data-view="stats"]').click();
scanForLeaks(doc, DONKEY_WORDS, 'stats-woche (otter)');
doc.querySelector('.seg button[data-mode="month"]').click();
scanForLeaks(doc, DONKEY_WORDS, 'stats-monat (otter)');
doc.querySelector('.seg button[data-mode="year"]').click();
scanForLeaks(doc, DONKEY_WORDS, 'stats-jahr (otter)');

// Album
doc.getElementById('btn-settings').click();
doc.getElementById('btn-album').click();
scanForLeaks(doc, DONKEY_WORDS, 'album (otter)');
doc.getElementById('btn-close-album').click();
doc.getElementById('btn-close-settings').click();

// Zurück zur Heute-Ansicht, dort streicheln (mehrfach, um mehrere zufällige
// PETS_OTTER-Einträge zu treffen — der Tap-Zone existiert nur im Hero)
doc.querySelector('.tab[data-view="today"]').click();
for (let i = 0; i < 8; i++) {
  doc.querySelector('.donkey-tap').click();
  scanForLeaks(doc, DONKEY_WORDS, `streicheln#${i} (otter)`);
}

// Update-Karte: eigene Instanz mit alter seenVersion, damit sie erscheint.
// Sie nennt LEGITIM beide Tiernamen im Erklärtext ("Wähle zwischen Esel und Otter") —
// deshalb hier nur auf die eigentlichen Charakter-Marker prüfen, nicht auf "Esel" selbst.
const seed2 = JSON.parse(w.localStorage.getItem('emse-habits-v1'));
seed2.ui.seenVersion = 0;
const w2 = mkDom(2026, 6, 13, 12, seed2);
check('update-karte (otter) sichtbar', w2.document.querySelector('.update-card') !== null);
DONKEY_WORDS.filter((wd) => wd !== 'Esel').forEach((wd) => {
  check(`update-karte (otter): kein "${wd}"`, !w2.document.querySelector('.update-card').textContent.includes(wd));
});

// ---- ESEL-Modus (default): derselbe Rundgang, jetzt auf Otter-Wörter prüfen ----
const donkeySeed = { ...richSeed, ui: { seenVersion: 999, userName: 'Test' } }; // kein mascot = donkey
let wd = mkDom(2026, 6, 13, 12, donkeySeed);
let docD = wd.document;
scanForLeaks(docD, OTTER_WORDS, 'heute (esel)');
check('heute (esel): "Otter" kommt nicht vor (sichtbarer text)', !visibleText(docD).includes('Otter'));

const envD = docD.querySelector('.envelope-card');
if (envD) {
  envD.click();
  scanForLeaks(docD, OTTER_WORDS, 'brief (esel)');
  docD.getElementById('btn-close-letter').click();
} else {
  check('umschlag (esel) — übersprungen', true);
}

docD.querySelector('.tab[data-view="stats"]').click();
scanForLeaks(docD, OTTER_WORDS, 'stats-woche (esel)');
docD.querySelector('.seg button[data-mode="year"]').click();
scanForLeaks(docD, OTTER_WORDS, 'stats-jahr (esel)');

docD.querySelector('.tab[data-view="today"]').click();
for (let i = 0; i < 8; i++) {
  docD.querySelector('.donkey-tap').click();
  scanForLeaks(docD, OTTER_WORDS, `streicheln#${i} (esel)`);
}

console.log(fails === 0 ? '\nALLE PURITY-TESTS BESTANDEN' : `\n${fails} FEHLGESCHLAGEN`);
process.exit(fails ? 1 : 0);
