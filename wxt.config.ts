import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  webExt: {
    // Dev browser opens a page with plenty of Cyrillic text to select.
    startUrls: ['https://ru.wikipedia.org/wiki/Транслитерация'],
  },
  outDir: '.output',
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['contextMenus', 'storage', 'activeTab', 'scripting'],
    commands: {
      'open-converter': {
        suggested_key: { default: 'Alt+Shift+T' },
        description: '__MSG_cmdOpenConverter__',
      },
    },
    action: {
      default_title: '__MSG_extName__',
    },
  },
});
