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

// The bars' shapes and, once moved, their spots. `home` is Edit Mode's "in default position": the game places a bar
// that's home itself (gameRects), so its point/x/y only matter once it's been dragged. They hold where each bar sits
// on a 16:9 screen with every bar on, for links and old saves.
// `on` is the game's Options > Action Bars switch for bars 2-8, off in a new character (probe run 1); it isn't part
// of an Edit Mode layout. `vis` is Edit Mode's Bar Visible setting. Stance and pet bars are placed, not shaped.
function defaultGeo() {
  const bar = (point, x, y, o = {}) => Object.assign({ point, x, y, rows: 1, icons: 12, size: 100, pad: 2, vertical: false, vis: 'always', home: true }, o);
  const extra = (point, x, y, o = {}) => bar(point, x, y, Object.assign({ on: false }, o));
  return {
    b1: bar('BOTTOM', -320, 2), b2: extra('BOTTOM', -298, 72), b3: extra('BOTTOM', 286, 72),
    b4: extra('RIGHT', -5, -77, { vertical: true }), b5: extra('RIGHT', -55, -77, { vertical: true }),
    b6: extra('CENTER', 0, -22.5), b7: extra('CENTER', 0, -72.5), b8: extra('CENTER', 0, -122.5),
    stance: { point: 'BOTTOM', x: -556, y: 121, home: true }, pet: { point: 'BOTTOM', x: -412, y: 155, home: true },
  };
}
// Spots that meant "where the game puts it" in layouts saved before bars had a home flag (each default the planner
// has used), so those bars go back to following the game.
const OLD_HOMES = {
  b1: [['BOTTOM', -320, 2]], b2: [['BOTTOM', -320, 72], ['BOTTOM', -298, 70], ['BOTTOM', -298, 72]],
  b3: [['BOTTOM', -320, 121], ['BOTTOM', 286, 70], ['BOTTOM', 286, 72]], b4: [['RIGHT', -5, -77]],
  b5: [['RIGHT', -52, -77], ['RIGHT', -55, -77]], b6: [['CENTER', 0, -22.5]], b7: [['CENTER', 0, -72.5]],
  b8: [['CENTER', 0, -122.5]], stance: [['BOTTOM', -470, 170], ['BOTTOM', -571, 121]], pet: [['BOTTOM', -150, 170]],
};
const wasHome = (id, g) => (OLD_HOMES[id] || []).some(([p, x, y]) => g.point === p && g.x === x && g.y === y);

