/* ================================================================== */
/*  Emse's Habit Tracker — vanilla JS, localStorage, keine Builds      */
/* ================================================================== */

'use strict';

// ---------- Konstanten ----------

const STORAGE_KEY = 'emse-habits-v1';

// App-Version für die einmalige „Was ist neu"-Karte.
// Bei jedem Update: Version hochzählen + CHANGELOG-Eintrag ergänzen.
const APP_VERSION = 24;
const CHANGELOG = [
  {
    v: 24,
    items: [
      '🐛 Kleiner Textfehler behoben: der Wochenbrief-Button zeigte kurz „Danke, Esel!" auch im Otter-Modus, bevor er sich korrigierte.',
    ],
  },
  {
    v: 23,
    items: [
      '🦦 Neues Maskottchen: Wähle in den Einstellungen zwischen Esel und Otter — mit eigenem Charakter in Sprüchen, Stimmungs-Reaktionen und Wochenbriefen.',
    ],
  },
  {
    v: 22,
    items: [
      '📱 Stabiler auf dem iPhone: ruhigeres Rendern (kein Zucken beim Abhaken), robusterer Header auf schmalen Displays, flackerfreie Tab-Leiste.',
      '💌 Der Esel fragt nach deinem Namen und spricht dich in Briefen persönlich an — änderbar in den Einstellungen.',
    ],
  },
  {
    v: 21,
    items: [
      '🌙 Der Esel lebt mit dir: nachts trägt er eine Schlafmütze, vor 7 Uhr ist er verschlafen — und zu Weihnachten, Silvester, Ostern und Halloween ist er passend verkleidet.',
      '✨ Goldene Woche: schaffst du ALLES in einer Woche, glänzt dein Sonntagsbrief golden und der Esel trägt die Folgewoche sein Krönchen.',
      '🏆 Erinnerungs-Album (Einstellungen): deine Rekorde, Belohnungen und alle bisherigen Wochenbriefe zum Nachlesen.',
    ],
  },
  {
    v: 20,
    items: [
      '📬 Post vom Esel! Sonntagabends flattert ein Wochenbrief rein: deine Bilanz, dein Star der Woche und aufrichtige Motivation für die nächste — egal wie die Woche lief.',
      '🗂 Alte Wochenbriefe kannst du in der Statistik nachlesen (vergangene Woche öffnen → „Wochenbrief lesen").',
    ],
  },
  {
    v: 19,
    items: [
      '✨ Cleaner Hero: Esel, Ringe und Zähler in einer Reihe — die Sprechblase erscheint nur noch kurz beim Streicheln oder Stimmungswechsel.',
      '🔥 Beste Serie & nächste Belohnung sind in den Statistik-Tab umgezogen (dort immer beide sichtbar).',
      '💭 Die Stimmungs-Frage kommt jetzt erst abends ab 18 Uhr — nachtragen geht jederzeit über die Statistik.',
    ],
  },
  {
    v: 18,
    items: [
      '💍 Drei Ringe wie bei Apple Health: außen deine täglichen Habits, Mitte die Zahlen-Ziele (z. B. Eiweiß), innen das Wochen-/Monatspensum — jede Kategorie hat jetzt ihren eigenen Fortschritt.',
      '🔄 Beste Serie und nächste Belohnung teilen sich eine Zeile und wechseln sich alle 5 Minuten ab — kein Gedränge mehr neben dem Stimmungs-Badge.',
    ],
  },
  {
    v: 17,
    items: [
      '🌱 Verzicht rückwirkend: Rückfälle lassen sich jetzt auf beliebigen vergangenen Tagen nachtragen — auch vor dem Anlegen. Deine Serie zählt dann ab dem letzten Rückfall.',
      '💭 Das Stimmungs-Badge sitzt jetzt unten rechts in der Esel-Karte.',
    ],
  },
  {
    v: 16,
    items: [
      '💭 Stimmung wandert nach der Wahl als kleines Badge in die Esel-Karte — antippen zum Ändern.',
      '🎯 Der Tagesring zählt nur noch echte To-dos: erledigte Wochenziele und Verzicht-Habits füllen ihn nicht mehr vor.',
      '📊 Stimmung lässt sich jetzt auch rückblickend in der Statistik eintragen (Tag antippen) — Rückfälle wie gehabt.',
    ],
  },
  {
    v: 15,
    items: [
      '🎁 Diese Update-Hinweise! Nach jedem Update siehst du hier einmalig, was neu ist.',
    ],
  },
  {
    v: 14,
    items: [
      '📅 Wochentags-Pläne: Habits nur an bestimmten Tagen (z. B. Gym Mo/Mi/Fr) — Ruhetage brechen keine Serie.',
      '💭 Mood-Check-in: Sag dem Esel, wie es dir geht — mit Stimmungs-Verlauf in der Statistik.',
      '🌱 Verzicht-Habits: „X Tage ohne" — die Serie wächst von allein, nur Rückfälle werden geloggt.',
      '🏆 Jahres-Heatmap & Rekorde: neuer Jahr-Tab in der Statistik mit deiner besten Serie aller Zeiten.',
    ],
  },
];

// Reihenfolge der Farben ist CVD-validiert (nicht umsortieren)
const COLORS = {
  rose:   { bg: '#FADCE4', ink: '#C4547C' },
  blue:   { bg: '#D8E6F8', ink: '#3F7BC8' },
  peach:  { bg: '#FDE3D3', ink: '#C96A2E' },
  lilac:  { bg: '#E5DEF8', ink: '#7A63C9' },
  green:  { bg: '#DCEFD8', ink: '#4C8A4C' },
  yellow: { bg: '#FBF0CE', ink: '#A88600' },
};

const EMOJIS = ['✅', '📖', '🏃‍♀️', '💪', '🧘‍♀️', '💧', '🥗', '🍗', '😴', '🧹', '💊', '🎹', '✍️', '🌱', '📵', '🦷', '☀️', '💌'];

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Mood-Check-in: 5 Stufen, der Esel reagiert
const MOODS = [
  { v: 1, e: '😢', reaction: 'Oh nein… komm her, Ohrenkuscheln! 🫂 Morgen wird\'s leichter.' },
  { v: 2, e: '😕', reaction: 'Halb so wild. Ein kleiner Habit hebt die Laune — versprochen! 🌱' },
  { v: 3, e: '😐', reaction: 'Okay-Tage gehören dazu. Ich bin da! 🐴' },
  { v: 4, e: '🙂', reaction: 'Schön zu hören! Weiter so! 💛' },
  { v: 5, e: '🥰', reaction: 'Iiiaah, das freut mich riesig! ✨' },
];

// Sprüche vom Baby-Esel, je nach Tagesfortschritt
const QUOTES = {
  sleepy: [
    'Iiiaah… noch ganz verschlafen hier. Ein kleiner Schritt reicht für den Anfang! 🌱',
    'Auch ein Baby-Esel fängt mit dem ersten Hufschlag an. Los geht\'s!',
    'Heute noch nichts? Kein Stress — jetzt ist der beste Moment. ✨',
    'Ich glaub an dich. Ein Habit, dann gibt\'s Möhren! 🥕',
    'Aufstehen, strecken, anfangen — ich mach\'s dir vor! 💪',
  ],
  hopeful: [
    'Guter Start! Ein Häkchen nach dem anderen. 🐾',
    'Iiiaah! Weiter so, der Tag gehört dir!',
    'Schritt für Schritt — genau so wird\'s gemacht! 🌸',
    'Die Möhre ist schon in Sicht. Dranbleiben! 🥕',
    'Du bist auf dem Weg — ich trab neben dir her! 💛',
  ],
  happy: [
    'Wow, schon über die Hälfte! Ich bin stolz auf dich! 🎀',
    'Iiiaah, das läuft ja richtig gut heute!',
    'Fast geschafft — der Endspurt ist unser Ding! 🏃‍♀️',
    'Noch ein kleiner Galopp bis zum Ziel! 🐴',
    'So viel geschafft — Möhrenpause verdient! 🥕',
  ],
  party: [
    'IIIAAH! Alles geschafft! Du bist der Wahnsinn! 🎉',
    '100 %! Heute tanzen wir auf der Weide! 🌼',
    'Perfekter Tag! Ich mach Freudensprünge! ✨',
    'Alle Habits erledigt — du bist mein Held! 💖',
    'Volle Möhre! Besser geht\'s nicht! 🥕✨',
  ],
  // Easter Egg: App zwischen 0–4 Uhr geöffnet
  midnight: [
    'Psst… es ist mitten in der Nacht. Ich träume von Möhrenfeldern. 🌙',
    'Iiii… ganz leise. Alle anderen Esel schlafen schon. ✨',
    'Nachteule oder Frühaufsteher? So oder so: geh bald schlafen. 😴',
    'Die Sterne sind schön heute Nacht, findest du nicht auch? 🌌',
    'Ich bewache deine Habits, während die Welt schläft. 🌛',
  ],
};

// Easter Egg: Reaktionen auf Doppel-Tap/Long-Press auf den Esel
const PETS = [
  'Iiiaah! Das kitzelt! 🥰',
  'Danke fürs Kraulen! 💛',
  'Mehr davon, bitte! 🐴',
  'Du bist mein Lieblingsmensch. 💖',
  'Möhren später? Ich freu mich schon! 🥕',
];

// Otter-Pendants: gleiche Struktur, eigener Wortschatz (Fluss statt Möhrenfeld,
// Muscheln statt Möhren, Flitzen statt Traben)
const MOODS_OTTER_REACTIONS = [
  'Oh nein… komm her, Bauchkuscheln! 🫂 Morgen wird\'s leichter.',
  'Halb so wild. Ein kleiner Habit spült die Laune weg — versprochen! 🌊',
  'Okay-Tage gehören dazu. Ich schwimm an deiner Seite! 🦦',
  'Schön zu hören! Weiter so! 💛',
  'Wiiiii, das freut mich riesig! ✨',
];

const QUOTES_OTTER = {
  sleepy: [
    'Noch ganz verschlafen hier, eingerollt im Seetang. Ein kleiner Schritt reicht für den Anfang! 🌱',
    'Auch ein kleiner Otter fängt mal klein an. Los geht\'s!',
    'Heute noch nichts? Kein Stress — jetzt ist der beste Moment. ✨',
    'Ich glaub an dich. Ein Habit, dann gibt\'s eine Extra-Muschel! 🐚',
    'Aufstehen, strecken, reinspringen — ich mach\'s dir vor! 💪',
  ],
  hopeful: [
    'Guter Start! Ein Häkchen nach dem anderen. 🦦',
    'Wiiiii! Weiter so, der Tag gehört dir!',
    'Schritt für Schritt — genau so wird\'s gemacht! 🌊',
    'Die Muschel ist schon in Sicht. Dranbleiben! 🐚',
    'Du bist auf dem Weg — ich schwimm neben dir her! 💛',
  ],
  happy: [
    'Wow, schon über die Hälfte! Ich bin stolz auf dich! 🎀',
    'Das läuft ja richtig gut heute!',
    'Fast geschafft — der Endspurt ist unser Ding! 🏊',
    'Noch ein kleiner Flitzer bis zum Ziel! 🦦',
    'So viel geschafft — Muschelpause verdient! 🐚',
  ],
  party: [
    'WIIII! Alles geschafft! Du bist der Wahnsinn! 🎉',
    '100 %! Heute plantschen wir im Fluss! 🌊',
    'Perfekter Tag! Ich mach Wasser-Purzelbäume! ✨',
    'Alle Habits erledigt — du bist mein Held! 💖',
    'Volle Muschelbank! Besser geht\'s nicht! 🐚✨',
  ],
  midnight: [
    'Psst… es ist mitten in der Nacht. Ich träume von ruhigen Flüssen. 🌙',
    'Ganz leise. Alle anderen Otter schlafen schon. ✨',
    'Nachteule oder Frühaufsteher? So oder so: geh bald schlafen. 😴',
    'Die Sterne spiegeln sich schön im Wasser heute Nacht. 🌌',
    'Ich bewache deine Habits, während die Welt schläft. 🌛',
  ],
};

const PETS_OTTER = [
  'Wiiii! Das kitzelt! 🥰',
  'Danke fürs Kraulen! 💛',
  'Mehr davon, bitte! 🦦',
  'Du bist mein Lieblingsmensch. 💖',
  'Muscheln später? Ich freu mich schon! 🐚',
];

// Mascot-bewusste Textauswahl — zieht Sprüche/Reaktionen vom gewählten Tier
function mascotQuotes(mood) {
  return state.ui.mascot === 'otter' ? QUOTES_OTTER[mood] : QUOTES[mood];
}
function mascotPets() {
  return state.ui.mascot === 'otter' ? PETS_OTTER : PETS;
}
function mascotMoodReaction(v) {
  return state.ui.mascot === 'otter' ? MOODS_OTTER_REACTIONS[v - 1] : MOODS[v - 1].reaction;
}
function mascotName() {
  return state.ui.mascot === 'otter' ? 'Otter' : 'Esel';
}

// ---------- State ----------

let state = load();
let view = 'today';               // 'today' | 'stats'
let statsMode = 'week';           // 'week' | 'month'
let statsOffset = 0;              // 0 = aktuelle Periode, -1 = vorherige, …
let dayOffset = 0;                // Heute-Ansicht: 0 = heute, -1 = gestern, …
let editingId = null;             // Habit-ID im Sheet (null = neu)
let sheetSel = { emoji: EMOJIS[0], color: 'rose', freq: 'daily', target: 3, kind: 'check', direction: 'min' };
let logCtx = null;                // { habitId, date } fürs Wert-Sheet
let moodCtx = null;               // ISO-Datum fürs Stimmungs-Sheet (Statistik)
let letterCtx = null;             // { key, fromEnvelope } fürs Wochenbrief-Sheet
let moodExpanded = false;         // Mood-Karte trotz gesetzter Stimmung ausgeklappt
let lastMood = null;              // letzte Hero-Stimmung — Toast nur bei Wechsel
let eventCtx = null;              // { habitId, date } fürs Ereignis-Sheet
let detail = null;                // { id, mode, offset } fürs Detail-Sheet

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.habits)) {
        migrate(data);
        return data;
      }
    }
  } catch (e) { /* korrupte Daten → frisch starten */ }
  // Frische Installation: nichts ist „neu" → aktuelle Version gilt als gesehen
  return { version: 1, habits: [], logs: {}, pauses: {}, ui: { seenVersion: APP_VERSION }, moods: {} };
}

// Ältere Datenstände auf den aktuellen Stand heben
function migrate(data) {
  data.habits.forEach((h) => {
    if (!h.kind) h.kind = 'check';
    if (h.kind === 'number' && !h.direction) h.direction = 'min';
    // Wochentags-Plan: bestehende tägliche Habits gelten an allen Tagen
    if ((h.kind === 'check' || h.kind === 'number') && h.freq.type === 'daily' && !Array.isArray(h.days)) {
      h.days = [0, 1, 2, 3, 4, 5, 6];
    }
  });
  // Ereignis-Logs: früher Text-Arrays pro Tag, jetzt reine Zähler
  data.habits.filter((h) => h.kind === 'event').forEach((h) => {
    const log = data.logs[h.id];
    if (!log) return;
    Object.keys(log).forEach((d) => {
      if (Array.isArray(log[d])) log[d] = log[d].length;
    });
  });
  if (!data.pauses) data.pauses = {};
  if (!data.ui) data.ui = {};
  if (!data.moods) data.moods = {};
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Datums-Helfer (alles in lokaler Zeit) ----------

function iso(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// Montag der Woche von d
function monday(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Mo=0 … So=6
  return addDays(x, -day);
}

function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

// ---------- Log-Zugriff ----------

// Rohwert eines Tages (bei Abhaken-Habits 1, bei Zahlen-Habits die Summe)
function rawVal(habitId, isoDate) {
  return (state.logs[habitId] && state.logs[habitId][isoDate]) || 0;
}

function isDone(habitId, isoDate) { return !!rawVal(habitId, isoDate); }

// Ist ein Zahlen-Wert zielkonform? Richtung 'min' = mindestens, 'max' = höchstens
function goalReached(h, val) {
  if (!val) return false; // kein Eintrag zählt nie als erledigt (gilt für beide Richtungen)
  return h.direction === 'max' ? val <= h.goal : val >= h.goal;
}

// Startpunkt eines Verzicht-Habits: das Anlegedatum — oder ein früher
// nachgetragener Rückfall (dann zählt die Zeit rückwirkend ab dort)
function quitStart(h) {
  const created = fromIso(h.createdAt);
  const dates = Object.keys(state.logs[h.id] || {}).sort();
  if (dates.length > 0 && fromIso(dates[0]) < created) return fromIso(dates[0]);
  return created;
}

// „Zählt der Tag als geschafft?" — Zahlen-Habits: Tagesziel erreicht;
// Verzicht-Habits: kein Rückfall geloggt; Ereignis-Habits: nie ein „Ziel"
function doneOn(h, isoDate) {
  if (h.kind === 'number') return goalReached(h, rawVal(h.id, isoDate));
  if (h.kind === 'event') return false;
  if (h.kind === 'quit') {
    return fromIso(isoDate) >= quitStart(h) && !isDone(h.id, isoDate);
  }
  return isDone(h.id, isoDate);
}

// Ereignisse sind reine Tages-Zähler: rawVal/setVal/sumInRange decken alles ab.
// +1 für ein Ereignis an einem Tag:
function bumpEvent(habitId, isoDate, delta = 1) {
  setVal(habitId, isoDate, Math.max(0, rawVal(habitId, isoDate) + delta));
}

function toggle(habitId, isoDate) {
  if (!state.logs[habitId]) state.logs[habitId] = {};
  if (state.logs[habitId][isoDate]) delete state.logs[habitId][isoDate];
  else state.logs[habitId][isoDate] = 1;
  save();
}

function setVal(habitId, isoDate, value) {
  if (!state.logs[habitId]) state.logs[habitId] = {};
  if (value > 0) state.logs[habitId][isoDate] = value;
  else delete state.logs[habitId][isoDate];
  save();
}

function countInRange(habitId, from, to) { // Tage mit Eintrag, from/to inklusiv
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    if (isDone(habitId, iso(d))) n++;
  }
  return n;
}

function countDone(h, from, to) { // Tage, die als „geschafft" zählen
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    if (doneOn(h, iso(d))) n++;
  }
  return n;
}

