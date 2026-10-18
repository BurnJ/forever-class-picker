'use strict';
/* The game's own Edit Mode import string (Edit Mode > Import), so a bar layout goes into Forever with no addon.
   The format is plain text, worked out from the probe (docs/forever-actionbar-facts.md). A header "5 0 <count>",
   then one record per Edit Mode system, 10 fields split by spaces:
     system, systemIndex - 1 (-1 for none), isInDefaultPosition (1/0), point, relativePoint (0-8: TOPLEFT ... BOTTOMRIGHT,
     the order of POINTS), relativeTo (a frame name), offsetX, offsetY (one decimal), -1, settings.
   Settings are two characters each: the setting id + 35, then the raw value + 35 ("#" when there are none).
   The layout's name isn't in the string; the game asks for one on import.
   Needs geo.js and layout.js (POINTS). */

// C_EditMode.ConvertLayoutInfoToString of Forever's Modern preset (build 1.60.1.70450, probe 2026-10-17).
// Everything that isn't an action bar stays as the game has it, unless the player moved it (geo.js FRAMES).
const EM_MODERN = "5 0 59 0 0 1 8 6 MicroMenuContainer -4.5 -4.0 -1 ##$$%/&('%)#+#,$ 0 1 1 7 7 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 2 1 7 7 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 3 1 5 5 UIParent -5.0 -77.0 -1 #$$$%/&('%(#,$ 0 4 1 5 5 UIParent -5.0 -77.0 -1 #$$$%/&('%(#,$ 0 5 1 1 4 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 6 1 1 4 UIParent 0.0 -50.0 -1 ##$$%/&('%(#,$ 0 7 1 1 4 UIParent 0.0 -100.0 -1 ##$$%/&('%(#,$ 0 10 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('% 0 11 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('%,# 0 12 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('% 1 -1 1 4 4 UIParent 0.0 0.0 -1 ##$#%# 2 -1 1 2 2 UIParent 0.0 0.0 -1 ##$#%(&( 3 0 1 8 7 UIParent -300.0 250.0 -1 $#3# 3 1 1 6 7 UIParent 300.0 250.0 -1 %#3# 3 2 1 6 7 UIParent 520.0 265.0 -1 %#&#3# 3 3 1 0 2 CompactRaidFrameManager 0.0 -7.0 -1 '#(#)#-=.+/#1$3#5#6(7-7$8(9( 3 4 1 0 2 CompactRaidFrameManager 0.0 -5.0 -1 ,#-=.+/#0#1#2(3#5#6(7-7$8(9( 3 5 1 5 5 UIParent 0.0 0.0 -1 &#*$3# 3 6 1 5 5 UIParent 0.0 0.0 -1 -=.+/#4$5#6(7-7$8(9( 3 7 1 4 4 UIParent 0.0 0.0 -1 3# 4 -1 1 7 7 UIParent 0.0 -4.0 -1 # 5 -1 1 7 7 UIParent 0.0 -4.0 -1 # 6 0 1 2 2 UIParent -255.0 -10.0 -1 ##$#%#&.(()( 6 1 1 2 2 UIParent -270.0 -155.0 -1 ##$#%#'+(()(-$ 6 2 1 1 1 UIParent 0.0 -25.0 -1 ##$#%$&.(()(+#,-,$ 7 -1 1 7 7 UIParent 0.0 -4.0 -1 # 8 -1 1 6 6 UIParent 35.0 145.0 -1 #'$A%$&i 9 -1 1 7 7 UIParent 0.0 -4.0 -1 # 10 -1 1 0 0 UIParent 16.0 -116.0 -1 # 11 -1 1 8 8 UIParent -9.0 85.0 -1 # 12 -1 1 2 2 UIParent -110.0 -275.0 -1 #K$#%# 13 -1 1 7 7 UIParent 116.5 6.0 -1 ##$#%) 14 -1 1 6 8 MicroMenuContainer 7.0 -4.0 -1 ##$#%( 15 0 1 7 7 UIParent 0.0 0.0 -1 &- 15 1 1 7 7 UIParent 0.0 17.0 -1 &- 16 -1 1 5 5 UIParent 0.0 0.0 -1 #( 17 -1 1 1 1 UIParent 0.0 -100.0 -1 ## 18 -1 1 5 5 UIParent 0.0 0.0 -1 #- 19 -1 1 7 7 UIParent 0.0 0.0 -1 ## 20 0 1 7 7 UIParent 0.0 310.0 -1 ##$/%$&('%(-($)#+$,$-$ 20 1 1 7 7 UIParent 0.0 240.0 -1 ##$*%$&('%(-($)#+$,$-$ 20 2 1 7 7 UIParent 0.0 370.0 -1 ##$$%$&('((-($)#+$,$-$ 20 3 1 7 7 UIParent 420.0 430.0 -1 #$$$%#&('((-($)#*#+$,$-$.-.$ 21 -1 1 7 7 UIParent -410.0 380.0 -1 ##%#&#'((()#*-*$+#,&-#.#/(0#1# 22 0 1 8 7 UIParent -457.0 336.0 -1 #$$$%#&('((#)U*$+%,$-#.#/U0% 22 1 1 1 1 UIParent 0.0 -40.0 -1 &('()U*#+% 22 2 1 1 1 UIParent 0.0 -90.0 -1 &('()U*#+% 22 3 1 1 1 UIParent 0.0 -130.0 -1 &('()U*#+% 23 -1 1 0 0 UIParent 0.0 0.0 -1 ##$#%$&7&%'7(%)U+$,$-$.(/U 24 -1 1 1 1 UIParent 0.0 -182.0 -1 # 25 -1 1 5 7 UIParent -28.0 128.0 -1 # 26 0 1 5 3 MainActionBar 30.0 5.0 -1 ## 26 1 1 3 5 BagsBar -30.0 5.0 -1 ## 27 -1 1 4 4 Minimap -68.0 -68.0 -1 #- 28 -1 1 4 4 UIParent 0.0 0.0 -1 #( 29 0 1 7 7 UIParent 0.0 450.0 -1 #($U%#&D&%'2($)$ 29 1 1 7 7 UIParent 0.0 425.0 -1 #($U%#&D&%'2($)$ 29 2 1 7 7 UIParent 0.0 400.0 -1 #($U%#&D&%'2($)$";
// The Classic preset, from the game's own export (Edit Mode > Classic > Share > Copy to Clipboard, Ian 2026-10-18).
// Same as Modern except the player, target and focus frames (top left) and one chat setting.
const EM_CLASSIC = "5 0 59 0 0 1 8 6 MicroMenuContainer -4.5 -4.0 -1 ##$$%/&('%)#+#,$ 0 1 1 7 7 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 2 1 7 7 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 3 1 5 5 UIParent -5.0 -77.0 -1 #$$$%/&('%(#,$ 0 4 1 5 5 UIParent -5.0 -77.0 -1 #$$$%/&('%(#,$ 0 5 1 1 4 UIParent 0.0 0.0 -1 ##$$%/&('%(#,$ 0 6 1 1 4 UIParent 0.0 -50.0 -1 ##$$%/&('%(#,$ 0 7 1 1 4 UIParent 0.0 -100.0 -1 ##$$%/&('%(#,$ 0 10 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('% 0 11 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('%,# 0 12 1 7 7 UIParent 0.0 -4.0 -1 ##$$&('% 1 -1 1 4 4 UIParent 0.0 0.0 -1 ##$#%# 2 -1 1 2 2 UIParent 0.0 0.0 -1 ##$#%(&( 3 0 1 0 0 UIParent 4.0 -4.0 -1 $#3# 3 1 1 0 0 UIParent 250.0 -4.0 -1 %#3# 3 2 1 0 0 UIParent 500.0 -240.0 -1 %#&#3# 3 3 1 0 2 CompactRaidFrameManager 0.0 -7.0 -1 '#(#)#-=.+/#1$3#5#6(7-7$8(9( 3 4 1 0 2 CompactRaidFrameManager 0.0 -5.0 -1 ,#-=.+/#0#1#2(3#5#6(7-7$8(9( 3 5 1 5 5 UIParent 0.0 0.0 -1 &#*$3# 3 6 1 5 5 UIParent 0.0 0.0 -1 -=.+/#4$5#6(7-7$8(9( 3 7 1 4 4 UIParent 0.0 0.0 -1 3# 4 -1 1 7 7 UIParent 0.0 -4.0 -1 # 5 -1 1 7 7 UIParent 0.0 -4.0 -1 # 6 0 1 2 2 UIParent -255.0 -10.0 -1 ##$#%#&.(()( 6 1 1 2 2 UIParent -270.0 -155.0 -1 ##$#%#'+(()(-$ 6 2 1 1 1 UIParent 0.0 -25.0 -1 ##$#%$&.(()(+#,-,$ 7 -1 1 7 7 UIParent 0.0 -4.0 -1 # 8 -1 1 6 6 UIParent 35.0 145.0 -1 #'$A%$&7 9 -1 1 7 7 UIParent 0.0 -4.0 -1 # 10 -1 1 0 0 UIParent 16.0 -116.0 -1 # 11 -1 1 8 8 UIParent -9.0 85.0 -1 # 12 -1 1 2 2 UIParent -110.0 -275.0 -1 #K$#%# 13 -1 1 7 7 UIParent 116.5 6.0 -1 ##$#%) 14 -1 1 6 8 MicroMenuContainer 7.0 -4.0 -1 ##$#%( 15 0 1 7 7 UIParent 0.0 0.0 -1 &- 15 1 1 7 7 UIParent 0.0 17.0 -1 &- 16 -1 1 5 5 UIParent 0.0 0.0 -1 #( 17 -1 1 1 1 UIParent 0.0 -100.0 -1 ## 18 -1 1 5 5 UIParent 0.0 0.0 -1 #- 19 -1 1 7 7 UIParent 0.0 0.0 -1 ## 20 0 1 7 7 UIParent 0.0 310.0 -1 ##$/%$&('%(-($)#+$,$-$ 20 1 1 7 7 UIParent 0.0 240.0 -1 ##$*%$&('%(-($)#+$,$-$ 20 2 1 7 7 UIParent 0.0 370.0 -1 ##$$%$&('((-($)#+$,$-$ 20 3 1 7 7 UIParent 420.0 430.0 -1 #$$$%#&('((-($)#*#+$,$-$.-.$ 21 -1 1 7 7 UIParent -410.0 380.0 -1 ##%#&#'((()#*-*$+#,&-#.#/(0#1# 22 0 1 8 7 UIParent -457.0 336.0 -1 #$$$%#&('((#)U*$+%,$-#.#/U0% 22 1 1 1 1 UIParent 0.0 -40.0 -1 &('()U*#+% 22 2 1 1 1 UIParent 0.0 -90.0 -1 &('()U*#+% 22 3 1 1 1 UIParent 0.0 -130.0 -1 &('()U*#+% 23 -1 1 0 0 UIParent 0.0 0.0 -1 ##$#%$&7&%'7(%)U+$,$-$.(/U 24 -1 1 1 1 UIParent 0.0 -182.0 -1 # 25 -1 1 5 7 UIParent -28.0 128.0 -1 # 26 0 1 5 3 MainActionBar 30.0 5.0 -1 ## 26 1 1 3 5 BagsBar -30.0 5.0 -1 ## 27 -1 1 4 4 Minimap -68.0 -68.0 -1 #- 28 -1 1 4 4 UIParent 0.0 0.0 -1 #( 29 0 1 7 7 UIParent 0.0 450.0 -1 #($U%#&D&%'2($)$ 29 1 1 7 7 UIParent 0.0 425.0 -1 #($U%#&D&%'2($)$ 29 2 1 7 7 UIParent 0.0 400.0 -1 #($U%#&D&%'2($)$";
const EM_PRESETS = { modern: EM_MODERN, classic: EM_CLASSIC };
// our bars -> Enum.EditModeActionBarSystemIndices
const EM_BAR_INDEX = { b1: 1, b2: 2, b3: 3, b4: 4, b5: 5, b6: 6, b7: 7, b8: 8, stance: 11, pet: 12 };
const EM_ACTION_BAR = 0;  // Enum.EditModeSystem.ActionBar

