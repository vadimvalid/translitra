/**
 * Smoke test: loads the built extension into headless Chrome (via the CDP
 * `Extensions.loadUnpacked` command over --remote-debugging-pipe, which works
 * on current Google Chrome builds where --load-extension is ignored) and checks
 * that the popup converts text and the content-script tooltip appears.
 *
 *   pnpm smoke        (builds first)
 *   CHROME_BIN=/path/to/chrome node scripts/smoke.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const EXT_DIR = resolve('.output/chrome-mv3');
const CHROME = process.env.CHROME_BIN || 'google-chrome';
/** Set SMOKE_SHOTS=<dir> to save PNG screenshots of every page under test. */
const SHOTS = process.env.SMOKE_SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- test page ----------
const page = `<!doctype html><meta charset="utf-8"><title>t</title>
<p id="ru">Привет, мир</p><p id="en">Privet, mir</p>
<textarea id="ta">Текст в поле</textarea>`;
const server = createServer((_, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(page);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;

// ---------- chrome over pipe ----------
const profile = mkdtempSync(join(tmpdir(), 'translitra-smoke-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-pipe',
    '--enable-unsafe-extension-debugging',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
);
let chromeErr = '';
chrome.stderr.on('data', (d) => (chromeErr += d));

class Pipe {
  constructor(proc) {
    this.proc = proc;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    let buffer = '';
    proc.stdio[4].on('data', (chunk) => {
      buffer += chunk.toString();
      let idx;
      while ((idx = buffer.indexOf('\0')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        this.dispatch(JSON.parse(raw));
      }
    });
  }
  dispatch(msg) {
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message} (${msg.error.data ?? ''})`)) : resolve(msg.result);
    } else if (msg.method) {
      for (const l of this.listeners) l(msg);
    }
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.proc.stdio[3].write(JSON.stringify(payload) + '\0');
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

class Session {
  constructor(pipe, sessionId) {
    this.pipe = pipe;
    this.sessionId = sessionId;
    this.events = [];
    pipe.listeners.push((msg) => {
      if (msg.sessionId === sessionId) this.events.push(msg);
    });
  }
  send(method, params) {
    return this.pipe.send(method, params, this.sessionId);
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }
  async waitFor(expression, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.eval(`Boolean(${expression})`)) return true;
      await sleep(100);
    }
    return false;
  }
  async screenshot(name, width = 1280, height = 800) {
    if (!SHOTS) return;
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await sleep(150);
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  }
  errors() {
    return this.events
      .filter((e) => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
      .map((e) => e.params.exceptionDetails?.exception?.description ?? e.params.exceptionDetails?.text ?? e.params.entry?.text);
  }
}

const pipe = new Pipe(chrome);

async function openPage(url) {
  const { targetId } = await pipe.send('Target.createTarget', { url });
  const { sessionId } = await pipe.send('Target.attachToTarget', { targetId, flatten: true });
  const session = new Session(pipe, sessionId);
  await session.send('Runtime.enable');
  await session.send('Page.enable');
  await session.send('Log.enable');
  await sleep(300);
  session.close = () => pipe.send('Target.closeTarget', { targetId });
  return session;
}

const failures = [];
function check(name, ok, detail = '') {
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

try {
  const version = await Promise.race([
    pipe.send('Browser.getVersion'),
    sleep(15000).then(() => { throw new Error('Chrome did not answer over the pipe:\n' + chromeErr); }),
  ]);
  console.log(`Chrome ${version.product}`);

  const { id: extId } = await pipe.send('Extensions.loadUnpacked', { path: EXT_DIR });
  check('extension loaded', typeof extId === 'string' && extId.length === 32, extId);
  await sleep(800);

  const { targetInfos } = await pipe.send('Target.getTargets');
  const sw = targetInfos.find((t) => t.type === 'service_worker' && t.url === `chrome-extension://${extId}/background.js`);
  check('service worker is running', Boolean(sw), sw ? '' : targetInfos.map((t) => `${t.type}:${t.url}`).join(' | '));

  // ---------- popup ----------
  const popup = await openPage(`chrome-extension://${extId}/popup.html`);
  const popupReady = await popup.waitFor("document.querySelector('#source')");
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
  check('popup has no errors', popup.errors().length === 0, JSON.stringify(popup.errors()).slice(0, 300));
  await popup.screenshot('popup', 400, 420);
  await popup.close();

  // ---------- options ----------
  const options = await openPage(`chrome-extension://${extId}/options.html`);
  check('options renders', await options.waitFor("document.querySelector('#standard option')"), JSON.stringify(options.errors()));
  const optState = await options.eval(`(() => ({
    title: document.querySelector('h1').textContent,
    standard: document.querySelector('#standard').value,
    tooltip: document.querySelector('#tooltipEnabled').checked,
    delay: document.querySelector('#tooltipDelay').value,
  }))()`);
  await options.screenshot('options', 640, 560);
  check('options shows defaults', optState.title.length > 0 && optState.standard === 'popular' && optState.tooltip === true && optState.delay === '150', JSON.stringify(optState));
  await options.close();

  // ---------- window ----------
  const win = await openPage(`chrome-extension://${extId}/window.html`);
  check('converter window renders', await win.waitFor("document.querySelector('#source')"), JSON.stringify(win.errors()));
  const openWindowHidden = await win.eval("document.querySelector('#open-window').hidden");
  check('window hides "open in window" button', openWindowHidden === true);
  await win.eval(`(() => { const s = document.querySelector('#source'); s.value = 'Съешь же ещё этих мягких французских булок, да выпей чаю'; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await win.screenshot('window', 560, 480);
  await win.close();

  // ---------- content script ----------
  const tab = await openPage(pageUrl);
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
  await tab.screenshot('tooltip', 800, 400);
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
} catch (err) {
  console.error(err);
  failures.push('exception: ' + err.message);
} finally {
  chrome.kill('SIGKILL');
  server.close();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
