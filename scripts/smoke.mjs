/**
 * Smoke test: loads the built extension into headless Chrome and checks that
 * the popup converts text and the content-script tooltip appears on selection.
 *
 *   pnpm smoke                      (builds first)
 *   SMOKE_SHOTS=<dir> pnpm smoke    (also saves PNG screenshots of each page)
 *   CHROME_BIN=/path/to/chrome ...  (override the browser binary)
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { Chrome, sleep } from './lib/chrome.mjs';

const EXT_DIR = resolve('.output/chrome-mv3');
/** Copy of the build with page access pre-granted, since CDP cannot click Chrome's permission prompt. */
const GRANTED_DIR = resolve('.output/chrome-mv3-smoke-granted');
const SHOTS = process.env.SMOKE_SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const page = `<!doctype html><meta charset="utf-8"><title>t</title>
<p id="ru">Привет, мир</p><p id="en">Privet, mir</p>
<textarea id="ta">Текст в поле</textarea>`;
const server = createServer((_, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(page);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;

const failures = [];
function check(name, ok, detail = '') {
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}
async function shot(session, name, width, height) {
  if (!SHOTS) return;
  await session.setViewport(width, height);
  writeFileSync(join(SHOTS, `${name}.png`), await session.screenshot());
}

let chrome;
try {
  chrome = await Chrome.launch();
  console.log(chrome.version);

  const extId = await chrome.loadExtension(EXT_DIR);
  check('extension loaded', typeof extId === 'string' && extId.length === 32, extId);
  await sleep(800);

  const targets = await chrome.targets();
  const sw = targets.find((t) => t.type === 'service_worker' && t.url === `chrome-extension://${extId}/background.js`);
  check('service worker is running', Boolean(sw), sw ? '' : targets.map((t) => `${t.type}:${t.url}`).join(' | '));

  const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
  check('manifest has no required host permissions', !manifest.host_permissions && !manifest.content_scripts, JSON.stringify({ host: manifest.host_permissions, cs: manifest.content_scripts }));
  check('manifest declares optional <all_urls>', manifest.optional_host_permissions?.includes('<all_urls>'), JSON.stringify(manifest.optional_host_permissions));
  check('manifest permissions are minimal', JSON.stringify([...manifest.permissions].sort()) === JSON.stringify(['activeTab', 'contextMenus', 'scripting', 'storage']), JSON.stringify(manifest.permissions));

  // ---------- popup ----------
  const popup = await chrome.open(`chrome-extension://${extId}/popup.html`);
  const popupReady = await popup.waitFor("document.documentElement.dataset.ready");
  check('popup renders', popupReady, popupReady ? '' : `errors=${JSON.stringify(popup.errors())} url=${await popup.eval('location.href')}`);
  const popupResult = await popup.eval(`(() => {
    const src = document.querySelector('#source');
    src.value = 'Щука и ёж';
    src.dispatchEvent(new Event('input', { bubbles: true }));
    return {
      result: document.querySelector('#result').value,
      options: [...document.querySelectorAll('#standard option')].map(o => o.textContent),
      hint: document.querySelector('#hint').textContent,
      copyLabel: document.querySelector('#copy').textContent,
    };
  })()`);
  check('popup transliterates', popupResult.result === 'Shchuka i yozh', JSON.stringify(popupResult));
  check('popup lists 4 standards', popupResult.options.length === 4, popupResult.options.join(', '));
  check('popup is localized', popupResult.copyLabel !== 'copy' && popupResult.copyLabel.length > 0, popupResult.copyLabel);

  const gostResult = await popup.eval(`(() => {
    const sel = document.querySelector('#standard');
    sel.value = 'gost';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return document.querySelector('#result').value;
  })()`);
  check('popup switches standard to GOST', gostResult === 'Shhuka i yozh', gostResult);
  await sleep(300);

  const swapped = await popup.eval(`(() => {
    document.querySelector('#swap').click();
    return { source: document.querySelector('#source').value, result: document.querySelector('#result').value };
  })()`);
  check('swap feeds result back as source', swapped.source === 'Shhuka i yozh' && swapped.result === 'Щука и ёж', JSON.stringify(swapped));

  await popup.eval(`(() => {
    const sel = document.querySelector('#standard');
    sel.value = 'popular';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(300);
  const bannerDisplay = await popup.eval("getComputedStyle(document.querySelector('#tooltip-banner')).display");
  check('popup offers to turn the tooltip on', bannerDisplay !== 'none', bannerDisplay);
  check('popup has no errors', popup.errors().length === 0, JSON.stringify(popup.errors()).slice(0, 300));
  await shot(popup, 'popup', 400, 420);
  await popup.close();

  // ---------- options ----------
  const options = await chrome.open(`chrome-extension://${extId}/options.html`);
  check('options renders', await options.waitFor("document.documentElement.dataset.ready"), JSON.stringify(options.errors()));
  const optState = await options.eval(`(() => ({
    title: document.querySelector('h1').textContent,
    standard: document.querySelector('#standard').value,
    tooltip: document.querySelector('#tooltipEnabled').checked,
    delay: document.querySelector('#tooltipDelay').value,
  }))()`);
  await shot(options, 'options', 640, 560);
  check('options shows defaults', optState.title.length > 0 && optState.standard === 'popular' && optState.tooltip === false && optState.delay === '150', JSON.stringify(optState));
  const registeredBefore = await options.eval('chrome.scripting.getRegisteredContentScripts().then(s => s.length)');
  check('no content script registered without page access', registeredBefore === 0, String(registeredBefore));
  await options.close();

  // ---------- window ----------
  const win = await chrome.open(`chrome-extension://${extId}/window.html`);
  check('converter window renders', await win.waitFor("document.documentElement.dataset.ready"), JSON.stringify(win.errors()));
  const openWindowDisplay = await win.eval("getComputedStyle(document.querySelector('#open-window')).display");
  check('window hides "open in window" button', openWindowDisplay === 'none', openWindowDisplay);
  await win.eval(`(() => { const s = document.querySelector('#source'); s.value = 'Съешь же ещё этих мягких французских булок, да выпей чаю'; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await shot(win, 'window', 560, 480);
  await win.close();

  // ---------- tooltip: enable flow on a build with page access granted ----------
  rmSync(GRANTED_DIR, { recursive: true, force: true });
  cpSync(EXT_DIR, GRANTED_DIR, { recursive: true });
  const grantedManifest = { ...manifest, host_permissions: ['<all_urls>'] };
  writeFileSync(join(GRANTED_DIR, 'manifest.json'), JSON.stringify(grantedManifest));
  const grantedId = await chrome.loadExtension(GRANTED_DIR);
  await sleep(800);

  const opt2 = await chrome.open(`chrome-extension://${grantedId}/options.html`);
  await opt2.waitFor("document.documentElement.dataset.ready");
  await opt2.eval("document.querySelector('#tooltipEnabled').click()", { userGesture: true });
  await sleep(800);
  const enabled = await opt2.eval(`(async () => ({
    checked: document.querySelector('#tooltipEnabled').checked,
    registered: (await chrome.scripting.getRegisteredContentScripts()).map(s => s.id),
    settings: (await chrome.storage.sync.get('settings')).settings?.tooltipEnabled,
  }))()`);
  check('enabling the tooltip registers the content script', enabled.checked && enabled.registered.includes('translitra-tooltip') && enabled.settings === true, JSON.stringify(enabled));
  const popup2 = await chrome.open(`chrome-extension://${grantedId}/popup.html`);
  await popup2.waitFor("document.documentElement.dataset.ready");
  const bannerAfter = await popup2.eval("getComputedStyle(document.querySelector('#tooltip-banner')).display");
  check('popup hides the banner once the tooltip is on', bannerAfter === 'none', bannerAfter);
  await popup2.close();
  check('options has no errors', opt2.errors().length === 0, JSON.stringify(opt2.errors()).slice(0, 300));
  await opt2.close();

  const tab = await chrome.open(pageUrl);
  await tab.waitFor("document.getElementById('ru')");
  await sleep(600);
  const select = (id) => `(async () => {
    const el = document.getElementById('${id}');
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    const host = document.getElementById('translitra-tooltip-host');
    if (!host) return { host: false };
    const tip = host.shadowRoot.querySelector('.tip');
    return { host: true, hidden: tip.hidden, text: tip.querySelector('.text').textContent, left: tip.style.left, top: tip.style.top };
  })()`;

  const tipRu = await tab.eval(select('ru'));
  check('tooltip appears for Cyrillic selection', tipRu.host && !tipRu.hidden && tipRu.text === 'Privet, mir', JSON.stringify(tipRu));
  await shot(tab, 'tooltip', 800, 400);
  const tipEn = await tab.eval(select('en'));
  check('tooltip converts Latin selection', tipEn.host && !tipEn.hidden && tipEn.text === 'Привет, мир', JSON.stringify(tipEn));

  const hiddenOnEsc = await tab.eval(`(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    return document.getElementById('translitra-tooltip-host').shadowRoot.querySelector('.tip').hidden;
  })()`);
  check('tooltip hides on Escape', hiddenOnEsc === true);

  const tipTextarea = await tab.eval(`(async () => {
    const ta = document.getElementById('ta');
    ta.focus();
    ta.select();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    return document.getElementById('translitra-tooltip-host').shadowRoot.querySelector('.tip').hidden;
  })()`);
  check('tooltip ignores selection inside textarea', tipTextarea === true);
  check('page has no errors', tab.errors().length === 0, JSON.stringify(tab.errors()).slice(0, 300));
  await tab.close();

  const opt3 = await chrome.open(`chrome-extension://${grantedId}/options.html`);
  await opt3.waitFor("document.documentElement.dataset.ready && document.querySelector('#tooltipEnabled').checked");
  await opt3.eval("document.querySelector('#tooltipEnabled').click()", { userGesture: true });
  await sleep(800);
  const disabled = await opt3.eval(`(async () => ({
    checked: document.querySelector('#tooltipEnabled').checked,
    registered: (await chrome.scripting.getRegisteredContentScripts()).length,
  }))()`);
  check('disabling the tooltip unregisters the content script', !disabled.checked && disabled.registered === 0, JSON.stringify(disabled));
  await opt3.close();
} catch (err) {
  console.error(err);
  failures.push('exception: ' + err.message);
} finally {
  await chrome?.close();
  server.close();
  rmSync(GRANTED_DIR, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
