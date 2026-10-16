import '../../shared/ui.css';
import { mountConverter } from '../../shared/converter';
import { readActiveTabSelection } from '../../shared/messages';
import { openConverterWindow } from '../../shared/session';

async function main(): Promise<void> {
  const root = document.getElementById('app')!;
  const converter = await mountConverter(root, {
    showOpenWindow: true,
    onOpenWindow: async (text) => {
      await openConverterWindow(text);
      window.close();
    },
  });
  const selection = await readActiveTabSelection();
  if (selection.trim()) converter.setSource(selection);
  converter.focus();
}

void main();