function sumInRange(habitId, from, to) { // Wertesumme (Zahlen-Habits)
  let s = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    s += rawVal(habitId, iso(d));
  }
  return s;
}

// ---------- Pause-Tage ----------

function isPause(isoDate) { return !!state.pauses[isoDate]; }

// ---------- Wochentags-Pläne & Verzicht ----------

function dowOf(isoDate) { return (fromIso(isoDate).getDay() + 6) % 7; } // Mo=0 … So=6

// Ist der Habit an diesem Tag überhaupt dran? (Wochentags-Plan)
function scheduledOn(h, isoDate) {
  if (h.kind === 'event') return false;
  if (h.kind === 'quit') return true;
  if (h.freq.type !== 'daily') return true; // Wochen-/Monats-Habits haben Periodenziele
  return !Array.isArray(h.days) || h.days.includes(dowOf(isoDate));
}

// Fällige Tage eines Habits: geplant UND kein Pause-Tag
function habitDueDays(h, from, to) {
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    const i = iso(d);
    if (!isPause(i) && scheduledOn(h, i)) n++;
  }
  return n;
}

// Zählt der Habit an diesem Tag zur Tageserfüllung? (Hero, Konfetti)
function relevantOn(h, isoDate) {
  if (h.kind === 'event') return false;
  if (h.kind === 'quit') return true;
  if (h.freq.type === 'daily') return scheduledOn(h, isoDate);
  return true;
}

// Verzicht: Tage seit dem letzten Rückfall (auch rückwirkend nachgetragene),
// ohne Rückfall seit dem Startpunkt (Anlage bzw. früherer Rückfall)
function quitStreak(h) {
  const t = today();
  const log = state.logs[h.id] || {};
  const relapses = Object.keys(log)
    .filter((d) => log[d] && fromIso(d) <= t)
    .sort();
  if (relapses.length === 0) {
    return Math.round((t - quitStart(h)) / 86400000) + 1; // Starttag zählt mit
  }
  const last = fromIso(relapses[relapses.length - 1]);
  return Math.round((t - last) / 86400000); // Rückfalltag selbst zählt nicht, heute = 0
}

// „Zählt der Tag für diesen Habit als erfüllt?" — der Unterschied zu doneOn:
// Wochen-/Monats-Habits gelten auch als erfüllt, wenn das Periodenziel schon
// erreicht ist (Gym 3×/Woche am Donnerstag = ✓, wenn Mo–Mi gemacht).
function dayFulfilled(h, isoDate) {
  if (h.kind === 'event') return false;
  if (h.kind === 'quit') return doneOn(h, isoDate); // kein Rückfall = geschafft
  if (h.freq.type === 'daily' && !scheduledOn(h, isoDate)) return true; // heute nicht dran
  if (doneOn(h, isoDate)) return true;
  const d = fromIso(isoDate);
  if (h.freq.type === 'weekly') {
    const wk = monday(d);
    return countInRange(h.id, wk, addDays(wk, 6)) >= h.freq.target;
  }
  if (h.freq.type === 'monthly') {
    const ms = monthStart(d);
    return countInRange(h.id, ms, new Date(ms.getFullYear(), ms.getMonth() + 1, 0)) >= h.freq.target;
  }
  return false;
}

// Ist das Periodenziel (Woche/Monat) eines Habits am Stichtag schon erreicht?
function periodGoalMet(h, isoDate) {
  const d = fromIso(isoDate);
  if (h.freq.type === 'weekly') {
    const wk = monday(d);
    return countInRange(h.id, wk, addDays(wk, 6)) >= h.freq.target;
  }
  if (h.freq.type === 'monthly') {
    const ms = monthStart(d);
    return countInRange(h.id, ms, new Date(ms.getFullYear(), ms.getMonth() + 1, 0)) >= h.freq.target;
  }
  return false;
}

// Steht der Habit an diesem Tag als To-do im Tagesring?
// Nicht dabei: Events (reine Logs), Verzicht (nichts zu tun), Ruhetage,
// und Wochen-/Monats-Habits, deren Periodenziel schon steht (außer heute geloggt —
// dann bleibt der Beitrag als ✓ sichtbar).
function actionableOn(h, isoDate) {
  if (h.kind === 'event' || h.kind === 'quit') return false;
  if (h.freq.type === 'daily') return scheduledOn(h, isoDate);
  if (doneOn(h, isoDate)) return true;
  return !periodGoalMet(h, isoDate);
}

function allDoneToday() {
  const t = iso(today());
  const todos = state.habits.filter((h) => actionableOn(h, t));
  return todos.length > 0 && todos.every((h) => doneOn(h, t));
}

// ---------- Streaks ----------

function streak(habit) {
  const t = today();
  if (habit.kind === 'quit') {
    const n = quitStreak(habit);
    return { n, unit: n === 1 ? 'Tag' : 'Tage' };
  }
  if (habit.freq.type === 'daily') {
    // Pause-Tage und ungeplante Wochentage brechen die Serie nicht
    // (zählen aber nur mit, wenn trotzdem erledigt)
    let n = 0;
    let d = doneOn(habit, iso(t)) ? t : addDays(t, -1);
    for (let guard = 0; guard < 3700; guard++) {
      const dIso = iso(d);
      if (doneOn(habit, dIso)) n++;
      else if (!isPause(dIso) && scheduledOn(habit, dIso)) break;
      d = addDays(d, -1);
    }
    return { n, unit: n === 1 ? 'Tag' : 'Tage' };
  }
  if (habit.freq.type === 'weekly') {
    let n = 0;
    let wk = monday(t);
    // aktuelle Woche zählt, wenn Ziel schon erreicht — sonst ab Vorwoche
    if (countInRange(habit.id, wk, addDays(wk, 6)) < habit.freq.target) wk = addDays(wk, -7);
    while (countInRange(habit.id, wk, addDays(wk, 6)) >= habit.freq.target) { n++; wk = addDays(wk, -7); }
    return { n, unit: n === 1 ? 'Woche' : 'Wochen' };
  }
  // monthly
  let n = 0;
  let ms = monthStart(t);
  const cnt = (s) => countInRange(habit.id, s, new Date(s.getFullYear(), s.getMonth() + 1, 0));
  if (cnt(ms) < habit.freq.target) ms = new Date(ms.getFullYear(), ms.getMonth() - 1, 1);
  while (cnt(ms) >= habit.freq.target) { n++; ms = new Date(ms.getFullYear(), ms.getMonth() - 1, 1); }
  return { n, unit: n === 1 ? 'Monat' : 'Monate' };
}

// ---------- Format-Helfer ----------

function fmtNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Hex-Farbe mit Alpha (0–1) als rgba
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ---------- Sheets: öffnen/schließen mit Scroll-Lock + Swipe-to-dismiss ----------

let openSheets = 0;
let scrollY = 0;

function openSheet(el) {
  if (openSheets === 0) {
    scrollY = window.scrollY;
    document.body.classList.add('scroll-lock');
    document.body.style.top = `-${scrollY}px`;
  }
  openSheets++;
  el.classList.remove('hidden');
}

function closeSheet(el) {
  if (el.classList.contains('hidden')) return;
  el.classList.add('hidden');
  el.querySelector('.sheet')?.style.removeProperty('transform');
  openSheets = Math.max(0, openSheets - 1);
  if (openSheets === 0) {
    document.body.classList.remove('scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }
  if (el.id === 'sheet-habit') editingId = null;
  if (el.id === 'sheet-log') logCtx = null;
  if (el.id === 'sheet-event') eventCtx = null;
  if (el.id === 'sheet-detail') detail = null;
}

// Am Handle nach unten ziehen schließt das Sheet
function wireSwipeToDismiss(backdrop) {
  const sheet = backdrop.querySelector('.sheet');
  const handle = backdrop.querySelector('.sheet-handle');
  if (!sheet || !handle) return;
  let startY = null, dy = 0;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    sheet.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (startY === null) return;
    sheet.style.transition = '';
    if (dy > 90) closeSheet(backdrop);
    else sheet.style.removeProperty('transform');
    startY = null; dy = 0;
  });
}

// ---------- Baby-Esel (SVG-Maskottchen) ----------

