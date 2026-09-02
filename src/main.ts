import './style.css';
import { App } from './app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app root element not found');

// WebApp is PC-oriented; a real phone/tablet previews the future native
// (Capacitor) app instead of getting a scaled-down copy of the PC chassis.
// `?mobile` (or `?mobile=1`) forces the mobile view from any browser/window,
// for previewing it without a real device — e.g. VS Code's Simple Browser or
// a desktop browser's device-emulation mode.
const forceMobile = new URLSearchParams(window.location.search).has('mobile');
const isMobile = forceMobile || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

new App(root, isMobile);
