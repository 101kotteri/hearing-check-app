import type { Locale } from './i18n';

export type Ear = 'right' | 'left';
export type DeviceType = 'headphone' | 'earphone';
export type ListeningType = 'reference' | 'listening';
export type Screen = 'gate' | 'opening' | 'hearing';
export type HearStep = 'intro' | 'setup' | 'calibrate' | 'measure' | 'done';

export interface FrequencyResult {
  threshold: number | null;
  noResponse: boolean;
}

export type EarResults = Partial<Record<number, FrequencyResult>>;

export interface HearResults {
  right: EarResults;
  left: EarResults;
}

export interface AppState {
  screen: Screen;
  password: string;
  passwordError: boolean;
  hearStep: HearStep;
  hearEar: Ear;
  hearFreqPos: number;
  hearResults: HearResults;
  hearPlaying: boolean;
  hearCalPlaying: boolean;
  hearReportName: string;
  hearDeviceType: DeviceType;
  hearListeningType: ListeningType;
  // iPad: uses the PC chassis/screens (not the phone's frame-less mobile UI —
  // see main.ts's device detection), with a handful of targeted touch-
  // friendly overrides (back button, CTA press feedback, no "聴力チェック"
  // heading, bigger results graph). Constant for the session, riding along in
  // state purely so templates.ts's PC render functions (which only ever
  // receive AppState/ViewModel, never a device flag directly) can see it.
  isTablet: boolean;
  // Resolved once at boot (see main.ts's detectLocale()) and carried in state
  // for the same reason isTablet is — templates.ts/mobileTemplates.ts only
  // ever receive AppState/ViewModel, never a device/locale flag directly.
  locale: Locale;
  // Capacitor.isNativePlatform(), threaded through state the same way —
  // lets templates.ts/mobileTemplates.ts branch the results-screen save
  // button (native: "Save Results" dropdown with PDF/image choices, each
  // shared as its own file; web: unchanged single "Save as PDF" ->
  // window.print()) without importing @capacitor/core themselves.
  isNative: boolean;
  // Transient UI state for the in-app language-switcher dropdown (see
  // templates.ts's renderLocaleSwitcher) — not part of the hearing flow, so
  // not reset by createInitialHearingState the way hearStep/hearResults etc.
  // are on EXIT/retry.
  localeMenuOpen: boolean;
  // Transient UI state for the native-only save dropdown (see
  // renderSaveMenu) — same lifecycle rules as localeMenuOpen above.
  saveMenuOpen: boolean;
}

export function createInitialHearingState(): Pick<
  AppState,
  | 'hearStep'
  | 'hearEar'
  | 'hearFreqPos'
  | 'hearResults'
  | 'hearPlaying'
  | 'hearCalPlaying'
  | 'hearReportName'
  | 'hearDeviceType'
  | 'hearListeningType'
> {
  return {
    hearStep: 'intro',
    hearEar: 'right',
    hearFreqPos: 0,
    hearResults: { right: {}, left: {} },
    hearPlaying: false,
    hearCalPlaying: false,
    hearReportName: '',
    hearDeviceType: 'headphone',
    hearListeningType: 'reference',
  };
}

export function createInitialState(
  isMobile: boolean,
  isTablet: boolean = false,
  locale: Locale = 'en',
  isNative: boolean = false
): AppState {
  return {
    // No login gate on tablet either — see app.ts's goToGate.
    screen: isMobile || isTablet ? 'opening' : 'gate',
    password: '',
    passwordError: false,
    isTablet,
    locale,
    isNative,
    localeMenuOpen: false,
    saveMenuOpen: false,
    ...createInitialHearingState(),
  };
}