function donkeySvg(mood, size = 104, acc = null) {
  const BODY = '#CFC7DC', DARK = '#A79DBE', MUZZLE = '#F3EDF3',
        INNER = '#F5CBD8', MANE = '#9C92B5', EYE = '#4A4453', BLUSH = '#F5B8C9';

  // Ohren: Winkel je Stimmung (aufgestellt ↔ hängend)
  const earDeg = { sleepy: 52, hopeful: 30, happy: 18, party: 12, heart: 14, midnight: 46 }[mood] ?? 30;

  let eyes, mouth, extra = '';
  if (mood === 'sleepy') {
    eyes = `<path d="M48 63 q6 5 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>
            <path d="M80 63 q6 5 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`;
    mouth = `<path d="M63 97 q7 -6 14 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<text x="108" y="30" font-size="15" font-weight="800" fill="${DARK}" transform="rotate(14 108 30)">z</text>
             <text x="119" y="18" font-size="11" font-weight="800" fill="${DARK}" transform="rotate(14 119 18)">z</text>`;
  } else if (mood === 'hopeful') {
    eyes = `<circle cx="54" cy="63" r="4.4" fill="${EYE}"/><circle cx="55.6" cy="61.4" r="1.4" fill="#fff"/>
            <circle cx="86" cy="63" r="4.4" fill="${EYE}"/><circle cx="87.6" cy="61.4" r="1.4" fill="#fff"/>`;
    mouth = `<path d="M63 95 q7 5 14 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (mood === 'happy') {
    eyes = `<circle cx="54" cy="62" r="4.8" fill="${EYE}"/><circle cx="55.7" cy="60.2" r="1.6" fill="#fff"/>
            <circle cx="86" cy="62" r="4.8" fill="${EYE}"/><circle cx="87.7" cy="60.2" r="1.6" fill="#fff"/>`;
    mouth = `<path d="M61 94 q9 8 18 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<ellipse cx="42" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.75"/>
             <ellipse cx="98" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.75"/>`;
  } else if (mood === 'party') {
    eyes = `<path d="M48 63 q6 -8 12 0" fill="none" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M80 63 q6 -8 12 0" fill="none" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round"/>`;
    mouth = `<path d="M60 93 q10 12 20 0 z" fill="#8A5568"/>`;
    extra = `<ellipse cx="42" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.8"/>
             <ellipse cx="98" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.8"/>
             <path d="M18 22 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z" fill="#F0C24B"/>
             <path d="M118 40 l1.7 3.8 3.8 1.7 -3.8 1.7 -1.7 3.8 -1.7 -3.8 -3.8 -1.7 3.8 -1.7 z" fill="#F5B8C9"/>`;
  } else if (mood === 'heart') { // Easter Egg: Doppel-Tap auf den Esel
    const heart = (cx, cy, s) => `<path transform="translate(${cx} ${cy}) scale(${s})"
      d="M0 3.4 C-4 -1.6 -11 -1 -11 4.4 C-11 9 -5.4 12.6 0 17 C5.4 12.6 11 9 11 4.4 C11 -1 4 -1.6 0 3.4 Z" fill="#E8536F"/>`;
    eyes = heart(54, 61, 0.62) + heart(86, 61, 0.62);
    mouth = `<path d="M61 94 q9 8 18 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<ellipse cx="42" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.85"/>
             <ellipse cx="98" cy="76" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.85"/>`;
  } else if (mood === 'midnight') { // Easter Egg: App zwischen 0–4 Uhr geöffnet
    eyes = `<path d="M48 64 q6 4 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>
            <path d="M80 64 q6 4 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`;
    mouth = `<ellipse cx="70" cy="96" rx="4.5" ry="5.5" fill="${DARK}"/>`;
    extra = `<g fill="#F0C24B">
        <circle cx="20" cy="18" r="1.6"/><circle cx="112" cy="12" r="1.3"/>
        <circle cx="128" cy="34" r="1.6"/><circle cx="14" cy="42" r="1.3"/>
        <path d="M100 10 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z"/>
      </g>
      <path d="M60 22 q10 -6 20 0 q-2 8 -10 8 q-8 0 -10 -8 Z" fill="${MANE}" opacity="0.9"/>`;
  }

  // Accessoires: eine Kopfbedeckung nach Priorität (Nacht > Saison > Krone > Hut),
  // Blume und Kürbis unabhängig davon
  let gear = '';
  if (acc) {
    const HEADWEAR = {
      nightcap: `<g data-acc="nightcap">
        <path d="M52 34 Q64 8 92 12 L102 26 Q90 20 84 30 Q72 16 58 38 Z" fill="#A99BD6"/>
        <rect x="48" y="31" width="42" height="9" rx="4.5" fill="#fff"/>
        <circle cx="104" cy="28" r="5.5" fill="#fff"/></g>`,
      santa: `<g data-acc="santa">
        <path d="M52 32 Q60 6 86 8 Q100 10 99 20 Q88 14 84 26 Q72 12 58 34 Z" fill="#D03B3B"/>
        <rect x="48" y="29" width="42" height="9" rx="4.5" fill="#fff"/>
        <circle cx="100" cy="19" r="5.5" fill="#fff"/></g>`,
      wreath: `<g data-acc="wreath">
        <path d="M48 46 Q70 31 92 46" stroke="#7FA65A" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${[[50, 45, '#F2A7BF'], [60, 39, '#F0C24B'], [70, 37, '#fff'], [80, 39, '#F2A7BF'], [90, 45, '#F0C24B']].map(([x, y, c]) =>
          `<circle cx="${x}" cy="${y}" r="4.4" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.7" fill="#E8862E"/>`).join('')}</g>`,
      crown: `<g data-acc="crown"><path d="M56 20 L60 35 L84 35 L88 20 L80 27 L72 16 L64 27 Z" fill="#F0C24B"/>
        <circle cx="56" cy="19" r="2.6" fill="#F0C24B"/><circle cx="72" cy="15" r="2.6" fill="#F0C24B"/><circle cx="88" cy="19" r="2.6" fill="#F0C24B"/></g>`,
      hat: `<g data-acc="hat"><polygon points="70,4 59,36 81,36" fill="#7A63C9"/>
        <path d="M62.5 26 L77.5 26" stroke="#E5DEF8" stroke-width="4"/>
        <circle cx="70" cy="4" r="4.2" fill="#F2A7BF"/></g>`,
    };
    // Verdiente Kronen schlagen Saison-Deko; nur nachts wird immer geschlafen
    const worn = ['nightcap', 'crown', 'santa', 'wreath', 'hat'].find((k) => acc[k]);
    if (worn) gear += HEADWEAR[worn];

    if (acc.flower) {
      const px = 38, py = 45;
      gear += `<g data-acc="flower">
        ${[[0, -4.6], [4.4, -1.4], [2.7, 3.7], [-2.7, 3.7], [-4.4, -1.4]].map(([dx, dy]) =>
          `<circle cx="${px + dx}" cy="${py + dy}" r="3.4" fill="#F2A7BF"/>`).join('')}
        <circle cx="${px}" cy="${py}" r="2.6" fill="#F0C24B"/></g>`;
    }
    if (acc.pumpkin) {
      gear += `<g data-acc="pumpkin">
        <path d="M20 92 Q19 85 25 84" stroke="#4C8A4C" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="20" cy="103" rx="14" ry="11" fill="#E8862E"/>
        <ellipse cx="20" cy="103" rx="6" ry="11" fill="none" stroke="#C96A2E" stroke-width="1.5"/>
        <path d="M13 100 l4.5 3.5 -4.5 2 z M27 100 l-4.5 3.5 4.5 2 z" fill="#5C3A10"/>
        <path d="M14.5 109 q5.5 4.5 11 0" stroke="#5C3A10" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
    }
  }

  return `<svg class="donkey" width="${size}" height="${size}" viewBox="0 0 140 120" aria-hidden="true">
    <!-- Ohren -->
    <g transform="rotate(${-earDeg} 52 48)">
      <ellipse cx="48" cy="26" rx="10.5" ry="25" fill="${BODY}"/>
      <ellipse cx="48" cy="29" rx="5" ry="16" fill="${INNER}"/>
    </g>
    <g transform="rotate(${earDeg} 88 48)">
      <ellipse cx="92" cy="26" rx="10.5" ry="25" fill="${BODY}"/>
      <ellipse cx="92" cy="29" rx="5" ry="16" fill="${INNER}"/>
    </g>
    <!-- Mähne -->
    <circle cx="60" cy="40" r="7" fill="${MANE}"/>
    <circle cx="70" cy="36" r="8" fill="${MANE}"/>
    <circle cx="80" cy="40" r="7" fill="${MANE}"/>
    <!-- Kopf -->
    <ellipse cx="70" cy="72" rx="37" ry="33" fill="${BODY}"/>
    <!-- Schnauze -->
    <ellipse cx="70" cy="87" rx="23" ry="15.5" fill="${MUZZLE}"/>
    <ellipse cx="61" cy="86" rx="2.6" ry="3.6" fill="${DARK}"/>
    <ellipse cx="79" cy="86" rx="2.6" ry="3.6" fill="${DARK}"/>
    ${eyes}${mouth}${extra}${gear}
  </svg>`;
}

// Zweites wählbares Maskottchen: ein kleiner Otter. Gleiche Mood-Namen und
// Accessoire-Objekte wie der Esel, andere Anatomie (rundes Gesicht, kein Ohren-
// Winkel-Trick, dafür Schnurrhaare) — Kopfbedeckungen sitzen etwas tiefer.
function otterSvg(mood, size = 104, acc = null) {
  const BODY = '#C99A6E', DARK = '#A87A50', MUZZLE = '#F3E6D4',
        BELLY = '#F6EDE0', EYE = '#3E2E1F', BLUSH = '#F5B8C9', NOSE = '#6B4A32';

  let eyes, mouth, extra = '';
  const whiskers = `<g stroke="${DARK}" stroke-width="1.6" stroke-linecap="round" opacity="0.55">
      <path d="M48 88 q-14 -2 -20 -6 M48 93 q-15 2 -21 3"/>
      <path d="M92 88 q14 -2 20 -6 M92 93 q15 2 21 3"/></g>`;

  if (mood === 'sleepy') {
    eyes = `<path d="M50 62 q6 5 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>
            <path d="M78 62 q6 5 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`;
    mouth = `<path d="M62 92 q8 -6 16 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<text x="106" y="26" font-size="15" font-weight="800" fill="${DARK}" transform="rotate(14 106 26)">z</text>
             <text x="117" y="14" font-size="11" font-weight="800" fill="${DARK}" transform="rotate(14 117 14)">z</text>`;
  } else if (mood === 'hopeful') {
    eyes = `<circle cx="55" cy="62" r="4.4" fill="${EYE}"/><circle cx="56.6" cy="60.4" r="1.4" fill="#fff"/>
            <circle cx="85" cy="62" r="4.4" fill="${EYE}"/><circle cx="86.6" cy="60.4" r="1.4" fill="#fff"/>`;
    mouth = `<path d="M62 90 q8 5 16 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (mood === 'happy') {
    eyes = `<circle cx="55" cy="61" r="4.8" fill="${EYE}"/><circle cx="56.7" cy="59.2" r="1.6" fill="#fff"/>
            <circle cx="85" cy="61" r="4.8" fill="${EYE}"/><circle cx="86.7" cy="59.2" r="1.6" fill="#fff"/>`;
    mouth = `<path d="M60 89 q10 8 20 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<ellipse cx="40" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.75"/>
             <ellipse cx="100" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.75"/>`;
  } else if (mood === 'party') {
    eyes = `<path d="M49 62 q6 -8 12 0" fill="none" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M79 62 q6 -8 12 0" fill="none" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round"/>`;
    mouth = `<path d="M59 88 q11 12 22 0 z" fill="#8A5E3F"/>`;
    extra = `<ellipse cx="40" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.8"/>
             <ellipse cx="100" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.8"/>
             <path d="M16 20 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z" fill="#F0C24B"/>
             <path d="M120 38 l1.7 3.8 3.8 1.7 -3.8 1.7 -1.7 3.8 -1.7 -3.8 -3.8 -1.7 3.8 -1.7 z" fill="#F5B8C9"/>`;
  } else if (mood === 'heart') { // Easter Egg: Doppel-Tap auf den Otter
    const heart = (cx, cy, s) => `<path transform="translate(${cx} ${cy}) scale(${s})"
      d="M0 3.4 C-4 -1.6 -11 -1 -11 4.4 C-11 9 -5.4 12.6 0 17 C5.4 12.6 11 9 11 4.4 C11 -1 4 -1.6 0 3.4 Z" fill="#E8536F"/>`;
    eyes = heart(55, 60, 0.62) + heart(85, 60, 0.62);
    mouth = `<path d="M60 89 q10 8 20 0" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>`;
    extra = `<ellipse cx="40" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.85"/>
             <ellipse cx="100" cy="74" rx="6" ry="3.6" fill="${BLUSH}" opacity="0.85"/>`;
  } else if (mood === 'midnight') { // Easter Egg: App zwischen 0–4 Uhr geöffnet
    eyes = `<path d="M49 63 q6 4 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>
            <path d="M79 63 q6 4 12 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`;
    mouth = `<ellipse cx="70" cy="91" rx="4.5" ry="5.5" fill="${DARK}"/>`;
    extra = `<g fill="#F0C24B">
        <circle cx="20" cy="16" r="1.6"/><circle cx="112" cy="10" r="1.3"/>
        <circle cx="128" cy="32" r="1.6"/><circle cx="14" cy="40" r="1.3"/>
        <path d="M100 8 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z"/>
      </g>`;
  }

  // Accessoires: dieselbe Priorität/Logik wie beim Esel, andere Sitzposition
  let gear = '';
  if (acc) {
    const HEADWEAR = {
      nightcap: `<g data-acc="nightcap">
        <path d="M50 30 Q62 4 90 8 L100 22 Q88 16 82 26 Q70 12 56 34 Z" fill="#A99BD6"/>
        <rect x="46" y="27" width="42" height="9" rx="4.5" fill="#fff"/>
        <circle cx="102" cy="24" r="5.5" fill="#fff"/></g>`,
      santa: `<g data-acc="santa">
        <path d="M50 28 Q58 2 84 4 Q98 6 97 16 Q86 10 82 22 Q70 8 56 30 Z" fill="#D03B3B"/>
        <rect x="46" y="25" width="42" height="9" rx="4.5" fill="#fff"/>
        <circle cx="98" cy="15" r="5.5" fill="#fff"/></g>`,
      wreath: `<g data-acc="wreath">
        <path d="M47 40 Q70 26 93 40" stroke="#7FA65A" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${[[49, 39, '#F2A7BF'], [60, 33, '#F0C24B'], [70, 31, '#fff'], [80, 33, '#F2A7BF'], [91, 39, '#F0C24B']].map(([x, y, c]) =>
          `<circle cx="${x}" cy="${y}" r="4.4" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.7" fill="#E8862E"/>`).join('')}</g>`,
      crown: `<g data-acc="crown"><path d="M55 16 L59 31 L83 31 L87 16 L79 23 L71 12 L63 23 Z" fill="#F0C24B"/>
        <circle cx="55" cy="15" r="2.6" fill="#F0C24B"/><circle cx="71" cy="11" r="2.6" fill="#F0C24B"/><circle cx="87" cy="15" r="2.6" fill="#F0C24B"/></g>`,
      hat: `<g data-acc="hat"><polygon points="69,0 58,32 80,32" fill="#7A63C9"/>
        <path d="M61.5 22 L76.5 22" stroke="#E5DEF8" stroke-width="4"/>
        <circle cx="69" cy="0" r="4.2" fill="#F2A7BF"/></g>`,
    };
    const worn = ['nightcap', 'crown', 'santa', 'wreath', 'hat'].find((k) => acc[k]);
    if (worn) gear += HEADWEAR[worn];

    if (acc.flower) {
      const px = 40, py = 42;
      gear += `<g data-acc="flower">
        ${[[0, -4.6], [4.4, -1.4], [2.7, 3.7], [-2.7, 3.7], [-4.4, -1.4]].map(([dx, dy]) =>
          `<circle cx="${px + dx}" cy="${py + dy}" r="3.4" fill="#F2A7BF"/>`).join('')}
        <circle cx="${px}" cy="${py}" r="2.6" fill="#F0C24B"/></g>`;
    }
    if (acc.pumpkin) {
      gear += `<g data-acc="pumpkin">
        <path d="M20 92 Q19 85 25 84" stroke="#4C8A4C" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="20" cy="103" rx="14" ry="11" fill="#E8862E"/>
        <ellipse cx="20" cy="103" rx="6" ry="11" fill="none" stroke="#C96A2E" stroke-width="1.5"/>
        <path d="M13 100 l4.5 3.5 -4.5 2 z M27 100 l-4.5 3.5 4.5 2 z" fill="#5C3A10"/>
        <path d="M14.5 109 q5.5 4.5 11 0" stroke="#5C3A10" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
    }
  }

  return `<svg class="donkey otter" width="${size}" height="${size}" viewBox="0 0 140 120" aria-hidden="true">
    <!-- Kleine runde Ohren -->
    <circle cx="42" cy="38" r="9" fill="${BODY}"/>
    <circle cx="98" cy="38" r="9" fill="${BODY}"/>
    <circle cx="42" cy="38" r="4.5" fill="${MUZZLE}"/>
    <circle cx="98" cy="38" r="4.5" fill="${MUZZLE}"/>
    <!-- Rundlicher Kopf -->
    <ellipse cx="70" cy="66" rx="40" ry="35" fill="${BODY}"/>
    <!-- Heller Bauch-/Wangen-Fleck -->
    <ellipse cx="70" cy="80" rx="26" ry="20" fill="${BELLY}"/>
    <!-- Schnauze -->
    <ellipse cx="70" cy="82" rx="19" ry="13" fill="${MUZZLE}"/>
    ${whiskers}
    <path d="M63 74 Q70 80 77 74 L74 79 Q70 82 66 79 Z" fill="${NOSE}"/>
    ${eyes}${mouth}${extra}${gear}
  </svg>`;
}

// Fassade: dispatcht auf das aktuell gewählte Maskottchen
function mascotSvg(mood, size, acc) {
  return state.ui.mascot === 'otter' ? otterSvg(mood, size, acc) : donkeySvg(mood, size, acc);
}

// ---------- Belohnungen (Streak schaltet Accessoires frei) ----------

const REWARDS = [
  { days: 7,  key: 'flower', icon: '🌸', label: 'Blume' },
  { days: 30, key: 'hat',    icon: '🎉', label: 'Partyhut' },
  { days: 66, key: 'crown',  icon: '👑', label: 'Krone' },
];

function accessoriesFor(days) {
  return {
    flower: days >= 7,
    hat: days >= 30 && days < 66,
    crown: days >= 66,
  };
}

// Gauß'sche Osterformel (gregorianisch)
function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
    f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

// Goldene Woche: alles Fällige geschafft
function goldenWeek(wk) {
  const s = weekScore(wk);
  return s.due > 0 && s.done >= s.due;
}

// Streak-Belohnungen + Goldene-Woche-Krönchen + Saison + Tageszeit, mit Priorität
function currentAccessories(sd) {
  const acc = accessoriesFor(sd);
  if (goldenWeek(addDays(monday(today()), -7))) acc.crown = true; // Krönchen nach goldener Vorwoche
  const now = new Date();
  const h = now.getHours(), m = now.getMonth(), d = now.getDate();
  if (m === 11) acc.santa = true;                                          // Dezember 🎅
  if ((m === 11 && d === 31) || (m === 0 && d === 1)) { acc.santa = false; acc.hat = true; } // Silvester 🎉
  if (m === 9 && d >= 25) acc.pumpkin = true;                              // Halloween 🎃
  const es = easterSunday(now.getFullYear());
  const diff = Math.round((new Date(now.getFullYear(), m, d) - es) / 86400000);
  if (diff >= -2 && diff <= 1) acc.wreath = true;                          // Karfreitag–Ostermontag 🌼
  if (h >= 22 || h < 7) acc.nightcap = true;                               // Nacht 😴
  return acc;
}

// ---------- Konfetti (bei 100 % Tagesziel) ----------

function confetti() {
  window.__confetti = (window.__confetti || 0) + 1; // Hook für Tests
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  document.body.appendChild(cv);
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) { cv.remove(); return; }

  const W = window.innerWidth, H = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#C4547C', '#E58AA8', '#3F7BC8', '#C96A2E', '#7A63C9', '#4C8A4C', '#F0C24B'];
  const parts = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.35,
    vx: (Math.random() - 0.5) * 2.4,
    vy: 2.2 + Math.random() * 3.2,
    w: 6 + Math.random() * 5,
    h: 8 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.25,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const t0 = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (now - t0 < 2600) requestAnimationFrame(frame);
    else cv.remove();
  })(t0);
}

function moodFor(pct) {
  // Easter Egg: nachts (0–4 Uhr) bekommt der Esel unabhängig vom Fortschritt sein Schlafmützen-Gesicht
  if (new Date().getHours() < 4) return 'midnight';
  if (pct >= 100) return 'party';
  if (pct >= 50) return 'happy';
  if (pct > 0) return 'hopeful';
  return 'sleepy';
}

// Spruch pro Tag stabil, wechselt täglich. Easter Egg: freitags manchmal ein Wochenend-Gruß.
function pickQuote(mood) {
  let s = 0;
  for (const ch of iso(today())) s += ch.charCodeAt(0);
  if (today().getDay() === 5 && s % 3 === 0) {
    return state.ui.mascot === 'otter'
      ? 'Endlich Freitag! Zeit zum Planschen — aber die Habits erst noch abhaken. 🎉🐚'
      : 'Iiiaah, endlich Freitag! Zeit fürs Wochenende — aber die Habits erst noch abhaken. 🎉🥕';
  }
  const pool = mascotQuotes(mood);
  return pool[s % pool.length];
}

// Zufälliger Streichel-Spruch (nicht tagesstabil — jeder Tap darf anders klingen)
function pickPet() {
  const pool = mascotPets();
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- Rendering: Grundgerüst ----------

const $ = (sel) => document.querySelector(sel);
const main = $('#main');

let lastRenderedView = null;

function render() {
  // Einblend-Animationen nur beim Wechsel der Ansicht — nicht bei jedem
  // Abhaken/Update, sonst zuckt die ganze Liste bei jeder Interaktion
  main.classList.toggle('fresh', view !== lastRenderedView);
  lastRenderedView = view;
  const vd = addDays(today(), view === 'today' ? dayOffset : 0);
  $('#header-title').textContent = view === 'stats' ? 'Statistik'
    : dayOffset === 0 ? 'Heute'
    : dayOffset === -1 ? 'Gestern'
    : vd.toLocaleDateString('de-DE', { weekday: 'long' });
  $('#header-date').textContent = vd.toLocaleDateString('de-DE', {
    weekday: dayOffset === 0 || view === 'stats' ? 'long' : undefined,
    day: 'numeric', month: 'long',
  });

  // Tages-Pfeile: nur in der Heute-Ansicht, Zukunft gesperrt;
  // bei vergangenem Tag springt ein Tipp auf Titel/Datum zurück zu Heute
  const isTodayView = view === 'today';
  $('#day-prev').classList.toggle('hidden', !isTodayView);
  $('#day-next').classList.toggle('hidden', !isTodayView);
  $('#day-next').disabled = dayOffset >= 0;
  $('#header-day').classList.toggle('jumpable', isTodayView && dayOffset < 0);

  document.querySelectorAll('.tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === view));

  if (view === 'today') renderToday();
  else renderStats();
}

// SVG-Fortschrittsring (pct: 0–100 oder null)
// Mini-Fortschrittsbalken; bei Übererfüllung ein heller Overflow-Streifen obendrauf.
// isMax: „höchstens X" (z. B. Kalorien) — hier ist ein Überschreiten eine Warnung, keine Belohnung.
function miniBar(val, goal, c, isMax = false) {
  if (!goal) return '';
  const pct = Math.min(100, (val / goal) * 100);
  const overPct = val > goal ? Math.min(100, ((val - goal) / goal) * 100) : 0;
  const overColor = isMax ? '#E8B84B' : c.bg;
  return `<div class="mini-bar${overPct > 0 ? ' over' : ''}">
    <div style="width:${pct}%;background:${c.ink}"></div>
    ${overPct > 0 ? `<div class="overflow" style="width:${overPct}%;background:${overColor}"></div>` : ''}
  </div>`;
}

function ringSvg(pct, size = 76, stroke = 9) {
  const gid = 'rg' + Math.random().toString(36).slice(2, 7);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, pct ?? 0) / 100);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E58AA8"/><stop offset="100%" stop-color="#C4547C"/>
    </linearGradient></defs>
    <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
    <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"
      stroke="url(#${gid})" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"
      transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text class="ring-pct" x="50%" y="52%" text-anchor="middle" dominant-baseline="central">${pct === null ? '–' : pct + '%'}</text>
  </svg>`;
}

// Beste aktuelle Serie über alle Habits (für Esel-Accessoires + Statistik-Karte)
function bestCurrentStreak() {
  let best = null;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return;
    const st = streak(h);
    if (st.n === 0) return;
    const days = st.n * (h.freq.type === 'weekly' ? 7 : h.freq.type === 'monthly' ? 30 : 1);
    if (!best || days > best.days) best = { h, st, days };
  });
  return best;
}

// Konzentrische Ringe (Apple-Health-Stil), außen → innen in Array-Reihenfolge
function multiRingSvg(rings, size = 74, stroke = 7.5) {
  const cx = size / 2;
  let out = `<svg class="rings" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">`;
  rings.forEach((rg, i) => {
    const r = size / 2 - stroke / 2 - i * (stroke + 2.5);
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - Math.min(1, rg.frac));
    out += `
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${hexA(rg.color, 0.16)}" stroke-width="${stroke}"/>
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${rg.color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${cx} ${cx})" class="ring-fill"/>`;
  });
  return out + '</svg>';
}

