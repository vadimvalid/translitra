import { saveSettings } from './settings';

/** Host permission needed by the selection tooltip. Optional in the manifest. */
export const PAGE_ORIGINS = ['<all_urls>'];
const SCRIPT_ID = 'translitra-tooltip';
const SCRIPT_FILE = 'content-scripts/content.js';

export function hasPageAccess(): Promise<boolean> {
  return chrome.permissions.contains({ origins: PAGE_ORIGINS });
}

/** Must be called from a user gesture (click/change handler). */
export function requestPageAccess(): Promise<boolean> {
  return chrome.permissions.request({ origins: PAGE_ORIGINS });
}

export async function isTooltipScriptRegistered(): Promise<boolean> {
  const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  return scripts.length > 0;
}

export async function registerTooltipScript(): Promise<void> {
  if (await isTooltipScriptRegistered()) return;
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: SCRIPT_ID,
        js: [SCRIPT_FILE],
        matches: PAGE_ORIGINS,
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ]);
  } catch (err) {
    // The background worker and the options page can race to register it.
    if (!String(err).includes('Duplicate script ID')) throw err;
  }
}

export async function unregisterTooltipScript(): Promise<void> {
  if (!(await isTooltipScriptRegistered())) return;
  await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
}

/** Injects the tooltip script into already-open http(s) tabs so it works without a reload. */
export async function injectIntoOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id === undefined) return;
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [SCRIPT_FILE] });
      } catch {
        // Tab may be discarded, a store page, or otherwise off-limits.
      }
    }),
  );
}

/**
 * Turns the tooltip on: asks for page access (prompt on first use), saves the
 * setting, registers the content script and injects it into open tabs.
 * Returns false if the user declined.
 */
export async function enableTooltip(): Promise<boolean> {
  const granted = await requestPageAccess();
  if (!granted) return false;
  await saveSettings({ tooltipEnabled: true });
  await registerTooltipScript();
  await injectIntoOpenTabs();
  return true;
}

/** Turns the tooltip off and gives the page access back. */
export async function disableTooltip(): Promise<void> {
  await saveSettings({ tooltipEnabled: false });
  await unregisterTooltipScript();
  try {
    await chrome.permissions.remove({ origins: PAGE_ORIGINS });
  } catch {
    // Not granted or not removable; nothing to do.
  }
}

/** Called by the background worker: keeps registration in sync with permission + setting. */
export async function syncTooltipRegistration(tooltipEnabled: boolean): Promise<void> {
  if (tooltipEnabled && (await hasPageAccess())) await registerTooltipScript();
  else await unregisterTooltipScript();
}
