/**
 * Generates Chrome Web Store assets into store/screenshots/:
 *   1280x800 screenshots of the tooltip, popup, window and options,
 *   plus the 440x280 small promo tile.
 *
 *   pnpm build && node scripts/screenshots.mjs
 * Needs google-chrome (or CHROME_BIN) and ImageMagick `convert`.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { Chrome, sleep } from './lib/chrome.mjs';

const EXT_DIR = resolve('.output/chrome-mv3');
const OUT = resolve('store/screenshots');
const TMP = resolve('.output/screenshots-tmp');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const FONT = 'DejaVu-Sans';
const FONT_BOLD = 'DejaVu-Sans-Bold';
const BG = 'gradient:#eef3ff-#d6e2ff';
const INK = '#1a1c20';
const MUTED = '#4b5563';

const demoPage = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Демо</title>
<style>
  body { margin: 0; background: #fff; color: #1a1c20; font: 18px/1.65 Georgia, "DejaVu Serif", serif; }
  header { border-bottom: 1px solid #e5e7eb; padding: 18px 0; margin-bottom: 36px; font: 14px system-ui, sans-serif; color: #6b7280; }
  main { max-width: 760px; margin: 0 auto; padding: 0 24px 60px; }
  header div { max-width: 760px; margin: 0 auto; padding: 0 24px; display: flex; gap: 24px; }
  h1 { font-size: 36px; line-height: 1.2; margin: 0 0 8px; }
  .meta { font: 14px system-ui, sans-serif; color: #6b7280; margin-bottom: 28px; }
  p { margin: 0 0 20px; }
  ::selection { background: #bfd4ff; }
</style>
<header><div><span>Новости</span><span>Культура</span><span>Путешествия</span><span>Технологии</span></div></header>
<main>
  <h1>Как читать русские вывески, если вы только учите алфавит</h1>
  <div class="meta">Путешествия · 5 минут чтения</div>
  <p>Кириллица выглядит пугающе только первые два дня. Половина букв совпадает с латиницей, ещё треть легко запоминается по форме.</p>
  <p id="target">Выделите любое слово или предложение на странице, и рядом появится его транслитерация.</p>
  <p>Названия станций метро, улиц и ресторанов станут понятны без словаря. Для документов есть паспортный стандарт, для научных ссылок — ГОСТ.</p>
</main>`;

const server = createServer((_, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(demoPage);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;

function convert(args) {
  execFileSync('convert', args, { stdio: 'inherit' });
}

/** Places a UI screenshot on a 1280x800 gradient with a caption on the left. */
function compose(shotPath, outName, title, subtitle, shotWidth) {
  const framed = join(TMP, `framed-${outName}`);
  convert([
    shotPath, '-resize', `${shotWidth}x`, '-bordercolor', '#e2e8f0', '-border', '1',
    '(', '+clone', '-background', '#00000066', '-shadow', '60x16+0+12', ')',
    '+swap', '-background', 'none', '-layers', 'merge', '+repage',
    framed,
  ]);
  convert([
    '-size', '1280x800', BG,
    '-font', FONT_BOLD, '-pointsize', '40', '-fill', INK, '-annotate', '+72+300', title,
    '-font', FONT, '-pointsize', '22', '-fill', MUTED, '-interline-spacing', '6', '-annotate', '+72+350', subtitle,
    framed, '-gravity', 'East', '-geometry', '+60+0', '-composite',
    join(OUT, outName),
  ]);
}

