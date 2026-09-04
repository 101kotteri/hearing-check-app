import { defineConfig } from 'vite';

// Two build targets share this one config, distinguished by --mode:
// - default (GitHub Pages, `npm run build`): served from
//   https://101kotteri.github.io/hearing-check-app/, so asset URLs need the
//   repo name as a base path.
// - capacitor (`npm run build:capacitor`): the built dist/ is copied into
//   the native app bundle and loaded from a local origin (capacitor://
//   localhost on iOS), not a subpath — an absolute /hearing-check-app/ base
//   would 404 every asset there, so this mode uses relative paths instead.
export default defineConfig(({ mode }) => ({
  base: mode === 'capacitor' ? './' : '/hearing-check-app/',
}));
