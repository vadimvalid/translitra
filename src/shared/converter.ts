import { STANDARDS, transliterate, type DirectionOption, type Standard } from '../core';
import { loadSettings, onSettingsChange, saveSettings, type Settings } from './settings';
import { localizeDom, t } from './i18n';
import { applyTheme } from './theme';

export interface ConverterHandle {
  setSource(text: string): void;
  getSource(): string;
  focus(): void;
}

export interface ConverterOptions {
  /** Show the "Open in window" button. */
  showOpenWindow: boolean;
  onOpenWindow?: (text: string) => void;
}

const DIRECTIONS: DirectionOption[] = ['auto', 'cyr2lat', 'lat2cyr'];

export function renderConverterMarkup(): string {
  return `
    <div class="toolbar">
      <label class="field">
        <span data-i18n="standard"></span>
        <select id="standard"></select>
      </label>
      <label class="field">
        <span data-i18n="direction"></span>
        <select id="direction"></select>
      </label>
      <span class="spacer"></span>
      <button id="swap" class="icon" data-i18n-title="swap" title="">⇅</button>
    </div>
    <div class="panes">
      <div class="pane">
        <div class="pane-head">
          <span data-i18n="source"></span>
          <button id="clear" class="small" data-i18n="clear"></button>
        </div>
        <textarea id="source" data-i18n-placeholder="sourcePlaceholder" spellcheck="false"></textarea>
      </div>
      <div class="pane">
        <div class="pane-head">
          <span id="result-label" data-i18n="result"></span>
          <button id="copy" class="small primary" data-i18n="copy"></button>
        </div>
        <textarea id="result" readonly></textarea>
      </div>
    </div>
    <p class="hint" id="hint"></p>
    <div class="footer">
      <a href="#" id="open-options" data-i18n="settings"></a>
      <button id="open-window" class="small" data-i18n="openWindow" hidden></button>
    </div>
  `;
}

export async function mountConverter(root: HTMLElement, options: ConverterOptions): Promise<ConverterHandle> {
  root.innerHTML = renderConverterMarkup();
  localizeDom(root);

  const standardEl = root.querySelector<HTMLSelectElement>('#standard')!;
  const directionEl = root.querySelector<HTMLSelectElement>('#direction')!;
  const sourceEl = root.querySelector<HTMLTextAreaElement>('#source')!;
  const resultEl = root.querySelector<HTMLTextAreaElement>('#result')!;
  const copyEl = root.querySelector<HTMLButtonElement>('#copy')!;
  const swapEl = root.querySelector<HTMLButtonElement>('#swap')!;
  const clearEl = root.querySelector<HTMLButtonElement>('#clear')!;
  const hintEl = root.querySelector<HTMLParagraphElement>('#hint')!;
  const openWindowEl = root.querySelector<HTMLButtonElement>('#open-window')!;
  const openOptionsEl = root.querySelector<HTMLAnchorElement>('#open-options')!;

  for (const id of STANDARDS) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = t(`standard_${id}`);
    standardEl.append(opt);
  }
  for (const id of DIRECTIONS) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = t(`direction_${id}`);
    directionEl.append(opt);
  }

  let settings: Settings = await loadSettings();
  applyTheme(settings.theme);
  standardEl.value = settings.standard;
  directionEl.value = settings.direction;

  function update(): void {
    const { text, direction } = transliterate(sourceEl.value, {
      standard: standardEl.value as Standard,
      direction: directionEl.value as DirectionOption,
    });
    resultEl.value = text;
    const dirLabel = t(direction === 'cyr2lat' ? 'direction_cyr2lat' : 'direction_lat2cyr');
    hintEl.textContent =
      sourceEl.value.trim() === ''
        ? ''
        : direction === 'lat2cyr'
          ? `${dirLabel}. ${t('reverseApproximate')}`
          : dirLabel;
  }

  sourceEl.addEventListener('input', update);
  standardEl.addEventListener('change', () => {
    void saveSettings({ standard: standardEl.value as Standard });
    update();
  });
  directionEl.addEventListener('change', () => {
    void saveSettings({ direction: directionEl.value as DirectionOption });
    update();
  });

  copyEl.addEventListener('click', async () => {
    if (!resultEl.value) return;
    try {
      await navigator.clipboard.writeText(resultEl.value);
    } catch {
      resultEl.select();
      document.execCommand('copy');
    }
    const label = copyEl.textContent;
    copyEl.textContent = t('copied');
    setTimeout(() => (copyEl.textContent = label), 1200);
  });

  swapEl.addEventListener('click', () => {
    const result = resultEl.value;
    sourceEl.value = result;
    const current = directionEl.value as DirectionOption;
    if (current !== 'auto') directionEl.value = current === 'cyr2lat' ? 'lat2cyr' : 'cyr2lat';
    update();
    sourceEl.focus();
  });

  clearEl.addEventListener('click', () => {
    sourceEl.value = '';
    update();
    sourceEl.focus();
  });

  openOptionsEl.addEventListener('click', (e) => {
    e.preventDefault();
    void chrome.runtime.openOptionsPage();
  });

  if (options.showOpenWindow) {
    openWindowEl.hidden = false;
    openWindowEl.addEventListener('click', () => options.onOpenWindow?.(sourceEl.value));
  }

  onSettingsChange((next) => {
    settings = next;
    applyTheme(next.theme);
    if (standardEl.value !== next.standard) {
      standardEl.value = next.standard;
      update();
    }
  });

  update();

  return {
    setSource(text) {
      sourceEl.value = text;
      update();
    },
    getSource: () => sourceEl.value,
    focus: () => sourceEl.focus(),
  };
}