// ---------- Heute ----------

function renderToday() {
  main.innerHTML = '';

  if (state.habits.length === 0) {
    main.innerHTML = `<div class="empty-state">
      ${mascotSvg('hopeful', 120)}
      <p style="margin-top:12px">Hallo, ich bin dein Habit-${mascotName()}! 🌸<br>
      Tippe unten auf <b>+</b> und leg deinen ersten Habit an — ich feuer dich an!</p>
    </div>`;
    return;
  }

  const vd = addDays(today(), dayOffset); // betrachteter Tag (Navigation im Header)
  const t = iso(vd);
  const isToday = dayOffset === 0;

  // Hero: Baby-Esel mit Stimmung + Spruch + Fortschritt des betrachteten Tags.
  // Wochen-/Monats-Habits zählen als erfüllt, sobald ihr Periodenziel steht;
  // Ereignis-Habits sind reine Logs und zählen gar nicht mit.
  // Esel-Stimmung & Konfetti: echte To-dos des Tages (wie gehabt)
  const todos = state.habits.filter((h) => actionableOn(h, t));
  const doneCount = todos.filter((h) => doneOn(h, t)).length;
  const total = todos.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  // Vor 7 Uhr ist auch der Esel noch verschlafen
  const earlyMorning = new Date().getHours() < 7;
  const mood = earlyMorning ? 'sleepy' : moodFor(total > 0 ? pct : 1);

  // Drei Ringe à la Apple Health — je Kategorie einer, nur wenn vorhanden.
  // Verzicht bekommt bewusst keinen Ring (startet immer voll = aussagelos).
  const rings = [];
  const dailyChecks = state.habits.filter((h) => h.kind === 'check' && h.freq.type === 'daily' && scheduledOn(h, t));
  if (dailyChecks.length) {
    const done = dailyChecks.filter((h) => doneOn(h, t)).length;
    rings.push({ color: '#C4547C', frac: done / dailyChecks.length, label: 'Heute', text: `${done}/${dailyChecks.length}`, cls: 'hero-count' });
  }
  const numbers = state.habits.filter((h) => h.kind === 'number' && scheduledOn(h, t));
  if (numbers.length) {
    const done = numbers.filter((h) => doneOn(h, t)).length;
    rings.push({ color: '#3F7BC8', frac: done / numbers.length, label: 'Ziele', text: `${done}/${numbers.length}`, cls: 'hero-goals' });
  }
  const periodics = state.habits.filter((h) => h.kind === 'check' && h.freq.type !== 'daily');
  if (periodics.length) {
    let got = 0, target = 0;
    periodics.forEach((h) => {
      let cnt;
      if (h.freq.type === 'weekly') {
        const wk = monday(vd);
        cnt = countInRange(h.id, wk, addDays(wk, 6));
      } else {
        const ms = monthStart(vd);
        cnt = countInRange(h.id, ms, addDays(ms, daysInMonth(vd) - 1));
      }
      got += Math.min(cnt, h.freq.target);
      target += h.freq.target;
    });
    const label = periodics.every((h) => h.freq.type === 'monthly') ? 'Monat' : 'Woche';
    const frac = target > 0 ? got / target : 0;
    rings.push({ color: '#4C8A4C', frac, label, text: `${Math.round(frac * 100)}%`, cls: 'hero-week' });
  }

  // Beste Serie nur noch für die Esel-Accessoires — die Anzeige lebt in der Statistik
  const best = bestCurrentStreak();
  const sd = best ? best.days : 0;
  const acc = currentAccessories(sd); // Streak + Goldene Woche + Saison + Tageszeit

  const hero = document.createElement('div');
  hero.className = 'hero';
  // Drittel-Layout: Esel links, Ringe in der Mitte, Zähler-Legende rechts
  hero.innerHTML = `
    <div class="donkey-tap" role="button" aria-label="${mascotName()} streicheln">${mascotSvg(mood, 104, acc)}</div>
    <div class="bubble-toast" aria-live="polite"></div>
    ${rings.length ? `${multiRingSvg(rings, 84, 8.5)}
    <div class="rings-legend">${rings.map((r) =>
      `<div class="rl"><span class="rl-dot" style="background:${r.color}"></span><b class="${r.cls}">${r.text}</b>&nbsp;${r.label}</div>`).join('')}</div>` : ''}`;
  main.appendChild(hero);

  // Sprechblase nur noch als kurzer Toast: bei Stimmungswechsel oder Antippen
  const toast = hero.querySelector('.bubble-toast');
  let toastTimer;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };
  if (mood !== lastMood) {
    showToast(pickQuote(mood));
    lastMood = mood;
  }

  // Easter Egg: Esel antippen zum Streicheln — kurz Herzaugen + Toast-Spruch
  const tapZone = hero.querySelector('.donkey-tap');
  tapZone.addEventListener('click', () => {
    tapZone.innerHTML = mascotSvg('heart', 104, acc);
    tapZone.classList.add('petted');
    showToast(pickPet());
    clearTimeout(tapZone._resetTimer);
    tapZone._resetTimer = setTimeout(() => {
      tapZone.innerHTML = mascotSvg(mood, 104, acc);
      tapZone.classList.remove('petted');
    }, 1800);
  });

  // Mood-Check-in: morgens einmal wählen, danach klappt die Karte in den Hero
  // (kleines Emoji-Badge oben rechts) — antippen klappt sie zum Ändern wieder aus
  const savedMood = state.moods[t];
  // Die Abfrage kommt erst abends (ab 18 Uhr) — vergangene Tage sind eh vorbei;
  // vorher lässt sich die Stimmung jederzeit über die Statistik eintragen
  const eveningReached = !isToday || new Date().getHours() >= 18;
  if (savedMood && !moodExpanded) {
    const badge = document.createElement('button');
    badge.className = 'hero-mood';
    badge.setAttribute('aria-label', 'Stimmung ändern');
    badge.textContent = MOODS[savedMood - 1].e;
    badge.addEventListener('click', () => { moodExpanded = true; render(); });
    hero.appendChild(badge);
    hero.classList.add('has-mood');
  } else if (savedMood || eveningReached) {
    const moodCard = document.createElement('div');
    moodCard.className = 'mood-card';
    moodCard.innerHTML = `
      <div class="mood-head">
        <div class="mood-q">${isToday ? 'Wie geht\'s dir heute?' : 'Wie ging\'s dir an dem Tag?'}</div>
        ${savedMood ? '<button class="mood-collapse" aria-label="Einklappen">Einklappen ▴</button>' : ''}
      </div>
      <div class="mood-row">${MOODS.map((m) =>
        `<button data-mood="${m.v}" class="${savedMood === m.v ? 'active' : ''}">${m.e}</button>`).join('')}</div>
      ${savedMood ? `<div class="mood-reaction">${mascotMoodReaction(savedMood)}</div>` : ''}`;
    moodCard.querySelectorAll('.mood-row button').forEach((b) =>
      b.addEventListener('click', () => {
        const v = Number(b.dataset.mood);
        if (state.moods[t] === v) delete state.moods[t]; // nochmal tippen = zurücknehmen
        else state.moods[t] = v;
        save();
        moodExpanded = false; // nach der Wahl einklappen
        render();
      }));
    moodCard.querySelector('.mood-collapse')?.addEventListener('click', () => {
      moodExpanded = false;
      render();
    });
    main.appendChild(moodCard);
  }

  // Einmalige „Was ist neu"-Karte nach einem Update
  if (isToday) {
    const upd = buildUpdateCard();
    if (upd) main.appendChild(upd);
  }

  // Einmalige Namens-Frage (für persönliche Briefe) — überspringbar
  if (isToday && !state.ui.userName && !state.ui.nameAsked) {
    const nc = document.createElement('div');
    nc.className = 'name-card';
    nc.innerHTML = `
      <div class="mood-q">👋 Wie darf dich ${state.ui.mascot === 'otter' ? 'der Otter' : 'der Esel'} nennen?</div>
      <div class="name-row">
        <input id="inp-username" type="text" placeholder="Dein Name" maxlength="20" autocomplete="given-name">
        <button id="btn-username-save" class="btn primary">Los!</button>
      </div>
      <button id="btn-username-skip" class="mood-collapse">Lieber nicht — dann sagt er einfach „du"</button>`;
    nc.querySelector('#btn-username-save').addEventListener('click', () => {
      const v = nc.querySelector('#inp-username').value.trim();
      if (v) state.ui.userName = v;
      state.ui.nameAsked = true;
      save();
      render();
    });
    nc.querySelector('#inp-username').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') nc.querySelector('#btn-username-save').click();
    });
    nc.querySelector('#btn-username-skip').addEventListener('click', () => {
      state.ui.nameAsked = true;
      save();
      render();
    });
    main.appendChild(nc);
  }

  // Wochenbrief: flattert sonntagabends rein (montags liegt er noch da)
  if (isToday) {
    const envelope = buildEnvelope();
    if (envelope) main.appendChild(envelope);
  }

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = 'Deine Habits';
  main.appendChild(label);

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    const done = doneOn(h, t);
    const st = streak(h);

    let sub, bar = '', action;

    if (h.kind === 'number') {
      const val = rawVal(h.id, t);
      const isMax = h.direction === 'max';
      const over = h.goal > 0 && val > 0 && (isMax ? val > h.goal : val > h.goal);
      const goalLbl = isMax ? `max. <b>${fmtNum(h.goal)} ${esc(h.unit)}</b>` : `Ziel <b>${fmtNum(h.goal)} ${esc(h.unit)}</b>`;
      sub = goalLbl + (over ? (isMax ? ' ⚠️ überschritten' : ' ✨ übertroffen') : '') +
        (st.n > 0 ? ` &nbsp;·&nbsp; 🔥 ${st.n} ${st.unit}` : '');
      bar = miniBar(val, h.goal, c, isMax);
      action = `<button class="value-btn ${done ? 'done' : ''} ${over && isMax ? 'warn' : ''}"
        style="${done ? `background:${c.ink}` : ''}"
        aria-label="Wert eintragen">${fmtNum(val)}<span>${esc(h.unit)}</span></button>`;
    } else if (h.kind === 'event') {
      const cntDay = rawVal(h.id, t);
      const ms = monthStart(vd);
      const cntMonth = sumInRange(h.id, ms, addDays(ms, daysInMonth(vd) - 1));
      sub = cntDay > 0
        ? `<b>${cntDay}×</b> ${isToday ? 'heute' : 'an dem Tag'} &nbsp;·&nbsp; ${cntMonth}× im Monat`
        : (cntMonth > 0 ? `<b>${cntMonth}×</b> im Monat` : 'Passiert einfach — kein Ziel');
      // Kein +: geloggt wird übers Plus-Formular; Badge zeigt den Zähler,
      // antippen öffnet das Anpassen-Sheet für diesen Tag
      action = `<button class="value-btn event-badge" aria-label="Zähler anpassen">${cntDay}<span>×</span></button>`;
    } else if (h.kind === 'quit') {
      const relapse = isDone(h.id, t);
      sub = relapse
        ? 'Rückfall 😔 — morgen zählt wieder!'
        : `🌱 <b>${st.n}</b> ${st.unit} ohne`;
      action = `<button class="value-btn relapse-btn ${relapse ? 'active' : ''}"
        aria-label="Rückfall eintragen">${relapse ? '✕ Rückfall' : 'Rückfall?'}</button>`;
    } else if (h.freq.type === 'daily') {
      if (!scheduledOn(h, t)) {
        sub = `Ruhetag — ${isToday ? 'heute' : 'an dem Tag'} nicht dran 😌`;
      } else {
        sub = st.n > 0 ? `🔥 <b>${st.n}</b> ${st.unit} in Folge`
          : (isToday ? 'Heute noch offen' : 'An dem Tag offen');
      }
    } else {
      // Wochen-/Monats-Habit: Fortschritt in der Periode des betrachteten Tags
      let cnt, label2;
      if (h.freq.type === 'weekly') {
        const wk = monday(vd);
        cnt = countInRange(h.id, wk, addDays(wk, 6));
        label2 = 'diese Woche';
      } else {
        const ms = monthStart(vd);
        cnt = countInRange(h.id, ms, addDays(ms, daysInMonth(vd) - 1));
        label2 = 'diesen Monat';
      }
      const reached = cnt >= h.freq.target;
      const over = cnt > h.freq.target;
      sub = (reached
        ? `Ziel erreicht ✓ <b>${cnt}/${h.freq.target}</b>${over ? ' ✨' : ''}`
        : `<b>${cnt}/${h.freq.target}</b> ${label2}`) +
        (st.n > 0 ? ` &nbsp;·&nbsp; 🔥 ${st.n} ${st.unit}` : '');
      bar = miniBar(cnt, h.freq.target, c);
    }

    if (h.kind === 'check') {
      action = `<button class="check-btn ${done ? 'done' : ''}"
        style="${done ? `background:${c.ink}` : ''}"
        aria-label="${done ? 'Erledigt' : 'Als erledigt markieren'}">✓</button>`;
    }

    const offday = h.kind !== 'event' && h.kind !== 'quit' &&
      h.freq.type === 'daily' && !scheduledOn(h, t);

    const card = document.createElement('div');
    card.className = 'habit-card' + (offday ? ' offday' : '');
    card.style.background = `linear-gradient(135deg, ${c.bg} 0%, ${hexA(c.bg, 0.55)} 100%)`;
    card.innerHTML = `
      <div class="habit-emoji">${h.emoji}</div>
      <div class="habit-info">
        <div class="name">${esc(h.name)}</div>
        <div class="sub">${sub}</div>
        ${bar}
      </div>
      ${action}`;

    card.querySelector('.habit-info').addEventListener('click', () => openHabitSheet(h.id));
    if (h.kind === 'number') {
      card.querySelector('.value-btn').addEventListener('click', () => openLog(h.id, t));
    } else if (h.kind === 'event') {
      card.querySelector('.value-btn').addEventListener('click', () => openEventLog(h.id, t));
    } else if (h.kind === 'quit') {
      card.querySelector('.relapse-btn').addEventListener('click', () => {
        const relapse = isDone(h.id, t);
        if (!relapse) {
          const days = streak(h).n;
          if (!confirm(`Rückfall ${isToday ? 'heute' : 'an dem Tag'} eintragen?` +
            (days > 1 ? ` Deine Serie (${days} Tage) beginnt dann neu.` : '') +
            ' Kein Drama — morgen zählt wieder! 🌱')) return;
        }
        toggle(h.id, t);
        render();
      });
    } else {
      card.querySelector('.check-btn').addEventListener('click', (e) => {
        const wasAll = allDoneToday();
        toggle(h.id, t);
        if (!wasAll && allDoneToday()) confetti();
        e.currentTarget.classList.add('pop');
        render();
      });
    }
    main.appendChild(card);
  });
}

// ---------- „Was ist neu"-Karte (einmalig pro Update) ----------

function buildUpdateCard() {
  const seen = state.ui.seenVersion || 0;
  const news = CHANGELOG.filter((e) => e.v > seen);
  if (news.length === 0) return null;

  const card = document.createElement('div');
  card.className = 'update-card';
  card.innerHTML = `
    <div class="update-head">
      <span class="update-donkey">${mascotSvg('party', 52)}</span>
      <div class="update-title">${state.ui.mascot === 'otter' ? 'Wiiii — es gibt Neuigkeiten!' : 'Iiiaah — es gibt Neuigkeiten!'}</div>
    </div>
    <ul class="update-list">
      ${news.flatMap((e) => e.items).map((i) => `<li>${i}</li>`).join('')}
    </ul>
    <button class="update-dismiss">Alles klar ✨</button>`;
  card.querySelector('.update-dismiss').addEventListener('click', () => {
    state.ui.seenVersion = APP_VERSION;
    save();
    render();
  });
  return card;
}

