'use strict';
/* Where the bars sit on the game screen and what shape they are, the way Forever's Edit Mode stores it.
   Units are UIParent units. Rects use the game's origin: left/bottom from the bottom-left corner, y up.
   A bar's position is kept as an anchor (a point on the bar pinned to the same point on the screen, plus
   offsets), so a layout fits any monitor width. Numbers come from the probe (docs/forever-actionbar-facts.md);
   the ones still marked provisional wait on a second probe run with every bar switched on. */

const BUTTON = 45;          // a 100% action button (probe: ActionButton1 is 45 wide)
// The screen in UIParent units: 768 / UI scale high. With the game's UI Scale box off the scale is
// 768 / pixel height but never below 0.64 (probe: 2560x1440 gave UIParent 2133.33 x 1200 at 0.64).
const SCREENS = {
  '1920x1080': { aspect: 16 / 9, h: 1080 }, '2560x1440': { aspect: 16 / 9, h: 1200 }, '3840x2160': { aspect: 16 / 9, h: 1200 },
  '1920x1200': { aspect: 16 / 10, h: 1200 }, '2560x1080': { aspect: 64 / 27, h: 1080 }, '3440x1440': { aspect: 43 / 18, h: 1200 },
};
const SNAP = 8;             // how close an edge must be to snap
const ALL_BARS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
const VIS = ['always', 'combat', 'ooc', 'hidden'];

const screenSize = (aspect = 16 / 9, h = 1080) => ({ w: Math.round(h * aspect * 100) / 100, h });

// Bar shape: icons buttons in rows rows (columns when vertical), size in percent, pad between buttons.
function barSize(g) {
  const lines = Math.max(1, Math.min(g.rows || 1, g.icons));
  const per = Math.ceil(g.icons / lines);
  const b = BUTTON * (g.size || 100) / 100, pad = g.pad || 0;
  const long = per * b + (per - 1) * pad, short = lines * b + (lines - 1) * pad;
  return g.vertical ? { w: short, h: long } : { w: long, h: short };
}
// Bars whose extra rows go above the first, so button 1 is bottom left (the game's addButtonsToTop).
// b2 seen in game (Ian's import, 2026-10-18); b1 and b3 follow Blizzard's setup until probe run 2 reads them.
const ROWS_UP = new Set(['b1', 'b2', 'b3']);
// Button i's spot inside the bar, from the bar's top-left, in the same units. Buttons fill rows left to
// right, top down, except on ROWS_UP bars; vertical bars fill columns top down, left to right.
function buttonPos(g, i, bar) {
  const lines = Math.max(1, Math.min(g.rows || 1, g.icons));
  const per = Math.ceil(g.icons / lines);
  const b = BUTTON * (g.size || 100) / 100, step = b + (g.pad || 0);
  const along = i % per, across = Math.floor(i / per);
  if (g.vertical) return { x: across * step, y: along * step, size: b };
  return { x: along * step, y: (ROWS_UP.has(bar) ? lines - 1 - across : across) * step, size: b };
}

// Which point a rect is pinned by: the screen third its centre is in, like the game when a frame is dragged.
function pointFor(rect, scr) {
  const cx = rect.l + rect.w / 2, cy = rect.b + rect.h / 2;
  const col = cx < scr.w / 3 ? 'LEFT' : cx > scr.w * 2 / 3 ? 'RIGHT' : '';
  const row = cy < scr.h / 3 ? 'BOTTOM' : cy > scr.h * 2 / 3 ? 'TOP' : '';
  return row + col || 'CENTER';
}
// the x,y of a named point on a rect
function pointXY(point, l, b, w, h) {
  const x = point.includes('LEFT') ? l : point.includes('RIGHT') ? l + w : l + w / 2;
  const y = point.includes('BOTTOM') ? b : point.includes('TOP') ? b + h : b + h / 2;
  return { x, y };
}
const round1 = n => Math.round(n * 10) / 10;
function toAnchor(rect, scr) {
  const point = pointFor(rect, scr);
  const p = pointXY(point, rect.l, rect.b, rect.w, rect.h), s = pointXY(point, 0, 0, scr.w, scr.h);
  return { point, x: round1(p.x - s.x), y: round1(p.y - s.y) };
}
// a w x h rect pinned by point at offsets x, y
function placeRect(point, x, y, w, h, scr) {
  const s = pointXY(point, 0, 0, scr.w, scr.h);
  const o = pointXY(point, 0, 0, w, h);  // the point's offset inside the rect
  return { l: s.x + x - o.x, b: s.y + y - o.y, w, h };
}
function fromAnchor(g, scr) {
  const { w, h } = barSize(g);
  return placeRect(g.point, g.x, g.y, w, h, scr);
}

// Pull a dragged rect onto nearby screen edges, the screen centre and other bars' edges and centres.
function snap(rect, others, scr, d = SNAP) {
  const xs = [0, scr.w, scr.w / 2], ys = [0, scr.h, scr.h / 2];
  for (const o of others) { xs.push(o.l, o.l + o.w, o.l + o.w / 2); ys.push(o.b, o.b + o.h, o.b + o.h / 2); }
  const best = (edges, targets) => {
    let move = 0, dist = d + 1;
    for (const e of edges) for (const t of targets) if (Math.abs(t - e) < dist) { dist = Math.abs(t - e); move = t - e; }
    return dist <= d ? move : 0;
  };
  const dx = best([rect.l, rect.l + rect.w, rect.l + rect.w / 2], xs);
  const dy = best([rect.b, rect.b + rect.h, rect.b + rect.h / 2], ys);
  return clamp({ l: rect.l + dx, b: rect.b + dy, w: rect.w, h: rect.h }, scr);
}
const clamp = (r, scr) => ({ l: Math.max(0, Math.min(scr.w - r.w, r.l)), b: Math.max(0, Math.min(scr.h - r.h, r.b)), w: r.w, h: r.h });

