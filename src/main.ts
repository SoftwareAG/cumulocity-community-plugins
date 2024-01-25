import './i18n';
import { applyOptions, loadOptions, loginOptions } from '@c8y/bootstrap';

const barHolder: HTMLElement | null = document.querySelector('body > .init-load');
export const removeProgress = () => barHolder && barHolder.parentNode?.removeChild(barHolder);

applicationSetup();

async function applicationSetup() {
  await applyOptions({
    ...(await loadOptions()),
    ...((await loginOptions()) as object)
  });

  const mod = await import('./bootstrap');
  const bootstrapApp = mod.bootstrap || (window as any).bootstrap || (() => null);

  return Promise.resolve(bootstrapApp()).then(removeProgress);
}
