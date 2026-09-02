import './style.css';
import { App } from './app';
import { MOBILE_CHASSIS_H, MOBILE_CHASSIS_W, PC_CHASSIS_H, PC_CHASSIS_W } from './chassis';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app root element not found');
const appEl: HTMLDivElement = root;

// WebApp is PC-oriented; a real phone/tablet previews the future native
// (Capacitor) app instead of getting a scaled-down copy of the PC chassis.
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

new App(appEl, isMobile);

// The chassis is a fixed-size design (see chassis.ts); scale it down (never
// up) to fit whatever viewport it's opened in, centered, so a phone screen
// shows the whole app at once instead of requiring pinch-zoom/scroll.
const CHASSIS_W = isMobile ? MOBILE_CHASSIS_W : PC_CHASSIS_W;
const CHASSIS_H = isMobile ? MOBILE_CHASSIS_H : PC_CHASSIS_H;

function fitToScreen(): void {
  const scale = Math.min(window.innerWidth / CHASSIS_W, window.innerHeight / CHASSIS_H, 1);
  const offsetX = (window.innerWidth - CHASSIS_W * scale) / 2;
  const offsetY = (window.innerHeight - CHASSIS_H * scale) / 2;
  appEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

window.addEventListener('resize', fitToScreen);
window.addEventListener('orientationchange', fitToScreen);
fitToScreen();