// The game's other Edit Mode frames, which the planner can move but not reshape. Spots and sizes are the game's own
// rects in each preset (/fkbprobe presets, 2026-10-18, docs/forever-actionbar-facts.md); `classic` is what differs in
// the Classic preset. system and index are the record's in the Edit Mode string (Enum.EditModeSystem, system index).
// The player and target frames are pinned by their inner corners in Modern; these are the same spots from the centre.
// `editOnly` frames are only on screen in a group, so the planner shows them in Edit Mode only, the way the game does.
// `toggle` frames are switched on in the game's settings and off in a new character (TOGGLES, layout.show): shown
// when switched on, and always in Edit Mode, marked off. The swing timers are stacked as Edit Mode shows them with
// all three on. Out of Edit Mode the game shows only the ones for what's equipped. The swing timers, the objective
// tracker and the pet frame are placed by the game around other frames (gameRects); their point/x/y here are only
// their spot on a 16:9 screen with bars 2-8 off.
// `classes` limits a frame to the classes that can use it.
const FRAMES = {
  player: { name: 'Player', system: 3, index: 1, w: 232, h: 100, point: 'BOTTOM', x: -416, y: 250, classic: { point: 'TOPLEFT', x: 4, y: -4 } },
  target: { name: 'Target', system: 3, index: 2, w: 232, h: 100, point: 'BOTTOM', x: 416, y: 250, classic: { point: 'TOPLEFT', x: 250, y: -4 } },
  // Modern: BOTTOMLEFT at BOTTOM 520, 265; 232 x 100 at scale 0.75
  focus: { name: 'Focus', system: 3, index: 3, w: 174, h: 75, point: 'BOTTOM', x: 607, y: 265, classic: { point: 'TOPLEFT', x: 500, y: -240 }, editOnly: 'with a focus' },
  // under the player frame (PlayerBottomManagedFrameContainer); provisional: camelot's petframe.lua isn't in the extract
  petFrame: { name: 'Pet', system: 3, index: 8, w: 120, h: 49, point: 'BOTTOM', x: -393.5, y: 226, classic: { point: 'TOPLEFT', x: 97.5, y: -79 }, editOnly: 'with a pet', classes: ['hunter', 'warlock'] },
  party: { name: 'Party', system: 3, index: 4, w: 120, h: 244, point: 'TOPLEFT', x: 22, y: -147, editOnly: 'in a group' },
  minimap: { name: 'Minimap', system: 2, index: 0, w: 273, h: 283, point: 'TOPRIGHT', x: 0, y: 0 },
  objectives: { name: 'Objectives', system: 12, index: 0, w: 260, h: 791, point: 'TOPRIGHT', x: -5, y: -286 },
  // Edit Mode's chat height setting (id 3) is the height less 100: Modern 70, Classic 20
  chat: { name: 'Chat', system: 8, index: 0, w: 430, h: 170, point: 'BOTTOMLEFT', x: 35, y: 145, classic: { h: 120 } },
  buffs: { name: 'Buffs', system: 6, index: 1, w: 400, h: 135, point: 'TOPRIGHT', x: -255, y: -10 },
  debuffs: { name: 'Debuffs', system: 6, index: 2, w: 280, h: 90, point: 'TOPRIGHT', x: -270, y: -155 },
  menu: { name: 'Menu', system: 13, index: 0, w: 302, h: 40, point: 'BOTTOM', x: 116.5, y: 6 },
  swingMain: { name: 'Main Hand swing', system: 29, index: 1, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 149, toggle: 'swing' },
  swingOff: { name: 'Off Hand swing', system: 29, index: 2, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 115, toggle: 'swing' },
  swingRanged: { name: 'Ranged swing', system: 29, index: 3, w: 426, h: 30, point: 'BOTTOM', x: 0, y: 81, toggle: 'swing' },
  meter: { name: 'Damage Meter', system: 23, index: 0, w: 400, h: 140, point: 'TOPLEFT', x: 0, y: 0, toggle: 'meter' },
};
// the game's settings switches for frames, by layout.show key
const TOGGLES = { swing: 'Swing Timer', meter: 'Damage Meter' };
// the frames a class sees: toggle ones only when switched on (show), in Edit Mode too, like the game; editOnly ones
// only in Edit Mode (edit)
const framesFor = (cls, edit, show) => Object.keys(FRAMES).filter(k => {
  const f = FRAMES[k];
  if (f.classes && !f.classes.includes(cls)) return false;
  if (f.toggle && !(show && show[f.toggle])) return false;
  return edit || !f.editOnly;
});
// the Edit Mode presets a layout can start from; the bars sit the same in both, the unit frames don't
const PRESETS = { modern: 'Modern', classic: 'Classic' };
// where the game puts a frame in a preset, and its size there
const frameHome = (key, preset) => (preset === 'classic' && FRAMES[key].classic ? Object.assign({}, FRAMES[key], FRAMES[key].classic) : FRAMES[key]);
// The bottom of a bar 1 page's status bar (the XP bar): the game stacks it on bar 1.
const XP_SIZE = { w: 1192, h: 17 };

