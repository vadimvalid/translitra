import '../../shared/ui.css';
import { mountConverter } from '../../shared/converter';
import { forgetConverterWindow, saveBounds, takePendingText } from '../../shared/session';
import { t } from '../../shared/i18n';

async function main(): Promise<void> {
  document.title = t('windowTitle');
  const root = document.getElementById('app')!;
  const converter = await mountConverter(root, { showOpenWindow: false });

  const pending = await takePendingText();
  if (pending) converter.setSource(pending);
  converter.focus();

  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message?.type === 'pending-text') {
      void takePendingText().then((text) => {
        if (text) {
          converter.setSource(text);
          converter.focus();
        }
      });
    }
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void saveBounds({
        width: window.outerWidth,
        height: window.outerHeight,
        left: window.screenX,
        top: window.screenY,
      });
    }, 300);
  });

  window.addEventListener('beforeunload', () => {
    void saveBounds({
      width: window.outerWidth,
      height: window.outerHeight,
      left: window.screenX,
      top: window.screenY,
    });
    void chrome.windows.getCurrent().then((win) => {
      if (win.id !== undefined) void forgetConverterWindow(win.id);
    });
  });
}

void main();