// Where Forever's Modern preset puts each bar, as an anchor on the screen.
//   b1: pinned to the micro menu's left (menu BOTTOM 116.5,6, 302 wide; the bar 4.5 left of it, 4 lower).
//   b4, b5: RIGHT -5,-77, vertical. b6-b8: their top edge at the screen centre, then 50 and 100 lower.
//   b2, b3, stance and pet sit in the game's bottom stack: provisional until the second probe run.
// Bars 4-8 start hidden. Stance and pet bars are placed, not shaped.
function defaultGeo() {
  const bar = (point, x, y, o = {}) => Object.assign({ point, x, y, rows: 1, icons: 12, size: 100, pad: 2, vertical: false, vis: 'always' }, o);
  return {
    b1: bar('BOTTOM', -320, 2), b2: bar('BOTTOM', -320, 72), b3: bar('BOTTOM', -320, 121),
    b4: bar('RIGHT', -5, -77, { vertical: true, vis: 'hidden' }), b5: bar('RIGHT', -52, -77, { vertical: true, vis: 'hidden' }),
    b6: bar('CENTER', 0, -22.5, { vis: 'hidden' }), b7: bar('CENTER', 0, -72.5, { vis: 'hidden' }), b8: bar('CENTER', 0, -122.5, { vis: 'hidden' }),
    stance: { point: 'BOTTOM', x: -470, y: 170 }, pet: { point: 'BOTTOM', x: -150, y: 170 },
  };
}

// The game's other Edit Mode frames, which the planner can move but not reshape: Forever's Modern preset, sizes from
// the probe's frame rects. `classic` is the frame's spot in the Classic preset when it differs (its string, editmode.js). system and index are the record's in the Edit Mode string (Enum.EditModeSystem, system index).
// The player and target frames are pinned by their inner corners in game; these are the same spots from the centre.
// The swing timers sit where the game puts them while in their default position (probe rects); the off hand
// and ranged timers share a spot. `classes` limits a frame to the classes that can use it.
const FRAMES = {
  player: { name: 'Player', system: 3, index: 1, w: 232, h: 100, point: 'BOTTOM', x: -416, y: 250, classic: { point: 'TOPLEFT', x: 4, y: -4 } },
  target: { name: 'Target', system: 3, index: 2, w: 232, h: 100, point: 'BOTTOM', x: 416, y: 250, classic: { point: 'TOPLEFT', x: 250, y: -4 } },
  minimap: { name: 'Minimap', system: 2, index: 0, w: 273, h: 283, point: 'TOPRIGHT', x: 0, y: 0 },
  chat: { name: 'Chat', system: 8, index: 0, w: 430, h: 170, point: 'BOTTOMLEFT', x: 35, y: 145 },
  buffs: { name: 'Buffs', system: 6, index: 1, w: 400, h: 135, point: 'TOPRIGHT', x: -255, y: -10 },
  debuffs: { name: 'Debuffs', system: 6, index: 2, w: 280, h: 90, point: 'TOPRIGHT', x: -270, y: -155 },
  menu: { name: 'Menu', system: 13, index: 0, w: 302, h: 40, point: 'BOTTOM', x: 116.5, y: 6 },
  swingMain: { name: 'Main Hand swing', system: 29, index: 1, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 265 },
  swingOff: { name: 'Off Hand swing', system: 29, index: 2, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 231, classes: ['rogue', 'warrior', 'hunter'] },
  swingRanged: { name: 'Ranged swing', system: 29, index: 3, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 231, classes: ['rogue', 'warrior', 'hunter'] },
};
const framesFor = cls => Object.keys(FRAMES).filter(k => !FRAMES[k].classes || FRAMES[k].classes.includes(cls));
// the Edit Mode presets a layout can start from; the bars sit the same in both, the unit frames don't
const PRESETS = { modern: 'Modern', classic: 'Classic' };
// where the game puts a frame in a preset
const frameHome = (key, preset) => (preset === 'classic' && FRAMES[key].classic) || FRAMES[key];
// where a frame is: moved (layout.frames) or the preset's spot
const framePos = (layout, key) => (layout.frames && layout.frames[key]) || frameHome(key, layout.preset);

// Keep a geometry record inside what Edit Mode allows (anything from a link is untrusted).
function cleanGeo(g, dflt) {
  const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
  const POINTS = ['TOPLEFT', 'TOP', 'TOPRIGHT', 'LEFT', 'CENTER', 'RIGHT', 'BOTTOMLEFT', 'BOTTOM', 'BOTTOMRIGHT'];
  const o = g && typeof g === 'object' ? g : {};
  const out = { point: POINTS.includes(o.point) ? o.point : dflt.point, x: num(o.x, -4000, 4000, dflt.x), y: num(o.y, -4000, 4000, dflt.y) };
  if ('icons' in dflt) {
    out.icons = Math.round(num(o.icons, 6, 12, dflt.icons));
    out.rows = Math.round(num(o.rows, 1, 4, dflt.rows));
    out.size = Math.round(num(o.size, 50, 200, dflt.size) / 10) * 10;
    out.pad = Math.round(num(o.pad, 2, 10, dflt.pad));
    out.vertical = typeof o.vertical === 'boolean' ? o.vertical : dflt.vertical;
    out.vis = VIS.includes(o.vis) ? o.vis : dflt.vis;
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { SCREENS, BUTTON, ALL_BARS, VIS, screenSize, barSize, buttonPos,
  pointFor, toAnchor, placeRect, fromAnchor, snap, defaultGeo, cleanGeo, FRAMES, framesFor, framePos, frameHome, PRESETS };
