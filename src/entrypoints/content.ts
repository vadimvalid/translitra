import { countScripts, transliterate } from '../core';
import { loadSettings, onSettingsChange, type Settings } from '../shared/settings';
import { t } from '../shared/i18n';

const MAX_SELECTION = 2000;
const HOST_ID = 'translitra-tooltip-host';

const STYLES = `
  :host { all: initial; }
  .tip {
    position: fixed;
    z-index: 2147483647;
    max-width: 420px;
    max-height: 200px;
    overflow: auto;
    box-sizing: border-box;
    padding: 8px 10px;
    border-radius: 8px;
    background: #1f2227;
    color: #f2f3f5;
    font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
    display: flex;
    gap: 8px;
    align-items: flex-start;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .text { flex: 1; min-width: 0; user-select: text; }
  .copy {
    flex: none;
    font: 12px system-ui, sans-serif;
    color: #f2f3f5;
    background: #3a3f48;
    border: 0;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
  }
  .copy:hover { background: #4a5060; }
  .note {
    position: absolute;
    right: 10px;
    bottom: 2px;
    font-size: 10px;
    color: #9aa1ad;
  }
`;

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: false,

  async main() {
    let settings: Settings = await loadSettings();
    onSettingsChange((next) => {
      settings = next;
      if (!settings.tooltipEnabled) hide();
    });

    let host: HTMLDivElement | undefined;
    let tip: HTMLDivElement | undefined;
    let textEl: HTMLDivElement | undefined;
    let copyEl: HTMLButtonElement | undefined;
    let lastResult = '';
    let timer: ReturnType<typeof setTimeout> | undefined;

    function ensureTooltip(): void {
      if (host && host.isConnected) return;
      host = document.createElement('div');
      host.id = HOST_ID;
      host.style.all = 'initial';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = STYLES;
      tip = document.createElement('div');
      tip.className = 'tip';
      tip.hidden = true;
      textEl = document.createElement('div');
      textEl.className = 'text';
      copyEl = document.createElement('button');
      copyEl.className = 'copy';
      copyEl.type = 'button';
      copyEl.textContent = t('copy');
      copyEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(lastResult);
          copyEl!.textContent = t('copied');
          setTimeout(() => (copyEl!.textContent = t('copy')), 1200);
        } catch {
          /* clipboard blocked by page policy */
        }
      });
      tip.append(textEl, copyEl);
      // Keep page handlers from reacting to clicks inside the tooltip.
      for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup'] as const) {
        tip.addEventListener(type, (e) => e.stopPropagation());
      }
      shadow.append(style, tip);
      (document.body ?? document.documentElement).append(host);
    }

    function hide(): void {
      if (tip) tip.hidden = true;
    }

    function isEditable(node: Node | null): boolean {
      let el: Element | null = node instanceof Element ? node : node?.parentElement ?? null;
      while (el) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
        if ((el as HTMLElement).isContentEditable) return true;
        el = el.parentElement;
      }
      return false;
    }

    function position(rect: DOMRect): void {
      if (!tip) return;
      tip.style.left = '0px';
      tip.style.top = '0px';
      tip.hidden = false;
      const { width, height } = tip.getBoundingClientRect();
      const margin = 8;
      let left = rect.left;
      let top = rect.bottom + margin;
      if (left + width > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - width - margin);
      if (top + height > window.innerHeight - margin) top = Math.max(margin, rect.top - height - margin);
      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
    }

    function show(): void {
      if (!settings.tooltipEnabled) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        hide();
        return;
      }
      const text = selection.toString();
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > MAX_SELECTION) {
        hide();
        return;
      }
      const { cyrillic, latin } = countScripts(trimmed);
      if (cyrillic + latin === 0) {
        hide();
        return;
      }
      if (settings.ignoreInputs && isEditable(selection.anchorNode)) {
        hide();
        return;
      }

      const { text: result } = transliterate(trimmed, { standard: settings.standard, direction: 'auto' });
      if (result === trimmed) {
        hide();
        return;
      }
      lastResult = result;

      ensureTooltip();
      textEl!.textContent = result;
      copyEl!.textContent = t('copy');
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      const rect = rects.length ? rects[rects.length - 1]! : range.getBoundingClientRect();
      position(rect);
    }

    function schedule(): void {
      clearTimeout(timer);
      timer = setTimeout(show, settings.tooltipDelay);
    }

    document.addEventListener('mouseup', (e) => {
      if (host && e.composedPath().includes(host)) return;
      schedule();
    });
    document.addEventListener('keyup', (e) => {
      if (e.shiftKey || e.key === 'Shift' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a')) schedule();
    });
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) hide();
    });
    document.addEventListener('mousedown', (e) => {
      if (host && e.composedPath().includes(host)) return;
      hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
    });
    window.addEventListener('scroll', hide, { capture: true, passive: true });
    window.addEventListener('resize', hide);
  },
});