// ---------- Stimmungs-Sheet (rückblickend über die Statistik) ----------

function openMoodSheet(isoDate) {
  moodCtx = isoDate;
  $('#mood-sub').textContent = fromIso(isoDate).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  renderMoodSheetRow();
  openSheet($('#sheet-mood'));
}

function renderMoodSheetRow() {
  const row = $('#mood-sheet-row');
  row.innerHTML = '';
  MOODS.forEach((m) => {
    const b = document.createElement('button');
    b.textContent = m.e;
    b.classList.toggle('active', state.moods[moodCtx] === m.v);
    b.addEventListener('click', () => {
      if (state.moods[moodCtx] === m.v) delete state.moods[moodCtx];
      else state.moods[moodCtx] = m.v;
      save();
      renderMoodSheetRow();
      render();
    });
    row.appendChild(b);
  });
}

// ---------- Wochenrückblick ----------

// Gesamtquote einer Woche (tägliche + wöchentliche Habits, Pause-Tage ausgenommen)
function weekScore(wk) {
  const t = today();
  const wkEnd = addDays(wk, 6);
  let done = 0, due = 0;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return; // reine Logs, keine fälligen Einheiten
    const created = fromIso(h.createdAt);
    if (created > wkEnd) return;
    const from = created > wk ? created : wk;
    const upto = t < wkEnd ? t : wkEnd;
    if (upto < from) return;
    if (h.freq.type === 'daily') {
      const d = habitDueDays(h, from, upto); // geplante Tage minus Pausen
      due += d;
      done += Math.min(countDone(h, from, upto), d); // Bonus-Tage nicht überzählen
    } else if (h.freq.type === 'weekly') {
      due += h.freq.target;
      done += Math.min(countInRange(h.id, from, upto), h.freq.target);
    }
  });
  return { done, due, pct: due > 0 ? Math.round((done / due) * 100) : null };
}

// Motivations-Absätze je nach Wochenergebnis — der Esel urteilt nie, er mag dich
const LETTER_MOTIVATION = {
  great: [
    'Ich bin so stolz auf dich, dass meine Ohren ganz von allein wackeln! Du hast diese Woche richtig was gerissen. Lass uns nächste Woche genau so weitertraben — oder mit einem kleinen Freudensprung extra! 🎉',
    'IIIAAH! Was für eine Woche! Wenn ich Hufe zum Klatschen hätte, würdest du jetzt Standing Ovations bekommen. Nächste Woche zeigen wir allen, dass das kein Zufall war! ✨',
    'Du warst diese Woche mein absoluter Lieblingsmensch (gut, das bist du immer). Diese Energie nehmen wir mit — die nächste Woche kann kommen! 💛',
  ],
  good: [
    'Das war eine ordentliche Woche! Nicht jeder Tag war perfekt — muss er auch nicht. Die Richtung stimmt, und ich trab an deiner Seite. Nächste Woche holen wir uns noch ein Häkchen mehr! 🐾',
    'Solide Woche, wirklich! Und weißt du was? Die perfekte Woche ist gar nicht das Ziel — dranbleiben ist es. Genau das machst du. Weiter so! 🌸',
    'Gute Arbeit diese Woche! Ein paar Möhren haben wir liegen lassen, aber die holen wir uns nächste Woche einfach dazu. Ich glaub an dich! 🥕',
  ],
  rough: [
    'Diese Woche war schwer, hm? Komm her, Ohrenkuscheln. 🫂 Weißt du, was ich an dir mag? Du bist noch da. Das zählt mehr als jedes Häkchen. Nächste Woche fangen wir klein an — ein Habit, ein Tag, ein Schritt. Ich bin bei dir.',
    'Hey. Manche Wochen sind einfach zum Vergessen — und genau dafür gibt es neue Wochen. Kein Vorwurf, kein Drama, nur ein Esel, der dich anstupst: Morgen ist Montag, und Montage sind für Neuanfänge gemacht. 🌱',
    'Die Häkchen waren diese Woche schüchtern — macht nichts. Auch ich verstecke mich manchmal hinterm Heuhaufen. Wichtig ist: Wir kommen beide wieder raus. Nächste Woche, du und ich, ein neuer Anlauf. Versprochen? 💛',
  ],
};

const LETTER_PS = [
  'P.S. Ich habe für dich eine extra Möhre in den Stall gelegt. 🥕',
  'P.S. Streichel mich mal wieder — die Herzaugen vermisse ich schon!',
  'P.S. Wusstest du, dass Esel bis zu 50 Jahre alt werden? So lange bleibe ich mindestens bei dir.',
  'P.S. Vergiss dein Backup nicht — Einstellungen → Exportieren. Auch Briefe brauchen ein Zuhause. 📦',
  'P.S. Falls es mal schwer wird: Ein Pause-Tag ist keine Schwäche, sondern Eselsweisheit. ⏸',
];

// Otter-Pendants zum Wochenbrief
const LETTER_MOTIVATION_OTTER = {
  great: [
    'Ich bin so stolz auf dich, dass ich vor Freude Wasser-Purzelbäume schlage! Du hast diese Woche richtig was gerissen. Lass uns nächste Woche genau so weiterschwimmen — oder mit einem Extra-Sprung! 🎉',
    'WIIII! Was für eine Woche! Wenn ich Pfoten zum Klatschen hätte, würdest du jetzt Standing Ovations bekommen. Nächste Woche zeigen wir allen, dass das kein Zufall war! ✨',
    'Du warst diese Woche mein absoluter Lieblingsmensch (gut, das bist du immer). Diese Energie nehmen wir mit — die nächste Woche kann kommen! 💛',
  ],
  good: [
    'Das war eine ordentliche Woche! Nicht jeder Tag war perfekt — muss er auch nicht. Die Strömung stimmt, und ich schwimm an deiner Seite. Nächste Woche holen wir uns noch ein Häkchen mehr! 🦦',
    'Solide Woche, wirklich! Und weißt du was? Die perfekte Woche ist gar nicht das Ziel — dranbleiben ist es. Genau das machst du. Weiter so! 🌊',
    'Gute Arbeit diese Woche! Ein paar Muscheln haben wir liegen lassen, aber die holen wir uns nächste Woche einfach dazu. Ich glaub an dich! 🐚',
  ],
  rough: [
    'Diese Woche war schwer, hm? Komm her, Bauchkuscheln. 🫂 Weißt du, was ich an dir mag? Du bist noch da. Das zählt mehr als jedes Häkchen. Nächste Woche fangen wir klein an — ein Habit, ein Tag, ein Schritt. Ich bin bei dir.',
    'Hey. Manche Wochen sind einfach zum Vergessen — und genau dafür gibt es neue Wochen. Kein Vorwurf, kein Drama, nur ein Otter, der dich anstupst: Morgen ist Montag, und Montage sind für Neuanfänge gemacht. 🌱',
    'Die Häkchen waren diese Woche schüchtern — macht nichts. Auch ich verstecke mich manchmal im Schilf. Wichtig ist: Wir kommen beide wieder raus. Nächste Woche, du und ich, ein neuer Anlauf. Versprochen? 💛',
  ],
};

const LETTER_PS_OTTER = [
  'P.S. Ich habe für dich eine extra Muschel am Ufer versteckt. 🐚',
  'P.S. Streichel mich mal wieder — die Herzaugen vermisse ich schon!',
  'P.S. Wusstest du, dass Otter sich beim Schlafen an den Pfoten halten, damit sie nicht wegtreiben? So halten wir auch zusammen.',
  'P.S. Vergiss dein Backup nicht — Einstellungen → Exportieren. Auch Briefe brauchen ein Zuhause. 📦',
  'P.S. Falls es mal schwer wird: Ein Pause-Tag ist keine Schwäche, sondern Otter-Weisheit. ⏸',
];

// Stabiler Mini-Hash, damit derselbe Brief beim erneuten Öffnen gleich bleibt
function weekHash(key) {
  let s = 0;
  for (const ch of key) s = (s * 31 + ch.charCodeAt(0)) % 9973;
  return s;
}

// Stärkster Habit einer Woche (fürs Briefpapier)
function weekBestHabit(wk) {
  const t = today();
  const wkEnd = addDays(wk, 6);
  const upto = t < wkEnd ? t : wkEnd;
  let bestHabit = null, bestRatio = -1;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return;
    if (fromIso(h.createdAt) > upto) return;
    const from = fromIso(h.createdAt) > wk ? fromIso(h.createdAt) : wk;
    let ratio;
    if (h.freq.type === 'daily') {
      const due = habitDueDays(h, from, upto);
      ratio = due > 0 ? Math.min(1, countDone(h, from, upto) / due) : 0;
    } else if (h.freq.type === 'weekly') {
      ratio = Math.min(1, countInRange(h.id, from, upto) / h.freq.target);
    } else return;
    if (ratio > bestRatio) { bestRatio = ratio; bestHabit = h; }
  });
  return bestHabit ? { h: bestHabit, ratio: bestRatio } : null;
}

// Der Wochenbrief: Bilanz + Trend + Highlights + Motivation, als Briefpapier-HTML
function composeLetter(wk) {
  const wkEnd = addDays(wk, 6);
  const cur = weekScore(wk);
  const prev = weekScore(addDays(wk, -7));
  const bestH = weekBestHabit(wk);
  const bestS = bestCurrentStreak();
  const hash = weekHash(iso(wk));

  const fmt = (d) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  const pct = cur.pct ?? 0;
  const tier = pct >= 80 ? 'great' : pct >= 40 ? 'good' : 'rough';
  const isOtter = state.ui.mascot === 'otter';
  const motivationPool = isOtter ? LETTER_MOTIVATION_OTTER : LETTER_MOTIVATION;
  const psPool = isOtter ? LETTER_PS_OTTER : LETTER_PS;
  const motivation = motivationPool[tier][hash % motivationPool[tier].length];
  const ps = psPool[hash % psPool.length];

  let trend = '';
  if (prev.pct !== null && cur.pct !== null) {
    const d = cur.pct - prev.pct;
    if (d > 0) trend = isOtter
      ? `Das sind <b class="up">${d} Punkte mehr</b> als in der Woche davor — Strömung aufgenommen!`
      : `Das sind <b class="up">${d} Punkte mehr</b> als in der Woche davor — Trab aufgenommen!`;
    else if (d < 0) trend = `Das sind ${-d} Punkte weniger als in der Woche davor — aber Briefe wie dieser sind zum Neustarten da.`;
    else trend = 'Genau wie in der Woche davor — Beständigkeit ist auch eine Kunst.';
  }

  // Stimmungs-Schnitt der Woche
  const moodVals = [];
  for (let i = 0; i < 7; i++) {
    const v = state.moods[iso(addDays(wk, i))];
    if (v) moodVals.push(v);
  }
  const moodLine = moodVals.length
    ? `<p>Deine Stimmung diese Woche: im Schnitt ${MOODS[Math.round(moodVals.reduce((a, b) => a + b, 0) / moodVals.length) - 1].e} — danke, dass du sie mit mir teilst.</p>`
    : '';

  return `
    <div class="letter-head">${mascotSvg('happy', 56)}<div>
      <div class="letter-title">Post vom ${mascotName()}</div>
      <div class="letter-date">Woche vom ${fmt(wk)} – ${fmt(wkEnd)}</div>
    </div></div>
    <p class="letter-greet">Hallo ${state.ui.userName ? esc(state.ui.userName) : 'du'},</p>
    <p>${cur.due > 0
      ? `diese Woche hast du <b>${cur.pct}%</b> deiner Vorhaben geschafft (${cur.done} von ${cur.due}). ${trend}`
      : 'diese Woche war noch nichts fällig — perfekte Gelegenheit, nächste Woche gemeinsam loszulegen!'}</p>
    ${bestH ? `<p>Dein Star der Woche: ${bestH.h.emoji} <b>${esc(bestH.h.name)}</b> mit ${Math.round(bestH.ratio * 100)}% — Respekt!</p>` : ''}
    ${bestS ? `<p>Und deine beste Serie steht bei <b>${bestS.st.n} ${bestS.st.unit}</b> (${bestS.h.emoji} ${esc(bestS.h.name)}) 🔥</p>` : ''}
    ${moodLine}
    ${goldenWeek(wk) ? '<p class="letter-gold-note">✨ <b>Goldene Woche!</b> Du hast restlos alles geschafft. Zur Feier trage ich nächste Woche mein Krönchen — nur für dich. 👑</p>' : ''}
    <p class="letter-motivation" data-tier="${tier}">${motivation}</p>
    <p class="letter-sign">Dein ${mascotName()} ${isOtter ? '🦦' : '🐴'}💛</p>
    <p class="letter-ps">${ps}</p>`;
}

function openLetter(wk, fromEnvelope) {
  letterCtx = { key: iso(wk), fromEnvelope: !!fromEnvelope };
  $('#letter-content').classList.toggle('letter-golden', goldenWeek(wk));
  $('#letter-content').innerHTML = composeLetter(wk);
  $('#btn-close-letter').textContent = fromEnvelope ? `Danke, ${mascotName()}! 💛` : 'Schließen';
  openSheet($('#sheet-letter'));
}

// ---------- Erinnerungs-Album ----------

function openAlbum() {
  const box = $('#album-content');
  const t = today();

  // Rekord-Serie aller Zeiten (über alle Habits)
  let rec = null;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return;
    const r = bestStreakEver(h);
    if (r.n === 0) return;
    const days = r.n * (h.freq.type === 'weekly' ? 7 : h.freq.type === 'monthly' ? 30 : 1);
    if (!rec || days > rec.days) rec = { h, r, days };
  });
  const everDays = rec ? rec.days : 0;

  // Abgeschlossene Wochen (bis 12 zurück) + goldene zählen
  const rows = [];
  let goldenCount = 0;
  if (state.habits.length) {
    const first = state.habits.reduce((a, h) => fromIso(h.createdAt) < a ? fromIso(h.createdAt) : a, t);
    let wk = addDays(monday(t), -7);
    for (let i = 0; i < 12 && addDays(wk, 6) >= first; i++, wk = addDays(wk, -7)) {
      const s = weekScore(wk);
      if (s.due === 0) continue;
      const g = goldenWeek(wk);
      if (g) goldenCount++;
      rows.push({ wk: new Date(wk), pct: s.pct, g });
    }
  }

  box.innerHTML = `
    ${rec ? `<div class="album-record">🔥 Rekord-Serie: <b>${rec.r.n} ${rec.r.unit}</b> ${rec.h.emoji} ${esc(rec.h.name)}${goldenCount ? ` &nbsp;·&nbsp; ✨ ${goldenCount} goldene Woche${goldenCount === 1 ? '' : 'n'}` : ''}</div>` : '<p class="hint">Noch keine Serien — dein Album füllt sich von ganz allein. 🌱</p>'}
    <h3>Belohnungen</h3>
    <div class="album-rewards">${REWARDS.map((rw) =>
      `<div class="album-reward ${everDays >= rw.days ? '' : 'locked'}"><span>${rw.icon}</span><b>${rw.label}</b><small>ab ${rw.days} Tagen</small></div>`).join('')}</div>
    <h3>Wochenbriefe</h3>
    ${rows.length ? '<div class="album-letters"></div>' : '<p class="hint">Noch keine abgeschlossenen Wochen — dein erster Brief kommt am Sonntag! 📬</p>'}`;

  const list = box.querySelector('.album-letters');
  if (list) {
    const fmt = (d) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    rows.forEach(({ wk, pct, g }) => {
      const b = document.createElement('button');
      b.className = 'album-letter-row';
      b.innerHTML = `<span>${g ? '✨' : '📬'} ${fmt(wk)} – ${fmt(addDays(wk, 6))}</span><b>${pct}%</b><span class="chev">›</span>`;
      b.addEventListener('click', () => openLetter(wk, false));
      list.appendChild(b);
    });
  }
  openSheet($('#sheet-album'));
}

// Sonntagabend flattert der Brief rein (montags liegt er noch da)
function buildEnvelope() {
  const t = today();
  const dow = (t.getDay() + 6) % 7; // Mo=0 … So=6
  let wk;
  if (dow === 6 && new Date().getHours() >= 18) wk = monday(t); // So ab 18 Uhr: laufende Woche
  else if (dow === 0) wk = addDays(monday(t), -7);              // Mo: letzte Woche
  else return null;

  const key = iso(wk);
  if (state.ui.reviewDismissed === key) return null;
  if (weekScore(wk).due === 0) return null;

  const golden = goldenWeek(wk);
  const card = document.createElement('button');
  card.className = 'envelope-card' + (golden ? ' golden' : '');
  card.innerHTML = `
    <span class="envelope-icon">${golden ? '💌' : '📬'}</span>
    <span class="envelope-text">
      <span class="envelope-title">${golden ? '✨ Goldene Post!' : `Post vom ${mascotName()}!`}</span>
      <span class="envelope-sub">${golden ? 'Eine perfekte Woche — dieser Brief glänzt' : 'Dein Wochenbrief ist da — antippen zum Öffnen'}</span>
    </span>`;
  card.addEventListener('click', () => openLetter(wk, true));
  return card;
}

