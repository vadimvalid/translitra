import { readActiveTabSelection } from '../shared/messages';
import { loadSettings, onSettingsChange } from '../shared/settings';
import { forgetConverterWindow, openConverterWindow } from '../shared/session';
import { syncTooltipRegistration, unregisterTooltipScript } from '../shared/permissions';

const MENU_ID = 'translitra-selection';

async function syncFromSettings(): Promise<void> {
  const settings = await loadSettings();
  await syncTooltipRegistration(settings.tooltipEnabled);
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_ID,
        title: chrome.i18n.getMessage('ctxTransliterate'),
        contexts: ['selection'],
      });
    });
    void syncFromSettings();
    // First install: show settings so the user can turn the tooltip on.
    if (details.reason === 'install') void chrome.runtime.openOptionsPage();
  });

  chrome.runtime.onStartup.addListener(() => {
    void syncFromSettings();
  });

  onSettingsChange((settings) => {
    void syncTooltipRegistration(settings.tooltipEnabled);
  });

  chrome.permissions.onRemoved.addListener((removed) => {
    if (removed.origins?.length) void unregisterTooltipScript();
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== MENU_ID) return;
    void openConverterWindow(info.selectionText ?? '');
  });

  chrome.commands.onCommand.addListener((command) => {
    if (command !== 'open-converter') return;
    void readActiveTabSelection().then((text) => openConverterWindow(text));
  });

  chrome.windows.onRemoved.addListener((windowId) => {
    void forgetConverterWindow(windowId);
  });
});