// Every bar's and frame's rect on a screen, placed by the game's own rules (docs/forever-ui-layout-rules.md, from the
// client's Edit Mode and UIParentPanelManager code; both /fkbprobe presets runs reproduce). Moved bars and frames sit at
// their anchors; the rest are placed around them the way the game does:
//   - bar 1's BOTTOMRIGHT on the micro menu's BOTTOMLEFT, -4.5, -4;
//   - the bottom stack on bar 1's BOTTOMLEFT, 4 apart: the XP bar, bar 3 (x 606, adds no height), bar 2 (x 22), stance
//     bar (x 30), pet bar (x 30). Bars that are off or moved drop out and the stack closes up;
//   - the bottom container (swing timers, 10 apart, centred) from bar 2's top + 35 when bar 2 is on, home and visible,
//     else from the micro menu's top + 35 (81);
//   - bars 4 then 5 from RIGHT -5, -77, each next one its width + 5 further left;
//   - the right container (objective tracker) 5 left of the outermost visible right bar, from 260 below the top, the
//     tracker's top 26 lower and its bottom at the minimap's height less 160;
//   - bars 6-8 with their tops on the screen centre, 50 apart; the pet frame under the player frame.
// The XP bar is assumed shown (players plan while levelling). n: { stance: buttons (0 = no stance bar), pet: bool }.
// Returns { [bar or frame id]: { l, b, w, h }, xp }; bars that are off get the spot they'd take if switched on.
function gameRects(layout, scr, n = {}) {
  const geo = layout.geo, moved = layout.frames || {}, out = {};
  const small = buttons => barSize({ rows: 1, icons: Math.max(1, buttons), size: 30 / BUTTON * 100, pad: 2 });
  const sizeOf = id => (id === 'stance' ? small(n.stance) : id === 'pet' ? small(10) : barSize(geo[id]));
  const anchored = id => { const g = geo[id], sz = sizeOf(id); return placeRect(g.point, g.x, g.y, sz.w, sz.h, scr); };
  const home = id => geo[id].home !== false;
  const frame = key => {
    const f = frameHome(key, layout.preset), m = moved[key];
    return m ? placeRect(m.point, m.x, m.y, f.w, f.h, scr) : null;
  };
  const presetFrame = key => { const f = frameHome(key, layout.preset); return placeRect(f.point, f.x, f.y, f.w, f.h, scr); };
  const shownAt = g => g.vis === 'always' || g.vis === 'ooc';  // visible out of combat

  const menu = frame('menu') || presetFrame('menu');
  out.menu = menu;
  // bar 1 and the bottom stack
  const s1 = sizeOf('b1');
  const b1 = out.b1 = home('b1') ? { l: menu.l - 4.5 - s1.w, b: menu.b - 4, w: s1.w, h: s1.h } : anchored('b1');
  let y = b1.h + 4;
  out.xp = { l: b1.l, b: b1.b + y, w: XP_SIZE.w, h: XP_SIZE.h };
  y += XP_SIZE.h + 4;
  const stack = (id, dx, adds) => {
    const sz = sizeOf(id);
    if (!home(id)) { out[id] = anchored(id); return; }
    out[id] = { l: b1.l + dx, b: b1.b + y, w: sz.w, h: sz.h };
    if (adds) y += sz.h + 4;
  };
  stack('b3', 606, false);
  const b2y = y;
  stack('b2', 22, geo.b2.on);
  if (n.stance) stack('stance', 30, true);
  if (n.pet) stack('pet', 30, true);
  // the bottom container
  const b2counts = geo.b2.on && home('b2') && shownAt(geo.b2);
  const y0 = b2counts ? b2y + out.b2.h + 35 : moved.menu ? 35 : Math.abs(FRAMES.menu.y) + menu.h + 35;
  const timers = ['swingRanged', 'swingOff', 'swingMain'];
  let ty = y0;
  for (const key of timers) {
    const f = frameHome(key, layout.preset);
    out[key] = frame(key) || { l: scr.w / 2 - f.w / 2, b: ty + (key === 'swingRanged' ? 0 : -6), w: f.w, h: f.h };
    ty += f.h + 10 + (key === 'swingRanged' ? 0 : -6);
  }
  // bars 4 and 5, then the right container
  let rx = -5;
  for (const id of ['b4', 'b5']) {
    const sz = sizeOf(id);
    if (!home(id)) { out[id] = anchored(id); continue; }
    out[id] = placeRect('RIGHT', rx, -77, sz.w, sz.h, scr);
    if (geo[id].on) rx -= sz.w + 5;
  }
  const outer = ['b5', 'b4'].find(id => geo[id].on && home(id) && shownAt(geo[id]));
  const rbw = outer ? scr.w - out[outer].l : 0;
  const tracker = frameHome('objectives', layout.preset), minimapH = frameHome('minimap', layout.preset).h;
  out.objectives = frame('objectives') ||
    { l: scr.w - 5 - rbw - tracker.w, b: minimapH - 160, w: tracker.w, h: scr.h - 286 - (minimapH - 160) };
  // bars 6-8: top edge on the centre, 50 apart
  ['b6', 'b7', 'b8'].forEach((id, i) => {
    const sz = sizeOf(id);
    out[id] = home(id) ? { l: scr.w / 2 - sz.w / 2, b: scr.h / 2 - 50 * i - sz.h, w: sz.w, h: sz.h } : anchored(id);
  });
  // the other frames: moved, or the preset's spot; the pet frame follows the player frame
  for (const key of Object.keys(FRAMES)) {
    if (out[key]) continue;
    if (key === 'petFrame' && !moved.petFrame) {
      const p = out.player || frame('player') || presetFrame('player'), f = FRAMES.petFrame;
      out.petFrame = { l: p.l + p.w / 2 - 22.5, b: p.b - 24, w: f.w, h: f.h };
      continue;
    }
    out[key] = frame(key) || presetFrame(key);
  }
  return out;
}

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
    if ('on' in dflt) out.on = typeof o.on === 'boolean' ? o.on : dflt.on;
  }
  if ('home' in dflt) out.home = typeof o.home === 'boolean' ? o.home : dflt.home;
  return out;
}

if (typeof module !== 'undefined') module.exports = { SCREENS, BUTTON, ALL_BARS, VIS, screenSize, barSize, buttonPos,
  pointFor, toAnchor, placeRect, fromAnchor, snap, defaultGeo, wasHome, gameRects, cleanGeo, FRAMES, framesFor, frameHome, PRESETS, TOGGLES };