// ---------- Statistik ----------

function renderStats() {
  if (state.habits.length === 0) {
    main.innerHTML = `<div class="empty-state">
      ${mascotSvg('hopeful', 120)}
      <p style="margin-top:12px">Sobald du Habits trackst, zeige ich dir hier deine Wochen- und Monats-Auswertung. 📊</p>
    </div>`;
    return;
  }

  main.innerHTML = '';

  // Beste Serie + nächste Belohnung — hierher gezogen, damit der Hero clean bleibt
  const best = bestCurrentStreak();
  const sd = best ? best.days : 0;
  const next = REWARDS.find((r) => sd < r.days);
  const sc = document.createElement('div');
  sc.className = 'streak-card';
  sc.innerHTML = best
    ? `<span class="sc-streak">🔥 Beste Serie: <b>${best.st.n} ${best.st.unit}</b> <span class="streak-habit">${best.h.emoji} ${esc(best.h.name)}</span></span>` +
      (next
        ? `<span class="next-reward">${next.icon} ${next.label} in ${next.days - sd} ${next.days - sd === 1 ? 'Tag' : 'Tagen'}</span>`
        : '<span class="next-reward">👑 Alles freigeschaltet!</span>')
    : `<span class="sc-streak">Starte eine Serie — ab 7 Tagen gibt's die erste Belohnung! 🌸</span>`;
  main.appendChild(sc);

  const seg = document.createElement('div');
  seg.className = 'seg';
  seg.innerHTML = `
    <button data-mode="week" class="${statsMode === 'week' ? 'active' : ''}">Woche</button>
    <button data-mode="month" class="${statsMode === 'month' ? 'active' : ''}">Monat</button>
    <button data-mode="year" class="${statsMode === 'year' ? 'active' : ''}">Jahr</button>`;
  seg.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { statsMode = b.dataset.mode; statsOffset = 0; render(); }));
  main.appendChild(seg);

  if (statsMode === 'week') renderWeekStats();
  else if (statsMode === 'month') renderMonthStats();
  else renderYearStats();
}

// Stimmungs-Zeile für die Wochen-Statistik (nur wenn überhaupt Moods erfasst sind)
function moodWeekCard(wk, t) {
  const card = document.createElement('div');
  card.className = 'stat-card';
  const vals = [];
  for (let i = 0; i < 7; i++) vals.push(state.moods[iso(addDays(wk, i))]);
  const set = vals.filter(Boolean);
  const avg = set.length ? MOODS[Math.round(set.reduce((a, b) => a + b, 0) / set.length) - 1].e : '';
  card.innerHTML = `<div class="stat-head">
      <div class="habit-emoji">💭</div>
      <div class="name">Stimmung</div>
      <div class="val">${avg ? `Ø ${avg}` : ''}</div>
    </div><div class="week-row"></div>`;
  const row = card.querySelector('.week-row');
  for (let i = 0; i < 7; i++) {
    const d = addDays(wk, i);
    const dIso = iso(d);
    const v = vals[i];
    const future = d > t;
    const cell = document.createElement('button');
    cell.className = 'day-cell mood-cell' + (dIso === iso(t) ? ' today' : '') + (future ? ' future' : '');
    cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    cell.innerHTML = `<span class="dot">${v ? MOODS[v - 1].e : ''}</span><span class="lbl">${WEEKDAYS[i]}</span>`;
    if (!future) cell.addEventListener('click', () => openMoodSheet(dIso));
    row.appendChild(cell);
  }
  return card;
}

function periodNav(label, onPrev, onNext, canNext) {
  const nav = document.createElement('div');
  nav.className = 'period-nav';
  nav.innerHTML = `
    <button class="p-prev" aria-label="Zurück">‹</button>
    <span class="period-label">${label}</span>
    <button class="p-next" aria-label="Weiter" ${canNext ? '' : 'disabled'}>›</button>`;
  nav.querySelector('.p-prev').addEventListener('click', onPrev);
  nav.querySelector('.p-next').addEventListener('click', onNext);
  return nav;
}

function summaryTile(pct, sub) {
  const tile = document.createElement('div');
  tile.className = 'summary-tile';
  tile.innerHTML = `${ringSvg(pct, 68, 8)}<div class="summary-label">${sub}</div>`;
  return tile;
}

function statHead(h, val, detailBtn) {
  return `<div class="stat-head ${detailBtn ? 'tappable' : ''}">
    <div class="habit-emoji">${h.emoji}</div>
    <div class="name">${esc(h.name)}</div>
    <div class="val">${val}${detailBtn ? '<span class="chev">›</span>' : ''}</div>
  </div>`;
}

// --- Woche ---

function renderWeekStats() {
  const t = today();
  const wk = addDays(monday(t), statsOffset * 7);
  const wkEnd = addDays(wk, 6);
  const isCurrent = statsOffset === 0;

  const fmt = (d) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  main.appendChild(periodNav(
    isCurrent ? 'Diese Woche' : `${fmt(wk)} – ${fmt(wkEnd)}`,
    () => { statsOffset--; render(); },
    () => { if (statsOffset < 0) { statsOffset++; render(); } },
    !isCurrent));

  // Gesamt: geschaffte / fällige Einheiten in dieser Woche (Pause-Tage zählen nicht)
  const score = weekScore(wk);
  main.appendChild(summaryTile(score.pct,
    score.due > 0 ? `<b>${score.done}</b> von <b>${score.due}</b> fälligen Einheiten geschafft` : 'Keine fälligen Habits in dieser Woche'));

  // Abgeschlossene Wochen: der Wochenbrief bleibt nachlesbar
  if (!isCurrent) {
    const lb = document.createElement('button');
    lb.className = 'btn ghost letter-btn';
    lb.textContent = '📬 Wochenbrief lesen';
    lb.addEventListener('click', () => openLetter(wk, false));
    main.appendChild(lb);
  }

  const moodCard = moodWeekCard(wk, t);
  if (moodCard) main.appendChild(moodCard);

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    // Verzicht-Habits sind zeitlos: auch vor dem Anlegedatum anzeigen (Nachtragen!)
    if (h.kind !== 'quit' && fromIso(h.createdAt) > wkEnd) return;

    const card = document.createElement('div');
    card.className = 'stat-card';

    if (h.kind === 'quit') {
      // Verzicht: sauberer Tag = ✓, Rückfall = ✕; antippen korrigiert
      const st = quitStreak(h);
      card.innerHTML = statHead(h, `🌱 <b>${st}</b> ${st === 1 ? 'Tag' : 'Tage'} ohne`, false) +
        '<div class="week-row"></div>';
      const row = card.querySelector('.week-row');
      const start = quitStart(h);
      for (let i = 0; i < 7; i++) {
        const d = addDays(wk, i);
        const dIso = iso(d);
        const future = d > t;
        const before = d < start; // vor dem Start: kein ✓, aber Rückfall nachtragbar
        const relapse = isDone(h.id, dIso);
        const cell = document.createElement('button');
        cell.className = 'day-cell' + (relapse ? ' relapse' : (!future && !before ? ' done' : '')) +
          (future ? ' future' : '') + (before && !relapse ? ' offplan' : '') + (dIso === iso(t) ? ' today' : '');
        cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) +
          (relapse ? ' (Rückfall)' : before ? ' (Rückfall nachtragen)' : '');
        cell.innerHTML = `
          <span class="dot" style="${relapse ? '' : (!future && !before ? `background:${hexA(c.ink, 0.65)}` : '')}">${relapse ? '✕' : (!future && !before ? '✓' : '')}</span>
          <span class="lbl">${WEEKDAYS[i]}</span>`;
        if (!future) cell.addEventListener('click', () => { toggle(h.id, dIso); render(); });
        row.appendChild(cell);
      }
    } else if (h.kind === 'number') {
      // Mini-Balkenchart der 7 Tage
      const vals = [];
      for (let i = 0; i < 7; i++) vals.push(rawVal(h.id, iso(addDays(wk, i))));
      const daysElapsed = isCurrent ? Math.min(7, Math.round((t - wk) / 86400000) + 1) : 7;
      const avg = daysElapsed > 0 ? vals.slice(0, daysElapsed).reduce((a, b) => a + b, 0) / daysElapsed : 0;
      card.innerHTML = statHead(h, `Ø <b>${fmtNum(Math.round(avg * 10) / 10)}</b> ${esc(h.unit)}`, true) +
        barChart(vals, h, c, wk, t, 'week');
      wireBars(card, h, wk, t);
    } else if (h.kind === 'event') {
      const cnt = sumInRange(h.id, wk, wkEnd);
      card.innerHTML = statHead(h, `<b>${cnt}</b>× diese Woche`, true) + '<div class="week-row"></div>';
      const row = card.querySelector('.week-row');
      for (let i = 0; i < 7; i++) {
        const d = addDays(wk, i);
        const dIso = iso(d);
        const n = rawVal(h.id, dIso);
        const future = d > t;
        const cell = document.createElement('button');
        cell.className = 'day-cell' + (n > 0 ? ' done' : '') + (future ? ' future' : '') + (dIso === iso(t) ? ' today' : '');
        cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
        cell.innerHTML = `
          <span class="dot" style="${n > 0 ? `background:${c.ink}` : ''}">${n > 0 ? n : ''}</span>
          <span class="lbl">${WEEKDAYS[i]}</span>`;
        if (!future) cell.addEventListener('click', () => openEventLog(h.id, dIso));
        row.appendChild(cell);
      }
      card.querySelector('.stat-head').addEventListener('click', () => openDetail(h.id));
    } else {
      const cnt = countInRange(h.id, wk, wkEnd);
      let val;
      if (h.freq.type === 'daily') val = `<b>${cnt}</b>/${habitDueDays(h, wk, wkEnd)} Tage`;
      else if (h.freq.type === 'weekly') val = `<b>${cnt}</b>/${h.freq.target} Ziel`;
      else val = `<b>${cnt}</b>× diese Woche`;

      card.innerHTML = statHead(h, val, false) + '<div class="week-row"></div>';
      const row = card.querySelector('.week-row');
      for (let i = 0; i < 7; i++) {
        const d = addDays(wk, i);
        const dIso = iso(d);
        const dDone = isDone(h.id, dIso);
        const future = d > t;
        const paused = isPause(dIso) && !dDone;
        const off = !scheduledOn(h, dIso) && !dDone; // Ruhetag laut Wochentags-Plan
        const cell = document.createElement('button');
        cell.className = 'day-cell' + (dDone ? ' done' : '') + (future ? ' future' : '') +
          (paused ? ' pause' : '') + (off ? ' offplan' : '') + (dIso === iso(t) ? ' today' : '');
        cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) +
          (paused ? ' (Pause)' : off ? ' (Ruhetag)' : '');
        cell.innerHTML = `
          <span class="dot" style="${dDone ? `background:${c.ink}` : ''}">${dDone ? '✓' : paused ? '⏸' : off ? '·' : ''}</span>
          <span class="lbl">${WEEKDAYS[i]}</span>`;
        if (!future) cell.addEventListener('click', () => { toggle(h.id, dIso); render(); });
        row.appendChild(cell);
      }
    }

    if (h.kind === 'number') {
      card.querySelector('.stat-head').addEventListener('click', () => openDetail(h.id));
    }
    main.appendChild(card);
  });
}

// --- Monat ---

function renderMonthStats() {
  const t = today();
  const ms = new Date(t.getFullYear(), t.getMonth() + statsOffset, 1);
  const nDays = daysInMonth(ms);
  const mEnd = new Date(ms.getFullYear(), ms.getMonth(), nDays);
  const isCurrent = statsOffset === 0;

  main.appendChild(periodNav(
    ms.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
    () => { statsOffset--; render(); },
    () => { if (statsOffset < 0) { statsOffset++; render(); } },
    !isCurrent));

  // Gesamt
  let done = 0, due = 0;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return; // reine Logs, keine fälligen Einheiten
    const created = fromIso(h.createdAt);
    if (created > mEnd) return;
    const from = created > ms ? created : ms;
    const upto = isCurrent && t < mEnd ? t : mEnd;
    if (upto < from) return;
    if (h.freq.type === 'daily') {
      const d = habitDueDays(h, from, upto);
      due += d;
      done += Math.min(countDone(h, from, upto), d);
    } else if (h.freq.type === 'weekly') {
      const cnt = countInRange(h.id, from, upto);
      const weeks = Math.max(1, Math.ceil(((upto - from) / 86400000 + 1) / 7));
      due += weeks * h.freq.target;
      done += Math.min(cnt, weeks * h.freq.target);
    } else {
      const cnt = countInRange(h.id, from, upto);
      due += h.freq.target;
      done += Math.min(cnt, h.freq.target);
    }
  });
  const pct = due > 0 ? Math.round((done / due) * 100) : null;
  main.appendChild(summaryTile(pct,
    due > 0 ? `<b>${done}</b> von <b>${due}</b> fälligen Einheiten geschafft` : 'Keine fälligen Habits in diesem Monat'));

  // Stimmungs-Kalender (immer da — auch zum erstmaligen Nachtragen)
  {
    const mc = document.createElement('div');
    mc.className = 'stat-card';
    mc.innerHTML = `<div class="stat-head">
        <div class="habit-emoji">💭</div><div class="name">Stimmung</div><div class="val"></div>
      </div><div class="month-grid"></div>`;
    const grid = mc.querySelector('.month-grid');
    WEEKDAYS.forEach((w) => {
      const el = document.createElement('div');
      el.className = 'wd';
      el.textContent = w;
      grid.appendChild(el);
    });
    const lead = (ms.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) {
      const el = document.createElement('div');
      el.className = 'm-cell blank';
      grid.appendChild(el);
    }
    for (let day = 1; day <= nDays; day++) {
      const d = new Date(ms.getFullYear(), ms.getMonth(), day);
      const dIso = iso(d);
      const v = state.moods[dIso];
      const future = d > t;
      const el = document.createElement('button');
      el.className = 'm-cell mood-m' + (future ? ' future' : '') + (dIso === iso(t) ? ' today' : '');
      el.textContent = v ? MOODS[v - 1].e : day;
      el.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!future) el.addEventListener('click', () => openMoodSheet(dIso));
      grid.appendChild(el);
    }
    main.appendChild(mc);
  }

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    // Verzicht-Habits sind zeitlos: auch vor dem Anlegedatum anzeigen (Nachtragen!)
    if (h.kind !== 'quit' && fromIso(h.createdAt) > mEnd) return;

    const isNum = h.kind === 'number';
    const isEvent = h.kind === 'event';
    const isQuit = h.kind === 'quit';
    let val;
    if (isNum) {
      const sum = sumInRange(h.id, ms, mEnd);
      val = `<b>${fmtNum(sum)}</b> ${esc(h.unit)} gesamt`;
    } else if (isEvent) {
      val = `<b>${sumInRange(h.id, ms, mEnd)}</b>× diesen Monat`;
    } else if (isQuit) {
      const st = quitStreak(h);
      val = `🌱 <b>${st}</b> ${st === 1 ? 'Tag' : 'Tage'} ohne`;
    } else {
      const cnt = countInRange(h.id, ms, mEnd);
      if (h.freq.type === 'daily') val = `<b>${cnt}</b>/${habitDueDays(h, ms, mEnd)} Tage`;
      else if (h.freq.type === 'monthly') val = `<b>${cnt}</b>/${h.freq.target} Ziel`;
      else val = `<b>${cnt}</b>× diesen Monat`;
    }

    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = statHead(h, val, isNum || isEvent) + '<div class="month-grid"></div>';

    const grid = card.querySelector('.month-grid');
    WEEKDAYS.forEach((w) => {
      const el = document.createElement('div');
      el.className = 'wd';
      el.textContent = w;
      grid.appendChild(el);
    });

    const lead = (ms.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) {
      const el = document.createElement('div');
      el.className = 'm-cell blank';
      grid.appendChild(el);
    }
    for (let day = 1; day <= nDays; day++) {
      const d = new Date(ms.getFullYear(), ms.getMonth(), day);
      const dIso = iso(d);
      const future = d > t;
      const cell = document.createElement('button');
      cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

      if (isNum) {
        // Heatmap: Farbintensität nach Zielerreichung (eine Farbe, hell → dunkel).
        // Bei „höchstens X" ist wenig gut → Ratio invertiert (voll = nah am Limit/drüber).
        const v = rawVal(h.id, dIso);
        const ratio = Math.min(1, v / h.goal);
        cell.className = 'm-cell' + (future ? ' future' : '') + (dIso === iso(t) ? ' today' : '');
        if (v > 0) {
          const warn = h.direction === 'max' && v > h.goal;
          cell.style.background = warn ? hexA('#E8B84B', 0.18 + 0.82 * Math.min(1, ratio)) : hexA(c.ink, 0.18 + 0.82 * ratio);
          cell.style.color = ratio > 0.5 ? '#fff' : '';
          cell.style.fontWeight = '700';
        }
        cell.textContent = day;
        if (!future) cell.addEventListener('click', () => openLog(h.id, dIso));
      } else if (isEvent) {
        const n = rawVal(h.id, dIso);
        cell.className = 'm-cell' + (n > 0 ? ' done' : '') + (future ? ' future' : '') + (dIso === iso(t) ? ' today' : '');
        if (n > 0) { cell.style.background = c.ink; cell.style.color = '#fff'; cell.style.fontWeight = '700'; }
        cell.textContent = n > 0 ? n : day;
        if (!future) cell.addEventListener('click', () => openEventLog(h.id, dIso));
      } else if (isQuit) {
        const relapse = isDone(h.id, dIso);
        const before = d < quitStart(h); // vor dem Start: kein ✓, aber nachtragbar
        cell.className = 'm-cell' + (relapse ? ' relapse' : (!future && !before ? ' done' : '')) +
          (future ? ' future' : '') + (before && !relapse ? ' offplan' : '') + (dIso === iso(t) ? ' today' : '');
        if (relapse) cell.title += ' (Rückfall)';
        else if (before) cell.title += ' (Rückfall nachtragen)';
        cell.style.background = relapse || future || before ? '' : hexA(c.ink, 0.65);
        cell.textContent = relapse ? '✕' : (!future && !before ? '✓' : day);
        if (!future) cell.addEventListener('click', () => { toggle(h.id, dIso); render(); });
      } else {
        const dDone = isDone(h.id, dIso);
        const paused = isPause(dIso) && !dDone;
        const off = !scheduledOn(h, dIso) && !dDone;
        cell.className = 'm-cell' + (dDone ? ' done' : '') + (future ? ' future' : '') +
          (paused ? ' pause' : '') + (off ? ' offplan' : '') + (dIso === iso(t) ? ' today' : '');
        cell.style.background = dDone ? c.ink : '';
        cell.textContent = dDone ? '✓' : paused ? '⏸' : off ? '·' : day;
        if (!future) cell.addEventListener('click', () => { toggle(h.id, dIso); render(); });
      }
      grid.appendChild(cell);
    }

    if (isNum || isEvent) {
      card.querySelector('.stat-head').addEventListener('click', () => openDetail(h.id));
    }
    main.appendChild(card);
  });
}

