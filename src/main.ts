import './style.css';
import { App } from './app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app root element not found');
const appEl: HTMLDivElement = root;

new App(appEl);

// The chassis is a fixed 1504x838 design; scale it down (never up) to fit
// whatever viewport it's opened in, centered, so a phone screen shows the
// whole app at once instead of requiring pinch-zoom/scroll to see it.
const CHASSIS_W = 1504;
const CHASSIS_H = 838;

function fitToScreen(): void {
  const scale = Math.min(window.innerWidth / CHASSIS_W, window.innerHeight / CHASSIS_H, 1);
  const offsetX = (window.innerWidth - CHASSIS_W * scale) / 2;
  const offsetY = (window.innerHeight - CHASSIS_H * scale) / 2;
  appEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

window.addEventListener('resize', fitToScreen);
window.addEventListener('orientationchange', fitToScreen);
fitToScreen();
