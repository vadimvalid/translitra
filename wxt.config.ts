import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  webExt: {
    // Dev browser opens a page with plenty of Cyrillic text to select.
    startUrls: ['https://ru.wikipedia.org/wiki/Транслитерация'],
  },
  outDir: '.output',
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      // The tooltip content script is registered at runtime, so WXT must not
      // turn its `matches` into required host permissions.
      delete manifest.host_permissions;
      if (!manifest.content_scripts?.length) delete manifest.content_scripts;
    },
  },
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['contextMenus', 'storage', 'activeTab', 'scripting'],
    // Page access is optional: it is requested only when the user turns the
    // selection tooltip on, and the content script is registered at runtime.
    optional_host_permissions: ['<all_urls>'],
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
