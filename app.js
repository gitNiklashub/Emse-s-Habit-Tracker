/* ================================================================== */
/*  Emse's Habit Tracker — vanilla JS, localStorage, keine Builds      */
/* ================================================================== */

'use strict';

// ---------- Konstanten ----------

const STORAGE_KEY = 'emse-habits-v1';

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

// ---------- State ----------

let state = load();
let view = 'today';               // 'today' | 'stats'
let statsMode = 'week';           // 'week' | 'month'
let statsOffset = 0;              // 0 = aktuelle Periode, -1 = vorherige, …
let editingId = null;             // Habit-ID im Sheet (null = neu)
let sheetSel = { emoji: EMOJIS[0], color: 'rose', freq: 'daily', target: 3, kind: 'check', direction: 'min' };
let logCtx = null;                // { habitId, date } fürs Wert-Sheet
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
  return { version: 1, habits: [], logs: {}, pauses: {}, ui: {} };
}

// Ältere Datenstände auf den aktuellen Stand heben
function migrate(data) {
  data.habits.forEach((h) => {
    if (!h.kind) h.kind = 'check';
    if (h.kind === 'number' && !h.direction) h.direction = 'min';
  });
  if (!data.pauses) data.pauses = {};
  if (!data.ui) data.ui = {};
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

// „Zählt der Tag als geschafft?" — Zahlen-Habits: Tagesziel erreicht; Ereignis-Habits: nie ein „Ziel"
function doneOn(h, isoDate) {
  if (h.kind === 'number') return goalReached(h, rawVal(h.id, isoDate));
  if (h.kind === 'event') return false;
  return isDone(h.id, isoDate);
}

// Ereignis-Log eines Tages: Array von { text } — mehrere Ereignisse pro Tag möglich
function eventsOn(habitId, isoDate) {
  return (state.logs[habitId] && state.logs[habitId][isoDate]) || [];
}

function addEvent(habitId, isoDate, text) {
  if (!state.logs[habitId]) state.logs[habitId] = {};
  if (!Array.isArray(state.logs[habitId][isoDate])) state.logs[habitId][isoDate] = [];
  state.logs[habitId][isoDate].push({ text, at: Date.now() });
  save();
}

function removeEvent(habitId, isoDate, idx) {
  const arr = state.logs[habitId] && state.logs[habitId][isoDate];
  if (!Array.isArray(arr)) return;
  arr.splice(idx, 1);
  if (arr.length === 0) delete state.logs[habitId][isoDate];
  save();
}

function eventCountInRange(habitId, from, to) {
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) n += eventsOn(habitId, iso(d)).length;
  return n;
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

// Fällige Tage in einem Zeitraum (Pause-Tage zählen nicht)
function dueDaysBetween(from, to) {
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    if (!isPause(iso(d))) n++;
  }
  return n;
}

function allDoneToday() {
  const t = iso(today());
  return state.habits.length > 0 && state.habits.every((h) => doneOn(h, t));
}

// ---------- Streaks ----------

