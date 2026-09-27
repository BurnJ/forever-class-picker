'use strict';

/* Builds og.png, the 1200x630 image shown when the site link is shared.
   Usage: node tools/make-og.js "<path to chrome.exe>"
   It writes a throwaway page using the crests from index.html and asks Chrome to screenshot it. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const { CLASSES } = require(path.join(root, 'data.js'));
const chrome = process.argv[2];
if (!chrome || !fs.existsSync(chrome)) {
  console.error('Pass the path to chrome.exe as the first argument.');
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const block = html.match(/const CREST_ART = (\{[\s\S]*?\n\});/);
if (!block) throw new Error('CREST_ART not found in index.html');
const CREST_ART = new Function(`return ${block[1]}`)();

const crest = c => `
  <div class="c" style="color:${c.color}">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="24" r="22.500" stroke-width="1"/>
      <g transform="translate(24 24) scale(.9) translate(-24 -24)">${CREST_ART[c.id]}</g>
    </svg>
    <span style="color:${c.text}">${c.name}</span>
  </div>`;

const page = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Crimson+Pro:wght@400;600&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: #0c0a07; color: #e6d9b8; font-family: 'Crimson Pro', Georgia, serif; padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 6px solid #c9a84c; }
  .site { font-family: 'Uncial Antiqua', serif; font-size: 30px; color: #ffd644; }
  h1 { font-size: 76px; line-height: 1.05; font-weight: 600; max-width: 900px; letter-spacing: -.01em; margin-top: 20px; }
  p { font-size: 30px; color: #b8ad93; margin-top: 18px; }
  .row { display: flex; justify-content: space-between; border-top: 1px solid #5c4a2a; padding-top: 28px; }
  .c { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 104px; }
  .c svg { width: 84px; height: 84px; }
  .c span { font-family: 'Uncial Antiqua', serif; font-size: 17px; }
</style></head><body>
  <div>
    <div class="site">Forever Class Guide</div>
    <h1>Which class should you play in WoW Forever?</h1>
    <p>Nine classes, 27 specs and a quiz, from Skyy's guide.</p>
  </div>
  <div class="row">${CLASSES.map(crest).join('')}</div>
</body></html>`;

const tmp = path.join(os.tmpdir(), 'forever-og.html');
fs.writeFileSync(tmp, page);
const out = path.join(root, 'og.png');
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1200,630',
  '--virtual-time-budget=8000',
  `--screenshot=${out}`, pathToFileURL(tmp).href
], { stdio: 'ignore' });
console.log('wrote', out, fs.statSync(out).size, 'bytes');