// --- Jahr ---

// Längste Serie aller Zeiten (Rekord), in der Einheit des Habits
function bestStreakEver(h) {
  const t = today();
  const created = fromIso(h.createdAt);
  if (h.freq.type === 'weekly' && h.kind === 'check') {
    let best = 0, run = 0;
    for (let wk = monday(created); wk <= t; wk = addDays(wk, 7)) {
      if (countInRange(h.id, wk, addDays(wk, 6)) >= h.freq.target) { run++; best = Math.max(best, run); }
      else run = 0;
    }
    return { n: best, unit: best === 1 ? 'Woche' : 'Wochen' };
  }
  if (h.freq.type === 'monthly' && h.kind === 'check') {
    let best = 0, run = 0;
    for (let ms = monthStart(created); ms <= t; ms = new Date(ms.getFullYear(), ms.getMonth() + 1, 1)) {
      if (countInRange(h.id, ms, new Date(ms.getFullYear(), ms.getMonth() + 1, 0)) >= h.freq.target) { run++; best = Math.max(best, run); }
      else run = 0;
    }
    return { n: best, unit: best === 1 ? 'Monat' : 'Monate' };
  }
  // täglich (check/number/quit): Pausen & Ruhetage überspringen, nicht brechen
  let best = 0, run = 0;
  const scanFrom = h.kind === 'quit' ? quitStart(h) : created;
  for (let d = new Date(scanFrom); d <= t; d = addDays(d, 1)) {
    const i = iso(d);
    if (doneOn(h, i)) run++;
    else if (isPause(i) || !scheduledOn(h, i)) { /* Serie läuft weiter */ }
    else run = 0;
    best = Math.max(best, run);
  }
  return { n: best, unit: best === 1 ? 'Tag' : 'Tage' };
}

function renderYearStats() {
  const t = today();
  const y = t.getFullYear() + statsOffset;
  const from = new Date(y, 0, 1);
  const to = new Date(y, 11, 31);
  const isCurrent = statsOffset === 0;

  main.appendChild(periodNav(String(y),
    () => { statsOffset--; render(); },
    () => { if (statsOffset < 0) { statsOffset++; render(); } },
    !isCurrent));

  // Jahres-Gesamtquote
  let done = 0, due = 0;
  state.habits.forEach((h) => {
    if (h.kind === 'event') return;
    const created = fromIso(h.createdAt);
    if (created > to) return;
    const f = created > from ? created : from;
    const upto = isCurrent && t < to ? t : to;
    if (upto < f) return;
    if (h.freq.type === 'daily') {
      const d = habitDueDays(h, f, upto);
      due += d;
      done += Math.min(countDone(h, f, upto), d);
    } else if (h.freq.type === 'weekly') {
      const weeks = Math.max(1, Math.ceil(((upto - f) / 86400000 + 1) / 7));
      due += weeks * h.freq.target;
      done += Math.min(countInRange(h.id, f, upto), weeks * h.freq.target);
    } else {
      const months = (upto.getFullYear() - f.getFullYear()) * 12 + (upto.getMonth() - f.getMonth()) + 1;
      due += months * h.freq.target;
      done += Math.min(countInRange(h.id, f, upto), months * h.freq.target);
    }
  });
  const pct = due > 0 ? Math.round((done / due) * 100) : null;
  main.appendChild(summaryTile(pct,
    due > 0 ? `<b>${done}</b> von <b>${due}</b> fälligen Einheiten in ${y} geschafft` : `Noch keine fälligen Habits in ${y}`));

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    const created = fromIso(h.createdAt);
    if (created > to) return;

    // Kopfzeile: Jahresbilanz + Rekord-Serie
    let val;
    const rec = bestStreakEver(h);
    if (h.kind === 'number') {
      val = `<b>${fmtNum(sumInRange(h.id, from, to))}</b> ${esc(h.unit)} · Rekord ${rec.n} ${rec.unit}`;
    } else if (h.kind === 'event') {
      val = `<b>${sumInRange(h.id, from, to)}</b>× in ${y}`;
    } else if (h.kind === 'quit') {
      val = `🏆 Rekord: <b>${rec.n}</b> ${rec.unit} ohne`;
    } else {
      val = `<b>${countInRange(h.id, from, to)}</b>× · Rekord ${rec.n} ${rec.unit}`;
    }

    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = statHead(h, val, false) + '<div class="year-scroll"><div class="year-grid"></div></div>';
    const grid = card.querySelector('.year-grid');

    // GitHub-Style: Spalten = Wochen, Zeilen = Mo–So
    const start = monday(from);
    const weeks = Math.ceil((addDays(to, 1) - start) / 86400000 / 7);
    const evtMax = h.kind === 'event'
      ? Math.max(1, ...Object.values(state.logs[h.id] || {})) : 1;
    // Verzicht: rückwirkend nachgetragene Rückfälle verschieben den Start nach vorn
    const habitStart = h.kind === 'quit' ? quitStart(h) : created;

    for (let w = 0; w < weeks; w++) {
      for (let r = 0; r < 7; r++) {
        const d = addDays(start, w * 7 + r);
        const dIso = iso(d);
        const cell = document.createElement('div');
        cell.className = 'yh-cell';
        if (d < from || d > to || d > t || d < habitStart) {
          cell.classList.add('void');
        } else {
          cell.title = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
          let bg = '';
          if (h.kind === 'quit') {
            bg = isDone(h.id, dIso) ? '#C0392B' : hexA(c.ink, 0.6);
          } else if (h.kind === 'number') {
            const v = rawVal(h.id, dIso);
            if (v > 0) bg = hexA(c.ink, 0.25 + 0.75 * Math.min(1, v / h.goal));
          } else if (h.kind === 'event') {
            const v = rawVal(h.id, dIso);
            if (v > 0) bg = hexA(c.ink, 0.35 + 0.65 * Math.min(1, v / evtMax));
          } else {
            if (isDone(h.id, dIso)) bg = c.ink;
          }
          if (bg) cell.style.background = bg;
        }
        grid.appendChild(cell);
      }
    }
    main.appendChild(card);
  });
}

// ---------- Balkenchart für Zahlen-Habits ----------

// vals: Werte pro Tag ab `from`; mode 'week' (7 Balken, Labels) | 'month' (viele Balken)
function barChart(vals, h, c, from, t, mode) {
  const maxVal = Math.max(...vals);
  // 18 % Luft nach oben: die Ziellinie klebt so nie am oberen Rand,
  // selbst wenn das Ziel der höchste Wert im Chart ist
  const chartMax = Math.max(h.goal, maxVal, 1) * 1.18;
  const goalPct = (h.goal / chartMax) * 100;
  const isMax = h.direction === 'max';

  let bars = '';
  for (let i = 0; i < vals.length; i++) {
    const d = addDays(from, i);
    const future = d > t;
    const v = vals[i];
    const hPct = (v / chartMax) * 100;
    // „Mindestens": voll ab Ziel · „Höchstens": voll, solange unter der Grenze
    const reached = v > 0 && (isMax ? v <= h.goal : v >= h.goal);
    // Ein Farbton, zwei Stufen: geschafft = voll, sonst hell (sequential)
    const fill = reached ? c.ink : hexA(c.ink, 0.35);
    // Selektive Labels: Woche = alle Werte > 0; Monat = nur Bestwert
    const showLbl = v > 0 && (mode === 'week' || v === maxVal);
    bars += `<div class="bar ${future ? 'future' : ''}" data-i="${i}"
        title="${d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}: ${fmtNum(v)} ${esc(h.unit)}">
      ${showLbl ? `<span class="bv" style="bottom:calc(${hPct}% + 3px)">${fmtNum(v)}</span>` : ''}
      <div class="bf" style="height:${Math.max(hPct, v > 0 ? 3 : 0)}%;background:${fill}"></div>
    </div>`;
  }

  let xlbls = '';
  if (mode === 'week') {
    xlbls = WEEKDAYS.map((w, i) =>
      `<span class="${iso(addDays(from, i)) === iso(t) ? 'today' : ''}">${w}</span>`).join('');
  } else {
    xlbls = vals.map((_, i) => {
      const day = i + 1;
      return `<span>${(day === 1 || day % 7 === 0) ? day : ''}</span>`;
    }).join('');
  }

  return `<div class="chart ${mode}">
      <div class="goal-line" style="bottom:${goalPct}%">
        <span class="goal-tag">${isMax ? 'Max.' : 'Ziel'} ${fmtNum(h.goal)}</span>
      </div>
      ${bars}
    </div>
    <div class="chart-x ${mode}">${xlbls}</div>`;
}

function wireBars(container, h, from, t) {
  container.querySelectorAll('.bar:not(.future)').forEach((bar) => {
    bar.addEventListener('click', () => {
      openLog(h.id, iso(addDays(from, Number(bar.dataset.i))));
    });
  });
}

// ---------- Habit-Detail (Sheet mit großem Chart) ----------

function openDetail(id) {
  detail = { id, mode: statsMode, offset: statsOffset };
  renderDetail();
  openSheet($('#sheet-detail'));
}

function renderDetail() {
  if (!detail) return;
  const h = state.habits.find((x) => x.id === detail.id);
  if (!h) { closeSheet($('#sheet-detail')); detail = null; return; }
  const c = COLORS[h.color] || COLORS.rose;
  const t = today();
  const box = $('#detail-content');
  box.innerHTML = '';

  const isEvent = h.kind === 'event';

  // Kopf
  const goalLbl = isEvent ? '' : (h.direction === 'max' ? `Höchstens ${fmtNum(h.goal)} ${esc(h.unit)}` : `Tagesziel ${fmtNum(h.goal)} ${esc(h.unit)}`);
  const head = document.createElement('div');
  head.className = 'detail-head';
  head.innerHTML = `<span class="habit-emoji">${h.emoji}</span>
    <div><h2>${esc(h.name)}</h2>
    ${goalLbl ? `<p class="detail-sub">${goalLbl}</p>` : ''}</div>`;
  box.appendChild(head);

  // Woche/Monat-Umschalter
  const seg = document.createElement('div');
  seg.className = 'seg';
  seg.innerHTML = `
    <button data-mode="week" class="${detail.mode === 'week' ? 'active' : ''}">Woche</button>
    <button data-mode="month" class="${detail.mode === 'month' ? 'active' : ''}">Monat</button>`;
  seg.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { detail.mode = b.dataset.mode; detail.offset = 0; renderDetail(); }));
  box.appendChild(seg);

  // Zeitraum bestimmen
  let from, to, label;
  if (detail.mode === 'week') {
    from = addDays(monday(t), detail.offset * 7);
    to = addDays(from, 6);
    const fmt = (d) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    label = detail.offset === 0 ? 'Diese Woche' : `${fmt(from)} – ${fmt(to)}`;
  } else {
    from = new Date(t.getFullYear(), t.getMonth() + detail.offset, 1);
    to = new Date(from.getFullYear(), from.getMonth(), daysInMonth(from));
    label = from.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }

  box.appendChild(periodNav(label,
    () => { detail.offset--; renderDetail(); },
    () => { if (detail.offset < 0) { detail.offset++; renderDetail(); } },
    detail.offset < 0));

  if (isEvent) {
    renderEventDetail(h, from, to, box);
    return;
  }

  // Werte einsammeln
  const nDays = Math.round((to - from) / 86400000) + 1;
  const vals = [];
  for (let i = 0; i < nDays; i++) vals.push(rawVal(h.id, iso(addDays(from, i))));

  const upto = to > t ? t : to;
  const elapsed = upto >= from ? Math.round((upto - from) / 86400000) + 1 : 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = elapsed > 0 ? sum / elapsed : 0;
  const hit = countDone(h, from, upto < from ? from : upto);
  const hitLbl = h.direction === 'max' ? 'Im Limit' : 'Ziel erreicht';

  // KPI-Reihe
  const kpi = document.createElement('div');
  kpi.className = 'kpi-row';
  kpi.innerHTML = `
    <div class="kpi"><div class="k-val">${fmtNum(Math.round(avg * 10) / 10)}</div><div class="k-lbl">Ø pro Tag</div></div>
    <div class="kpi"><div class="k-val">${fmtNum(sum)}</div><div class="k-lbl">${esc(h.unit)} gesamt</div></div>
    <div class="kpi"><div class="k-val">${hit}<span class="k-of">/${elapsed}</span></div><div class="k-lbl">${hitLbl}</div></div>`;
  box.appendChild(kpi);

  // Chart
  const chartWrap = document.createElement('div');
  chartWrap.innerHTML = barChart(vals, h, c, from, t, detail.mode);
  box.appendChild(chartWrap);
  wireBars(chartWrap, h, from, t);
}

// Detail-Ansicht für Ereignis-Habits: Tage mit Zähler, antippen zum Anpassen
function renderEventDetail(h, from, to, box) {
  const nDays = Math.round((to - from) / 86400000) + 1;
  let total = 0;
  const rows = [];
  for (let i = 0; i < nDays; i++) {
    const d = addDays(from, i);
    const dIso = iso(d);
    const n = rawVal(h.id, dIso);
    total += n;
    if (n > 0) rows.push({ dIso, d, n });
  }

  const kpi = document.createElement('div');
  kpi.className = 'kpi-row';
  kpi.innerHTML = `<div class="kpi" style="flex:1"><div class="k-val">${total}×</div><div class="k-lbl">in diesem Zeitraum</div></div>`;
  box.appendChild(kpi);

  const list = document.createElement('div');
  list.className = 'event-list detail-event-list';
  if (rows.length === 0) {
    list.innerHTML = '<p class="event-empty">Keine Einträge in diesem Zeitraum.</p>';
  } else {
    rows.reverse().forEach((r) => {
      const row = document.createElement('button');
      row.className = 'event-row';
      const dLbl = r.d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
      row.innerHTML = `<span><b class="ev-date">${dLbl}</b></span><span class="ev-count">${r.n}×</span><span class="chev">›</span>`;
      row.addEventListener('click', () => openEventLog(h.id, r.dIso));
      list.appendChild(row);
    });
  }
  box.appendChild(list);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn ghost event-add-today';
  addBtn.textContent = '+1 für heute';
  addBtn.addEventListener('click', () => {
    bumpEvent(h.id, iso(today()));
    renderDetail();
    render();
  });
  box.appendChild(addBtn);
}

// ---------- Wert-Sheet (Zahlen-Habits) ----------

