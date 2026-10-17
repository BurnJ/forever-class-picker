'use strict';
/* Key and mouse binds, written the way WoW names them ("SHIFT-1", "CTRL-Q", "BUTTON4", "MOUSEWHEELUP"),
   so a layout could one day be applied in game as-is. Pure: no DOM beyond reading event fields. */

// KeyboardEvent.code -> WoW key name (physical keys, so the keyboard language doesn't matter)
const KEY_NAMES = {
  Minus: '-', Equal: '=', Backquote: '`', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';',
  Quote: "'", Comma: ',', Period: '.', Slash: '/', Space: 'SPACE', Tab: 'TAB', CapsLock: 'CAPSLOCK',
  Insert: 'INSERT', Delete: 'DELETE', Home: 'HOME', End: 'END', PageUp: 'PAGEUP', PageDown: 'PAGEDOWN',
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', Backspace: 'BACKSPACE', Enter: 'ENTER',
  NumpadAdd: 'NUMPADPLUS', NumpadSubtract: 'NUMPADMINUS', NumpadMultiply: 'NUMPADMULTIPLY', NumpadDivide: 'NUMPADDIVIDE',
  NumpadDecimal: 'NUMPADDECIMAL', NumpadEnter: 'ENTER', Escape: 'ESCAPE',
};
// mouse buttons that can be binds (left and right click stay for clicking, like in game)
const MOUSE_NAMES = { 1: 'BUTTON3', 3: 'BUTTON4', 4: 'BUTTON5' };
// combinations the browser keeps for itself (it closes or opens tabs/windows before the page sees them)
const RESERVED = new Set(['CTRL-W', 'CTRL-T', 'CTRL-N', 'CTRL-SHIFT-W', 'CTRL-SHIFT-T', 'CTRL-SHIFT-N',
  'CTRL-TAB', 'CTRL-SHIFT-TAB', 'ALT-F4', 'ALT-TAB', 'ESCAPE']);

function keyName(code) {
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  if (/^Numpad\d$/.test(code)) return 'NUMPAD' + code.slice(6);
  return KEY_NAMES[code] || null;
}

// WoW's modifier order: ALT-CTRL-SHIFT-<key>
const withMods = (e, k) => (e.altKey ? 'ALT-' : '') + (e.ctrlKey ? 'CTRL-' : '') + (e.shiftKey ? 'SHIFT-' : '') + k;

// A keydown, mousedown or wheel event -> bind name, or null when it isn't one (a lone modifier, a left click).
function bindFromEvent(e) {
  if (e.metaKey) return null;  // Cmd/Win combinations belong to the system
  if (e.type === 'keydown') {
    const k = keyName(e.code);
    return k ? withMods(e, k) : null;
  }
  if (e.type === 'mousedown' || e.type === 'mouseup' || e.type === 'pointerdown') {
    const k = MOUSE_NAMES[e.button];
    return k ? withMods(e, k) : null;
  }
  if (e.type === 'wheel') return e.deltaY ? withMods(e, e.deltaY < 0 ? 'MOUSEWHEELUP' : 'MOUSEWHEELDOWN') : null;
  return null;
}

const SHORT = { BUTTON3: 'M3', BUTTON4: 'M4', BUTTON5: 'M5', MOUSEWHEELUP: 'MwU', MOUSEWHEELDOWN: 'MwD', SPACE: 'Spc',
  CAPSLOCK: 'Caps', BACKSPACE: 'Bs', PAGEUP: 'PU', PAGEDOWN: 'PD', INSERT: 'Ins', DELETE: 'Del', ENTER: 'Ent',
  NUMPADPLUS: 'N+', NUMPADMINUS: 'N-', NUMPADMULTIPLY: 'N*', NUMPADDIVIDE: 'N/', NUMPADDECIMAL: 'N.' };
// Short form for the corner of an action button: "SHIFT-1" -> "S1", "CTRL-BUTTON4" -> "CM4", "NUMPAD3" -> "N3".
function bindLabel(b) {
  if (!b) return '';
  const parts = b.split('-');
  let key = parts.pop();
  if (key === '' && parts.length) { parts.pop(); key = '-'; }  // the minus key itself: "SHIFT--"
  const mods = parts.map(m => m[0]).join('');
  const k = SHORT[key] || (key.startsWith('NUMPAD') ? 'N' + key.slice(6) : key);
  return mods + k;
}

const isReserved = b => RESERVED.has(b);
// keys the practice page leaves to the browser when they aren't bound (reload, full screen, dev tools, back)
const PASSTHROUGH = new Set(['F5', 'F11', 'F12', 'CTRL-R', 'CTRL-SHIFT-R', 'CTRL-L', 'ALT-LEFT', 'ALT-RIGHT', 'CTRL-F5']);
const isMouse = b => /(^|-)(BUTTON\d|MOUSEWHEEL(UP|DOWN))$/.test(b);

if (typeof module !== 'undefined') module.exports = { bindFromEvent, bindLabel, isReserved, isMouse, RESERVED, PASSTHROUGH };
