/**
 * Minimal Chrome DevTools Protocol driver over --remote-debugging-pipe.
 * Used by the smoke test and the store screenshot generator.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

export class Session {
  constructor(pipe, sessionId, targetId) {
    this.pipe = pipe;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.events = [];
    pipe.listeners.push((msg) => {
      if (msg.sessionId === sessionId) this.events.push(msg);
    });
  }
  send(method, params) {
    return this.pipe.send(method, params, this.sessionId);
  }
  async eval(expression, { userGesture = false } = {}) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture });
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
  async setViewport(width, height, scale = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
    await sleep(150);
  }
  /** Returns a PNG buffer of the current viewport. */
  async screenshot() {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(data, 'base64');
  }
  errors() {
    return this.events
      .filter((e) => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
      .map((e) => e.params.exceptionDetails?.exception?.description ?? e.params.exceptionDetails?.text ?? e.params.entry?.text);
  }
  close() {
    return this.pipe.send('Target.closeTarget', { targetId: this.targetId });
  }
}

export class Chrome {
  constructor(proc, pipe, profile) {
    this.proc = proc;
    this.pipe = pipe;
    this.profile = profile;
  }

  /**
   * Launches headless Chrome with the extension-debugging flag.
   * Google Chrome 137+ ignores --load-extension, so extensions are loaded
   * afterwards with the CDP command Extensions.loadUnpacked.
   */
  static async launch({ bin = process.env.CHROME_BIN || 'google-chrome', lang = 'en-US' } = {}) {
    const profile = mkdtempSync(join(tmpdir(), 'translitra-chrome-'));
    const proc = spawn(
      bin,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-first-run',
        '--hide-scrollbars',
        '--remote-debugging-pipe',
        '--enable-unsafe-extension-debugging',
        `--lang=${lang}`,
        `--user-data-dir=${profile}`,
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
    );
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d));
    const pipe = new Pipe(proc);
    const version = await Promise.race([
      pipe.send('Browser.getVersion'),
      sleep(15000).then(() => {
        throw new Error('Chrome did not answer over the pipe:\n' + stderr);
      }),
    ]);
    const chrome = new Chrome(proc, pipe, profile);
    chrome.version = version.product;
    return chrome;
  }

  async loadExtension(path) {
    const { id } = await this.pipe.send('Extensions.loadUnpacked', { path });
    return id;
  }

  async targets() {
    const { targetInfos } = await this.pipe.send('Target.getTargets');
    return targetInfos;
  }

  async open(url) {
    const { targetId } = await this.pipe.send('Target.createTarget', { url });
    const { sessionId } = await this.pipe.send('Target.attachToTarget', { targetId, flatten: true });
    const session = new Session(this.pipe, sessionId, targetId);
    await session.send('Runtime.enable');
    await session.send('Page.enable');
    await session.send('Log.enable');
    await sleep(300);
    return session;
  }

  async close() {
    this.proc.kill('SIGKILL');
    await sleep(300);
    rmSync(this.profile, { recursive: true, force: true });
  }
}