const emSettings = tok => tok === '#' ? [] : Array.from({ length: tok.length / 2 }, (_, i) => [tok.charCodeAt(i * 2) - 35, tok.charCodeAt(i * 2 + 1) - 35]);
const emSettingsToken = pairs => pairs.length ? pairs.map(([s, v]) => String.fromCharCode(s + 35, v + 35)).join('') : '#';

// A string of records: [{ system, index, def, point, relPoint, relTo, x, y, extra, settings }]
function emParse(str) {
  const t = String(str).trim().split(' ');
  const n = +t[2];
  if (t.length !== 3 + n * 10) throw new Error('not an Edit Mode layout string');
  return { head: t.slice(0, 3), recs: Array.from({ length: n }, (_, i) => {
    const r = t.slice(3 + i * 10, 13 + i * 10);
    return { system: +r[0], index: +r[1] + 1, def: r[2] === '1', point: +r[3], relPoint: +r[4], relTo: r[5], x: +r[6], y: +r[7], extra: r[8], settings: emSettings(r[9]) };
  }) };
}
function emFormat({ head, recs }) {
  return [...head, ...recs.flatMap(r => [r.system, r.index - 1, r.def ? 1 : 0, r.point, r.relPoint, r.relTo,
    r.x.toFixed(1), r.y.toFixed(1), r.extra, emSettingsToken(r.settings)])].join(' ');
}

