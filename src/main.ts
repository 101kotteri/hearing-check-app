import './style.css';
import { App } from './app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app root element not found');

// WebApp is PC-oriented; a real phone/tablet previews the future native
// (Capacitor) app instead of getting a scaled-down copy of the PC chassis.
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

new App(root, isMobile);
