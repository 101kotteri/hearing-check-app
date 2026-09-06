import type { Locale } from './i18n';
import type { Plan } from './constants';

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
  // Same reasoning as isTablet — riding along in state so viewModel.ts's
  // effectivePlan() can tell plain-desktop-PC apart from mobile/tablet
  // without app.ts needing to pass a device flag around separately. Also
  // constant for the session.
  isMobile: boolean;
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
  // Which pricing tier is unlocked (see constants.ts) — determines how many
  // frequencies actually get measured and whether PDF/image export is
  // available. On native, this is refreshed from StoreKit's real
  // entitlements at boot and after every purchase/restore (see app.ts's
  // refreshEntitlements/handlePurchase) — StoreKit itself is the source of
  // truth, this is just a cache of it for rendering. On web (not native),
  // there's no real store: settable via `?plan=a`/`?plan=b` at boot, or the
  // mock purchase buttons on the results screen (see app.ts's mockPurchase
  // action) — not persisted, resets on reload.
  plan: Plan;
  // True while a StoreKit purchase/restore call is in flight — disables the
  // purchase buttons so a slow network can't be double-tapped into two
  // concurrent purchase sheets.
  purchaseBusy: boolean;
  // Set when the last purchase/restore attempt failed (not on a plain user
  // cancellation, which isn't an error) — cleared on the next attempt. See
  // gate.passwordError for the same inline-error-flag pattern.
  purchaseError: boolean;
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
  isNative: boolean = false,
  plan: Plan = 'none'
): AppState {
  return {
    // No login gate on tablet either — see app.ts's goToGate.
    screen: isMobile || isTablet ? 'opening' : 'gate',
    password: '',
    passwordError: false,
    isTablet,
    isMobile,
    locale,
    isNative,
    localeMenuOpen: false,
    saveMenuOpen: false,
    plan,
    purchaseBusy: false,
    purchaseError: false,
    ...createInitialHearingState(),
  };
}