// The layout's preset with its bars pinned to the screen where the planner shows them, with their Edit Mode settings,
// and the frames the player moved (the rest keep the preset's records).
function editModeString(layout) {
  const parsed = emParse(EM_PRESETS[layout.preset] || EM_MODERN);
  const pin = (r, g) => Object.assign(r, { def: false, point: POINTS.indexOf(g.point), relPoint: POINTS.indexOf(g.point), relTo: 'UIParent', x: g.x, y: g.y });
  for (const r of parsed.recs) {
    if (r.system !== EM_ACTION_BAR) {
      const key = Object.keys(layout.frames || {}).find(k => FRAMES[k] && FRAMES[k].system === r.system && FRAMES[k].index === r.index);
      if (key) pin(r, layout.frames[key]);
      continue;
    }
    const id = Object.keys(EM_BAR_INDEX).find(k => EM_BAR_INDEX[k] === r.index);
    const g = id && layout.geo[id];
    if (!g) continue;
    pin(r, g);
    if ('icons' in g) {
      // Orientation, NumRows, NumIcons, IconSize (raw 0-15 = 50-200%), IconPadding, VisibleSetting
      const want = [g.vertical ? 1 : 0, g.rows, g.icons, (g.size - 50) / 10, g.pad, VIS.indexOf(g.vis)];
      r.settings = r.settings.map(([s, v]) => [s, s < want.length ? want[s] : v]);
    }
  }
  return emFormat(parsed);
}

if (typeof module !== 'undefined') module.exports = { EM_MODERN, EM_CLASSIC, emParse, emFormat, editModeString };