let chrome;
try {
  chrome = await Chrome.launch();
  // Page access is optional and CDP cannot click Chrome's permission prompt,
  // so load a copy with the permission pre-granted and enable the tooltip
  // through the real settings flow.
  const grantedDir = join(TMP, 'granted');
  rmSync(grantedDir, { recursive: true, force: true });
  cpSync(EXT_DIR, grantedDir, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
  writeFileSync(join(grantedDir, 'manifest.json'), JSON.stringify({ ...manifest, host_permissions: ['<all_urls>'] }));
  const extId = await chrome.loadExtension(grantedDir);
  await sleep(800);
  const setup = await chrome.open(`chrome-extension://${extId}/options.html`);
  await setup.waitFor("document.documentElement.dataset.ready");
  await setup.eval("document.querySelector('#tooltipEnabled').click()", { userGesture: true });
  await sleep(800);
  await setup.close();

  // 1. Tooltip on a real-looking page, captured straight at 1280x800.
  const tab = await chrome.open(pageUrl);
  await tab.setViewport(1280, 800);
  await tab.waitFor("document.getElementById('target')");
  await sleep(500);
  await tab.eval(`(async () => {
    const el = document.getElementById('target');
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
  })()`);
  writeFileSync(join(OUT, '1-tooltip.png'), await tab.screenshot());
  await tab.close();

  // 2. Popup
  const popup = await chrome.open(`chrome-extension://${extId}/popup.html`);
  await popup.waitFor("document.documentElement.dataset.ready");
  await popup.eval(`(() => { const s = document.querySelector('#source'); s.value = 'Съешь же ещё этих мягких французских булок, да выпей чаю'; s.dispatchEvent(new Event('input', { bubbles: true })); s.blur(); })()`);
  await popup.setViewport(400, 470, 2);
  const popupShot = join(TMP, 'popup.png');
  writeFileSync(popupShot, await popup.screenshot());
  await popup.close();
  compose(popupShot, '2-popup.png', 'One click converter', 'Pick a standard, paste or type,\ncopy the result. The selection from\nthe page is picked up automatically.', 560);

  // 3. Window
  const win = await chrome.open(`chrome-extension://${extId}/window.html`);
  await win.waitFor("document.documentElement.dataset.ready");
  await win.eval(`(() => { const d = document.querySelector('#direction'); d.value = 'lat2cyr'; d.dispatchEvent(new Event('change', { bubbles: true })); const s = document.querySelector('#source'); s.value = 'Dobro pozhalovat v Sankt-Peterburg! Nevskiy prospekt, Ermitazh, Petropavlovskaya krepost.'; s.dispatchEvent(new Event('input', { bubbles: true })); s.blur(); })()`);
  await win.setViewport(560, 440, 2);
  const winShot = join(TMP, 'window.png');
  writeFileSync(winShot, await win.screenshot());
  await win.eval(`(() => { const d = document.querySelector('#direction'); d.value = 'auto'; d.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(300);
  await win.close();
  compose(winShot, '3-window.png', 'Standalone window', 'Alt+Shift+T opens the converter\nin its own window with the text\nyou selected. Works both ways.', 640);

  // 4. Options
  const options = await chrome.open(`chrome-extension://${extId}/options.html`);
  await options.waitFor("document.documentElement.dataset.ready");
  await options.setViewport(600, 640, 2);
  const optShot = join(TMP, 'options.png');
  writeFileSync(optShot, await options.screenshot());
  await options.close();
  compose(optShot, '4-options.png', 'Your rules', 'Four standards: Popular, GOST\n7.79-2000, passport (ICAO), BGN/PCGN.\nTooltip delay, text fields, theme.', 600);

  // 5. Small promo tile 440x280
  convert([
    '-size', '440x280', 'gradient:#3b82f6-#1d4ed8',
    '(', resolve('src/public/icon/128.png'), '-resize', '96x96', ')', '-gravity', 'NorthWest', '-geometry', '+40+52', '-composite',
    '-gravity', 'NorthWest', '-font', FONT_BOLD, '-pointsize', '40', '-fill', 'white', '-annotate', '+160+62', 'Translitra',
    '-font', FONT, '-pointsize', '18', '-fill', '#dbeafe', '-annotate', '+160+118', 'Cyrillic ⇄ Latin, instantly',
    '-font', FONT, '-pointsize', '16', '-fill', '#bfdbfe', '-interline-spacing', '4', '-annotate', '+40+190', 'Select text on any page → see the transliteration.\nGOST · Passport · BGN/PCGN · Popular. Offline.',
    join(OUT, 'promo-small-440x280.png'),
  ]);

  console.log('Store assets written to', OUT);
} finally {
  await chrome?.close();
  server.close();
}