function streak(habit) {
  const t = today();
  if (habit.freq.type === 'daily') {
    // Pause-Tage brechen die Serie nicht (zählen aber nur, wenn trotzdem erledigt)
    let n = 0;
    let d = doneOn(habit, iso(t)) ? t : addDays(t, -1);
    for (let guard = 0; guard < 3700; guard++) {
      const dIso = iso(d);
      if (doneOn(habit, dIso)) n++;
      else if (!isPause(dIso)) break;
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

  // Belohnungs-Accessoires (durch Streaks freigeschaltet)
  let gear = '';
  if (acc) {
    if (acc.crown) {
      gear += `<g data-acc="crown"><path d="M56 20 L60 35 L84 35 L88 20 L80 27 L72 16 L64 27 Z" fill="#F0C24B"/>
        <circle cx="56" cy="19" r="2.6" fill="#F0C24B"/><circle cx="72" cy="15" r="2.6" fill="#F0C24B"/><circle cx="88" cy="19" r="2.6" fill="#F0C24B"/></g>`;
    } else if (acc.hat) {
      gear += `<g data-acc="hat"><polygon points="70,4 59,36 81,36" fill="#7A63C9"/>
        <path d="M62.5 26 L77.5 26" stroke="#E5DEF8" stroke-width="4"/>
        <circle cx="70" cy="4" r="4.2" fill="#F2A7BF"/></g>`;
    }
    if (acc.flower) {
      const px = 38, py = 45;
      gear += `<g data-acc="flower">
        ${[[0, -4.6], [4.4, -1.4], [2.7, 3.7], [-2.7, 3.7], [-4.4, -1.4]].map(([dx, dy]) =>
          `<circle cx="${px + dx}" cy="${py + dy}" r="3.4" fill="#F2A7BF"/>`).join('')}
        <circle cx="${px}" cy="${py}" r="2.6" fill="#F0C24B"/></g>`;
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

// ---------- Belohnungen (Streak schaltet Accessoires frei) ----------

const REWARDS = [
  { days: 7,  key: 'flower', icon: '🌸', label: 'Blume' },
  { days: 30, key: 'hat',    icon: '🎉', label: 'Partyhut' },
  { days: 66, key: 'crown',  icon: '👑', label: 'Krone' },
];

// Beste aktuelle Serie über alle Habits, umgerechnet in Tage
function bestStreakDays() {
  let best = 0;
  state.habits.forEach((h) => {
    const st = streak(h);
    const factor = h.freq.type === 'weekly' ? 7 : h.freq.type === 'monthly' ? 30 : 1;
    best = Math.max(best, st.n * factor);
  });
  return best;
}

function accessoriesFor(days) {
  return {
    flower: days >= 7,
    hat: days >= 30 && days < 66,
    crown: days >= 66,
  };
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
    return 'Iiiaah, endlich Freitag! Zeit fürs Wochenende — aber die Habits erst noch abhaken. 🎉🥕';
  }
  const pool = QUOTES[mood];
  return pool[s % pool.length];
}

// Zufälliger Streichel-Spruch (nicht tagesstabil — jeder Tap darf anders klingen)
function pickPet() {
  return PETS[Math.floor(Math.random() * PETS.length)];
}

// ---------- Rendering: Grundgerüst ----------

const $ = (sel) => document.querySelector(sel);
const main = $('#main');

function render() {
  $('#header-title').textContent = view === 'today' ? 'Heute' : 'Statistik';
  const t = new Date();
  $('#header-date').textContent = t.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

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

// ---------- Heute ----------

function renderToday() {
  main.innerHTML = '';

  if (state.habits.length === 0) {
    main.innerHTML = `<div class="empty-state">
      ${donkeySvg('hopeful', 120)}
      <p style="margin-top:12px">Hallo, ich bin dein Habit-Esel! 🌸<br>
      Tippe unten auf <b>+</b> und leg deinen ersten Habit an — ich feuer dich an!</p>
    </div>`;
    return;
  }

  const t = iso(today());

  // Hero: Baby-Esel mit Stimmung + Spruch + Fortschritt
  const doneCount = state.habits.filter((h) => doneOn(h, t)).length;
  const total = state.habits.length;
  const pct = Math.round((doneCount / total) * 100);
  const mood = moodFor(pct);

  // Streak & Belohnungen
  const sd = bestStreakDays();
  const next = REWARDS.find((r) => sd < r.days);
  const streakInfo = sd > 0
    ? `🔥 <b>${sd}</b> ${sd === 1 ? 'Tag' : 'Tage'} beste Serie` +
      (next
        ? `<span class="next-reward">${next.icon} ${next.label} in ${next.days - sd} ${next.days - sd === 1 ? 'Tag' : 'Tagen'}</span>`
        : '<span class="next-reward">👑 Alles freigeschaltet!</span>')
    : `Starte eine Serie — ab 7 Tagen gibt's die erste Belohnung! 🌸`;

  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.innerHTML = `
    <div class="donkey-tap" role="button" aria-label="Esel streicheln">${donkeySvg(mood, 104, accessoriesFor(sd))}</div>
    <div class="hero-right">
      <div class="bubble">${pickQuote(mood)}</div>
      <div class="hero-progress">
        <div class="hero-bar"><div style="width:${pct}%"></div></div>
        <span class="hero-count">${doneCount}/${total}</span>
      </div>
      <div class="streak-row">${streakInfo}</div>
    </div>`;
  main.appendChild(hero);

  // Easter Egg: Esel antippen zum Streicheln — kurz Herzaugen + zufälliger Spruch
  const tapZone = hero.querySelector('.donkey-tap');
  tapZone.addEventListener('click', () => {
    tapZone.innerHTML = donkeySvg('heart', 104, accessoriesFor(sd));
    tapZone.classList.add('petted');
    const bubble = hero.querySelector('.bubble');
    bubble.textContent = pickPet();
    clearTimeout(tapZone._resetTimer);
    tapZone._resetTimer = setTimeout(() => {
      tapZone.innerHTML = donkeySvg(mood, 104, accessoriesFor(sd));
      tapZone.classList.remove('petted');
      bubble.textContent = pickQuote(mood);
    }, 1800);
  });

  // Wochenrückblick (sonntags für die laufende, montags für die letzte Woche)
  const review = buildReviewCard();
  if (review) main.appendChild(review);

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
      const evts = eventsOn(h.id, t);
      sub = evts.length > 0
        ? `Heute: ${evts.map((e) => esc(e.text)).join(', ')}`
        : 'Noch kein Eintrag heute';
      action = `<button class="value-btn event-btn" aria-label="Ereignis loggen">+</button>`;
    } else if (h.freq.type === 'daily') {
      sub = st.n > 0 ? `🔥 <b>${st.n}</b> ${st.unit} in Folge` : 'Heute noch offen';
    } else {
      let cnt, label2;
      if (h.freq.type === 'weekly') {
        const wk = monday(today());
        cnt = countInRange(h.id, wk, addDays(wk, 6));
        label2 = 'diese Woche';
      } else {
        const ms = monthStart(today());
        cnt = countInRange(h.id, ms, addDays(ms, daysInMonth(today()) - 1));
        label2 = 'diesen Monat';
      }
      const over = cnt > h.freq.target;
      sub = `<b>${cnt}/${h.freq.target}</b> ${label2}` + (over ? ' ✨' : '') +
        (st.n > 0 ? ` &nbsp;·&nbsp; 🔥 ${st.n} ${st.unit}` : '');
      bar = miniBar(cnt, h.freq.target, c);
    }

    if (h.kind === 'check') {
      action = `<button class="check-btn ${done ? 'done' : ''}"
        style="${done ? `background:${c.ink}` : ''}"
        aria-label="${done ? 'Erledigt' : 'Als erledigt markieren'}">✓</button>`;
    }

    const card = document.createElement('div');
    card.className = 'habit-card';
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

// ---------- Wochenrückblick ----------

// Gesamtquote einer Woche (tägliche + wöchentliche Habits, Pause-Tage ausgenommen)
function weekScore(wk) {
  const t = today();
  const wkEnd = addDays(wk, 6);
  let done = 0, due = 0;
  state.habits.forEach((h) => {
    const created = fromIso(h.createdAt);
    if (created > wkEnd) return;
    const from = created > wk ? created : wk;
    const upto = t < wkEnd ? t : wkEnd;
    if (upto < from) return;
    if (h.freq.type === 'daily') {
      const d = dueDaysBetween(from, upto);
      due += d;
      done += Math.min(countDone(h, from, upto), d); // am Pause-Tag Erledigtes nicht überzählen
    } else if (h.freq.type === 'weekly') {
      due += h.freq.target;
      done += Math.min(countInRange(h.id, from, upto), h.freq.target);
    }
  });
  return { done, due, pct: due > 0 ? Math.round((done / due) * 100) : null };
}

function buildReviewCard() {
  const t = today();
  const dow = (t.getDay() + 6) % 7; // Mo=0 … So=6
  let wk;
  if (dow === 6) wk = monday(t);            // Sonntag: laufende Woche
  else if (dow === 0) wk = addDays(monday(t), -7); // Montag: letzte Woche
  else return null;

  const key = iso(wk);
  if (state.ui.reviewDismissed === key) return null;

  const cur = weekScore(wk);
  if (cur.due === 0) return null;
  const prev = weekScore(addDays(wk, -7));

  // Stärkster Habit dieser Woche
  let bestHabit = null, bestRatio = -1;
  state.habits.forEach((h) => {
    const wkEnd = addDays(wk, 6);
    const upto = t < wkEnd ? t : wkEnd;
    if (fromIso(h.createdAt) > upto) return;
    const from = fromIso(h.createdAt) > wk ? fromIso(h.createdAt) : wk;
    let ratio;
    if (h.freq.type === 'daily') {
      const due = dueDaysBetween(from, upto);
      ratio = due > 0 ? countDone(h, from, upto) / due : 0;
    } else if (h.freq.type === 'weekly') {
      ratio = Math.min(1, countInRange(h.id, from, upto) / h.freq.target);
    } else return;
    if (ratio > bestRatio) { bestRatio = ratio; bestHabit = h; }
  });

  let trend = '';
  if (prev.pct !== null && cur.pct !== null) {
    const d = cur.pct - prev.pct;
    if (d > 0) trend = `<span class="up">▲ ${d} Punkte</span> besser als letzte Woche`;
    else if (d < 0) trend = `<span class="down">▼ ${-d} Punkte</span> unter letzter Woche — neue Woche, neues Glück!`;
    else trend = 'genau wie letzte Woche';
  }

  const card = document.createElement('div');
  card.className = 'review-card';
  card.innerHTML = `
    <div class="review-title">🗞️ Wochenrückblick</div>
    <div class="review-line"><b>${cur.pct}%</b> geschafft (${cur.done}/${cur.due})${trend ? ' · ' + trend : ''}</div>
    ${bestHabit ? `<div class="review-line">Stärkster Habit: ${bestHabit.emoji} <b>${esc(bestHabit.name)}</b> (${Math.round(bestRatio * 100)}%)</div>` : ''}
    <button class="review-dismiss">Alles klar 🥕</button>`;
  card.querySelector('.review-dismiss').addEventListener('click', () => {
    state.ui.reviewDismissed = key;
    save();
    render();
  });
  return card;
}

// ---------- Statistik ----------

function renderStats() {
  if (state.habits.length === 0) {
    main.innerHTML = `<div class="empty-state">
      ${donkeySvg('hopeful', 120)}
      <p style="margin-top:12px">Sobald du Habits trackst, zeige ich dir hier deine Wochen- und Monats-Auswertung. 📊</p>
    </div>`;
    return;
  }

  main.innerHTML = '';

  const seg = document.createElement('div');
  seg.className = 'seg';
  seg.innerHTML = `
    <button data-mode="week" class="${statsMode === 'week' ? 'active' : ''}">Woche</button>
    <button data-mode="month" class="${statsMode === 'month' ? 'active' : ''}">Monat</button>`;
  seg.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { statsMode = b.dataset.mode; statsOffset = 0; render(); }));
  main.appendChild(seg);

  if (statsMode === 'week') renderWeekStats();
  else renderMonthStats();
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

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    if (fromIso(h.createdAt) > wkEnd) return;

    const card = document.createElement('div');
    card.className = 'stat-card';

    if (h.kind === 'number') {
      // Mini-Balkenchart der 7 Tage
      const vals = [];
      for (let i = 0; i < 7; i++) vals.push(rawVal(h.id, iso(addDays(wk, i))));
      const daysElapsed = isCurrent ? Math.min(7, Math.round((t - wk) / 86400000) + 1) : 7;
      const avg = daysElapsed > 0 ? vals.slice(0, daysElapsed).reduce((a, b) => a + b, 0) / daysElapsed : 0;
      card.innerHTML = statHead(h, `Ø <b>${fmtNum(Math.round(avg * 10) / 10)}</b> ${esc(h.unit)}`, true) +
        barChart(vals, h, c, wk, t, 'week');
      wireBars(card, h, wk, t);
    } else if (h.kind === 'event') {
      const cnt = eventCountInRange(h.id, wk, wkEnd);
      card.innerHTML = statHead(h, `<b>${cnt}</b>× diese Woche`, true) + '<div class="week-row"></div>';
      const row = card.querySelector('.week-row');
      for (let i = 0; i < 7; i++) {
        const d = addDays(wk, i);
        const dIso = iso(d);
        const n = eventsOn(h.id, dIso).length;
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
      if (h.freq.type === 'daily') val = `<b>${cnt}</b>/7 Tage`;
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
        const cell = document.createElement('button');
        cell.className = 'day-cell' + (dDone ? ' done' : '') + (future ? ' future' : '') +
          (paused ? ' pause' : '') + (dIso === iso(t) ? ' today' : '');
        cell.title = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) +
          (paused ? ' (Pause)' : '');
        cell.innerHTML = `
          <span class="dot" style="${dDone ? `background:${c.ink}` : ''}">${dDone ? '✓' : paused ? '⏸' : ''}</span>
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
    const created = fromIso(h.createdAt);
    if (created > mEnd) return;
    const from = created > ms ? created : ms;
    const upto = isCurrent && t < mEnd ? t : mEnd;
    if (upto < from) return;
    if (h.freq.type === 'daily') {
      const d = dueDaysBetween(from, upto);
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

  state.habits.forEach((h) => {
    const c = COLORS[h.color] || COLORS.rose;
    if (fromIso(h.createdAt) > mEnd) return;

    const isNum = h.kind === 'number';
    const isEvent = h.kind === 'event';
    let val;
    if (isNum) {
      const sum = sumInRange(h.id, ms, mEnd);
      val = `<b>${fmtNum(sum)}</b> ${esc(h.unit)} gesamt`;
    } else if (isEvent) {
      val = `<b>${eventCountInRange(h.id, ms, mEnd)}</b>× diesen Monat`;
    } else {
      const cnt = countInRange(h.id, ms, mEnd);
      if (h.freq.type === 'daily') val = `<b>${cnt}</b>/${nDays} Tage`;
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
        const n = eventsOn(h.id, dIso).length;
        cell.className = 'm-cell' + (n > 0 ? ' done' : '') + (future ? ' future' : '') + (dIso === iso(t) ? ' today' : '');
        if (n > 0) { cell.style.background = c.ink; cell.style.color = '#fff'; cell.style.fontWeight = '700'; }
        cell.textContent = n > 0 ? n : day;
        if (!future) cell.addEventListener('click', () => openEventLog(h.id, dIso));
      } else {
        const dDone = isDone(h.id, dIso);
        const paused = isPause(dIso) && !dDone;
        cell.className = 'm-cell' + (dDone ? ' done' : '') + (future ? ' future' : '') +
          (paused ? ' pause' : '') + (dIso === iso(t) ? ' today' : '');
        cell.style.background = dDone ? c.ink : '';
        cell.textContent = dDone ? '✓' : paused ? '⏸' : day;
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

// ---------- Balkenchart für Zahlen-Habits ----------

// vals: Werte pro Tag ab `from`; mode 'week' (7 Balken, Labels) | 'month' (viele Balken)
function barChart(vals, h, c, from, t, mode) {
  const maxV = Math.max(h.goal, ...vals, 1);
  const goalPct = (h.goal / maxV) * 100;
  const maxVal = Math.max(...vals);

  let bars = '';
  for (let i = 0; i < vals.length; i++) {
    const d = addDays(from, i);
    const future = d > t;
    const v = vals[i];
    const hPct = (v / maxV) * 100;
    const reached = v >= h.goal;
    // Ein Farbton, zwei Stufen: Ziel erreicht = voll, sonst hell (sequential)
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
        <span class="goal-tag">Ziel ${fmtNum(h.goal)}</span>
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

// Detail-Ansicht für Ereignis-Habits: chronologische, bearbeitbare Liste statt Chart
function renderEventDetail(h, from, to, box) {
  const nDays = Math.round((to - from) / 86400000) + 1;
  let total = 0;
  const rows = [];
  for (let i = 0; i < nDays; i++) {
    const d = addDays(from, i);
    const dIso = iso(d);
    const evts = eventsOn(h.id, dIso);
    total += evts.length;
    evts.forEach((e, idx) => rows.push({ dIso, d, idx, text: e.text }));
  }

  const kpi = document.createElement('div');
  kpi.className = 'kpi-row';
  kpi.innerHTML = `<div class="kpi" style="flex:1"><div class="k-val">${total}</div><div class="k-lbl">Einträge in diesem Zeitraum</div></div>`;
  box.appendChild(kpi);

  const list = document.createElement('div');
  list.className = 'event-list detail-event-list';
  if (rows.length === 0) {
    list.innerHTML = '<p class="event-empty">Keine Einträge in diesem Zeitraum.</p>';
  } else {
    rows.reverse().forEach((r) => {
      const row = document.createElement('div');
      row.className = 'event-row';
      const dLbl = r.d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
      row.innerHTML = `<span><b class="ev-date">${dLbl}</b> ${esc(r.text)}</span><button aria-label="Löschen">✕</button>`;
      row.querySelector('button').addEventListener('click', () => {
        removeEvent(h.id, r.dIso, r.idx);
        renderDetail();
        render();
      });
      list.appendChild(row);
    });
  }
  box.appendChild(list);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn ghost event-add-today';
  addBtn.textContent = '+ Eintrag für heute';
  addBtn.addEventListener('click', () => openEventLog(h.id, iso(today())));
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

// ---------- Ereignis-Sheet (Ereignis-Habits) ----------

function openEventLog(habitId, isoDate) {
  const h = state.habits.find((x) => x.id === habitId);
  if (!h) return;
  eventCtx = { habitId, date: isoDate };

  $('#event-title').textContent = `${h.emoji} ${h.name}`;
  const d = fromIso(isoDate);
  $('#event-sub').textContent = d.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  $('#inp-event').value = '';
  renderEventList();
  openSheet($('#sheet-event'));
  setTimeout(() => $('#inp-event').focus(), 250);
}

function renderEventList() {
  if (!eventCtx) return;
  const list = $('#event-list');
  const evts = eventsOn(eventCtx.habitId, eventCtx.date);
  list.innerHTML = '';
  if (evts.length === 0) {
    list.innerHTML = '<p class="event-empty">Noch kein Eintrag für diesen Tag.</p>';
    return;
  }
  evts.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `<span>${esc(e.text)}</span><button aria-label="Löschen">✕</button>`;
    row.querySelector('button').addEventListener('click', () => {
      removeEvent(eventCtx.habitId, eventCtx.date, i);
      renderEventList();
      render();
      if (detail && !$('#sheet-detail').classList.contains('hidden')) renderDetail();
    });
    list.appendChild(row);
  });
}

function addEventEntry() {
  if (!eventCtx) return;
  const text = $('#inp-event').value.trim();
  if (!text) { $('#inp-event').focus(); return; }
  addEvent(eventCtx.habitId, eventCtx.date, text);
  $('#inp-event').value = '';
  renderEventList();
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
    ? { emoji: h.emoji, color: h.color, freq: h.freq.type, target: h.freq.target, kind: h.kind || 'check', direction: h.direction || 'min' }
    : { emoji: EMOJIS[0], color: 'rose', freq: 'daily', target: 3, kind: 'check', direction: 'min' };

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
  $('#freq-block').classList.toggle('hidden', isNum || isEvent);
  $('#number-block').classList.toggle('hidden', !isNum);

  if (isNum) {
    document.querySelectorAll('#direction-seg button').forEach((b) =>
      b.classList.toggle('active', b.dataset.dir === sheetSel.direction));
    $('#goal-label').textContent = sheetSel.direction === 'max' ? 'Höchstgrenze' : 'Tagesziel';
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
  let unit = '', goal = 0;
  if (isNum) {
    unit = $('#inp-unit').value.trim() || '×';
    goal = parseFloat($('#inp-goal').value.trim().replace(',', '.'));
    if (isNaN(goal) || goal <= 0) { $('#inp-goal').focus(); return; }
  }

  const freq = (isNum || isEvent)
    ? { type: 'daily', target: 1 }
    : { type: sheetSel.freq, target: sheetSel.freq === 'daily' ? 1 : sheetSel.target };

  if (editingId) {
    const h = state.habits.find((x) => x.id === editingId);
    Object.assign(h, { name, emoji: sheetSel.emoji, color: sheetSel.color, freq });
    if (h.kind === 'number') { h.unit = unit; h.goal = goal; h.direction = sheetSel.direction; }
  } else {
    state.habits.push({
      id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      emoji: sheetSel.emoji,
      color: sheetSel.color,
      kind: sheetSel.kind,
      unit,
      goal,
      direction: sheetSel.direction,
      freq,
      createdAt: iso(today()),
    });
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
  b.addEventListener('click', () => { view = b.dataset.view; statsOffset = 0; render(); }));

$('#btn-add').addEventListener('click', () => openHabitSheet(null));
$('#btn-settings').addEventListener('click', () => {
  renderSettings();
  openSheet($('#sheet-settings'));
});

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

$('#btn-event-add').addEventListener('click', addEventEntry);
$('#btn-close-event').addEventListener('click', () => closeSheet($('#sheet-event')));
$('#inp-event').addEventListener('keydown', (e) => { if (e.key === 'Enter') addEventEntry(); });

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