function openLog(habitId, isoDate) {
  const h = state.habits.find((x) => x.id === habitId);
  if (!h) return;
  logCtx = { habitId, date: isoDate };

  $('#log-title').textContent = `${h.emoji} ${h.name}`;
  const d = fromIso(isoDate);
  $('#log-sub').textContent = d.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  $('#log-current-val').textContent = fmtNum(rawVal(habitId, isoDate));
  $('#log-unit').textContent = ` ${h.unit} · ${h.direction === 'max' ? 'Höchstens' : 'Ziel'} ${fmtNum(h.goal)}`;
  $('#inp-log').value = '';
  openSheet($('#sheet-log'));
  setTimeout(() => $('#inp-log').focus(), 250);
}

function applyLog(mode) { // 'add' | 'set' | 'clear'
  if (!logCtx) return;
  const h = state.habits.find((x) => x.id === logCtx.habitId);
  if (!h) return;

  const wasAll = allDoneToday();
  if (mode === 'clear') {
    setVal(h.id, logCtx.date, 0);
  } else {
    const raw = $('#inp-log').value.trim().replace(',', '.');
    const v = parseFloat(raw);
    if (isNaN(v) || v < 0) { $('#inp-log').focus(); return; }
    const cur = rawVal(h.id, logCtx.date);
    setVal(h.id, logCtx.date, mode === 'add' ? cur + v : v);
  }
  if (!wasAll && allDoneToday()) confetti();

  closeSheet($('#sheet-log'));
  logCtx = null;
  render();
  if (detail && !$('#sheet-detail').classList.contains('hidden')) renderDetail();
}

// ---------- Ereignis-Sheet: Zähler eines Tages anpassen ----------

function openEventLog(habitId, isoDate) {
  const h = state.habits.find((x) => x.id === habitId);
  if (!h) return;
  eventCtx = { habitId, date: isoDate };

  $('#event-title').textContent = `${h.emoji} ${h.name}`;
  const d = fromIso(isoDate);
  $('#event-sub').textContent = d.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  $('#event-count').textContent = rawVal(habitId, isoDate);
  openSheet($('#sheet-event'));
}

function adjustEvent(delta) {
  if (!eventCtx) return;
  bumpEvent(eventCtx.habitId, eventCtx.date, delta);
  $('#event-count').textContent = rawVal(eventCtx.habitId, eventCtx.date);
  render();
  if (detail && !$('#sheet-detail').classList.contains('hidden')) renderDetail();
}

// ---------- Habit-Sheet (anlegen / bearbeiten) ----------

function openHabitSheet(id) {
  editingId = id || null;
  const h = id ? state.habits.find((x) => x.id === id) : null;

  $('#sheet-habit-title').textContent = h ? 'Habit bearbeiten' : 'Neuer Habit';
  $('#inp-name').value = h ? h.name : '';
  $('#inp-unit').value = h && h.unit ? h.unit : '';
  $('#inp-goal').value = h && h.goal ? fmtNum(h.goal) : '';
  $('#btn-delete-habit').classList.toggle('hidden', !h);
  // Art nur beim Anlegen wählbar (nachträglich ändern würde die Logs entwerten)
  $('#kind-block').classList.toggle('hidden', !!h);

  sheetSel = h
    ? { emoji: h.emoji, color: h.color, freq: h.freq.type, target: h.freq.target, kind: h.kind || 'check', direction: h.direction || 'min', days: Array.isArray(h.days) ? [...h.days] : [0, 1, 2, 3, 4, 5, 6] }
    : { emoji: EMOJIS[0], color: 'rose', freq: 'daily', target: 3, kind: 'check', direction: 'min', days: [0, 1, 2, 3, 4, 5, 6] };

  renderSheetControls();
  openSheet($('#sheet-habit'));
  if (!h) setTimeout(() => $('#inp-name').focus(), 250);
}

function renderSheetControls() {
  // Art
  document.querySelectorAll('#kind-seg button').forEach((b) =>
    b.classList.toggle('active', b.dataset.kind === sheetSel.kind));
  const isNum = sheetSel.kind === 'number';
  const isEvent = sheetSel.kind === 'event';
  const isQuit = sheetSel.kind === 'quit';
  $('#freq-block').classList.toggle('hidden', isNum || isEvent || isQuit);
  $('#number-block').classList.toggle('hidden', !isNum);

  if (isNum) {
    document.querySelectorAll('#direction-seg button').forEach((b) =>
      b.classList.toggle('active', b.dataset.dir === sheetSel.direction));
    $('#goal-label').textContent = sheetSel.direction === 'max' ? 'Höchstgrenze' : 'Tagesziel';
  }

  // Wochentags-Plan: für tägliche Abhaken-Habits und Zahlen-Habits
  const showDays = (sheetSel.kind === 'check' && sheetSel.freq === 'daily') || isNum;
  $('#days-block').classList.toggle('hidden', !showDays);
  if (showDays) {
    const dr = $('#days-row');
    dr.innerHTML = '';
    WEEKDAYS.forEach((w, i) => {
      const b = document.createElement('button');
      b.textContent = w;
      b.classList.toggle('active', sheetSel.days.includes(i));
      b.addEventListener('click', () => {
        if (sheetSel.days.includes(i)) {
          if (sheetSel.days.length === 1) return; // mindestens ein Tag bleibt
          sheetSel.days = sheetSel.days.filter((x) => x !== i);
        } else {
          sheetSel.days = [...sheetSel.days, i].sort();
        }
        renderSheetControls();
      });
      dr.appendChild(b);
    });
  }

  // Bestehende Ereignisse als Chips: antippen loggt sie direkt für heute
  const existing = state.habits.filter((h) => h.kind === 'event');
  const showExisting = isEvent && !editingId && existing.length > 0;
  $('#event-existing-block').classList.toggle('hidden', !showExisting);
  if (showExisting) {
    const row = $('#event-existing');
    row.innerHTML = '';
    existing.forEach((h) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = `${h.emoji} ${h.name}`;
      chip.addEventListener('click', () => {
        bumpEvent(h.id, iso(today()));
        closeSheet($('#sheet-habit'));
        render();
      });
      row.appendChild(chip);
    });
  }

  // Emojis (Presets + eigenes)
  const er = $('#emoji-row');
  er.innerHTML = '';
  EMOJIS.forEach((e) => {
    const b = document.createElement('button');
    b.textContent = e;
    b.classList.toggle('active', e === sheetSel.emoji);
    b.addEventListener('click', () => { sheetSel.emoji = e; renderSheetControls(); });
    er.appendChild(b);
  });
  $('#inp-emoji').value = EMOJIS.includes(sheetSel.emoji) ? '' : sheetSel.emoji;

  // Farben
  const cr = $('#color-row');
  cr.innerHTML = '';
  Object.entries(COLORS).forEach(([key, c]) => {
    const b = document.createElement('button');
    b.style.background = c.ink;
    b.setAttribute('aria-label', key);
    b.classList.toggle('active', key === sheetSel.color);
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg>';
    b.addEventListener('click', () => { sheetSel.color = key; renderSheetControls(); });
    cr.appendChild(b);
  });

  // Frequenz
  document.querySelectorAll('#freq-seg button').forEach((b) => {
    b.classList.toggle('active', b.dataset.freq === sheetSel.freq);
  });
  const tb = $('#target-block');
  tb.classList.toggle('hidden', sheetSel.freq === 'daily');
  $('#target-label').textContent =
    sheetSel.freq === 'weekly' ? 'Ziel pro Woche' : 'Ziel pro Monat';
  $('#target-value').textContent = sheetSel.target;
}

function saveHabit() {
  const name = $('#inp-name').value.trim();
  if (!name) { $('#inp-name').focus(); return; }

  const isNum = sheetSel.kind === 'number';
  const isEvent = sheetSel.kind === 'event';
  const isQuit = sheetSel.kind === 'quit';
  let unit = '', goal = 0;
  if (isNum) {
    unit = $('#inp-unit').value.trim() || '×';
    goal = parseFloat($('#inp-goal').value.trim().replace(',', '.'));
    if (isNaN(goal) || goal <= 0) { $('#inp-goal').focus(); return; }
  }

  const freq = (isNum || isEvent || isQuit)
    ? { type: 'daily', target: 1 }
    : { type: sheetSel.freq, target: sheetSel.freq === 'daily' ? 1 : sheetSel.target };

  // Wochentags-Plan nur für tägliche Abhaken-Habits und Zahlen-Habits
  const days = ((sheetSel.kind === 'check' && freq.type === 'daily') || isNum)
    ? [...sheetSel.days] : undefined;

  if (editingId) {
    const h = state.habits.find((x) => x.id === editingId);
    Object.assign(h, { name, emoji: sheetSel.emoji, color: sheetSel.color, freq });
    if (days) h.days = days; else delete h.days;
    if (h.kind === 'number') { h.unit = unit; h.goal = goal; h.direction = sheetSel.direction; }
  } else {
    const id = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const habit = {
      id,
      name,
      emoji: sheetSel.emoji,
      color: sheetSel.color,
      kind: sheetSel.kind,
      unit,
      goal,
      direction: sheetSel.direction,
      freq,
      createdAt: iso(today()),
    };
    if (days) habit.days = days;
    state.habits.push(habit);
    // Ein neues Ereignis anlegen heißt: es ist gerade passiert → direkt für heute loggen
    if (isEvent) setVal(id, iso(today()), 1);
  }
  save();
  closeSheet($('#sheet-habit'));
  editingId = null;
  render();
}

function deleteHabit() {
  const h = state.habits.find((x) => x.id === editingId);
  if (!h) return;
  if (!confirm(`„${h.name}" wirklich löschen? Alle Einträge gehen verloren.`)) return;
  state.habits = state.habits.filter((x) => x.id !== editingId);
  delete state.logs[editingId];
  save();
  closeSheet($('#sheet-habit'));
  editingId = null;
  render();
}

// ---------- Einstellungen (Pause & Reihenfolge) ----------

function renderSettings() {
  $('#inp-settings-name').value = state.ui.userName || '';
  const current = state.ui.mascot === 'otter' ? 'otter' : 'donkey';
  document.querySelectorAll('.mascot-choice').forEach((b) =>
    b.classList.toggle('active', b.dataset.mascot === current));
  $('#mascot-preview-donkey').innerHTML = donkeySvg('happy', 48, accessoriesFor(0));
  $('#mascot-preview-otter').innerHTML = otterSvg('happy', 48, accessoriesFor(0));
  $('#settings-name-hint').textContent =
    `Damit der ${current === 'otter' ? 'Otter' : 'Esel'} dich in seinen Briefen persönlich ansprechen kann.`;
  const t = iso(today());
  $('#btn-pause-today').textContent = isPause(t)
    ? 'Pause für heute aufheben'
    : 'Heute pausieren ⏸';

  const list = $('#sort-list');
  $('#sort-group').classList.toggle('hidden', state.habits.length < 2);
  list.innerHTML = '';
  state.habits.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'sort-row';
    row.innerHTML = `
      <span class="sort-name">${h.emoji} ${esc(h.name)}</span>
      <span class="sort-btns">
        <button data-dir="-1" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button data-dir="1" aria-label="Nach unten" ${i === state.habits.length - 1 ? 'disabled' : ''}>↓</button>
      </span>`;
    row.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        const j = i + Number(b.dataset.dir);
        [state.habits[i], state.habits[j]] = [state.habits[j], state.habits[i]];
        save();
        renderSettings();
        render();
      }));
    list.appendChild(row);
  });
}

// ---------- Export / Import ----------

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `habit-tracker-backup-${iso(today())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.habits) || typeof data.logs !== 'object') {
        throw new Error('invalid');
      }
      if (!confirm('Import ersetzt alle aktuellen Daten. Fortfahren?')) return;
      migrate(data);
      state = data;
      save();
      closeSheet($('#sheet-settings'));
      render();
    } catch (e) {
      alert('Die Datei konnte nicht gelesen werden. Ist es ein Export dieser App?');
    }
  };
  reader.readAsText(file);
}

// ---------- Events ----------

document.querySelectorAll('.tab').forEach((b) =>
  b.addEventListener('click', () => { view = b.dataset.view; statsOffset = 0; dayOffset = 0; render(); }));

$('#day-prev').addEventListener('click', () => { dayOffset--; moodExpanded = false; render(); });
$('#day-next').addEventListener('click', () => { if (dayOffset < 0) { dayOffset++; moodExpanded = false; render(); } });
$('#header-day').addEventListener('click', () => {
  if (view === 'today' && dayOffset < 0) { dayOffset = 0; render(); }
});

$('#btn-add').addEventListener('click', () => openHabitSheet(null));
$('#btn-settings').addEventListener('click', () => {
  renderSettings();
  openSheet($('#sheet-settings'));
});

$('#inp-settings-name').addEventListener('change', () => {
  const v = $('#inp-settings-name').value.trim();
  if (v) state.ui.userName = v;
  else delete state.ui.userName;
  state.ui.nameAsked = true;
  save();
});

document.querySelectorAll('.mascot-choice').forEach((b) =>
  b.addEventListener('click', () => {
    state.ui.mascot = b.dataset.mascot === 'otter' ? 'otter' : 'donkey';
    save();
    renderSettings();
    render();
  }));

$('#btn-album').addEventListener('click', openAlbum);
$('#btn-close-album').addEventListener('click', () => closeSheet($('#sheet-album')));

$('#btn-pause-today').addEventListener('click', () => {
  const t = iso(today());
  if (state.pauses[t]) delete state.pauses[t];
  else state.pauses[t] = 1;
  save();
  renderSettings();
  render();
});

$('#btn-save-habit').addEventListener('click', saveHabit);
$('#btn-cancel-habit').addEventListener('click', () => {
  closeSheet($('#sheet-habit'));
  editingId = null;
});
$('#btn-delete-habit').addEventListener('click', deleteHabit);
$('#btn-close-settings').addEventListener('click', () => closeSheet($('#sheet-settings')));
$('#btn-close-detail').addEventListener('click', () => {
  closeSheet($('#sheet-detail'));
  detail = null;
});

$('#inp-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveHabit(); });

// Eigenes Emoji: erstes Zeichen (Graphem) übernehmen, Presets deaktivieren
$('#inp-emoji').addEventListener('input', () => {
  const v = $('#inp-emoji').value.trim();
  if (!v) {
    sheetSel.emoji = EMOJIS[0];
  } else if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    sheetSel.emoji = [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(v)][0].segment;
  } else {
    sheetSel.emoji = v;
  }
  // Aktiv-Zustände direkt togglen (kein Re-Render, sonst verliert das Feld den Fokus)
  document.querySelectorAll('#emoji-row button').forEach((b) =>
    b.classList.toggle('active', b.textContent === sheetSel.emoji));
});
$('#inp-log').addEventListener('keydown', (e) => { if (e.key === 'Enter') applyLog('add'); });

document.querySelectorAll('#kind-seg button').forEach((b) =>
  b.addEventListener('click', () => { sheetSel.kind = b.dataset.kind; renderSheetControls(); }));

document.querySelectorAll('#direction-seg button').forEach((b) =>
  b.addEventListener('click', () => { sheetSel.direction = b.dataset.dir; renderSheetControls(); }));

document.querySelectorAll('#freq-seg button').forEach((b) =>
  b.addEventListener('click', () => { sheetSel.freq = b.dataset.freq; renderSheetControls(); }));

$('#target-minus').addEventListener('click', () => {
  sheetSel.target = Math.max(1, sheetSel.target - 1);
  renderSheetControls();
});
$('#target-plus').addEventListener('click', () => {
  const max = sheetSel.freq === 'weekly' ? 7 : 31;
  sheetSel.target = Math.min(max, sheetSel.target + 1);
  renderSheetControls();
});

$('#btn-log-add').addEventListener('click', () => applyLog('add'));
$('#btn-log-set').addEventListener('click', () => applyLog('set'));
$('#btn-log-clear').addEventListener('click', () => applyLog('clear'));

$('#event-plus').addEventListener('click', () => adjustEvent(1));
$('#event-minus').addEventListener('click', () => adjustEvent(-1));
$('#btn-close-event').addEventListener('click', () => closeSheet($('#sheet-event')));
$('#btn-close-mood').addEventListener('click', () => closeSheet($('#sheet-mood')));
$('#btn-close-letter').addEventListener('click', () => {
  if (letterCtx && letterCtx.fromEnvelope) {
    state.ui.reviewDismissed = letterCtx.key;
    save();
  }
  letterCtx = null;
  closeSheet($('#sheet-letter'));
  render();
});

// Backdrop-Tap schließt jeweils nur das eigene Sheet
document.querySelectorAll('.sheet-backdrop').forEach((bd) => {
  bd.addEventListener('click', (e) => { if (e.target === bd) closeSheet(bd); });
  wireSwipeToDismiss(bd);
});

$('#btn-export').addEventListener('click', exportData);
$('#btn-import').addEventListener('click', () => $('#inp-import').click());
$('#inp-import').addEventListener('change', (e) => {
  if (e.target.files[0]) importData(e.target.files[0]);
  e.target.value = '';
});

// Beim Tageswechsel (App bleibt offen) neu rendern
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});



// ---------- Service Worker ----------

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}

// ---------- Start ----------

render();
