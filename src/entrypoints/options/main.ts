import '../../shared/ui.css';
import { STANDARDS } from '../../core';
import { loadSettings, saveSettings, type Settings, type Theme } from '../../shared/settings';
import { localizeDom, t } from '../../shared/i18n';
import { applyTheme } from '../../shared/theme';
import { disableTooltip, enableTooltip, hasPageAccess } from '../../shared/permissions';

const THEMES: Theme[] = ['system', 'light', 'dark'];

async function main(): Promise<void> {
  document.title = t('optionsTitle');
  localizeDom();

  const standardEl = document.getElementById('standard') as HTMLSelectElement;
  const tooltipEl = document.getElementById('tooltipEnabled') as HTMLInputElement;
  const tooltipAccessEl = document.getElementById('tooltipAccess')!;
  const delayEl = document.getElementById('tooltipDelay') as HTMLInputElement;
  const ignoreEl = document.getElementById('ignoreInputs') as HTMLInputElement;
  const themeEl = document.getElementById('theme') as HTMLSelectElement;
  const statusEl = document.getElementById('status')!;

  for (const id of STANDARDS) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = t(`standard_${id}`);
    standardEl.append(opt);
  }
  for (const id of THEMES) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = t(`theme_${id}`);
    themeEl.append(opt);
  }

  const settings = await loadSettings();
  applyTheme(settings.theme);
  standardEl.value = settings.standard;
  tooltipEl.checked = settings.tooltipEnabled && (await hasPageAccess());
  tooltipAccessEl.hidden = tooltipEl.checked;
  delayEl.value = String(settings.tooltipDelay);
  ignoreEl.checked = settings.ignoreInputs;
  themeEl.value = settings.theme;

  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  function showSaved(): void {
    statusEl.textContent = t('optSaved');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (statusEl.textContent = ''), 1500);
  }
  async function save(patch: Partial<Settings>): Promise<void> {
    const next = await saveSettings(patch);
    applyTheme(next.theme);
    showSaved();
  }

  standardEl.addEventListener('change', () => save({ standard: standardEl.value as Settings['standard'] }));
  tooltipEl.addEventListener('change', async () => {
    tooltipEl.disabled = true;
    try {
      if (tooltipEl.checked) {
        const ok = await enableTooltip();
        tooltipEl.checked = ok;
        if (ok) showSaved();
      } else {
        await disableTooltip();
        showSaved();
      }
    } finally {
      tooltipEl.disabled = false;
      tooltipAccessEl.hidden = tooltipEl.checked;
    }
  });
  delayEl.addEventListener('change', () => {
    const value = Math.min(2000, Math.max(0, Number(delayEl.value) || 0));
    delayEl.value = String(value);
    void save({ tooltipDelay: value });
  });
  ignoreEl.addEventListener('change', () => save({ ignoreInputs: ignoreEl.checked }));
  themeEl.addEventListener('change', () => save({ theme: themeEl.value as Theme }));
  document.documentElement.dataset.ready = 'true';
}

void main();
