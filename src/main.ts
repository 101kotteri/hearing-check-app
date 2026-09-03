import './style.css';
import { App } from './app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app root element not found');

// WebApp is PC-oriented; a real phone previews the future native (Capacitor)
// app instead of getting a scaled-down copy of the PC chassis. `?mobile` (or
// `?mobile=1`) forces the phone view from any browser/window, for previewing
// it without a real device — e.g. VS Code's Simple Browser or a desktop
// browser's device-emulation mode.
const params = new URLSearchParams(window.location.search);
const forceMobile = params.has('mobile');
const forceTablet = params.has('ipad');

// iPadOS 13+ deliberately reports a desktop macOS Safari user-agent by
// default (Apple wants iPad to get the desktop web, not a phone-scaled one),
// so "iPad" won't appear in navigator.userAgent on a real modern iPad. The
// standard workaround: a real Mac reports 0 touch points, but an iPad-as-Mac
// UA reports a nonzero count — that combination reliably means "this is
// actually an iPad", not a desktop with a touchscreen (vanishingly rare).
// Threshold is `> 0`, not `> 1`: a real iPad reports 5, but Chrome DevTools'
// own device-toolbar iPad presets (confirmed directly: "iPad Air" sends the
// Mac UA above with maxTouchPoints only 1, not a realistic 5) would fail a
// `> 1` check and silently fall through to the PC path — this is the
// intended way to test this in DevTools, so it has to actually work there.
const isIPadUA = /iPad/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 0);
const isPhoneUA = /iPhone|iPod|Android/i.test(navigator.userAgent);

const isTablet = forceTablet || (isIPadUA && !forceMobile);
const isMobile = forceMobile || (isPhoneUA && !isTablet);

new App(root, isMobile, isTablet);
