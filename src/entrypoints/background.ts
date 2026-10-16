import { readActiveTabSelection } from '../shared/messages';
import { forgetConverterWindow, openConverterWindow } from '../shared/session';

const MENU_ID = 'translitra-selection';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_ID,
        title: chrome.i18n.getMessage('ctxTransliterate'),
        contexts: ['selection'],
      });
    });
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
